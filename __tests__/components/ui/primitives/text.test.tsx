import { render, screen } from '@testing-library/react'
import { Text } from '@/components/ui/primitives/text'

describe('Text Component', () => {
  it('renders with default props', () => {
    render(<Text data-testid="text">Text content</Text>)
    const text = screen.getByTestId('text')
    expect(text).toBeInTheDocument()
    expect(text.tagName).toBe('SPAN')
    expect(text).toHaveTextContent('Text content')
  })

  it('renders with different size variants', () => {
    const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const
    
    sizes.forEach(size => {
      render(<Text size={size} data-testid={`text-${size}`}>Test</Text>)
      const text = screen.getByTestId(`text-${size}`)
      expect(text).toBeInTheDocument()
      expect(text).toHaveClass(`text-${size}`)
    })
  })

  it('renders with different weight variants', () => {
    const weights = ['normal', 'medium', 'semibold', 'bold'] as const
    
    weights.forEach(weight => {
      render(<Text weight={weight} data-testid={`text-${weight}`}>Test</Text>)
      const text = screen.getByTestId(`text-${weight}`)
      expect(text).toBeInTheDocument()
      expect(text).toHaveClass(`font-${weight}`)
    })
  })

  it('renders with different align variants', () => {
    const aligns = ['left', 'center', 'right', 'justify'] as const
    
    aligns.forEach(align => {
      render(<Text align={align} data-testid={`text-${align}`}>Test</Text>)
      const text = screen.getByTestId(`text-${align}`)
      expect(text).toBeInTheDocument()
      expect(text).toHaveClass(`text-${align}`)
    })
  })

  it('renders with different color variants', () => {
    const colors = [
      { variant: 'primary', expectedClass: 'text-primary' },
      { variant: 'secondary', expectedClass: 'text-secondary' },
      { variant: 'muted', expectedClass: 'text-muted-foreground' },
      { variant: 'success', expectedClass: 'text-success' },
      { variant: 'warning', expectedClass: 'text-warning' },
      { variant: 'error', expectedClass: 'text-destructive' },
      { variant: 'info', expectedClass: 'text-info' }
    ] as const
    
    colors.forEach(({ variant, expectedClass }) => {
      render(<Text color={variant} data-testid={`text-${variant}`}>Test</Text>)
      const text = screen.getByTestId(`text-${variant}`)
      expect(text).toBeInTheDocument()
      expect(text).toHaveClass(expectedClass)
    })
  })

  it('accepts custom className', () => {
    render(<Text className="custom-text-class" data-testid="text">Content</Text>)
    const text = screen.getByTestId('text')
    expect(text).toHaveClass('custom-text-class')
  })

  it('forwards HTML attributes', () => {
    render(<Text id="test-text" title="Test title" data-testid="text">Content</Text>)
    const text = screen.getByTestId('text')
    expect(text).toHaveAttribute('id', 'test-text')
    expect(text).toHaveAttribute('title', 'Test title')
  })

  it('renders as child element when asChild is true', () => {
    render(
      <Text asChild size="lg" weight="bold" data-testid="child-text">
        <h2>Heading text</h2>
      </Text>
    )
    const heading = screen.getByTestId('child-text')
    expect(heading.tagName).toBe('H2')
    expect(heading).toHaveClass('text-lg')
    expect(heading).toHaveClass('font-bold')
    expect(heading).toHaveTextContent('Heading text')
  })

  it('combines multiple variant props correctly', () => {
    render(
      <Text 
        size="xl" 
        weight="semibold" 
        align="center" 
        color="primary" 
        data-testid="combined-text"
      >
        Combined variants
      </Text>
    )
    const text = screen.getByTestId('combined-text')
    expect(text).toHaveClass('text-xl')
    expect(text).toHaveClass('font-semibold')
    expect(text).toHaveClass('text-center')
    expect(text).toHaveClass('text-primary')
  })

  it('handles long text content', () => {
    const longText = 'This is a very long text content that should be rendered correctly without any issues in the Text component.'
    render(<Text data-testid="long-text">{longText}</Text>)
    const text = screen.getByTestId('long-text')
    expect(text).toHaveTextContent(longText)
  })

  it('handles empty content gracefully', () => {
    render(<Text data-testid="empty-text"></Text>)
    const text = screen.getByTestId('empty-text')
    expect(text).toBeInTheDocument()
    expect(text).toBeEmptyDOMElement()
  })
})