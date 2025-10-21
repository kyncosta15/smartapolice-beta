import React from 'react'
import { Dialog, DialogTrigger, Modal, ModalOverlay, Heading, Button as AriaButton } from 'react-aria-components'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

export type DialogRCorpProps = {
  open?: boolean
  onOpenChange?: (value: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  trigger?: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  className?: string
}

const sizeVariants = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function DialogRCorp({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  footer,
  size = 'md',
  children,
  className,
}: DialogRCorpProps) {
  return (
    <DialogTrigger isOpen={open} onOpenChange={onOpenChange}>
      {trigger && (
        <AriaButton className="inline-flex">
          {trigger}
        </AriaButton>
      )}
      
      <ModalOverlay
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
          'entering:animate-in entering:fade-in-0',
          'exiting:animate-out exiting:fade-out-0'
        )}
      >
        <Modal
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] border bg-background p-6 shadow-lg rounded-lg',
            'entering:animate-in entering:fade-in-0 entering:zoom-in-95 entering:slide-in-from-left-1/2 entering:slide-in-from-top-[48%] entering:duration-200',
            'exiting:animate-out exiting:fade-out-0 exiting:zoom-out-95 exiting:slide-out-to-left-1/2 exiting:slide-out-to-top-[48%] exiting:duration-200',
            sizeVariants[size],
            className
          )}
        >
          <Dialog className="outline-none flex flex-col space-y-4">
            {({ close }) => (
              <>
                {(title || description) && (
                  <div className="flex flex-col space-y-2 text-center sm:text-left pr-8">
                    {title && (
                      <Heading slot="title" className="text-lg font-semibold leading-none tracking-tight text-foreground">
                        {title}
                      </Heading>
                    )}
                    {description && (
                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="overflow-y-auto max-h-[70vh]">
                  {children}
                </div>
                
                {footer && (
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    {footer}
                  </div>
                )}
                
                <AriaButton
                  onPress={close}
                  className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </AriaButton>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}