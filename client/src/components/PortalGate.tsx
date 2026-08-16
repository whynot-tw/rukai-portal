import { trpc } from "@/lib/trpc";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { FormEvent, type ReactNode, useState } from "react";

function GateScreen({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[#f5f1eb] px-5 py-8 text-[#292621] sm:px-8"><div className="mx-auto flex min-h-[78vh] max-w-xl items-center justify-center"><section className="relative w-full overflow-hidden border border-[#d9d0c4] bg-[#fffdf9] p-7 shadow-[0_24px_70px_rgba(69,52,34,0.12)] sm:p-11"><div className="absolute inset-x-0 top-0 h-1 bg-[#8d3131]" /><div className="mb-10 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#8d3131] text-[11px] font-bold tracking-[0.16em] text-white">RK</span><span><span className="block font-serif text-sm leading-none">榮耀之冠・百合之約</span><span className="mt-1.5 block text-[10px] font-semibold tracking-[0.16em] text-[#8d3131]">專案進度入口</span></span></div>{children}</section></div></main>;
}

function LoadingGate() {
  return <GateScreen><div className="flex flex-col items-center gap-4 border-y border-[#e2d8cc] py-9 text-center"><Loader2 className="h-7 w-7 animate-spin text-[#8d3131]" /><p className="font-serif text-xl">正在確認專案存取權限</p><p className="max-w-sm text-sm leading-6 text-[#746a5f]">我們正在安全驗證您的存取狀態。</p></div></GateScreen>;
}

function PasswordForm({ title, description, label, buttonLabel, error, pending, password, setPassword, submit }: { title: string; description: string; label: string; buttonLabel: string; error?: string; pending: boolean; password: string; setPassword: (value: string) => void; submit: (event: FormEvent) => Promise<void> }) {
  return <GateScreen><KeyRound className="mb-7 h-9 w-9 text-[#8d3131]" /><p className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#8d3131]">受限專案入口</p><h1 className="font-serif text-3xl leading-tight">{title}</h1><p className="mt-5 max-w-md leading-7 text-[#6a6259]">{description}</p><form className="mt-7" onSubmit={submit}><label className="block text-xs font-semibold tracking-[0.12em] text-[#665d53]">{label}</label><input autoFocus type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border border-[#cfc3b5] bg-white px-4 py-3 text-base outline-none transition focus:border-[#8d3131] focus:ring-2 focus:ring-[#8d3131]/10" placeholder="輸入密碼" />{error ? <p role="alert" className="mt-3 text-sm text-[#8d3131]">{error}</p> : null}<button disabled={!password || pending} className="mt-4 flex w-full items-center justify-center gap-2 bg-[#292621] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#8d3131] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{buttonLabel}</button></form></GateScreen>;
}

export function PortalGate({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const status = trpc.portal.passwordStatus.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const login = trpc.portal.passwordLogin.useMutation({ onSuccess: () => utils.portal.passwordStatus.invalidate() });
  const [password, setPassword] = useState("");
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await login.mutateAsync({ password }); setPassword(""); } catch { /* 顯示 API 錯誤 */ } };
  if (status.isLoading) return <LoadingGate />;
  if (!status.data?.authenticated) return <PasswordForm title="專案進度入口" description="請輸入專案存取密碼，以查看目前進度、校稿頁面與待確認項目。" label="專案存取密碼" buttonLabel="查看專案進度" error={login.error?.message} pending={login.isPending} password={password} setPassword={setPassword} submit={submit} />;
  return <>{children}</>;
}

export function AdminGate({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const status = trpc.portal.adminStatus.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const login = trpc.portal.adminPasswordLogin.useMutation({ onSuccess: () => utils.portal.adminStatus.invalidate() });
  const [password, setPassword] = useState("");
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await login.mutateAsync({ password }); setPassword(""); } catch { /* 顯示 API 錯誤 */ } };
  if (status.isLoading) return <LoadingGate />;
  if (!status.data?.authenticated) return <PasswordForm title="管理員驗證" description="此區僅供專案管理者維護頁序、更新紀錄、校稿對應與版本資料。" label="管理員密碼" buttonLabel="進入管理後台" error={login.error?.message} pending={login.isPending} password={password} setPassword={setPassword} submit={submit} />;
  return <>{children}</>;
}
