"use client"

import { usePathname } from "next/navigation"
import { ReactNode } from "react"

export function PageAnimationWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname()

    return (
        <div key={pathname} className="animate-fade-in w-full">
            {children}
        </div>
    )
}
