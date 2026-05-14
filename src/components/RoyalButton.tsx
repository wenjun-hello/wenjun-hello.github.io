"use client";

import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
  type?: "button" | "submit";
};

export default function RoyalButton({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
  type = "button",
}: Props) {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { y: -1 }}
      whileTap={disabled ? {} : { y: 0 }}
      className={`relative px-8 sm:px-10 py-3 sm:py-4 cursor-pointer group transition-opacity ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      } ${className}`}
      style={{
        background: isPrimary ? "transparent" : "rgba(200,169,107,0.04)",
        border: isPrimary
          ? "1px solid rgba(200,169,107,0.4)"
          : "1px solid rgba(200,169,107,0.2)",
        fontFamily: "Cinzel, serif",
        fontSize: "0.72rem",
        letterSpacing: "0.22em",
        color: isPrimary ? "#C8A96B" : "rgba(200,169,107,0.7)",
        textTransform: "uppercase" as const,
      }}
    >
      {/* Inner border */}
      <span
        className="absolute inset-[3px] transition-all duration-700"
        style={{ border: "1px solid rgba(200,169,107,0.1)" }}
      />

      {/* Hover glow (primary only) */}
      {isPrimary && (
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-1000"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(200,169,107,0.06) 0%, transparent 70%)",
            boxShadow: "0 0 30px rgba(200,169,107,0.1)",
          }}
        />
      )}

      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
