'use client'
import { useSlideStore } from '@/store/useSlideStore'
import React from 'react'
import { cn } from '@/lib/utils'

interface BlockQuoteProps extends React.HTMLAttributes<HTMLQuoteElement> {
  children: React.ReactNode
  className?: string
  isSidebar?: boolean
}

const BlockQuote = ({
  children,
  className,
  isSidebar = false,
  ...props
}: BlockQuoteProps) => {
  const { currentTheme } = useSlideStore()

  return (
    <blockquote
      className={cn(
        'pl-6 pr-4 py-4 my-4 rounded-xl border-l-4 italic text-gray-700 dark:text-gray-300',
        'bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.05)]',
        'hover:shadow-md transition-shadow duration-300',
        isSidebar &&
          'text-[0.78rem] px-3 py-2 my-2 max-h-[100px] overflow-auto leading-snug',
        className
      )}
      style={{ borderLeftColor: currentTheme.accentColor }}
      {...props}
    >
      {children}
    </blockquote>
  )
}

export default BlockQuote
