import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const headingVariants = cva('tracking-tight', {
  variants: {
    level: {
      h1: 'text-4xl font-bold',
      h2: 'text-3xl font-semibold',
      h3: 'text-2xl font-semibold',
      h4: 'text-xl font-medium',
      h5: 'text-lg font-medium',
      h6: 'text-base font-medium',
    },
  },
  defaultVariants: {
    level: 'h2',
  },
})

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel
}

/**
 * Heading - 제목 타이포그래피 프리미티브
 * 시맨틱한 제목 레벨을 제공하는 합성 가능한 컴포넌트
 */
export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ 
    level = 'h2',
    className,
    children,
    ...props 
  }, ref) => {
    const Component = level
    
    return (
      <Component
        ref={ref as any}
        className={cn(headingVariants({ level }), className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Heading.displayName = 'Heading'