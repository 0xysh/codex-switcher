import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconSparkles(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3l1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3L7.5 7.5l3.3-1.2L12 3z" />
      <path d="M5 13l.7 1.9L7.5 16l-1.8.7L5 18.5l-.7-1.8L2.5 16l1.8-1.1L5 13z" />
      <path d="M19 13l.7 1.9 1.8 1.1-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-1.1L19 13z" />
    </BaseIcon>
  );
}

export function IconShieldCheck(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3l7 3v6c0 4.8-3 7.8-7 9-4-1.2-7-4.2-7-9V6l7-3z" />
      <path d="M9.5 12.3l1.8 1.8 3.5-3.6" />
    </BaseIcon>
  );
}

export function IconAlertTriangle(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10.3 3.8L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </BaseIcon>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 11a8 8 0 10-2.4 5.6" />
      <path d="M20 4v7h-7" />
    </BaseIcon>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </BaseIcon>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </BaseIcon>
  );
}

export function IconSun(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="M4.9 4.9l1.8 1.8" />
      <path d="M17.3 17.3l1.8 1.8" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="M4.9 19.1l1.8-1.8" />
      <path d="M17.3 6.7l1.8-1.8" />
    </BaseIcon>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20.5 14.5A8.5 8.5 0 1111 3a7 7 0 009.5 11.5z" />
    </BaseIcon>
  );
}

export function IconMonitor(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 17v3" />
    </BaseIcon>
  );
}

export function IconArrowRightLeft(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M17 3l4 4-4 4" />
      <path d="M3 7h18" />
      <path d="M7 21l-4-4 4-4" />
      <path d="M21 17H3" />
    </BaseIcon>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
      <path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </BaseIcon>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 20l4-.8L19 8.2a1.8 1.8 0 000-2.5L17.3 4a1.8 1.8 0 00-2.5 0L3.8 15 3 19z" />
      <path d="M13 6l5 5" />
    </BaseIcon>
  );
}

export function IconEye(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.7" />
    </BaseIcon>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2.7 2.7 0 003.8 3.8" />
      <path d="M9.9 5.4A11.1 11.1 0 0112 5c6.5 0 10 7 10 7a16.8 16.8 0 01-3.2 3.9" />
      <path d="M6.5 6.5C3.7 8.4 2 12 2 12s3.5 7 10 7a9.9 9.9 0 003.7-.7" />
    </BaseIcon>
  );
}

export function IconClock(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </BaseIcon>
  );
}

export function IconFilter(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </BaseIcon>
  );
}

export function IconActivity(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 12h3l2-5 4 10 2-5h7" />
    </BaseIcon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12l4 4L19 6" />
    </BaseIcon>
  );
}

export function IconX(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </BaseIcon>
  );
}

export function IconKey(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="M12 15h9" />
      <path d="M18 15v3" />
      <path d="M21 15v2" />
    </BaseIcon>
  );
}

export function IconUserCircle(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.8 18a6.4 6.4 0 0110.4 0" />
    </BaseIcon>
  );
}

export function IconPanelRight(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M14 4v16" />
    </BaseIcon>
  );
}

export function IconGripVertical(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </BaseIcon>
  );
}

export function IconCommand(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 7h2a2 2 0 110 4H7a2 2 0 110-4z" />
      <path d="M15 7h2a2 2 0 110 4h-2a2 2 0 110-4z" />
      <path d="M7 15h2a2 2 0 110 4H7a2 2 0 110-4z" />
      <path d="M15 15h2a2 2 0 110 4h-2a2 2 0 110-4z" />
      <path d="M9 9l6 6" />
      <path d="M9 15l6-6" />
    </BaseIcon>
  );
}
