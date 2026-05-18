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
  children, onClick, disabled = false, variant = "primary", className = "", type = "button",
}: Props) {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { y: -1 }}
      whileTap={disabled ? {} : { y: 0 }}
      className={`rounded-full cursor-pointer transition-all duration-300 ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
      style={{
        border: isPrimary
          ? "1px solid rgba(199,165,111,0.5)"
          : "1px solid rgba(199,165,111,0.35)",
        background: isPrimary ? "#C7A56F" : "rgba(255,249,239,0.75)",
        padding: "0.7rem 2rem",
        fontFamily: "Cinzel, serif",
        fontSize: "0.7rem",
        letterSpacing: "0.2em",
        color: isPrimary ? "#FFF9EF" : "#6F5A3E",
        boxShadow: isPrimary
          ? "0 14px 38px rgba(111,90,62,0.16)"
          : "0 10px 30px rgba(111,90,62,0.08)",
      }}
    >
      {children}
    </motion.button>
  );
}
