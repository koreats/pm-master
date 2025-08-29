import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const boxVariants = cva('', {
  variants: {
    display: {
      block: 'block',
      inline: 'inline',
      'inline-block': 'inline-block',
      flex: 'flex',
      'inline-flex': 'inline-flex',
      grid: 'grid',
      'inline-grid': 'inline-grid',
      hidden: 'hidden',
    },
    position: {
      static: 'static',
      fixed: 'fixed',
      absolute: 'absolute',
      relative: 'relative',
      sticky: 'sticky',
    },
    overflow: {
      auto: 'overflow-auto',
      hidden: 'overflow-hidden',
      clip: 'overflow-clip',
      visible: 'overflow-visible',
      scroll: 'overflow-scroll',
    },
  },
})

export interface BoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof boxVariants> {
  asChild?: boolean
}

/**
 * Box - 기본 레이아웃 프리미티브
 * 모든 레이아웃 컴포넌트의 기반이 되는 합성 가능한 컴포넌트
 */
export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ 
    asChild = false, 
    className, 
    display, 
    position, 
    overflow,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'div'

    return (
      <Comp
        ref={ref}
        className={cn(
          boxVariants({ display, position, overflow }),
          className
        )}
        {...props}
      />
    )
  }
)

Box.displayName = 'Box'