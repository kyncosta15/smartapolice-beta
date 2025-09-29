import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle, X, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const ProgressToastProvider = ToastPrimitives.Provider

const ProgressToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-4 sm:right-4 sm:left-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ProgressToastViewport.displayName = ToastPrimitives.Viewport.displayName

const progressToastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center space-x-3 overflow-hidden rounded-lg border bg-background p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
  {
    variants: {
      variant: {
        success: "border-green-200 bg-green-50 text-green-800",
        error: "border-red-200 bg-red-50 text-red-800", 
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
        info: "border-blue-200 bg-blue-50 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "success",
    },
  }
)

interface ProgressToastProps extends 
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
  VariantProps<typeof progressToastVariants> {
  title: string
  duration?: number
  showProgress?: boolean
}

const ProgressToast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ProgressToastProps
>(({ className, variant, title, duration = 5000, showProgress = true, ...props }, ref) => {
  const [progress, setProgress] = React.useState(100)

  React.useEffect(() => {
    if (!showProgress) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 50))
        return newProgress <= 0 ? 0 : newProgress
      })
    }, 50)

    return () => clearInterval(interval)
  }, [duration, showProgress])

  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
      case "info":
        return <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
      default:
        return <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
    }
  }

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(progressToastVariants({ variant }), className)}
      duration={duration}
      {...props}
    >
      <div className="flex items-center space-x-3 flex-1">
        {getIcon()}
        <div className="flex-1">
          <ToastPrimitives.Title className="text-sm font-medium">
            {title}
          </ToastPrimitives.Title>
        </div>
      </div>
      
      <ToastPrimitives.Close className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
        <X className="h-4 w-4" />
      </ToastPrimitives.Close>

      {showProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 overflow-hidden">
          <div 
            className="h-full bg-current transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </ToastPrimitives.Root>
  )
})
ProgressToast.displayName = ToastPrimitives.Root.displayName

export {
  ProgressToastProvider,
  ProgressToastViewport,
  ProgressToast,
  type ProgressToastProps,
}