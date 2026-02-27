import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white hover:brightness-110 border border-transparent shadow-[0_10px_24px_rgb(37_99_235_/_.22)]",
  secondary:
    "bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] hover:border-[var(--border-strong)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] border border-transparent",
  danger:
    "bg-[var(--danger)] text-white hover:brightness-110 border border-transparent shadow-[0_10px_24px_rgb(220_38_38_/_.24)]",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-10 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className,
  type = "button",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const composedClassName = [
    "inline-flex touch-manipulation items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,border-color,color,opacity,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-60",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={composedClassName}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}
