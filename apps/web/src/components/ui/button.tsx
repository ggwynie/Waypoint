import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "ghost" | "quiet" | "link" | "icon";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 font-[inherit] transition-[border-color,filter,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50";
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "rounded-btn border-0 font-bold text-[var(--on-grad)] [background:var(--grad-primary)] [box-shadow:var(--grad-primary-shadow)] hover:brightness-110",
  ghost: "rounded-btn border border-line bg-transparent font-semibold text-ink hover:border-link",
  quiet: "rounded-field border border-line2 bg-transparent text-muted hover:border-line",
  link: "border-0 bg-transparent p-0 font-semibold text-link underline-offset-2 hover:underline",
  icon: "rounded-btn border border-chip bg-inset text-ink hover:border-link",
};
const SIZES: Record<Size, string> = {
  sm: "h-[34px] px-3 text-[13px]",
  md: "h-10 px-3.5 text-sm",
  lg: "h-12 px-[18px] text-[15px]",
};

export function buttonClass(variant: ButtonVariant = "ghost", size: Size = "md", extra = "") {
  const sizing = variant === "link" ? "text-sm" : variant === "icon" ? "h-12 w-12 p-0" : SIZES[size];
  return `${BASE} ${VARIANTS[variant]} ${sizing} ${extra}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: Size; loading?: boolean; children: ReactNode };

/** Button. Loading keeps the width and swaps the label for a spinner. */
export function Button({ variant = "ghost", size = "md", loading, className = "", children, disabled, type = "button", ...rest }: Props) {
  return (
    <button type={type} className={buttonClass(variant, size, `relative ${className}`)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      <span className={loading ? "invisible" : "contents"}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
    </button>
  );
}

export function ButtonLink({ href, variant = "ghost", size = "md", className = "", children }: { href: string; variant?: ButtonVariant; size?: Size; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass(variant, size, `no-underline ${className}`)}>
      {children}
    </Link>
  );
}
