import { CompassIcon } from "./icons";

export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <span className="font-heading font-bold tracking-[-0.5px]" style={{ fontSize: size }}>
      Way<span className="text-gradient">point</span>
    </span>
  );
}

export function LogoTile({ size = 40 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-field text-[var(--on-grad)]"
      style={{ width: size, height: size, background: "var(--grad-logo)", boxShadow: "var(--logo-shadow)" }}
    >
      <CompassIcon size={22} />
    </span>
  );
}
