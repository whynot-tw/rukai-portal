import { PortalHeader } from "@/components/PortalHeader";
import { ProofGallery } from "@/components/ProofGallery";
import { StatusPill } from "@/components/StatusPill";
import { trpc } from "@/lib/trpc";
import { ArrowDownRight, ArrowRight, CalendarDays, CircleAlert, Download, FileImage, FolderClock, Loader2, Sparkles } from "lucide-react";
import { formatPublishedDate } from "@shared/portal";
import { useEffect, useRef, useState } from "react";

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return <div className="max-w-2xl"><p className="text-xs font-semibold tracking-[0.18em] text-[#8d3131]">專案進度</p><h2 className="mt-3 font-serif text-3xl text-[#292621] sm:text-4xl">{title}</h2>{description ? <p className="mt-3 leading-7 text-[#746a5f]">{description}</p> : null}</div>;
}

export default function Home() {
  const dashboard = trpc.portal.dashboard.useQuery();
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [showVersionNote, setShowVersionNote] = useState(false);
  const [isDownloadingLatest, setIsDownloadingLatest] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [publishedDate, setPublishedDate] = useState("最新發布");
  const [showRecentUpdates, setShowRecentUpdates] = useState(false);
  const scrollPosition = useRef(0);

  useEffect(() => {
    fetch("/__manus__/version.json", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ timestamp?: number }> : Promise.reject(new Error("版本資訊無法讀取")))
      .then((version) => {
        if (typeof version.timestamp === "number") {
          const formatted = formatPublishedDate(version.timestamp);
          if (formatted) setPublishedDate(formatted);
        }
      })
      .catch(() => setPublishedDate("最新發布"));
  }, []);

  useEffect(() => {
    const handler = () => {
      const firstProof = dashboard.data?.pages.find((page) => Boolean(page.pngUrl));
      if (firstProof) {
        scrollPosition.current = window.scrollY;
        setActivePageId(firstProof.id);
      } else {
        document.getElementById("page-preview")?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("open-proof-gallery", handler);
    return () => window.removeEventListener("open-proof-gallery", handler);
  }, [dashboard.data?.pages]);

  if (dashboard.isLoading) return <div className="grid min-h-screen place-items-center bg-[#f5f1eb]"><div className="flex flex-col items-center gap-4 text-[#6f655a]"><Loader2 className="h-7 w-7 animate-spin text-[#8d3131]" /><p className="font-serif text-lg">正在載入專案進度</p></div></div>;
  if (!dashboard.data) return <div className="grid min-h-screen place-items-center bg-[#f5f1eb] text-[#6f655a]">目前無法載入專案資料。</div>;

  const { project, latestUpdate, weeklyProgress, recentUpdates, pages, attentionPages, versions } = dashboard.data;
  const galleryPages = pages.filter((page) => page.pngUrl);
  const openGallery = (pageId: number) => { scrollPosition.current = window.scrollY; setActivePageId(pageId); };
  const closeGallery = () => { setActivePageId(null); window.requestAnimationFrame(() => window.scrollTo(0, scrollPosition.current)); };
  const openCurrentProof = () => { if (galleryPages[0]) openGallery(galleryPages[0].id); else document.getElementById("page-preview")?.scrollIntoView({ behavior: "smooth" }); };
  const downloadLatest = async () => {
    setIsDownloadingLatest(true);
    setDownloadError(null);
    try {
      const response = await fetch("/api/portal/download-latest", { credentials: "include" });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message || "最新版頁面圖檔目前無法下載，請稍後再試。");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "魯凱文化手冊-最新版頁面圖檔.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "最新版頁面圖檔目前無法下載，請稍後再試。");
    } finally {
      setIsDownloadingLatest(false);
    }
  };

  return <div className="min-h-screen bg-[#f5f1eb] text-[#292621]"><PortalHeader /><main>
    <section className="border-b border-[#ded5c9] bg-[#e9e1d4]"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-20"><div><p className="text-xs font-semibold tracking-[0.2em] text-[#8d3131]">專案進度</p><h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.08] text-[#292621] sm:text-6xl">{project.title}</h1><div className="mt-8 flex flex-wrap gap-3"><span className="inline-flex items-center gap-2 border border-[#bfaaa0] bg-[#fdf9f3] px-3 py-2 text-sm font-semibold text-[#7d2d2d]"><Sparkles className="h-4 w-4" />目前排版依據｜2026/08/03 確認版本</span><span className="inline-flex items-center gap-2 border border-[#d0c2b1] px-3 py-2 text-sm text-[#675d52]"><CalendarDays className="h-4 w-4" />最後更新 {latestUpdate?.displayDate ?? project.baselineUpdatedAt}</span></div><div className="mt-10 flex flex-wrap gap-3"><button onClick={openCurrentProof} className="inline-flex items-center gap-2 bg-[#8d3131] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#702525] active:scale-[0.98]">開啟校稿相簿 <ArrowRight className="h-4 w-4" /></button><button onClick={() => document.getElementById("attention")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 border border-[#a99b8d] px-5 py-3.5 text-sm font-semibold text-[#4b433a] transition hover:border-[#8d3131] hover:text-[#8d3131] active:scale-[0.98]">查看待確認項目 <CircleAlert className="h-4 w-4" /></button><button onClick={downloadLatest} disabled={isDownloadingLatest} className="inline-flex items-center gap-2 border border-[#8d3131] bg-[#fdf9f3] px-5 py-3.5 text-sm font-semibold text-[#7d2d2d] transition hover:bg-[#8d3131] hover:text-white disabled:cursor-wait disabled:opacity-60">{isDownloadingLatest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}下載最新版（{publishedDate}）</button><button onClick={() => setShowVersionNote((value) => !value)} className="inline-flex items-center gap-2 px-3 py-3 text-sm font-semibold text-[#72564d] hover:text-[#8d3131]">查看版本說明 <ArrowDownRight className="h-4 w-4" /></button></div>{downloadError ? <p role="alert" className="mt-4 max-w-2xl text-sm text-[#8d3131]">{downloadError}</p> : null}{showVersionNote ? <p className="mt-5 max-w-2xl border-l-2 border-[#8d3131] pl-4 text-sm leading-7 text-[#675d52]">目前以 2026/08/03 確認版本作為排版依據；完整版本歷程由專案管理者維護。</p> : null}</div><aside className="self-end border-l-0 border-[#cbbbad] pt-2 lg:border-l lg:pl-10"><p className="text-xs font-semibold tracking-[0.16em] text-[#796d60]">最近進度</p>{latestUpdate ? <><p className="mt-5 font-serif text-2xl leading-snug">本案已更新</p><p className="mt-4 leading-7 text-[#675d52]">{latestUpdate.summary}</p><p className="mt-6 text-sm font-semibold text-[#8d3131]">{latestUpdate.displayDate}</p></> : <><p className="mt-5 font-serif text-2xl">等待最新進度</p><p className="mt-4 leading-7 text-[#675d52]">最新排版資訊將顯示於此處。</p></>}</aside></div></section>

    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><SectionTitle title="目前進度" description="以手冊實際排版頁序為準；已排版、已上傳、已校稿與已確認仍分開記錄。" />{weeklyProgress ? <><div className="mt-8 border border-[#ded5c9] bg-[#fffdf9] p-6 shadow-[0_10px_24px_rgba(74,52,25,0.04)] sm:p-8"><p className="text-xs font-semibold tracking-[0.16em] text-[#8d3131]">手冊實際排版進度</p><p className="mt-3 font-serif text-4xl text-[#292621] sm:text-5xl">目前排版更新至 {weeklyProgress.latestPageOrder || "—"}</p><p className="mt-4 max-w-2xl text-sm leading-7 text-[#746a5f]">此處表示目前排版頁序，不代表該頁已上傳、已完成校稿或已確認。</p></div><div className="mt-6 grid gap-px bg-[#ded5c9] sm:grid-cols-3"><div className="bg-[#fffdf9] p-5"><p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d3131]">本週處理</p><p className="mt-3 text-sm leading-6 text-[#4e473e]">{weeklyProgress.completedPages || "—"}</p></div><div className="bg-[#fffdf9] p-5"><p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d3131]">待確認事項</p><p className="mt-3 text-sm leading-6 text-[#4e473e]">{attentionPages.length ? `目前有 ${attentionPages.length} 頁待確認或待提供` : "目前沒有待確認事項"}</p></div><div className="bg-[#fffdf9] p-5"><p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d3131]">下一步</p><p className="mt-3 text-sm leading-6 text-[#4e473e]">{weeklyProgress.nextStage || "—"}</p></div></div></> : <div className="mt-8 border border-[#ded5c9] bg-[#fffdf9] p-6 text-sm leading-7 text-[#746a5f]">目前尚未建立最新排版頁序。</div>}</section>

    <section id="page-preview" className="border-y border-[#ded5c9] bg-[#fffdf9]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><SectionTitle title="頁面預覽" description="依目前頁序排列；已有校稿預覽的頁面可點擊放大查看。" /><button onClick={openCurrentProof} className="inline-flex items-center gap-2 bg-[#292621] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8d3131]">開啟校稿相簿 <ArrowRight className="h-4 w-4" /></button></div><div className="mt-9 grid gap-4 lg:grid-cols-2">{pages.map((page) => <article key={page.id} className="group grid min-h-48 grid-cols-[106px_1fr] gap-4 border border-[#ded5c9] bg-[#fffdf9] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(62,45,25,0.08)] sm:grid-cols-[132px_1fr] sm:gap-5 sm:p-5"><div className="relative flex min-h-36 items-center justify-center overflow-hidden bg-[#e8dfd3]">{page.pngUrl ? <button onClick={() => openGallery(page.id)} className="h-full w-full" aria-label={`開啟 ${page.pageNumber} 校稿預覽`}><img src={page.pngUrl} alt={`${page.pageNumber} 校稿縮圖`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></button> : <div className="px-3 text-center text-xs leading-5 text-[#776c5e]"><FileImage className="mx-auto mb-2 h-5 w-5 text-[#a4998b]" />尚未提供校稿預覽</div>}</div><div className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-3"><p className="font-serif text-2xl text-[#8d3131]">{page.pageNumber}</p><StatusPill label={page.layoutStatus} /></div><h3 className="mt-3 font-serif text-lg leading-snug text-[#302b25]">{page.title}</h3>{page.pngUrl ? <button onClick={() => openGallery(page.id)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8d3131] hover:underline">開啟校稿相簿 <ArrowRight className="h-3.5 w-3.5" /></button> : <p className="mt-4 text-xs text-[#8a8074]">校稿預覽整理中</p>}</div></article>)}</div></div></section>

    <section id="attention" className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]"><SectionTitle title="待確認／待提供" description="以下頁面仍有資料、圖檔或內容需確認；專案團隊完成整理後會更新進度。" /><div className="border-t border-[#cfc3b6]">{attentionPages.length ? attentionPages.map((page) => <div key={page.id} className="flex flex-col gap-3 border-b border-[#ded5c9] py-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-serif text-xl text-[#8d3131]">{page.pageNumber} <span className="ml-2 text-base text-[#302b25]">{page.title}</span></p><p className="mt-1 text-sm text-[#746a5f]">此頁仍有待確認或待提供項目。</p></div><StatusPill label={page.layoutStatus} /></div>) : <div className="py-8 text-sm leading-7 text-[#746a5f]">目前沒有待確認或待提供項目。</div>}</div></div></section>

    <section className="border-t border-[#ded5c9] bg-[#fffdf9]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><button onClick={() => setShowRecentUpdates((value) => !value)} className="flex w-full items-start justify-between gap-6 text-left"><SectionTitle title="最近更新" description="以下為完整的專案進度紀錄，預設收合以保留首頁閱讀節奏。" /><span aria-hidden="true" className="mt-2 text-2xl text-[#8d3131]">{showRecentUpdates ? "⌃" : "⌄"}</span></button>{showRecentUpdates ? <div className="mt-8 divide-y divide-[#ded5c9] border-y border-[#ded5c9]">{recentUpdates.length ? recentUpdates.map((update) => <article key={update.id} className="grid gap-3 py-5 md:grid-cols-[130px_1fr]"><div className="text-sm font-semibold text-[#8d3131]">{update.displayDate}</div><div><p className="leading-7 text-[#665d53]">{update.summary}</p></div></article>) : <div className="py-10 text-center text-sm text-[#746a5f]"><FolderClock className="mx-auto mb-3 h-7 w-7 text-[#a79b8c]" />尚未建立更新紀錄。</div>}</div> : null}</div></section>

    <section className="border-t border-[#ded5c9] bg-[#292621] text-[#fffaf2]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><p className="text-xs font-semibold tracking-[0.18em] text-[#e4b8a8]">版本歷程</p><h2 className="mt-3 font-serif text-3xl sm:text-4xl">V1–V4 內容版本基準</h2><p className="mt-3 max-w-2xl leading-7 text-[#d5cbc0]">以下為本專案各階段的版本摘要；目前排版依據為 2026/08/03 確認版本。</p><div className="mt-8 grid gap-3 lg:grid-cols-4">{[...versions].reverse().map((version) => <article key={version.stage} className={`border p-5 ${version.isCurrent ? "border-[#d89175] bg-[#46332d]" : "border-white/15 bg-white/[0.03]"}`}><div className="flex items-center justify-between"><span className="font-serif text-3xl">{version.stage === "V0" ? "V1" : version.stage === "V1" ? "V2" : version.stage === "V2" ? "V3" : version.stage === "V3" ? "V4" : version.stage}</span>{version.isCurrent ? <span className="border border-[#e4b8a8] px-2 py-1 text-[10px] font-bold tracking-[0.12em] text-[#f2c4b2]">目前基準</span> : null}</div><p className="mt-4 text-sm font-semibold text-[#e4b8a8]">{version.date}</p><h3 className="mt-4 font-serif text-lg">{version.title}</h3><p className="mt-3 text-sm leading-6 text-[#d5cbc0]">{version.isCurrent ? "目前排版與內容確認依據。" : "專案內容整理與校稿階段。"}</p></article>)}</div></div></section>
  </main>{activePageId && galleryPages.length ? <ProofGallery pages={galleryPages} initialPageId={activePageId} onClose={closeGallery} /> : null}</div>;
}
