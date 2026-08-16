import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import multer from "multer";
import { storagePut } from "../storage";
import { hasValidAdminSession, readCookie, ADMIN_SESSION_COOKIE } from "../passwordAuth";
import { buildProofStorageKey, isSupportedProofMimeType, MAX_PROOF_UPLOAD_SIZE } from "../proofUpload";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  const proofUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PROOF_UPLOAD_SIZE },
  });

  app.post("/api/admin/upload-proof", async (req, res) => {
    const adminToken = readCookie(req.headers.cookie, ADMIN_SESSION_COOKIE);
    if (!(await hasValidAdminSession(adminToken))) {
      res.status(403).json({ message: "此功能僅限管理員使用。" });
      return;
    }

    proofUpload.single("file")(req, res, async (error) => {
      if (error) {
        const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "圖片不可超過 15 MB。"
          : error.message || "圖片上傳失敗，請再試一次。";
        res.status(400).json({ message });
        return;
      }
      if (!req.file) {
        res.status(400).json({ message: "請先選擇 PNG、JPG 或 WebP 圖片。" });
        return;
      }
      if (!isSupportedProofMimeType(req.file.mimetype)) {
        res.status(400).json({ message: "只接受 PNG、JPG 或 WebP 圖片。" });
        return;
      }

      try {
        const pageNumber = typeof req.body.pageNumber === "string" ? req.body.pageNumber : "page";
        const uploaded = await storagePut(buildProofStorageKey(pageNumber, req.file.originalname), req.file.buffer, req.file.mimetype);
        res.json(uploaded);
      } catch (uploadError) {
        console.error("[Proof Upload]", uploadError);
        res.status(502).json({ message: "圖片儲存服務暫時無法使用，請稍後重試。" });
      }
    });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
