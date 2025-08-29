import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const gridVariants = cva('grid', {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
      none: 'grid-cols-none',
    },
    rows: {
      1: 'grid-rows-1',
      2: 'grid-rows-2',
      3: 'grid-rows-3',
      4: 'grid-rows-4',
      5: 'grid-rows-5',
      6: 'grid-rows-6',
      none: 'grid-rows-none',
    },
    gap: {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      7: 'gap-7',
      8: 'gap-8',
      9: 'gap-9',
      10: 'gap-10',
      11: 'gap-11',
      12: 'gap-12',
    },
    gapX: {
      0: 'gap-x-0',
      1: 'gap-x-1',
      2: 'gap-x-2',
      3: 'gap-x-3',
      4: 'gap-x-4',
      5: 'gap-x-5',
      6: 'gap-x-6',
      7: 'gap-x-7',
      8: 'gap-x-8',
      9: 'gap-x-9',
      10: 'gap-x-10',
      11: 'gap-x-11',
      12: 'gap-x-12',
    },
    gapY: {
      0: 'gap-y-0',
      1: 'gap-y-1',
      2: 'gap-y-2',
      3: 'gap-y-3',
      4: 'gap-y-4',
      5: 'gap-y-5',
      6: 'gap-y-6',
      7: 'gap-y-7',
      8: 'gap-y-8',
      9: 'gap-y-9',
      10: 'gap-y-10',
      11: 'gap-y-11',
      12: 'gap-y-12',
    },
    flow: {
      row: 'grid-flow-row',
      col: 'grid-flow-col',
      dense: 'grid-flow-dense',
      'row-dense': 'grid-flow-row-dense',
      'col-dense': 'grid-flow-col-dense',
    },
  },
  defaultVariants: {
    cols: 1,
    flow: 'row',
  },
})

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  asChild?: boolean
}

/**
 * Grid - Grid 레이아웃 프리미티브
 * Grid 레이아웃을 쉽게 구성할 수 있는 합성 가능한 컴포넌트
 */
export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ 
    asChild = false, 
    className,
    cols,
    rows,
    gap,
    gapX,
    gapY,
    flow,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'div'

    return (
      <Comp
        ref={ref}
        className={cn(
          gridVariants({ cols, rows, gap, gapX, gapY, flow }),
          className
        )}
        {...props}
      />
    )
  }
)

Grid.displayName = 'Grid'