import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface KPICardProps {
  title: string;
  value: string;
  target?: string;
  variancePct?: number;
  varianceLabel?: string;
  isFavorable?: boolean | null;
  subtitle?: string;
  trendText?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  variancePct,
  isFavorable,
  subtitle,
  trendText,
  className
}: KPICardProps) {
  const isPositive = variancePct !== undefined && variancePct >= 0;

  return (
    <Card className={cn("border border-zinc-200/90 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] bg-white dark:bg-zinc-950", className)}>
      <CardContent className="p-6">
        {/* Top Header: Title and Trend Pill */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            {title}
          </span>
          {variancePct !== undefined && (
            <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-zinc-800 dark:text-zinc-200" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-zinc-800 dark:text-zinc-200" />
              )}
              <span>{isPositive ? `+${variancePct}%` : `${variancePct}%`}</span>
            </div>
          )}
        </div>

        {/* Big Bold KPI Value */}
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
            {value}
          </div>
        </div>

        {/* Trend Statement & Context */}
        <div className="mt-3 space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-medium">
            <span>{trendText || (isFavorable ? "Trending up this period" : "Tracking below target")}</span>
            {isFavorable ? (
              <TrendingUp className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
            ) : (
              <TrendingDown className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
