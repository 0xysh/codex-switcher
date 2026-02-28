import type { UsageInfo } from "../types";
import { IconActivity, IconAlertTriangle, IconClock, IconShieldCheck } from "./ui";

interface UsageBarProps {
  usage?: UsageInfo;
  loading?: boolean;
}

function formatResetTime(resetAt: number | null | undefined): string {
  if (!resetAt) return "";

  const now = Math.floor(Date.now() / 1000);
  const diff = resetAt - now;

  if (diff <= 0) return "now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const dayHours = hours % 24;
  return dayHours > 0 ? `${days}d ${dayHours}h` : `${days}d`;
}

function formatWindowDuration(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function UsageMetric({
  label,
  usedPercent,
  windowMinutes,
  resetsAt,
  variant,
}: {
  label: string;
  usedPercent: number;
  windowMinutes?: number | null;
  resetsAt?: number | null;
  variant: "five_hour" | "seven_day";
}) {
  const remainingPercent = Math.max(0, 100 - usedPercent);
  const resetLabel = formatResetTime(resetsAt);
  const windowLabel = formatWindowDuration(windowMinutes);

  const metricStyle =
    variant === "five_hour"
      ? {
          label: "text-[var(--usage-5h)]",
          iconBadge: "border-[var(--usage-5h)] bg-[var(--usage-5h-soft)] shadow-[0_8px_16px_rgb(36_89_212_/_.14)]",
          healthyBar: "bg-gradient-to-r from-[var(--usage-5h)] to-[#4f80ea]",
          warningBar: "bg-gradient-to-r from-[#f59e0b] to-[#f4b153]",
          healthyText: "text-[var(--usage-5h)]",
        }
      : {
          label: "text-[var(--usage-7d)]",
          iconBadge: "border-[var(--usage-7d)] bg-[var(--usage-7d-soft)] shadow-[0_8px_16px_rgb(21_152_115_/_.14)]",
          healthyBar: "bg-gradient-to-r from-[var(--usage-7d)] to-[#2ac598]",
          warningBar: "bg-gradient-to-r from-[#fb923c] to-[#fbb36f]",
          healthyText: "text-[var(--usage-7d)]",
        };

  const tone =
    remainingPercent <= 10
      ? {
          bar: "bg-[var(--danger)]",
          text: "text-[var(--danger)]",
          icon: IconAlertTriangle,
        }
      : remainingPercent <= 30
        ? {
            bar: metricStyle.warningBar,
            text: "text-[var(--warning)]",
            icon: IconAlertTriangle,
          }
        : {
            bar: metricStyle.healthyBar,
            text: metricStyle.healthyText,
            icon: IconShieldCheck,
          };

  const ToneIcon = tone.icon;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={`flex items-center gap-1.5 font-semibold ${metricStyle.label}`}>
          <span className={`inline-flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full border ${metricStyle.iconBadge}`}>
            <IconActivity className="h-3 w-3" />
          </span>
          <span>{label}</span>
          {windowLabel && <span className="text-muted">({windowLabel})</span>}
        </span>

        {resetLabel ? (
          <span className={`mono-data inline-flex shrink-0 items-center gap-1 text-[11px] font-medium ${tone.text}`}>
            <IconClock className="h-3 w-3" />
            resets in {resetLabel}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full border border-[var(--border-soft)] bg-[var(--bg-surface)]">
          <div
            className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${tone.bar}`}
            style={{ width: `${Math.min(remainingPercent, 100)}%` }}
          />
        </div>

        <span className={`mono-data tabular-nums inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold ${tone.text}`}>
          <ToneIcon className="h-3.5 w-3.5" />
          {remainingPercent.toFixed(0)}% left
        </span>
      </div>
    </div>
  );
}

export function UsageBar({ usage, loading = false }: UsageBarProps) {
  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading usage">
        <div className="h-2.5 animate-pulse rounded-full bg-[var(--bg-surface)] motion-reduce:animate-none" />
        <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-[var(--bg-surface)] motion-reduce:animate-none" />
      </div>
    );
  }

  if (!usage || usage.error) {
    return (
      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-muted">
        {usage?.error || "Usage data is unavailable right now."}
      </div>
    );
  }

  const hasPrimary = typeof usage.primary_used_percent === "number";
  const hasSecondary = typeof usage.secondary_used_percent === "number";

  if (!hasPrimary && !hasSecondary) {
    return (
      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-muted">
        No usage limits reported for this account yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasPrimary && (
        <UsageMetric
          label="5h limit"
          usedPercent={usage.primary_used_percent!}
          windowMinutes={usage.primary_window_minutes}
          resetsAt={usage.primary_resets_at}
          variant="five_hour"
        />
      )}

      {hasSecondary && (
        <div className={hasPrimary ? "border-t border-[var(--border-soft)] pt-3" : undefined}>
          <UsageMetric
            label="Weekly limit"
            usedPercent={usage.secondary_used_percent!}
            windowMinutes={usage.secondary_window_minutes}
            resetsAt={usage.secondary_resets_at}
            variant="seven_day"
          />
        </div>
      )}
    </div>
  );
}
