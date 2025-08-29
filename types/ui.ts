/**
 * UI 컴포넌트 라이브러리 타입 정의
 */

import type { ComponentPropsWithoutRef, ElementType, ReactElement } from 'react'
import type { VariantProps } from 'class-variance-authority'

/**
 * 다형성 컴포넌트를 위한 유틸리티 타입
 */
export type PolymorphicRef<T extends ElementType> = React.ComponentPropsWithRef<T>['ref']

export type PolymorphicProps<T extends ElementType, P = {}> = P &
  Omit<ComponentPropsWithoutRef<T>, keyof P | 'as'> & {
    as?: T
    asChild?: boolean
  }

/**
 * Variant Props 추출 유틸리티
 */
export type ExtractVariantProps<T> = T extends (...args: any) => any
  ? VariantProps<T>
  : never

/**
 * 컴포넌트 크기 타입
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

/**
 * 컴포넌트 색상 타입
 */
export type Color = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'inherit'
  | 'current'

/**
 * 레이아웃 관련 타입
 */
export type Spacing = 
  | 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 5 
  | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 14 | 16 | 20 
  | 24 | 28 | 32 | 36 | 40 | 44 | 48 | 52 | 56 | 60 | 64 | 72 | 80 | 96

export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse'
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse'

export type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'none'
export type GridRows = 1 | 2 | 3 | 4 | 5 | 6 | 'none'
export type GridFlow = 'row' | 'col' | 'dense' | 'row-dense' | 'col-dense'

/**
 * 타이포그래피 관련 타입
 */
export type FontSize = 
  | 'xs' | 'sm' | 'base' | 'lg' | 'xl' 
  | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' 
  | '7xl' | '8xl' | '9xl'

export type FontWeight = 
  | 'thin' | 'extralight' | 'light' | 'normal' | 'medium'
  | 'semibold' | 'bold' | 'extrabold' | 'black'

export type TextAlign = 'left' | 'center' | 'right' | 'justify'
export type TextDecoration = 'none' | 'underline' | 'line-through' | 'overline'
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize'
export type LineHeight = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'

/**
 * 테마 관련 타입
 */
export interface ThemeTokens {
  colors: Record<string, string | Record<string, string>>
  spacing: Record<string | number, string>
  typography: {
    fonts: Record<string, string>
    sizes: Record<string, [string, { lineHeight: string }]>
    weights: Record<string, string>
  }
  radii: Record<string, string>
  shadows: Record<string, string>
  transitions: Record<string, string>
  breakpoints: Record<string, string>
  zIndices: Record<string, string | number>
}

/**
 * 컴포넌트 Compound Pattern 타입
 */
export interface CompoundComponent<T = {}> {
  displayName?: string
}

export type CompoundComponentType<P = {}, C = {}> = React.FC<P> & C