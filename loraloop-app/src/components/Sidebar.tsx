"use client";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("id");

  const knowledgeBaseHref = businessId ? `/board?id=${businessId}` : "/knowledge-base";

  const isHome = pathname === "/";
  const isBoard =
    pathname.startsWith("/board") ||
    pathname === "/knowledge-base" ||
    pathname.startsWith("/loading");

  return (
    <aside className="sticky top-0 left-0 h-screen z-40 flex flex-col bg-[#FAFBFC] w-[220px] border-r border-[#E5E7EB] py-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 mb-8">
        <div className="w-8 h-8 bg-[#3B82F6] rounded-[8px] flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 3H10V15H20V19H6V3Z" fill="white" />
          </svg>
        </div>
        <span className="text-[15px] font-bold text-[#111111] tracking-tight">Loraloop</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-4">
        <Link
          href="/"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-semibold text-[14px] ${
            isHome
              ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/20"
              : "text-[#3F3F46] hover:text-[#111111] hover:bg-[#F4F4F5]"
          }`}
        >
          <Home className="w-[18px] h-[18px] shrink-0 opacity-80" strokeWidth={2} />
          <span>Home</span>
        </Link>

        <Link
          href={knowledgeBaseHref}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-semibold text-[14px] ${
            isBoard
              ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/20"
              : "text-[#3F3F46] hover:text-[#111111] hover:bg-[#F4F4F5]"
          }`}
        >
          <Search className="w-[18px] h-[18px] shrink-0 opacity-80" strokeWidth={2} />
          <span>Knowledge Base</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-6 mt-auto">
        <div className="w-9 h-9 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-[14px] shadow-sm cursor-pointer hover:opacity-90 tracking-wide uppercase">
          L
        </div>
      </div>
    </aside>
  );
}
