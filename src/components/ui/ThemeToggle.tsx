import type { ComponentType, KeyboardEvent, SVGProps } from "react";

import type { ThemePreference } from "../../hooks/useTheme";
import { IconMoon, IconSparkles, IconSun } from "./icons";

interface ThemeToggleProps {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
  className?: string;
}

const OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "Random", icon: IconSparkles },
];

export function ThemeToggle({ value, onChange, className }: ThemeToggleProps) {
  const selectedIndex = OPTIONS.findIndex((option) => option.value === value);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (selectedIndex + direction + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[nextIndex].value);
  };

  return (
    <div
      className={`inline-grid w-full grid-cols-3 items-stretch gap-1 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface-elevated)] p-1.5 shadow-[var(--shadow-soft)] ${className ?? ""}`}
      role="radiogroup"
      aria-label="Theme mode"
      onKeyDown={handleKeyDown}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
            className={`inline-flex h-11 w-full cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] font-semibold transition-[background-color,color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-secondary)] sm:min-w-[88px] sm:text-xs ${
              active
                ? "border border-[var(--accent-border)] bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-[0_10px_20px_rgb(20_80_182_/_.3)]"
                : "border border-transparent text-[var(--text-muted)] hover:border-[var(--border-soft)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
