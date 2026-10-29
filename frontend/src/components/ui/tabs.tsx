import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (val: string) => void;
}

export function Tabs({ value, onValueChange, className, children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-0 bg-transparent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  badge?: string | number;
}

export function TabsTrigger({ value, badge, className, children, ...props }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used inside Tabs");

  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer border",
        isActive
          ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 shadow-2xs font-semibold"
          : "bg-transparent text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-850",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
            isActive ? "bg-zinc-100 text-zinc-800" : "bg-zinc-200/80 text-zinc-600"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used inside Tabs");

  if (ctx.value !== value) return null;

  return (
    <div
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}
