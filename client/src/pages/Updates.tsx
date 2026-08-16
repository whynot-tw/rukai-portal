import { PortalHeader } from "@/components/PortalHeader";
import { StatusPill } from "@/components/StatusPill";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FolderClock, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Updates() {
  const updatesQuery = trpc.portal.updates.useQuery();
  const [, setLocation] = useLocation();
  if (updatesQuery.isLoading) return <div className="grid min-h-screen place-items-center bg-[#f5f1eb]"><Loader2 className="h-7 w-7 animate-spin text-[#8d3131]" /></div>;
  const updates = updatesQuery.data ?? [];
  return <div className="min-h-screen bg-[#f5f1eb] text-[#292621]"><PortalHeader /><main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16"><button onClick={() => setLocation("/admin")} className="inline-flex items-center gap-2 text-sm font-semibold text-[#746a5f] transition hover:text-[#8d3131]"><ArrowLeft className="h-4 w-4" />返回管理後台</button><div className="mt-10 border-b border-[#d8cec1] pb-9"><p className="text-xs font-semibold tracking-[0.18em] text-[#8d3131]">管理員後台</p><h1 className="mt-3 font-serif text-4xl sm:text-5xl">完整更新紀錄</h1><p className="mt-4 max-w-2xl leading-7 text-[#746a5f]">此頁保留日期、管理範圍、更新類型、摘要、影響頁面與原始狀態，供專案管理者追溯施工變更。</p></div><div className="mt-8 divide-y divide-[#ded5c9] border-y border-[#ded5c9]">{updates.length ? updates.map((update) => <article key={update.id} className="grid gap-4 py-7 md:grid-cols-[145px_1fr_auto]"><div><p className="font-serif text-xl text-[#8d3131]">{update.displayDate}</p><p className="mt-2 text-xs font-semibold tracking-[0.12em] text-[#766c61]">{update.scope}</p></div><div><h2 className="font-serif text-2xl leading-snug">{update.updateType}</h2><p className="mt-3 leading-7 text-[#665d53]">{update.summary}</p><p className="mt-4 text-sm text-[#897e72]">影響頁面：{update.affectedPages}</p></div><div className="self-start"><StatusPill label={update.status} /></div></article>) : <div className="py-16 text-center"><FolderClock className="mx-auto h-9 w-9 text-[#a79d92]" /><p className="mt-5 font-serif text-xl">尚未建立更新紀錄</p><p className="mt-2 text-sm leading-6 text-[#746a5f]">管理員可由後台新增第一筆更新紀錄。</p></div>}</div></main></div>;
}
