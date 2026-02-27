import type { ComponentType, KeyboardEvent, SVGProps } from "react";

import type { ThemePreference } from "../../hooks/useTheme";
import { IconMonitor, IconMoon, IconSun } from "./icons";

interface ThemeToggleProps {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
}

const OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconMonitor },
];

export function ThemeToggle({ value, onChange }: ThemeToggleProps) {
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
      className="inline-flex items-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] p-1"
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
            className={`inline-flex h-11 min-w-11 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-secondary)] ${
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="ml-1 hidden xl:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
