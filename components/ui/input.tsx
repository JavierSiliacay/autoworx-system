import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

// Globally prevent mouse wheel from changing input[type=number] values anywhere in the app
if (typeof window !== 'undefined') {
  const preventNumberScroll = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target && target.type === 'number') {
      e.preventDefault()
    }
  }

  // Bind to both wheel events in capture phase
  window.addEventListener('wheel', preventNumberScroll, { passive: false, capture: true })
  window.addEventListener('mousewheel', preventNumberScroll, { passive: false, capture: true })
}

export { Input }
