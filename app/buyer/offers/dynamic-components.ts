import dynamic from 'next/dynamic'

// Dynamically import Dialog components (only loaded when needed)
export const DynamicDialog = dynamic(
    () => import('@/components/ui/dialog').then(mod => mod.Dialog),
    { ssr: false, loading: () => null }
)

export const DynamicDialogContent = dynamic(
    () => import('@/components/ui/dialog').then(mod => mod.DialogContent),
    { ssr: false, loading: () => null }
)

export const DynamicDialogHeader = dynamic(
    () => import('@/components/ui/dialog').then(mod => mod.DialogHeader),
    { ssr: false, loading: () => null }
)

export const DynamicDialogTitle = dynamic(
    () => import('@/components/ui/dialog').then(mod => mod.DialogTitle),
    { ssr: false, loading: () => null }
)

export const DynamicDialogFooter = dynamic(
    () => import('@/components/ui/dialog').then(mod => mod.DialogFooter),
    { ssr: false, loading: () => null }
)

export const DynamicDialogClose = dynamic(
    () => import('@/components/ui/dialog').then(mod => mod.DialogClose),
    { ssr: false, loading: () => null }
)
