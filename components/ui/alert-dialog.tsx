'use client'

import type {ComponentProps} from 'react'
import {AlertDialog as AlertDialogPrimitive} from '@base-ui/react/alert-dialog'

import {cn} from '@/lib/utils'

function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
    return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogContent({className, children, ...props}: AlertDialogPrimitive.Popup.Props) {
    return (
        <AlertDialogPrimitive.Portal>
            <AlertDialogPrimitive.Backdrop
                className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
            />
            <AlertDialogPrimitive.Popup
                data-slot="alert-dialog-content"
                className={cn(
                    'fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl outline-none transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
                    className,
                )}
                {...props}
            >
                {children}
            </AlertDialogPrimitive.Popup>
        </AlertDialogPrimitive.Portal>
    )
}

function AlertDialogHeader({className, ...props}: ComponentProps<'div'>) {
    return <div className={cn('mb-4 flex flex-col gap-1.5', className)} {...props} />
}

function AlertDialogFooter({className, ...props}: ComponentProps<'div'>) {
    return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}

function AlertDialogTitle({className, ...props}: AlertDialogPrimitive.Title.Props) {
    return <AlertDialogPrimitive.Title className={cn('text-lg font-bold text-[#183b50]', className)} {...props} />
}

function AlertDialogDescription({className, ...props}: AlertDialogPrimitive.Description.Props) {
    return <AlertDialogPrimitive.Description className={cn('text-sm text-[#78909c]', className)} {...props} />
}

export {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
}
