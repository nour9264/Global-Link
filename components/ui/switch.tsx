'use client'

import React, { useEffect, useState } from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  // Render a non-interactive placeholder on the initial render to avoid
  // hydration mismatches (extensions or client-side attributes can differ).
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const rootClass = cn(
    'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
    className,
  )

  const thumbClass =
    'bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0'

  if (!mounted) {
    // Non-interactive button that mirrors the structure/classes of the Radix switch
    // so server and initial client HTML match, avoiding hydration warnings.
    return (
      <button
        type="button"
        aria-hidden
        data-slot="switch"
        className={rootClass}
        tabIndex={-1}
      >
        <span data-slot="switch-thumb" className={thumbClass} />
      </button>
    )
  }

  return (
    <SwitchPrimitive.Root data-slot="switch" className={rootClass} {...props}>
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={thumbClass} />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
