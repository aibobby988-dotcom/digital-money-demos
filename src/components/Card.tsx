import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-paper-200 bg-paper-0 shadow-[0_1px_2px_rgba(15,21,33,0.04)]",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="text-[14px] font-semibold text-charcoal-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
