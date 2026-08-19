import { PortalHeader } from "@/components/PortalHeader";
import { ProofGallery } from "@/components/ProofGallery";
import { StatusPill } from "@/components/StatusPill";
import { trpc } from "@/lib/trpc";
import { issueLines } from "@shared/portal";
import { ArrowRight, Download, FileImage, FolderClock, Loader2 } from "lucide-react";
import { formatPublishedDate } from "@shared/portal";
import { useEffect, useRef, useState } from "react";

function SectionTitle({ title }: { title: string }) {
  return <h2 className="font-serif text-3xl text-[#292621] sm:text-4xl">{title}</h2>;
}

function HistoryList({ updates, emptyText }: { updates: Array<{ id: number; displayDate: string; summary: string; status: string }>; emptyText: string }) {
  if (!updates.length) return <div className="py-10 text-center text-sm text-[#746a5f]">{emptyText}</div>;
  const [latest, ...older] = updates;
  return <div className="divide-y divide-[#ded5c9] border-y border-[#ded5c9]">
    <article className="grid gap-3 py-5 md:grid-cols-[130px_1fr]">
      <div className="text-sm font-semibold text-[#8d3131]">{latest.displayDate}</div>
      <p className="whitespace-pre-line leading-7 text-[#665d53]">{latest.summary}</p>
    </article>
    {older.length ? <details>
      <summary className="cursor-pointer list-none py-4 text-sm font-semibold text-[#8d3131]">查看較早紀錄（{older.length}）</summary>
      <div className="divide-y divide-[#ded5c9] border-t border-[#ded5c9]">
        {older.map((update) => <article key={update.id} className="grid gap-3 py-5 md:grid-cols-[130px_1fr]">
          <div className="text-sm font-semibold text-[#8d3131]">{update.displayDate}</div>
          <p className="whitespace-pre-line leading-7 text-[#665d53]">{update.summary}</p>
        </article>)}
      </div>
    </details> : null}
  </div>;
}

export default function Home() {
  const dashboard = trpc.portal.dashboard.useQuery();
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [isDownloadingLatest, setIsDownloadingLatest] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [publishedDate, setPublishedDate] = useState("最新發布");
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

  const { project, weeklyProgress, recentUpdates, proofingUpdates, pages, attentionPages, versions } = dashboard.data;
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
      link.download = "rukai-book-latest.zip";
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

  const firstPage = pages[0]?.pageNumber ?? "—";
  const lastPage = pages[pages.length - 1]?.pageNumber ?? "—";
  const batchLabel = pages.length ? `${firstPage}–${lastPage}` : "—";
  const concreteAttentionPages = attentionPages.filter((page) => issueLines(page.notes).length > 0);

  return <div className="min-h-screen bg-[#f5f1eb] text-[#292621]"><PortalHeader /><main>
    <section className="border-b border-[#ded5c9] bg-[#e9e1d4]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20"><div className="max-w-5xl"><h1 className="font-serif text-5xl leading-[1.08] text-[#292621] sm:text-6xl">{project.title}</h1><div className="mt-8 flex flex-wrap gap-3"><button onClick={openCurrentProof} className="inline-flex items-center gap-2 bg-[#8d3131] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#702525] active:scale-[0.98]">開啟校稿相簿 <ArrowRight className="h-4 w-4" /></button><button onClick={downloadLatest} disabled={isDownloadingLatest} className="inline-flex items-center gap-2 bg-[#8d3131] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#702525] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60">{isDownloadingLatest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}下載最新版（{publishedDate}）</button></div>{downloadError ? <p role="alert" className="mt-4 max-w-2xl text-sm text-[#8d3131]">{downloadError}</p> : null}</div></div></section>

    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><SectionTitle title="目前進度" /><div className="mt-8 grid gap-px bg-[#ded5c9] sm:grid-cols-3"><div className="bg-[#fffdf9] p-6"><p className="text-xs font-semibold tracking-[0.12em] text-[#8d3131]">排版進度</p><p className="mt-3 font-serif text-4xl text-[#292621]">{weeklyProgress?.latestPageOrder || "—"}</p></div><div className="bg-[#fffdf9] p-6"><p className="text-xs font-semibold tracking-[0.12em] text-[#8d3131]">待處理頁面</p><p className="mt-3 font-serif text-4xl text-[#292621]">{concreteAttentionPages.length}</p></div><div className="bg-[#fffdf9] p-6"><p className="text-xs font-semibold tracking-[0.12em] text-[#8d3131]">本批版本</p><p className="mt-3 font-serif text-4xl text-[#292621]">{batchLabel}</p></div></div></section>

    <section id="page-preview" className="border-y border-[#ded5c9] bg-[#fffdf9]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><SectionTitle title="頁面預覽" /><div className="mt-9 grid gap-4 lg:grid-cols-2">{pages.map((page) => <article key={page.id} className="group grid min-h-48 grid-cols-[106px_1fr] gap-4 border border-[#ded5c9] bg-[#fffdf9] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(62,45,25,0.08)] sm:grid-cols-[132px_1fr] sm:gap-5 sm:p-5"><div className="relative flex min-h-36 items-center justify-center overflow-hidden bg-[#e8dfd3]">{page.pngUrl ? <button onClick={() => openGallery(page.id)} className="h-full w-full" aria-label={`開啟 ${page.pageNumber} 校稿預覽`}><img src={page.pngUrl} alt={`${page.pageNumber} 校稿縮圖`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></button> : <div className="px-3 text-center text-xs leading-5 text-[#776c5e]"><FileImage className="mx-auto mb-2 h-5 w-5 text-[#a4998b]" />尚無縮圖</div>}</div><div className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-3"><p className="font-serif text-2xl text-[#8d3131]">{page.pageNumber}</p><StatusPill label={page.layoutStatus} /></div><h3 className="mt-3 font-serif text-lg leading-snug text-[#302b25]">{page.title}</h3></div></article>)}</div></div></section>

    <section id="attention" className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]"><SectionTitle title="待處理事項" /><div className="border-t border-[#cfc3b6]">{concreteAttentionPages.length ? concreteAttentionPages.map((page) => <div key={page.id} className="border-b border-[#ded5c9] py-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-serif text-xl text-[#8d3131]">{page.pageNumber} <span className="ml-2 text-base text-[#302b25]">{page.title}</span></p><StatusPill label={issueLines(page.notes).some((line) => line.includes("頁碼")) ? "後處理" : "待提供"} /></div><div className="mt-3 space-y-1.5 text-sm leading-6 text-[#746a5f]">{issueLines(page.notes).map((issue) => <p key={issue}> {issue}</p>)}</div></div>) : <div className="py-8 text-sm leading-7 text-[#746a5f]">目前沒有待處理事項。</div>}</div></div></section>

    <section className="border-t border-[#ded5c9] bg-[#fffdf9]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><SectionTitle title="校稿歷程" /><div className="mt-8"><HistoryList updates={proofingUpdates} emptyText="目前尚未建立校稿處理紀錄。" /></div></div></section>

    <section className="border-t border-[#ded5c9] bg-[#fffdf9]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><SectionTitle title="更新歷程" /><div className="mt-8"><HistoryList updates={recentUpdates.filter((update) => update.updateType !== "校稿處理")} emptyText="尚未建立更新紀錄。" /></div></div></section>

    <section className="border-t border-[#ded5c9] bg-[#292621] text-[#fffaf2]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><p className="text-xs font-semibold tracking-[0.18em] text-[#e4b8a8]">版本歷程</p><h2 className="mt-3 font-serif text-3xl sm:text-4xl">V0–V3 內容版本基準</h2><div className="mt-8 grid gap-3 lg:grid-cols-4">{versions.map((version) => <article key={version.stage} className={`border p-5 ${version.isCurrent ? "border-[#d89175] bg-[#46332d]" : "border-white/15 bg-white/[0.03]"}`}><div className="flex items-center justify-between"><span className="font-serif text-3xl">{version.stage}</span>{version.isCurrent ? <span className="border border-[#e4b8a8] px-2 py-1 text-[10px] font-bold tracking-[0.12em] text-[#f2c4b2]">目前基準</span> : null}</div><p className="mt-4 text-sm font-semibold text-[#e4b8a8]">{version.date}</p><h3 className="mt-4 font-serif text-lg">{version.title}</h3><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#d5cbc0]">{version.details}</p></article>)}</div></div></section>
  </main>{activePageId && galleryPages.length ? <ProofGallery pages={galleryPages} initialPageId={activePageId} onClose={closeGallery} /> : null}</div>;
}
