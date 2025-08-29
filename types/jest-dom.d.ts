import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(...classNames: string[]): R
      toHaveAttribute(attr: string, value?: string): R
      toBeDisabled(): R
      toBeVisible(): R
      toBeEmptyDOMElement(): R
      toBeInvalid(): R
      toBeRequired(): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toHaveValue(value: string | number | string[]): R
      toHaveTextContent(text: string | RegExp): R
      toContainElement(element: HTMLElement | SVGElement | null): R
      toHaveStyle(css: string | Record<string, any>): R
      toHaveFocus(): R
      toBeChecked(): R
      toBePartiallyChecked(): R
      toHaveAccessibleDescription(expectedDescription?: string | RegExp): R
      toHaveAccessibleName(expectedName?: string | RegExp): R
    }
  }
}