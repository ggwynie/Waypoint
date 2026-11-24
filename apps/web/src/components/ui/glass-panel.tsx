import type { ComponentPropsWithoutRef, ElementType } from "react";

const VARIANT = { glass: "glass", map: "glass-map", float: "glass-float", inset: "inset" } as const;

type Props<T extends ElementType> = {
  as?: T;
  variant?: keyof typeof VARIANT;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/** GlassPanel: the only container for page sections. */
export function GlassPanel<T extends ElementType = "section">({ as, variant = "glass", className = "", ...rest }: Props<T>) {
  const Tag = (as ?? "section") as ElementType;
  return <Tag className={`${VARIANT[variant]} box-border flex min-w-0 flex-col rounded-panel ${className}`} {...rest} />;
}
