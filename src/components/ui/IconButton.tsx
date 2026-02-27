import type { ButtonHTMLAttributes } from "react";

type IconButtonTone = "neutral" | "accent" | "danger";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  "aria-label": string;
  tone?: IconButtonTone;
  size?: "sm" | "md";
};

const TONE_CLASS: Record<IconButtonTone, string> = {
  neutral:
    "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[0_10px_20px_rgb(14_28_50_/_.2)]",
  accent:
    "text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] hover:shadow-[0_10px_20px_rgb(31_82_195_/_.24)]",
  danger:
    "text-[var(--danger)] hover:text-[var(--danger)] hover:border-[var(--danger-border)] hover:bg-[var(--danger-soft)] hover:shadow-[0_10px_20px_rgb(204_49_64_/_.24)]",
};

const SIZE_CLASS = {
  sm: "h-10 w-10",
  md: "h-11 w-11",
};

export function IconButton({
  className,
  type = "button",
  tone = "neutral",
  size = "sm",
  ...props
}: IconButtonProps) {
  const composedClassName = [
    "inline-flex cursor-pointer touch-manipulation items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] transition-[background-color,border-color,color,opacity,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-50",
    TONE_CLASS[tone],
    SIZE_CLASS[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button type={type} className={composedClassName} {...props} />;
}
