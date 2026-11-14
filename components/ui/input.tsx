import type {ComponentProps} from 'react'

import {cn} from '@/lib/utils'

const fieldClasses =
    'h-10 w-full rounded-lg border border-[#d9e4e7] bg-white px-3 text-sm text-[#183b50] outline-none transition-colors placeholder:text-[#8299a1] focus-visible:border-[#0e8b8c] focus-visible:ring-3 focus-visible:ring-[#0e8b8c]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-400'

function Input({className, ...props}: ComponentProps<'input'>) {
    return <input data-slot="input" className={cn(fieldClasses, className)} {...props} />
}

/** Liste déroulante native, stylée comme Input (accessible, sans dépendance). */
function NativeSelect({className, ...props}: ComponentProps<'select'>) {
    return <select data-slot="select" className={cn(fieldClasses, className)} {...props} />
}

export {Input, NativeSelect}
