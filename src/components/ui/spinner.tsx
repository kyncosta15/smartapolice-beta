import * as React from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", className)}
        {...props}
      >
        <span className="sr-only">Carregando...</span>
      </div>
    )
  }
)

Spinner.displayName = "Spinner"
