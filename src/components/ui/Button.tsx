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
    "border border-[var(--accent-border)] bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--accent-foreground)] shadow-[0_12px_26px_rgb(20_80_182_/_.28)] hover:shadow-[0_16px_34px_rgb(20_80_182_/_.36)]",
  secondary:
    "border border-[var(--border-soft)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-soft)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-elevated)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-soft)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]",
  danger:
    "border border-[var(--danger-border)] bg-[var(--danger)] text-white shadow-[0_12px_26px_rgb(204_49_64_/_.28)] hover:brightness-105 hover:shadow-[0_16px_34px_rgb(204_49_64_/_.36)]",
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
    "inline-flex cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-secondary)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
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
