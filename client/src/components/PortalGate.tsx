import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, LogOut, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

function GateScreen({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f1eb] px-5 py-8 text-[#292621] sm:px-8">
      <div className="mx-auto flex min-h-[78vh] max-w-xl items-center justify-center">
        <section className="relative w-full overflow-hidden border border-[#d9d0c4] bg-[#fffdf9] p-7 shadow-[0_24px_70px_rgba(69,52,34,0.12)] sm:p-11">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#8d3131]" />
          <div className="mb-10 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#8d3131] text-[11px] font-bold tracking-[0.16em] text-white">RK</span>
            <span>
              <span className="block font-serif text-sm leading-none">榮耀之冠・百合之約</span>
              <span className="mt-1.5 block text-[10px] font-semibold tracking-[0.16em] text-[#8d3131]">CLIENT PROJECT PORTAL</span>
            </span>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

export function PortalGate({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const access = trpc.portal.access.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  if (loading || (isAuthenticated && access.isLoading)) {
    return (
      <GateScreen>
        <div className="flex flex-col items-center gap-4 border-y border-[#e2d8cc] py-9 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#8d3131]" />
          <p className="font-serif text-xl">正在確認專案存取權限</p>
          <p className="max-w-sm text-sm leading-6 text-[#746a5f]">為保護尚未公開的內容、校稿頁面與工作紀錄，我們正在安全驗證您的帳號。</p>
        </div>
      </GateScreen>
    );
  }

  if (!isAuthenticated) {
    return (
      <GateScreen>
        <ShieldCheck className="mb-7 h-9 w-9 text-[#8d3131]" />
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#8d3131]">PRIVATE PROJECT PORTAL</p>
        <h1 className="font-serif text-3xl leading-tight">受限專案工作入口</h1>
        <p className="mt-5 max-w-md leading-7 text-[#6a6259]">本平台僅供獲授權的專案成員查看。請以已列入白名單的 Manus 帳號登入。</p>
        <button onClick={startLogin} className="mt-8 w-full bg-[#292621] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#8d3131] active:scale-[0.98]">
          以 Manus 帳號登入
        </button>
      </GateScreen>
    );
  }

  if (!access.data?.allowed || (adminOnly && access.data.role !== "admin")) {
    return (
      <GateScreen>
        <ShieldCheck className="mb-7 h-9 w-9 text-[#8d3131]" />
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#8d3131]">ACCESS RESTRICTED</p>
        <h1 className="font-serif text-3xl leading-tight">此帳號未獲授權</h1>
        <p className="mt-5 leading-7 text-[#6a6259]">{adminOnly ? "此區塊僅限管理員使用。" : "請確認目前登入的帳號 Email 已由管理員列入存取白名單。"}</p>
        <p className="mt-2 text-sm text-[#8a8177]">{user?.email || "此帳號未提供 Email 資訊"}</p>
        <button onClick={logout} className="mt-8 flex w-full items-center justify-center gap-2 border border-[#bcb0a1] px-5 py-3.5 text-sm font-semibold transition hover:border-[#8d3131] hover:text-[#8d3131] active:scale-[0.98]">
          <LogOut className="h-4 w-4" /> 切換登入帳號
        </button>
      </GateScreen>
    );
  }

  return <>{children}</>;
}
