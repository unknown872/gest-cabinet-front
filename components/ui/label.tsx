import type {ComponentProps} from 'react'

import {cn} from '@/lib/utils'

function Label({className, ...props}: ComponentProps<'label'>) {
    return <label data-slot="label" className={cn('text-sm font-semibold text-[#23465b]', className)} {...props} />
}

export {Label}
