import type { ButtonHTMLAttributes } from "react";

type IconButtonTone = "neutral" | "accent" | "danger";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  "aria-label": string;
  tone?: IconButtonTone;
  size?: "sm" | "md";
};

const TONE_CLASS: Record<IconButtonTone, string> = {
  neutral:
    "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]",
  accent:
    "text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] hover:bg-[var(--accent-soft)]",
  danger: "text-[var(--danger)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]",
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
    "inline-flex touch-manipulation items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] transition-[background-color,border-color,color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-50",
    TONE_CLASS[tone],
    SIZE_CLASS[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button type={type} className={composedClassName} {...props} />;
}
