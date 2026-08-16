import { cn } from "@/lib/utils";

export function StatusPill({ label }: { label: string }) {
  const style =
    label === "目前採用" || label === "齊全"
      ? "border-[#a9b7a7] bg-[#edf3eb] text-[#486143]"
      : label === "排版中" || label === "已排待重編頁碼"
        ? "border-[#d9ba80] bg-[#fff5dd] text-[#815a18]"
        : label === "待確認" || label === "缺電子檔" || label === "待製作" || label === "尚未排版" || label === "頁序尚未鎖定"
          ? "border-[#e2b2ae] bg-[#fff0ee] text-[#8d3131]"
          : "border-[#d8cec1] bg-[#f7f3ed] text-[#665d53]";
  return <span className={cn("inline-flex min-h-6 items-center border px-2 py-0.5 text-[11px] font-semibold leading-4", style)}>{label}</span>;
}
