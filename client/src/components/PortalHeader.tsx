import { trpc } from "@/lib/trpc";
import { BookOpenText, LogOut, Settings, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

export function PortalHeader() {
  const utils = trpc.useUtils();
  const [location, setLocation] = useLocation();
  const adminStatus = trpc.portal.adminStatus.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const logout = trpc.portal.passwordLogout.useMutation({ onSuccess: async () => { await Promise.all([utils.portal.passwordStatus.invalidate(), utils.portal.adminStatus.invalidate()]); setLocation("/"); } });
  const openGallery = () => {
    if (location !== "/") setLocation("/");
    window.setTimeout(() => window.dispatchEvent(new Event("open-proof-gallery")), location === "/" ? 0 : 120);
  };

  return <header className="sticky top-0 z-30 border-b border-[#ded5c9]/90 bg-[#fffdf9]/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8"><button onClick={() => setLocation("/")} className="flex items-center gap-3 text-left" aria-label="返回專案首頁"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#8d3131] text-[10px] font-bold tracking-widest text-white">RK</span><span className="hidden sm:block"><span className="block font-serif text-sm leading-none text-[#292621]">榮耀之冠・百合之約</span><span className="mt-1 block text-[10px] font-semibold tracking-[0.15em] text-[#8d3131]">專案進度入口</span></span></button><div className="flex items-center gap-2"><span className="hidden h-9 items-center gap-1.5 border border-[#e4dbcf] px-3 text-xs text-[#766c61] sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5" />密碼保護</span><button onClick={openGallery} className="inline-flex h-9 items-center gap-2 border border-[#8d3131] bg-[#8d3131] px-3 text-xs font-semibold text-white transition hover:bg-[#702525]"><BookOpenText className="h-3.5 w-3.5" /><span>校稿相簿</span></button>{adminStatus.data?.authenticated ? <button onClick={() => setLocation("/admin")} className="inline-flex h-9 items-center gap-2 border border-[#d8cec1] px-3 text-xs font-semibold text-[#584f46] transition hover:border-[#8d3131] hover:text-[#8d3131]"><Settings className="h-3.5 w-3.5" /><span className="hidden sm:inline">管理後台</span></button> : null}<button onClick={() => logout.mutate()} className="grid h-9 w-9 place-items-center border border-[#d8cec1] text-[#584f46] transition hover:border-[#8d3131] hover:text-[#8d3131]" aria-label="登出"><LogOut className="h-4 w-4" /></button></div></div></header>;
}
