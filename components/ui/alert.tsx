import type {ComponentProps} from 'react'

import {cn} from '@/lib/utils'

function Alert({className, ...props}: ComponentProps<'div'>) {
    return (
        <div
            role="alert"
            data-slot="alert"
            className={cn('rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800', className)}
            {...props}
        />
    )
}

export {Alert}
