import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "blue" | "amber" | "rose" | "emerald";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-paper-100 text-ink-700 ring-paper-200",
  brand: "bg-brand-50 text-brand-600 ring-brand-100",
  blue: "bg-blue-100/60 text-blue-600 ring-blue-100",
  amber: "bg-amber-100/70 text-amber-500 ring-amber-100",
  rose: "bg-rose-100/70 text-rose-600 ring-rose-100",
  emerald: "bg-emerald-100/70 text-emerald-600 ring-emerald-100",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const riskTone: Record<string, Tone> = {
  Low: "emerald",
  Medium: "amber",
  High: "rose",
};

export function RiskBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  return <Badge tone={riskTone[level]}>{level} risk</Badge>;
}

const statusTone: Record<string, Tone> = {
  Effective: "emerald",
  Monitoring: "blue",
  "Remediation in Progress": "amber",
  Active: "emerald",
  "Under Review": "amber",
  Complete: "emerald",
  "In Progress": "blue",
  Planned: "neutral",
  Done: "emerald",
  "Not Started": "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? "neutral"}>{status}</Badge>;
}

const priorityTone: Record<string, Tone> = {
  Must: "rose",
  Should: "amber",
  Could: "blue",
};

export function PriorityBadge({ priority }: { priority: "Must" | "Should" | "Could" }) {
  return <Badge tone={priorityTone[priority]}>{priority} have</Badge>;
}
