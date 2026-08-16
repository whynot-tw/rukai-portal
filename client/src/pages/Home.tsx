import { PortalHeader } from "@/components/PortalHeader";
import { ProofGallery } from "@/components/ProofGallery";
import { StatusPill } from "@/components/StatusPill";
import { trpc } from "@/lib/trpc";
import { isAttentionItem } from "@shared/portal";
import { ArrowDownRight, ArrowRight, BookOpen, CalendarDays, CheckCircle2, CircleAlert, FileImage, FolderClock, Loader2, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

function Metric({ label, value, tone }: { label: string; value: number; tone: "ink" | "amber" | "wine" }) {
  const colors = { ink: "bg-[#292621]", amber: "bg-[#b77b1b]", wine: "bg-[#8d3131]" };
  return <div className="border border-[#ded5c9] bg-[#fffdf9] p-5 shadow-[0_10px_24px_rgba(74,52,25,0.04)]"><span className={`mb-6 block h-1 w-8 ${colors[tone]}`} /><p className="text-4xl font-serif text-[#292621]">{value}</p><p className="mt-2 text-xs font-semibold tracking-[0.13em] text-[#766c61]">{label}</p></div>;
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="max-w-2xl"><p className="text-xs font-semibold tracking-[0.18em] text-[#8d3131]">{eyebrow}</p><h2 className="mt-3 font-serif text-3xl text-[#292621] sm:text-4xl">{title}</h2>{description ? <p className="mt-3 leading-7 text-[#746a5f]">{description}</p> : null}</div>;
}

export default function Home() {
  const dashboard = trpc.portal.dashboard.useQuery();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<"all" | "attention">("all");
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const scrollPosition = useRef(0);

  const visiblePages = useMemo(() => {
    const pages = dashboard.data?.pages ?? [];
    return filter === "attention" ? pages.filter(isAttentionItem) : pages;
  }, [dashboard.data?.pages, filter]);

  if (dashboard.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-[#f5f1eb]"><div className="flex flex-col items-center gap-4 text-[#6f655a]"><Loader2 className="h-7 w-7 animate-spin text-[#8d3131]" /><p className="font-serif text-lg">正在載入專案紀錄</p></div></div>;
  }

  if (!dashboard.data) return <div className="grid min-h-screen place-items-center bg-[#f5f1eb] text-[#6f655a]">目前無法載入專案資料。</div>;

  const { project, versions, summary, latestUpdate, weeklySnapshot, updates, pages } = dashboard.data;
  const attentionPages = pages.filter(isAttentionItem);
  const galleryPages = pages.filter((page) => page.pngUrl);

  const openGallery = (pageId: number) => {
    scrollPosition.current = window.scrollY;
    setActivePageId(pageId);
  };
  const closeGallery = () => {
    setActivePageId(null);
    window.requestAnimationFrame(() => window.scrollTo(0, scrollPosition.current));
  };

  return (
    <div className="min-h-screen bg-[#f5f1eb] text-[#292621]">
      <PortalHeader />
      <main>
        <section className="border-b border-[#ded5c9] bg-[#e9e1d4]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#8d3131]">PROJECT RECORD · PRIVATE</p>
              <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.08] text-[#292621] sm:text-6xl">{project.title}</h1>
              <p className="mt-4 text-lg text-[#5e554b]">{project.subtitle}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 border border-[#bfaaa0] bg-[#fdf9f3] px-3 py-2 text-sm font-semibold text-[#7d2d2d]"><Sparkles className="h-4 w-4" /> 目前施工基準 {project.currentBaseline}</span>
                <span className="inline-flex items-center gap-2 border border-[#d0c2b1] px-3 py-2 text-sm text-[#675d52]"><CalendarDays className="h-4 w-4" /> 最新版本確認 {project.baselineUpdatedAt}</span>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <button onClick={() => document.getElementById("pages")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 bg-[#292621] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#8d3131] active:scale-[0.98]">查看頁面工作紀錄 <ArrowDownRight className="h-4 w-4" /></button>
                <button onClick={() => document.getElementById("attention")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 border border-[#a99b8d] px-5 py-3.5 text-sm font-semibold text-[#4b433a] transition hover:border-[#8d3131] hover:text-[#8d3131] active:scale-[0.98]">待確認／缺件 <CircleAlert className="h-4 w-4" /></button>
              </div>
            </div>
            <aside className="self-end border-l-0 border-[#cbbbad] pt-2 lg:border-l lg:pl-10">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#796d60]">LATEST UPDATE</p>
              {latestUpdate ? <><p className="mt-5 font-serif text-2xl leading-snug">{latestUpdate.updateType}</p><p className="mt-4 leading-7 text-[#675d52]">{latestUpdate.summary}</p><div className="mt-6 flex items-center justify-between text-sm"><span>{latestUpdate.displayDate}</span><span className="font-semibold text-[#8d3131]">{latestUpdate.affectedPages}</span></div></> : <><p className="mt-5 font-serif text-2xl">等待第一筆更新紀錄</p><p className="mt-4 leading-7 text-[#675d52]">管理員可在後台新增更新紀錄；完成後，最新內容會自動顯示於此處。</p></>}
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="mb-7 flex items-end justify-between gap-6"><SectionTitle eyebrow="WEEKLY SNAPSHOT" title="本週排版進度" /><p className="hidden max-w-sm text-right text-sm leading-6 text-[#746a5f] lg:block">此區塊以工作紀錄實際狀態彙整，供委託方快速理解目前進度。</p></div>
          <div className="grid gap-3 sm:grid-cols-3"><Metric label="已完成／目前採用" value={summary.completed} tone="ink" /><Metric label="排版中" value={summary.inProgress} tone="amber" /><Metric label="待確認／缺件" value={summary.needsAttention} tone="wine" /></div>
          {weeklySnapshot ? <div className="mt-8 grid gap-px bg-[#ded5c9] sm:grid-cols-2 lg:grid-cols-4">{[["本週完成章節", weeklySnapshot.completedChapters], ["本週完成頁面", weeklySnapshot.completedPages], ["本週版本異動", weeklySnapshot.versionChanges], ["下一階段", weeklySnapshot.nextStage]].map(([label, value]) => <div key={String(label)} className="bg-[#fffdf9] p-5"><p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d3131]">{label}</p><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#4e473e]">{value || "—"}</p></div>)}</div> : <div className="mt-8 border border-dashed border-[#cbbdad] p-6 text-sm leading-7 text-[#746a5f]">尚未建立週進度。管理員可在後台填入本週完成章節、頁面、版本異動與下一階段。</div>}
        </section>

        <section id="pages" className="border-y border-[#ded5c9] bg-[#fffdf9]">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><SectionTitle eyebrow="WORKING PAGES" title="頁序與工作紀錄" description="頁面依目前工作紀錄的實際順序排列；所有狀態均保留原始欄位用語。" /><div className="flex border border-[#d7ccc0] p-1"><button onClick={() => setFilter("all")} className={`px-3 py-2 text-xs font-semibold ${filter === "all" ? "bg-[#292621] text-white" : "text-[#675d52]"}`}>全部 {pages.length}</button><button onClick={() => setFilter("attention")} className={`px-3 py-2 text-xs font-semibold ${filter === "attention" ? "bg-[#8d3131] text-white" : "text-[#675d52]"}`}>待處理 {attentionPages.length}</button></div></div>
            {visiblePages.length ? <div className="mt-9 grid gap-4 lg:grid-cols-2">{visiblePages.map((page) => <article key={page.id} className="group grid min-h-48 grid-cols-[106px_1fr] gap-4 border border-[#ded5c9] bg-[#fffdf9] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(62,45,25,0.08)] sm:grid-cols-[132px_1fr] sm:gap-5 sm:p-5"><div className="relative flex min-h-36 items-center justify-center overflow-hidden bg-[#e8dfd3]">{page.pngUrl ? <button onClick={() => openGallery(page.id)} className="h-full w-full"><img src={page.pngUrl} alt={`${page.pageNumber} 校稿縮圖`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></button> : <div className="px-3 text-center text-xs leading-5 text-[#776c5e]"><FileImage className="mx-auto mb-2 h-5 w-5 text-[#a4998b]" />尚未提供校稿預覽</div>}</div><div className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-serif text-2xl text-[#8d3131]">{page.pageNumber}</p><p className="mt-1 text-xs font-semibold tracking-[0.12em] text-[#796e62]">{page.chapter}</p></div><div className="flex flex-wrap justify-end gap-1.5"><StatusPill label={page.layoutStatus} /><StatusPill label={page.assetStatus} /></div></div><h3 className="mt-3 font-serif text-lg leading-snug text-[#302b25]">{page.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-[#746a5f]">{page.notes || "尚無備註"}</p>{page.pngUrl ? <button onClick={() => openGallery(page.id)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8d3131] hover:underline">開啟校稿相簿 <ArrowRight className="h-3.5 w-3.5" /></button> : null}</div></article>)}</div> : <div className="mt-9 border border-dashed border-[#cbbdad] p-10 text-center"><BookOpen className="mx-auto h-8 w-8 text-[#a69b8e]" /><p className="mt-4 font-serif text-xl">尚未建立頁面工作紀錄</p><p className="mt-2 text-sm leading-6 text-[#746a5f]">管理員可在後台新增頁碼、標題、狀態與 PNG mapping。</p></div>}
          </div>
        </section>

        <section id="attention" className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]"><SectionTitle eyebrow="OPEN ITEMS" title="待確認／缺件" description="以下項目彙整待確認、缺電子檔、待製作、尚未排版與頁序尚未鎖定等工作狀態。" /><div className="border-t border-[#cfc3b6]">{attentionPages.length ? attentionPages.map((page) => <div key={page.id} className="flex flex-col gap-3 border-b border-[#ded5c9] py-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-serif text-xl text-[#8d3131]">{page.pageNumber} <span className="ml-2 text-base text-[#302b25]">{page.title}</span></p><p className="mt-1 text-sm text-[#746a5f]">{page.chapter}</p></div><div className="flex flex-wrap gap-1.5"><StatusPill label={page.layoutStatus} /><StatusPill label={page.assetStatus} /></div></div>) : <div className="py-8 text-sm leading-7 text-[#746a5f]">目前沒有符合篩選條件的待確認或缺件項目。</div>}</div></div>
        </section>

        <section className="border-y border-[#ded5c9] bg-[#292621] text-[#fffaf2]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><SectionTitle eyebrow="VERSION HISTORY" title="內容版本基準" description="" /><p className="max-w-md text-sm leading-6 text-[#d5cbc0]">目前施工以 V3（2026/08/03）為準；以下呈現本案四個內容版本階段。</p></div><div className="mt-10 grid gap-3 lg:grid-cols-4">{versions.map((version) => <article key={version.stage} className={`border p-5 ${version.isCurrent ? "border-[#d89175] bg-[#46332d]" : "border-white/15 bg-white/[0.03]"}`}><div className="flex items-center justify-between"><span className="font-serif text-3xl">{version.stage}</span>{version.isCurrent ? <span className="border border-[#e4b8a8] px-2 py-1 text-[10px] font-bold tracking-[0.12em] text-[#f2c4b2]">CURRENT</span> : null}</div><p className="mt-4 text-sm font-semibold text-[#e4b8a8]">{version.date}</p><h3 className="mt-4 font-serif text-lg">{version.title}</h3><p className="mt-3 text-sm leading-6 text-[#d5cbc0]">{version.details}</p></article>)}</div></div></section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><SectionTitle eyebrow="UPDATE LOG" title="更新紀錄" /><button onClick={() => setLocation("/updates")} className="inline-flex items-center gap-2 text-sm font-semibold text-[#8d3131] hover:underline">查看完整紀錄 <ArrowRight className="h-4 w-4" /></button></div><div className="mt-8 divide-y divide-[#ded5c9] border-y border-[#ded5c9]">{updates.length ? updates.slice(0, 5).map((update) => <article key={update.id} className="grid gap-3 py-5 md:grid-cols-[130px_1fr_auto]"><div className="text-sm font-semibold text-[#8d3131]">{update.displayDate}</div><div><div className="flex flex-wrap gap-x-3 gap-y-1"><p className="font-serif text-lg">{update.updateType}</p><span className="text-sm text-[#746a5f]">{update.scope}</span></div><p className="mt-2 leading-7 text-[#665d53]">{update.summary}</p><p className="mt-2 text-sm text-[#8a8074]">影響頁面：{update.affectedPages}</p></div><div className="self-start"><StatusPill label={update.status} /></div></article>) : <div className="py-10 text-center text-sm text-[#746a5f]"><FolderClock className="mx-auto mb-3 h-7 w-7 text-[#a79b8c]" />尚未建立更新紀錄。</div>}</div></section>
      </main>
      {activePageId && galleryPages.length ? <ProofGallery pages={galleryPages} initialPageId={activePageId} onClose={closeGallery} /> : null}
    </div>
  );
}
