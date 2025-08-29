import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('should render with default variant and size', () => {
    render(<Badge>Default Badge</Badge>)
    
    const badge = screen.getByText('Default Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs')
  })

  it('should render with different variants', () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>)
    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary', 'text-secondary-foreground')

    rerender(<Badge variant="destructive">Destructive</Badge>)
    expect(screen.getByText('Destructive')).toHaveClass('bg-destructive', 'text-destructive-foreground')

    rerender(<Badge variant="outline">Outline</Badge>)
    expect(screen.getByText('Outline')).toHaveClass('text-foreground')

    rerender(<Badge variant="success">Success</Badge>)
    expect(screen.getByText('Success')).toHaveClass('bg-green-500', 'text-white')

    rerender(<Badge variant="warning">Warning</Badge>)
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-500', 'text-white')

    rerender(<Badge variant="info">Info</Badge>)
    expect(screen.getByText('Info')).toHaveClass('bg-blue-500', 'text-white')
  })

  it('should render with different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>)
    expect(screen.getByText('Small')).toHaveClass('px-2', 'py-0.25', 'text-[10px]')

    rerender(<Badge size="default">Default Size</Badge>)
    expect(screen.getByText('Default Size')).toHaveClass('px-2.5', 'py-0.5', 'text-xs')

    rerender(<Badge size="lg">Large</Badge>)
    expect(screen.getByText('Large')).toHaveClass('px-3', 'py-1', 'text-sm')
  })

  it('should apply custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>)
    
    const badge = screen.getByText('Custom Badge')
    expect(badge).toHaveClass('custom-class')
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Badge onClick={handleClick}>Clickable Badge</Badge>)
    
    const badge = screen.getByText('Clickable Badge')
    badge.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render with custom attributes', () => {
    render(<Badge data-testid="badge" id="test-badge">Attributed Badge</Badge>)
    
    const badge = screen.getByTestId('badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('id', 'test-badge')
  })

  it('should be focusable when interactive', () => {
    render(<Badge tabIndex={0}>Focusable Badge</Badge>)
    
    const badge = screen.getByText('Focusable Badge')
    expect(badge).toHaveAttribute('tabIndex', '0')
    badge.focus()
    expect(badge).toHaveFocus()
  })

  it('should render with different content types', () => {
    render(
      <Badge>
        <span>Complex Content</span>
        <span className="ml-1">123</span>
      </Badge>
    )
    
    const badge = screen.getByText('Complex Content')
    expect(badge.parentElement).toBeInTheDocument()
    expect(screen.getByText('123')).toBeInTheDocument()
  })
})