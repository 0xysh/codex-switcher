interface LiveRegionProps {
  label: string;
  message: string | null;
}

export function LiveRegion({ label, message }: LiveRegionProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      role="status"
      aria-label={label}
      className="sr-only"
    >
      {message}
    </div>
  );
}
