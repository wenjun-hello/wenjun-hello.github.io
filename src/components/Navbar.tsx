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
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(13,20,36,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(200,169,107,0.1)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between h-14 sm:h-16">
        {/* Logo */}
        <Link
          href="/"
          className="text-xs sm:text-sm tracking-[0.3em] hover:opacity-80 transition-opacity"
          style={{
            fontFamily: "Cinzel, serif",
            fontWeight: 500,
            color: "#C8A96B",
          }}
        >
          ROYAL ARCANA
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 sm:gap-3">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[0.6rem] sm:text-[0.7rem] tracking-[0.15em] px-2 py-1.5 transition-all duration-500 ${
                  isActive ? "" : "hover:opacity-80"
                }`}
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  color: isActive ? "#C8A96B" : "rgba(184,188,198,0.55)",
                  borderBottom: isActive
                    ? "1px solid rgba(200,169,107,0.4)"
                    : "1px solid transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
