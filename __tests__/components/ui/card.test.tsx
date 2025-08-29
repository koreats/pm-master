import { render, screen } from '@testing-library/react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card'

describe('Card', () => {
  it('should render with default variant and size', () => {
    render(<Card>Card Content</Card>)
    
    const card = screen.getByText('Card Content')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass(
      'rounded-lg', 
      'border', 
      'bg-card', 
      'text-card-foreground', 
      'shadow-sm',
      'border-border'
    )
  })

  it('should render with different variants', () => {
    const { rerender } = render(<Card variant="elevated">Elevated Card</Card>)
    expect(screen.getByText('Elevated Card')).toHaveClass('shadow-lg', 'border-border/50')

    rerender(<Card variant="outline">Outline Card</Card>)
    expect(screen.getByText('Outline Card')).toHaveClass('border-2', 'border-border', 'shadow-none')

    rerender(<Card variant="ghost">Ghost Card</Card>)
    expect(screen.getByText('Ghost Card')).toHaveClass('shadow-none', 'border-transparent', 'bg-transparent')
  })

  it('should render with different sizes', () => {
    const { rerender } = render(<Card size="sm">Small Card</Card>)
    expect(screen.getByText('Small Card')).toHaveClass('p-3')

    rerender(<Card size="lg">Large Card</Card>)
    expect(screen.getByText('Large Card')).toHaveClass('p-8')
  })

  it('should apply custom className', () => {
    render(<Card className="custom-card">Custom Card</Card>)
    
    const card = screen.getByText('Custom Card')
    expect(card).toHaveClass('custom-card')
  })

  it('should handle custom attributes', () => {
    render(<Card data-testid="card" id="test-card">Test Card</Card>)
    
    const card = screen.getByTestId('card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute('id', 'test-card')
  })
})

describe('CardHeader', () => {
  it('should render with default styling', () => {
    render(<CardHeader>Header Content</CardHeader>)
    
    const header = screen.getByText('Header Content')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
  })

  it('should apply custom className', () => {
    render(<CardHeader className="custom-header">Custom Header</CardHeader>)
    
    const header = screen.getByText('Custom Header')
    expect(header).toHaveClass('custom-header')
  })
})

describe('CardTitle', () => {
  it('should render as h3 element with correct styling', () => {
    render(<CardTitle>Card Title</CardTitle>)
    
    const title = screen.getByRole('heading', { level: 3 })
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Card Title')
    expect(title).toHaveClass(
      'text-2xl', 
      'font-semibold', 
      'leading-none', 
      'tracking-tight'
    )
  })

  it('should apply custom className', () => {
    render(<CardTitle className="custom-title">Custom Title</CardTitle>)
    
    const title = screen.getByRole('heading', { level: 3 })
    expect(title).toHaveClass('custom-title')
  })

  it('should handle complex content', () => {
    render(
      <CardTitle>
        <span>Complex</span> Title
      </CardTitle>
    )
    
    const title = screen.getByRole('heading', { level: 3 })
    expect(title).toHaveTextContent('Complex Title')
    expect(screen.getByText('Complex')).toBeInTheDocument()
  })
})

describe('CardDescription', () => {
  it('should render with correct styling', () => {
    render(<CardDescription>Card description text</CardDescription>)
    
    const description = screen.getByText('Card description text')
    expect(description).toBeInTheDocument()
    expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    expect(description.tagName).toBe('P')
  })

  it('should apply custom className', () => {
    render(<CardDescription className="custom-description">Custom Description</CardDescription>)
    
    const description = screen.getByText('Custom Description')
    expect(description).toHaveClass('custom-description')
  })
})

describe('CardContent', () => {
  it('should render with default styling', () => {
    render(<CardContent>Content text</CardContent>)
    
    const content = screen.getByText('Content text')
    expect(content).toBeInTheDocument()
    expect(content).toHaveClass('p-6', 'pt-0')
  })

  it('should apply custom className', () => {
    render(<CardContent className="custom-content">Custom Content</CardContent>)
    
    const content = screen.getByText('Custom Content')
    expect(content).toHaveClass('custom-content')
  })
})

describe('CardFooter', () => {
  it('should render with default styling', () => {
    render(<CardFooter>Footer content</CardFooter>)
    
    const footer = screen.getByText('Footer content')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
  })

  it('should apply custom className', () => {
    render(<CardFooter className="custom-footer">Custom Footer</CardFooter>)
    
    const footer = screen.getByText('Custom Footer')
    expect(footer).toHaveClass('custom-footer')
  })
})

describe('Card Integration', () => {
  it('should work with all components together', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>This is a test card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content of the card.</p>
        </CardContent>
        <CardFooter>
          <button>Action Button</button>
        </CardFooter>
      </Card>
    )
    
    // Check all parts are rendered
    expect(screen.getByRole('heading', { name: 'Test Card' })).toBeInTheDocument()
    expect(screen.getByText('This is a test card description')).toBeInTheDocument()
    expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument()
  })

  it('should maintain proper semantic structure', () => {
    render(
      <Card role="article">
        <CardHeader>
          <CardTitle>Article Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Article content</p>
        </CardContent>
      </Card>
    )
    
    const article = screen.getByRole('article')
    expect(article).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
  })

  it('should support different card variants with content', () => {
    render(
      <Card variant="elevated" size="lg">
        <CardHeader>
          <CardTitle>Elevated Large Card</CardTitle>
        </CardHeader>
        <CardContent>
          Content in elevated large card
        </CardContent>
      </Card>
    )
    
    const card = screen.getByText('Elevated Large Card').closest('div')
    expect(card).toHaveClass('shadow-lg', 'p-8')
  })
})