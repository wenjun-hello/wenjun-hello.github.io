"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "首页" },
  { href: "/reading", label: "抽牌" },
  { href: "/archive", label: "牌库" },
  { href: "/about", label: "关于" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(251,244,234,0.85)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(199,165,111,0.22)",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-10 flex items-center justify-between h-14 sm:h-16">
        {/* Logo */}
        <Link
          href="/"
          className="text-xs sm:text-sm tracking-[0.3em] hover:opacity-65 transition-opacity flex items-center gap-2"
          style={{ fontFamily: "Cinzel, serif", fontWeight: 500, color: "#C7A56F" }}
        >
          <span className="text-[10px] opacity-60">✦</span>
          ROYAL ARCANA
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 sm:gap-4">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-[0.65rem] sm:text-[0.72rem] tracking-[0.16em] px-2 py-1.5 transition-all duration-300"
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  color: isActive ? "#C7A56F" : "#8A7760",
                  opacity: isActive ? 1 : 0.62,
                }}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-[1px]">
                    <span className="w-4 h-[1px]" style={{ background: "rgba(199,165,111,0.6)" }} />
                    <span className="text-[5px] opacity-70" style={{ color: "#C7A56F" }}>✦</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
