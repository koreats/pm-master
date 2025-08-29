import * as React from 'react'
import { Flex, type FlexProps } from './flex'
import { cn } from '@/lib/utils'

export type StackProps = Omit<FlexProps, 'direction'> & {
  spacing?: FlexProps['gap']
}

/**
 * Stack - 수직 레이아웃 프리미티브
 * 자식 요소들을 수직으로 배치하는 합성 가능한 컴포넌트
 */
export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ spacing, gap, className, ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="column"
        gap={spacing ?? gap}
        className={cn('w-full', className)}
        {...props}
      />
    )
  }
)

Stack.displayName = 'Stack'

export type HStackProps = Omit<FlexProps, 'direction'> & {
  spacing?: FlexProps['gap']
}

/**
 * HStack - 수평 레이아웃 프리미티브
 * 자식 요소들을 수평으로 배치하는 합성 가능한 컴포넌트
 */
export const HStack = React.forwardRef<HTMLDivElement, HStackProps>(
  ({ spacing, gap, className, ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="row"
        gap={spacing ?? gap}
        className={className}
        {...props}
      />
    )
  }
)

HStack.displayName = 'HStack'