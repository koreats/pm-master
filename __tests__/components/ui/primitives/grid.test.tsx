import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Grid } from '@/components/ui/primitives/grid'

describe('Grid', () => {
  it('should render with default props', () => {
    render(<Grid data-testid="grid">Grid Content</Grid>)
    
    const grid = screen.getByTestId('grid')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveClass('grid')
    expect(grid).toHaveClass('grid-cols-1') // default cols
    expect(grid).toHaveClass('grid-flow-row') // default flow
    expect(grid.tagName).toBe('DIV')
  })

  it('should render with different column counts', () => {
    const columns = [
      { cols: 1, class: 'grid-cols-1' },
      { cols: 2, class: 'grid-cols-2' },
      { cols: 3, class: 'grid-cols-3' },
      { cols: 4, class: 'grid-cols-4' },
      { cols: 6, class: 'grid-cols-6' },
      { cols: 12, class: 'grid-cols-12' },
      { cols: 'none', class: 'grid-cols-none' },
    ] as const

    columns.forEach(({ cols, class: expectedClass }) => {
      render(
        <Grid cols={cols} data-testid={`grid-cols-${cols}`}>
          Cols {cols}
        </Grid>
      )
      
      const grid = screen.getByTestId(`grid-cols-${cols}`)
      expect(grid).toHaveClass(expectedClass)
    })
  })

  it('should render with different row counts', () => {
    const rows = [
      { rows: 1, class: 'grid-rows-1' },
      { rows: 2, class: 'grid-rows-2' },
      { rows: 3, class: 'grid-rows-3' },
      { rows: 4, class: 'grid-rows-4' },
      { rows: 6, class: 'grid-rows-6' },
      { rows: 'none', class: 'grid-rows-none' },
    ] as const

    rows.forEach(({ rows, class: expectedClass }) => {
      render(
        <Grid rows={rows} data-testid={`grid-rows-${rows}`}>
          Rows {rows}
        </Grid>
      )
      
      const grid = screen.getByTestId(`grid-rows-${rows}`)
      expect(grid).toHaveClass(expectedClass)
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
        <Grid gap={gap} data-testid={`grid-gap-${gap}`}>
          Gap {gap}
        </Grid>
      )
      
      const grid = screen.getByTestId(`grid-gap-${gap}`)
      expect(grid).toHaveClass(expectedClass)
    })
  })

  it('should render with different gapX values', () => {
    const gapXValues = [
      { gapX: 0, class: 'gap-x-0' },
      { gapX: 2, class: 'gap-x-2' },
      { gapX: 4, class: 'gap-x-4' },
      { gapX: 8, class: 'gap-x-8' },
      { gapX: 12, class: 'gap-x-12' },
    ] as const

    gapXValues.forEach(({ gapX, class: expectedClass }) => {
      render(
        <Grid gapX={gapX} data-testid={`grid-gapx-${gapX}`}>
          Gap X {gapX}
        </Grid>
      )
      
      const grid = screen.getByTestId(`grid-gapx-${gapX}`)
      expect(grid).toHaveClass(expectedClass)
    })
  })

  it('should render with different gapY values', () => {
    const gapYValues = [
      { gapY: 0, class: 'gap-y-0' },
      { gapY: 2, class: 'gap-y-2' },
      { gapY: 4, class: 'gap-y-4' },
      { gapY: 8, class: 'gap-y-8' },
      { gapY: 12, class: 'gap-y-12' },
    ] as const

    gapYValues.forEach(({ gapY, class: expectedClass }) => {
      render(
        <Grid gapY={gapY} data-testid={`grid-gapy-${gapY}`}>
          Gap Y {gapY}
        </Grid>
      )
      
      const grid = screen.getByTestId(`grid-gapy-${gapY}`)
      expect(grid).toHaveClass(expectedClass)
    })
  })

  it('should render with different flow values', () => {
    const flows = [
      { flow: 'row', class: 'grid-flow-row' },
      { flow: 'col', class: 'grid-flow-col' },
      { flow: 'dense', class: 'grid-flow-dense' },
      { flow: 'row-dense', class: 'grid-flow-row-dense' },
      { flow: 'col-dense', class: 'grid-flow-col-dense' },
    ] as const

    flows.forEach(({ flow, class: expectedClass }) => {
      render(
        <Grid flow={flow} data-testid={`grid-flow-${flow}`}>
          Flow {flow}
        </Grid>
      )
      
      const grid = screen.getByTestId(`grid-flow-${flow}`)
      expect(grid).toHaveClass(expectedClass)
    })
  })

  it('should apply custom className', () => {
    render(
      <Grid className="custom-grid" data-testid="custom-grid">
        Custom Grid
      </Grid>
    )
    
    const grid = screen.getByTestId('custom-grid')
    expect(grid).toHaveClass('custom-grid')
    expect(grid).toHaveClass('grid') // Should still have base class
  })

  it('should combine multiple variant props', () => {
    render(
      <Grid
        cols={3}
        rows={2}
        gap={4}
        gapX={6}
        gapY={2}
        flow="col"
        data-testid="combined-grid"
      >
        Combined Props
      </Grid>
    )
    
    const grid = screen.getByTestId('combined-grid')
    expect(grid).toHaveClass(
      'grid',
      'grid-cols-3',
      'grid-rows-2',
      'gap-4',
      'gap-x-6',
      'gap-y-2',
      'grid-flow-col'
    )
  })

  it('should handle asChild prop', () => {
    render(
      <Grid asChild cols={2} data-testid="as-child-grid">
        <section>As Child Section</section>
      </Grid>
    )
    
    const section = screen.getByTestId('as-child-grid')
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveClass('grid', 'grid-cols-2')
    expect(screen.getByText('As Child Section')).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    
    render(
      <Grid ref={ref} data-testid="ref-grid">
        Ref Test
      </Grid>
    )
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toBe(screen.getByTestId('ref-grid'))
  })

  it('should handle custom HTML attributes', () => {
    render(
      <Grid
        id="test-grid"
        role="grid"
        aria-label="Test grid container"
        data-testid="attributes-grid"
      >
        Attributes Test
      </Grid>
    )
    
    const grid = screen.getByTestId('attributes-grid')
    expect(grid).toHaveAttribute('id', 'test-grid')
    expect(grid).toHaveAttribute('role', 'grid')
    expect(grid).toHaveAttribute('aria-label', 'Test grid container')
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    
    render(
      <Grid onClick={handleClick} data-testid="clickable-grid">
        Clickable Grid
      </Grid>
    )
    
    const grid = screen.getByTestId('clickable-grid')
    grid.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render children correctly', () => {
    render(
      <Grid cols={2} data-testid="children-grid">
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
        <div>Item 4</div>
      </Grid>
    )
    
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
    expect(screen.getByText('Item 4')).toBeInTheDocument()
    
    const grid = screen.getByTestId('children-grid')
    expect(grid.children).toHaveLength(4)
  })

  it('should work with responsive design classes', () => {
    render(
      <Grid 
        cols={1}
        className="sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        data-testid="responsive-grid"
      >
        <div>Responsive Item 1</div>
        <div>Responsive Item 2</div>
        <div>Responsive Item 3</div>
        <div>Responsive Item 4</div>
      </Grid>
    )
    
    const grid = screen.getByTestId('responsive-grid')
    expect(grid).toHaveClass(
      'grid',
      'grid-cols-1',
      'sm:grid-cols-2',
      'md:grid-cols-3',
      'lg:grid-cols-4'
    )
  })

  it('should work with complex nested structure', () => {
    render(
      <Grid cols={2} gap={4} data-testid="nested-grid">
        <div className="p-4 bg-gray-100">
          <h3>Card 1</h3>
          <p>Content 1</p>
        </div>
        <div className="p-4 bg-gray-100">
          <h3>Card 2</h3>
          <p>Content 2</p>
        </div>
        <div className="p-4 bg-gray-100 col-span-2">
          <h3>Full Width Card</h3>
          <p>Spans both columns</p>
        </div>
      </Grid>
    )
    
    expect(screen.getByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 2')).toBeInTheDocument()
    expect(screen.getByText('Full Width Card')).toBeInTheDocument()
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.getByText('Spans both columns')).toBeInTheDocument()
  })

  it('should maintain semantic accessibility when used as different elements', () => {
    render(
      <Grid asChild cols={3} role="grid" aria-label="Data grid">
        <div>
          <div role="gridcell">Cell 1</div>
          <div role="gridcell">Cell 2</div>
          <div role="gridcell">Cell 3</div>
        </div>
      </Grid>
    )
    
    const grid = screen.getByRole('grid', { name: 'Data grid' })
    expect(grid).toHaveClass('grid', 'grid-cols-3')
    expect(screen.getByRole('gridcell', { name: 'Cell 1' })).toBeInTheDocument()
  })

  it('should handle asymmetric gaps correctly', () => {
    render(
      <Grid cols={2} gapX={8} gapY={2} data-testid="asymmetric-grid">
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
        <div>Item 4</div>
      </Grid>
    )
    
    const grid = screen.getByTestId('asymmetric-grid')
    expect(grid).toHaveClass('gap-x-8', 'gap-y-2')
    expect(grid).not.toHaveClass('gap-8') // Should not have general gap when specific ones are set
  })
})