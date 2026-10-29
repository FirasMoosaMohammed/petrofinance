import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-slate-50 shadow hover:bg-slate-800 active:scale-[0.98]",
        destructive:
          "bg-red-500 text-slate-50 shadow-sm hover:bg-red-600",
        outline:
          "border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white",
        secondary:
          "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100 shadow-sm hover:bg-slate-200 dark:hover:bg-zinc-700",
        ghost: "hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-slate-100",
        link: "text-slate-900 underline-offset-4 hover:underline",
        navy: "bg-[#0f172a] text-white hover:bg-[#1e293b] shadow-sm",
        amber: "bg-amber-600 text-white hover:bg-amber-700 shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

