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
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
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
          iconBadge: "border-[var(--usage-5h)] bg-[var(--usage-5h-soft)]",
          healthyBar: "bg-[var(--usage-5h)]",
          warningBar: "bg-[#f59e0b]",
          healthyText: "text-[var(--usage-5h)]",
        }
      : {
          label: "text-[var(--usage-7d)]",
          iconBadge: "border-[var(--usage-7d)] bg-[var(--usage-7d-soft)]",
          healthyBar: "bg-[var(--usage-7d)]",
          warningBar: "bg-[#fb923c]",
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
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className={`flex items-center gap-1 font-semibold ${metricStyle.label}`}>
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${metricStyle.iconBadge}`}>
            <IconActivity className="h-3 w-3" />
          </span>
          {label}
          {windowLabel && <span className="text-muted">({windowLabel})</span>}
        </span>
        <span className={`mono-data tabular-nums inline-flex items-center gap-1 ${tone.text}`}>
          <ToneIcon className="h-3.5 w-3.5" />
          {remainingPercent.toFixed(0)}% left
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-surface)]">
        <div
          className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${tone.bar}`}
          style={{ width: `${Math.min(remainingPercent, 100)}%` }}
        />
      </div>

      {resetLabel && (
        <p className={`flex w-full items-center justify-end gap-1 text-[11px] font-medium ${tone.text}`}>
          <IconClock className="h-3 w-3" />
          resets in {resetLabel}
        </p>
      )}
    </div>
  );
}

export function UsageBar({ usage, loading = false }: UsageBarProps) {
  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading usage">
        <div className="h-2 animate-pulse rounded-full bg-[var(--bg-surface)] motion-reduce:animate-none" />
        <div className="h-2 w-4/5 animate-pulse rounded-full bg-[var(--bg-surface)] motion-reduce:animate-none" />
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
