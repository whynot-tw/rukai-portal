import { describe, expect, it } from "vitest";

const baseUrl = process.env.PORTAL_TEST_BASE_URL || "http://localhost:3000";
const adminPassword = process.env.PORTAL_ADMIN_PASSWORD;

describe("portal.adminPasswordLogin", () => {
  it("accepts the configured administrator password and issues an admin session", async () => {
    expect(adminPassword?.trim()).toBeTruthy();

    const response = await fetch(`${baseUrl}/api/trpc/portal.adminPasswordLogin?batch=1`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ 0: { json: { password: adminPassword } } }),
    });

    expect(response.ok).toBe(true);
    expect(response.headers.get("set-cookie")).toContain("rukai_portal_admin=");
  });
});
