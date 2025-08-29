import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Heading } from '@/components/ui/primitives/heading'

describe('Heading', () => {
  it('should render with default level (h2)', () => {
    render(<Heading>Default Heading</Heading>)
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Default Heading')
    expect(heading.tagName).toBe('H2')
    expect(heading).toHaveClass('text-3xl', 'font-semibold', 'tracking-tight')
  })

  it('should render with different heading levels', () => {
    const levels = [
      { level: 'h1', expectedLevel: 1, classes: ['text-4xl', 'font-bold'] },
      { level: 'h2', expectedLevel: 2, classes: ['text-3xl', 'font-semibold'] },
      { level: 'h3', expectedLevel: 3, classes: ['text-2xl', 'font-semibold'] },
      { level: 'h4', expectedLevel: 4, classes: ['text-xl', 'font-medium'] },
      { level: 'h5', expectedLevel: 5, classes: ['text-lg', 'font-medium'] },
      { level: 'h6', expectedLevel: 6, classes: ['text-base', 'font-medium'] },
    ] as const

    levels.forEach(({ level, expectedLevel, classes }) => {
      render(
        <Heading level={level}>
          {level.toUpperCase()} Heading
        </Heading>
      )
      
      const heading = screen.getByRole('heading', { level: expectedLevel })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe(level.toUpperCase())
      expect(heading).toHaveTextContent(`${level.toUpperCase()} Heading`)
      expect(heading).toHaveClass('tracking-tight') // Common class
      classes.forEach(className => {
        expect(heading).toHaveClass(className)
      })
    })
  })

  it('should apply custom className', () => {
    render(
      <Heading level="h3" className="custom-heading">
        Custom Heading
      </Heading>
    )
    
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveClass('custom-heading')
    expect(heading).toHaveClass('text-2xl', 'font-semibold') // Should still have default styles
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLHeadingElement>()
    
    render(
      <Heading ref={ref} level="h1">
        Ref Test Heading
      </Heading>
    )
    
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement)
    expect(ref.current?.tagName).toBe('H1')
    expect(ref.current?.textContent).toBe('Ref Test Heading')
  })

  it('should handle custom HTML attributes', () => {
    render(
      <Heading
        level="h2"
        id="test-heading"
        aria-label="Test heading"
        data-testid="attributes-heading"
      >
        Attributes Test
      </Heading>
    )
    
    const heading = screen.getByTestId('attributes-heading')
    expect(heading).toHaveAttribute('id', 'test-heading')
    expect(heading).toHaveAttribute('aria-label', 'Test heading')
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    
    render(
      <Heading level="h3" onClick={handleClick}>
        Clickable Heading
      </Heading>
    )
    
    const heading = screen.getByRole('heading', { level: 3 })
    heading.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render children correctly', () => {
    render(
      <Heading level="h1">
        <span>Complex</span> Heading Content
      </Heading>
    )
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Complex Heading Content')
    expect(screen.getByText('Complex')).toBeInTheDocument()
    expect(heading.children).toHaveLength(1) // The span element
  })

  it('should work with semantic HTML structure', () => {
    render(
      <article>
        <Heading level="h1">Article Title</Heading>
        <section>
          <Heading level="h2">Section Title</Heading>
          <div>
            <Heading level="h3">Subsection Title</Heading>
            <p>Content paragraph</p>
          </div>
        </section>
      </article>
    )
    
    const h1 = screen.getByRole('heading', { level: 1 })
    const h2 = screen.getByRole('heading', { level: 2 })
    const h3 = screen.getByRole('heading', { level: 3 })
    
    expect(h1).toHaveTextContent('Article Title')
    expect(h2).toHaveTextContent('Section Title')
    expect(h3).toHaveTextContent('Subsection Title')
    
    expect(h1).toHaveClass('text-4xl', 'font-bold')
    expect(h2).toHaveClass('text-3xl', 'font-semibold')
    expect(h3).toHaveClass('text-2xl', 'font-semibold')
  })

  it('should maintain accessibility with proper heading hierarchy', () => {
    render(
      <div>
        <Heading level="h1" id="main-title">
          Main Page Title
        </Heading>
        <Heading level="h2" id="section-1">
          Section 1
        </Heading>
        <Heading level="h3" id="subsection-1-1">
          Subsection 1.1
        </Heading>
        <Heading level="h3" id="subsection-1-2">
          Subsection 1.2
        </Heading>
        <Heading level="h2" id="section-2">
          Section 2
        </Heading>
      </div>
    )
    
    // Check that all headings are present in the document
    const headings = screen.getAllByRole('heading')
    expect(headings).toHaveLength(5)
    
    // Check specific heading levels
    expect(screen.getByRole('heading', { level: 1, name: 'Main Page Title' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
    
    // Check IDs are properly set
    expect(screen.getByRole('heading', { name: 'Main Page Title' })).toHaveAttribute('id', 'main-title')
    expect(screen.getByRole('heading', { name: 'Section 1' })).toHaveAttribute('id', 'section-1')
  })

  it('should handle edge cases with empty or special content', () => {
    const { rerender } = render(<Heading level="h2"></Heading>)
    let heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('')
    
    rerender(<Heading level="h2">   </Heading>)
    heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('   ')
    
    rerender(<Heading level="h2">Special chars: àáâãäå æ ç èéêë</Heading>)
    heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Special chars: àáâãäå æ ç èéêë')
  })

  it('should work with responsive design classes', () => {
    render(
      <Heading 
        level="h1" 
        className="text-2xl md:text-4xl lg:text-5xl"
      >
        Responsive Heading
      </Heading>
    )
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveClass(
      'text-4xl', // default h1 size
      'font-bold', // default h1 weight
      'tracking-tight', // common class
      'text-2xl', // custom responsive classes
      'md:text-4xl',
      'lg:text-5xl'
    )
  })

  it('should support ARIA attributes for accessibility', () => {
    render(
      <Heading 
        level="h2"
        aria-describedby="description-id"
        role="heading"
        aria-level={2}
      >
        Accessible Heading
      </Heading>
    )
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveAttribute('aria-describedby', 'description-id')
    expect(heading).toHaveAttribute('aria-level', '2')
  })

  it('should handle tabIndex for focusable headings', () => {
    render(
      <Heading level="h2" tabIndex={0}>
        Focusable Heading
      </Heading>
    )
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveAttribute('tabIndex', '0')
    
    heading.focus()
    expect(heading).toHaveFocus()
  })
})