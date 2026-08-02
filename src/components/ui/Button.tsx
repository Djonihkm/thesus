import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type ButtonProps = {
  href?: string;
  variant?: "primary" | "outline" | "accent";
  tone?: "light" | "dark";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
};

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-full px-7 py-3 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const styles = {
  light: {
    primary: "bg-ink text-paper hover:bg-ink/85",
    outline: "border border-accent text-ink hover:bg-accent/10",
    accent: "bg-accent-lime text-ink hover:brightness-95",
  },
  dark: {
    primary: "bg-paper text-ink hover:bg-paper/85",
    outline: "border border-accent text-paper hover:bg-accent/10",
    accent: "bg-accent-lime text-ink hover:brightness-95",
  },
} as const;

export function Button({
  href,
  variant = "primary",
  tone = "light",
  className = "",
  type = "button",
  disabled = false,
  onClick,
  children,
}: ButtonProps) {
  const classes = `${base} ${styles[tone][variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
