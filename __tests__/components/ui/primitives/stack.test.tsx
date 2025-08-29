import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Stack, HStack } from '@/components/ui/primitives/stack'

describe('Stack', () => {
  it('should render with default props (column direction)', () => {
    render(<Stack data-testid="stack">Stack Content</Stack>)
    
    const stack = screen.getByTestId('stack')
    expect(stack).toBeInTheDocument()
    expect(stack).toHaveClass('flex', 'flex-col', 'w-full')
    expect(stack.tagName).toBe('DIV')
  })

  it('should render with spacing prop', () => {
    const spacings = [
      { spacing: 0, class: 'gap-0' },
      { spacing: 1, class: 'gap-1' },
      { spacing: 2, class: 'gap-2' },
      { spacing: 4, class: 'gap-4' },
      { spacing: 8, class: 'gap-8' },
      { spacing: 12, class: 'gap-12' },
    ] as const

    spacings.forEach(({ spacing, class: expectedClass }) => {
      render(
        <Stack spacing={spacing} data-testid={`stack-spacing-${spacing}`}>
          Spacing {spacing}
        </Stack>
      )
      
      const stack = screen.getByTestId(`stack-spacing-${spacing}`)
      expect(stack).toHaveClass(expectedClass)
    })
  })

  it('should prefer spacing over gap prop', () => {
    render(
      <Stack spacing={4} gap={8} data-testid="spacing-priority">
        Spacing Priority Test
      </Stack>
    )
    
    const stack = screen.getByTestId('spacing-priority')
    expect(stack).toHaveClass('gap-4') // spacing should take priority
    expect(stack).not.toHaveClass('gap-8')
  })

  it('should use gap when spacing is not provided', () => {
    render(
      <Stack gap={6} data-testid="gap-fallback">
        Gap Fallback Test
      </Stack>
    )
    
    const stack = screen.getByTestId('gap-fallback')
    expect(stack).toHaveClass('gap-6')
  })

  it('should apply custom className', () => {
    render(
      <Stack className="custom-stack" data-testid="custom-stack">
        Custom Stack
      </Stack>
    )
    
    const stack = screen.getByTestId('custom-stack')
    expect(stack).toHaveClass('custom-stack')
    expect(stack).toHaveClass('w-full') // Should still have default w-full class
  })

  it('should inherit flex properties', () => {
    render(
      <Stack align="center" justify="between" data-testid="flex-props">
        Flex Properties
      </Stack>
    )
    
    const stack = screen.getByTestId('flex-props')
    expect(stack).toHaveClass('items-center', 'justify-between')
  })

  it('should handle asChild prop', () => {
    render(
      <Stack asChild spacing={4} data-testid="as-child-stack">
        <section>As Child Section</section>
      </Stack>
    )
    
    const section = screen.getByTestId('as-child-stack')
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveClass('flex', 'flex-col', 'gap-4', 'w-full')
    expect(screen.getByText('As Child Section')).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    
    render(
      <Stack ref={ref} data-testid="ref-stack">
        Ref Test
      </Stack>
    )
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toBe(screen.getByTestId('ref-stack'))
  })

  it('should handle custom HTML attributes', () => {
    render(
      <Stack
        id="test-stack"
        role="list"
        aria-label="Test stack container"
        data-testid="attributes-stack"
      >
        Attributes Test
      </Stack>
    )
    
    const stack = screen.getByTestId('attributes-stack')
    expect(stack).toHaveAttribute('id', 'test-stack')
    expect(stack).toHaveAttribute('role', 'list')
    expect(stack).toHaveAttribute('aria-label', 'Test stack container')
  })

  it('should render children correctly', () => {
    render(
      <Stack spacing={4} data-testid="children-stack">
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </Stack>
    )
    
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
    
    const stack = screen.getByTestId('children-stack')
    expect(stack.children).toHaveLength(3)
  })
})

describe('HStack', () => {
  it('should render with default props (row direction)', () => {
    render(<HStack data-testid="hstack">HStack Content</HStack>)
    
    const hstack = screen.getByTestId('hstack')
    expect(hstack).toBeInTheDocument()
    expect(hstack).toHaveClass('flex', 'flex-row')
    expect(hstack).not.toHaveClass('w-full') // HStack shouldn't have w-full by default
    expect(hstack.tagName).toBe('DIV')
  })

  it('should render with spacing prop', () => {
    const spacings = [
      { spacing: 0, class: 'gap-0' },
      { spacing: 1, class: 'gap-1' },
      { spacing: 2, class: 'gap-2' },
      { spacing: 4, class: 'gap-4' },
      { spacing: 8, class: 'gap-8' },
      { spacing: 12, class: 'gap-12' },
    ] as const

    spacings.forEach(({ spacing, class: expectedClass }) => {
      render(
        <HStack spacing={spacing} data-testid={`hstack-spacing-${spacing}`}>
          Spacing {spacing}
        </HStack>
      )
      
      const hstack = screen.getByTestId(`hstack-spacing-${spacing}`)
      expect(hstack).toHaveClass(expectedClass)
    })
  })

  it('should prefer spacing over gap prop', () => {
    render(
      <HStack spacing={4} gap={8} data-testid="hstack-spacing-priority">
        Spacing Priority Test
      </HStack>
    )
    
    const hstack = screen.getByTestId('hstack-spacing-priority')
    expect(hstack).toHaveClass('gap-4') // spacing should take priority
    expect(hstack).not.toHaveClass('gap-8')
  })

  it('should use gap when spacing is not provided', () => {
    render(
      <HStack gap={6} data-testid="hstack-gap-fallback">
        Gap Fallback Test
      </HStack>
    )
    
    const hstack = screen.getByTestId('hstack-gap-fallback')
    expect(hstack).toHaveClass('gap-6')
  })

  it('should apply custom className', () => {
    render(
      <HStack className="custom-hstack" data-testid="custom-hstack">
        Custom HStack
      </HStack>
    )
    
    const hstack = screen.getByTestId('custom-hstack')
    expect(hstack).toHaveClass('custom-hstack')
    expect(hstack).toHaveClass('flex') // Should still have base flex class
  })

  it('should inherit flex properties', () => {
    render(
      <HStack align="center" justify="between" data-testid="hstack-flex-props">
        Flex Properties
      </HStack>
    )
    
    const hstack = screen.getByTestId('hstack-flex-props')
    expect(hstack).toHaveClass('items-center', 'justify-between')
  })

  it('should handle asChild prop', () => {
    render(
      <HStack asChild spacing={4} data-testid="as-child-hstack">
        <nav>As Child Nav</nav>
      </HStack>
    )
    
    const nav = screen.getByTestId('as-child-hstack')
    expect(nav.tagName).toBe('NAV')
    expect(nav).toHaveClass('flex', 'flex-row', 'gap-4')
    expect(screen.getByText('As Child Nav')).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    
    render(
      <HStack ref={ref} data-testid="ref-hstack">
        Ref Test
      </HStack>
    )
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toBe(screen.getByTestId('ref-hstack'))
  })

  it('should render children correctly', () => {
    render(
      <HStack spacing={2} data-testid="children-hstack">
        <button>Button 1</button>
        <button>Button 2</button>
        <button>Button 3</button>
      </HStack>
    )
    
    expect(screen.getByRole('button', { name: 'Button 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Button 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Button 3' })).toBeInTheDocument()
    
    const hstack = screen.getByTestId('children-hstack')
    expect(hstack.children).toHaveLength(3)
  })
})

describe('Stack Integration', () => {
  it('should work with nested Stack and HStack', () => {
    render(
      <Stack spacing={6} data-testid="nested-integration">
        <div>
          <h2>Header</h2>
        </div>
        <Stack spacing={4}>
          <div>Content Line 1</div>
          <div>Content Line 2</div>
        </Stack>
        <HStack spacing={3} justify="end">
          <button>Cancel</button>
          <button>Save</button>
        </HStack>
      </Stack>
    )
    
    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Content Line 1')).toBeInTheDocument()
    expect(screen.getByText('Content Line 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    
    const mainStack = screen.getByTestId('nested-integration')
    expect(mainStack).toHaveClass('flex', 'flex-col', 'gap-6')
  })

  it('should maintain semantic accessibility with different elements', () => {
    render(
      <Stack asChild role="main" aria-label="Main content">
        <main>
          <HStack asChild role="navigation" aria-label="Breadcrumb">
            <nav>
              <a href="/">Home</a>
              <span> / </span>
              <a href="/products">Products</a>
            </nav>
          </HStack>
          <Stack spacing={4}>
            <h1>Product List</h1>
            <div>Product content</div>
          </Stack>
        </main>
      </Stack>
    )
    
    const main = screen.getByRole('main', { name: 'Main content' })
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    
    expect(main.tagName).toBe('MAIN')
    expect(nav.tagName).toBe('NAV')
    expect(main).toHaveClass('flex', 'flex-col')
    expect(nav).toHaveClass('flex', 'flex-row')
  })

  it('should handle complex form layouts', () => {
    render(
      <Stack spacing={6} className="w-96" data-testid="form-layout">
        <Stack spacing={4}>
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" type="text" />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
          </div>
        </Stack>
        
        <HStack spacing={3} justify="end">
          <button type="button">Cancel</button>
          <button type="submit">Submit</button>
        </HStack>
      </Stack>
    )
    
    const formLayout = screen.getByTestId('form-layout')
    expect(formLayout).toHaveClass('w-96', 'gap-6')
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })
})