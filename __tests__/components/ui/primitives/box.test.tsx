import { render, screen } from '@testing-library/react'
import { Box } from '@/components/ui/primitives/box'

describe('Box Component', () => {
  it('renders with default props', () => {
    render(<Box data-testid="box">Content</Box>)
    const box = screen.getByTestId('box')
    expect(box).toBeInTheDocument()
    expect(box.tagName).toBe('DIV')
  })

  it('renders with different display variants', () => {
    const displays = ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'hidden'] as const
    
    displays.forEach(display => {
      render(<Box display={display} data-testid={`box-${display}`}>Test</Box>)
      const box = screen.getByTestId(`box-${display}`)
      expect(box).toBeInTheDocument()
      expect(box).toHaveClass(display === 'inline-block' ? 'inline-block' : display === 'inline-flex' ? 'inline-flex' : display === 'inline-grid' ? 'inline-grid' : display)
    })
  })

  it('renders with different position variants', () => {
    const positions = ['static', 'relative', 'absolute', 'fixed', 'sticky'] as const
    
    positions.forEach(position => {
      render(<Box position={position} data-testid={`box-${position}`}>Test</Box>)
      const box = screen.getByTestId(`box-${position}`)
      expect(box).toBeInTheDocument()
      expect(box).toHaveClass(position)
    })
  })

  it('renders with different overflow variants', () => {
    const overflows = ['visible', 'hidden', 'scroll', 'auto'] as const
    
    overflows.forEach(overflow => {
      render(<Box overflow={overflow} data-testid={`box-${overflow}`}>Test</Box>)
      const box = screen.getByTestId(`box-${overflow}`)
      expect(box).toBeInTheDocument()
      expect(box).toHaveClass(`overflow-${overflow}`)
    })
  })

  it('accepts custom className', () => {
    render(<Box className="custom-class" data-testid="box">Content</Box>)
    const box = screen.getByTestId('box')
    expect(box).toHaveClass('custom-class')
  })

  it('forwards HTML attributes', () => {
    render(<Box id="test-id" data-custom="value" data-testid="box">Content</Box>)
    const box = screen.getByTestId('box')
    expect(box).toHaveAttribute('id', 'test-id')
    expect(box).toHaveAttribute('data-custom', 'value')
  })

  it('renders as child element when asChild is true', () => {
    render(
      <Box asChild display="flex" data-testid="child-test">
        <section>Section content</section>
      </Box>
    )
    const section = screen.getByTestId('child-test')
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveClass('flex')
    expect(section).toHaveTextContent('Section content')
  })

  it('combines multiple variant props correctly', () => {
    render(
      <Box 
        display="flex" 
        position="relative" 
        overflow="hidden" 
        data-testid="combined-box"
      >
        Combined variants
      </Box>
    )
    const box = screen.getByTestId('combined-box')
    expect(box).toHaveClass('flex')
    expect(box).toHaveClass('relative')
    expect(box).toHaveClass('overflow-hidden')
  })
})