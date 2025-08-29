import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Flex } from '@/components/ui/primitives/flex'

describe('Flex', () => {
  it('should render with default props', () => {
    render(<Flex data-testid="flex">Content</Flex>)
    
    const flex = screen.getByTestId('flex')
    expect(flex).toBeInTheDocument()
    expect(flex).toHaveClass('flex')
    expect(flex.tagName).toBe('DIV')
  })

  it('should render with different directions', () => {
    const directions = [
      { direction: 'row', class: 'flex-row' },
      { direction: 'row-reverse', class: 'flex-row-reverse' },
      { direction: 'column', class: 'flex-col' },
      { direction: 'column-reverse', class: 'flex-col-reverse' },
    ] as const

    directions.forEach(({ direction, class: expectedClass }) => {
      render(
        <Flex direction={direction} data-testid={`flex-${direction}`}>
          {direction}
        </Flex>
      )
      
      const flex = screen.getByTestId(`flex-${direction}`)
      expect(flex).toHaveClass(expectedClass)
    })
  })

  it('should render with different align values', () => {
    const alignments = [
      { align: 'start', class: 'items-start' },
      { align: 'center', class: 'items-center' },
      { align: 'end', class: 'items-end' },
      { align: 'stretch', class: 'items-stretch' },
      { align: 'baseline', class: 'items-baseline' },
    ] as const

    alignments.forEach(({ align, class: expectedClass }) => {
      render(
        <Flex align={align} data-testid={`flex-align-${align}`}>
          {align}
        </Flex>
      )
      
      const flex = screen.getByTestId(`flex-align-${align}`)
      expect(flex).toHaveClass(expectedClass)
    })
  })

  it('should render with different justify values', () => {
    const justifications = [
      { justify: 'start', class: 'justify-start' },
      { justify: 'center', class: 'justify-center' },
      { justify: 'end', class: 'justify-end' },
      { justify: 'between', class: 'justify-between' },
      { justify: 'around', class: 'justify-around' },
      { justify: 'evenly', class: 'justify-evenly' },
    ] as const

    justifications.forEach(({ justify, class: expectedClass }) => {
      render(
        <Flex justify={justify} data-testid={`flex-justify-${justify}`}>
          {justify}
        </Flex>
      )
      
      const flex = screen.getByTestId(`flex-justify-${justify}`)
      expect(flex).toHaveClass(expectedClass)
    })
  })

  it('should render with different wrap values', () => {
    const wraps = [
      { wrap: 'nowrap', class: 'flex-nowrap' },
      { wrap: 'wrap', class: 'flex-wrap' },
      { wrap: 'wrap-reverse', class: 'flex-wrap-reverse' },
    ] as const

    wraps.forEach(({ wrap, class: expectedClass }) => {
      render(
        <Flex wrap={wrap} data-testid={`flex-wrap-${wrap}`}>
          {wrap}
        </Flex>
      )
      
      const flex = screen.getByTestId(`flex-wrap-${wrap}`)
      expect(flex).toHaveClass(expectedClass)
    })
  })

  it('should render with different gap values', () => {
    const gaps = [
      { gap: 0, class: 'gap-0' },
      { gap: 1, class: 'gap-1' },
      { gap: 2, class: 'gap-2' },
      { gap: 4, class: 'gap-4' },
      { gap: 8, class: 'gap-8' },
      { gap: 12, class: 'gap-12' },
    ] as const

    gaps.forEach(({ gap, class: expectedClass }) => {
      render(
        <Flex gap={gap} data-testid={`flex-gap-${gap}`}>
          Gap {gap}
        </Flex>
      )
      
      const flex = screen.getByTestId(`flex-gap-${gap}`)
      expect(flex).toHaveClass(expectedClass)
    })
  })

  it('should apply custom className', () => {
    render(
      <Flex className="custom-flex" data-testid="custom-flex">
        Custom Flex
      </Flex>
    )
    
    const flex = screen.getByTestId('custom-flex')
    expect(flex).toHaveClass('custom-flex')
    expect(flex).toHaveClass('flex') // Should still have base class
  })

  it('should combine multiple variant props', () => {
    render(
      <Flex
        direction="column"
        align="center"
        justify="between"
        gap={4}
        wrap="wrap"
        data-testid="combined-flex"
      >
        Combined Props
      </Flex>
    )
    
    const flex = screen.getByTestId('combined-flex')
    expect(flex).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-between',
      'gap-4',
      'flex-wrap'
    )
  })

  it('should handle asChild prop', () => {
    render(
      <Flex asChild data-testid="as-child-flex">
        <section>As Child Section</section>
      </Flex>
    )
    
    const section = screen.getByTestId('as-child-flex')
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveClass('flex')
    expect(screen.getByText('As Child Section')).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    
    render(
      <Flex ref={ref} data-testid="ref-flex">
        Ref Test
      </Flex>
    )
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toBe(screen.getByTestId('ref-flex'))
  })

  it('should handle custom HTML attributes', () => {
    render(
      <Flex
        id="test-flex"
        role="group"
        aria-label="Test flex container"
        data-testid="attributes-flex"
      >
        Attributes Test
      </Flex>
    )
    
    const flex = screen.getByTestId('attributes-flex')
    expect(flex).toHaveAttribute('id', 'test-flex')
    expect(flex).toHaveAttribute('role', 'group')
    expect(flex).toHaveAttribute('aria-label', 'Test flex container')
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    
    render(
      <Flex onClick={handleClick} data-testid="clickable-flex">
        Clickable Flex
      </Flex>
    )
    
    const flex = screen.getByTestId('clickable-flex')
    flex.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render children correctly', () => {
    render(
      <Flex data-testid="children-flex">
        <div>Child 1</div>
        <span>Child 2</span>
        <p>Child 3</p>
      </Flex>
    )
    
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
    
    const flex = screen.getByTestId('children-flex')
    expect(flex.children).toHaveLength(3)
  })

  it('should work with complex nested structure', () => {
    render(
      <Flex direction="column" gap={4} data-testid="nested-flex">
        <Flex justify="between" align="center">
          <span>Header Left</span>
          <span>Header Right</span>
        </Flex>
        <Flex direction="column" gap={2}>
          <div>Content Line 1</div>
          <div>Content Line 2</div>
        </Flex>
        <Flex justify="end" gap={2}>
          <button>Cancel</button>
          <button>Save</button>
        </Flex>
      </Flex>
    )
    
    expect(screen.getByText('Header Left')).toBeInTheDocument()
    expect(screen.getByText('Header Right')).toBeInTheDocument()
    expect(screen.getByText('Content Line 1')).toBeInTheDocument()
    expect(screen.getByText('Content Line 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('should maintain semantic accessibility when used as different elements', () => {
    render(
      <Flex asChild role="navigation" aria-label="Main navigation">
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
        </nav>
      </Flex>
    )
    
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(nav.tagName).toBe('NAV')
    expect(nav).toHaveClass('flex')
  })
})