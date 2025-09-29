import { useProgressToast } from "@/hooks/use-progress-toast"
import {
  ProgressToast,
  ProgressToastProvider,
  ProgressToastViewport,
} from "@/components/ui/progress-toast"

export function ProgressToaster() {
  const { toasts } = useProgressToast()

  return (
    <ProgressToastProvider>
      {toasts.map(function ({ id, title, variant, duration, showProgress, ...props }) {
        return (
          <ProgressToast 
            key={id} 
            title={title}
            variant={variant}
            duration={duration}
            showProgress={showProgress}
            {...props} 
          />
        )
      })}
      <ProgressToastViewport />
    </ProgressToastProvider>
  )
}