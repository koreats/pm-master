import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction
} from '@/components/ui/toast'

// Helper component for testing Toast
const ToastTestComponent = ({ 
  children, 
  open = true,
  onOpenChange = jest.fn() 
}: { 
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void 
}) => (
  <ToastProvider>
    <Toast open={open} onOpenChange={onOpenChange}>
      {children}
    </Toast>
    <ToastViewport />
  </ToastProvider>
)

describe('Toast', () => {
  it('should render with default variant and size', () => {
    render(
      <ToastTestComponent>
        <ToastTitle>Default Toast</ToastTitle>
      </ToastTestComponent>
    )
    
    const toast = screen.getByText('Default Toast').closest('[role="status"]')
    expect(toast).toBeInTheDocument()
    expect(toast).toHaveClass('border', 'bg-background', 'text-foreground')
    expect(toast).toHaveClass('p-6', 'pr-8')
  })

  it('should render with different variants', () => {
    const variants = [
      { variant: 'destructive', classes: ['border-destructive', 'bg-destructive', 'text-destructive-foreground'] },
      { variant: 'success', classes: ['border-primary', 'bg-primary', 'text-primary-foreground'] },
      { variant: 'warning', classes: ['border-yellow-500', 'bg-yellow-50', 'text-yellow-900'] },
    ] as const

    variants.forEach(({ variant, classes }) => {
      render(
        <ToastTestComponent>
          <Toast variant={variant} data-testid={`toast-${variant}`}>
            <ToastTitle>{variant} Toast</ToastTitle>
          </Toast>
        </ToastTestComponent>
      )
      
      const toast = screen.getByTestId(`toast-${variant}`)
      classes.forEach(className => {
        expect(toast).toHaveClass(className)
      })
    })
  })

  it('should render with different sizes', () => {
    const sizes = [
      { size: 'sm', classes: ['p-3', 'pr-6', 'text-sm'] },
      { size: 'default', classes: ['p-6', 'pr-8'] },
      { size: 'lg', classes: ['p-8', 'pr-10'] },
    ] as const

    sizes.forEach(({ size, classes }) => {
      render(
        <ToastTestComponent>
          <Toast size={size} data-testid={`toast-${size}`}>
            <ToastTitle>{size} Toast</ToastTitle>
          </Toast>
        </ToastTestComponent>
      )
      
      const toast = screen.getByTestId(`toast-${size}`)
      classes.forEach(className => {
        expect(toast).toHaveClass(className)
      })
    })
  })

  it('should apply custom className', () => {
    render(
      <ToastTestComponent>
        <Toast className="custom-toast" data-testid="custom-toast">
          <ToastTitle>Custom Toast</ToastTitle>
        </Toast>
      </ToastTestComponent>
    )
    
    const toast = screen.getByTestId('custom-toast')
    expect(toast).toHaveClass('custom-toast')
  })
})

describe('ToastTitle', () => {
  it('should render with correct styling', () => {
    render(
      <ToastTestComponent>
        <ToastTitle>Toast Title</ToastTitle>
      </ToastTestComponent>
    )
    
    const title = screen.getByText('Toast Title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveClass('text-sm', 'font-semibold')
  })

  it('should apply custom className', () => {
    render(
      <ToastTestComponent>
        <ToastTitle className="custom-title">Custom Title</ToastTitle>
      </ToastTestComponent>
    )
    
    const title = screen.getByText('Custom Title')
    expect(title).toHaveClass('custom-title')
  })
})

describe('ToastDescription', () => {
  it('should render with correct styling', () => {
    render(
      <ToastTestComponent>
        <ToastDescription>Toast description</ToastDescription>
      </ToastTestComponent>
    )
    
    const description = screen.getByText('Toast description')
    expect(description).toBeInTheDocument()
    expect(description).toHaveClass('text-sm', 'opacity-90')
  })

  it('should apply custom className', () => {
    render(
      <ToastTestComponent>
        <ToastDescription className="custom-description">Custom Description</ToastDescription>
      </ToastTestComponent>
    )
    
    const description = screen.getByText('Custom Description')
    expect(description).toHaveClass('custom-description')
  })
})

describe('ToastClose', () => {
  it('should render close button', () => {
    render(
      <ToastTestComponent>
        <ToastTitle>Toast with Close</ToastTitle>
        <ToastClose />
      </ToastTestComponent>
    )
    
    const closeButton = screen.getByRole('button')
    expect(closeButton).toBeInTheDocument()
    expect(closeButton).toHaveClass('absolute', 'right-2', 'top-2')
  })

  it('should close toast when clicked', async () => {
    const user = userEvent.setup()
    const mockOnOpenChange = jest.fn()
    
    render(
      <ToastTestComponent onOpenChange={mockOnOpenChange}>
        <ToastTitle>Closable Toast</ToastTitle>
        <ToastClose />
      </ToastTestComponent>
    )
    
    const closeButton = screen.getByRole('button')
    await user.click(closeButton)
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should apply custom className', () => {
    render(
      <ToastTestComponent>
        <ToastClose className="custom-close" />
      </ToastTestComponent>
    )
    
    const closeButton = screen.getByRole('button')
    expect(closeButton).toHaveClass('custom-close')
  })
})

describe('ToastAction', () => {
  it('should render action button', () => {
    render(
      <ToastTestComponent>
        <ToastTitle>Toast with Action</ToastTitle>
        <ToastAction altText="Undo action">Undo</ToastAction>
      </ToastTestComponent>
    )
    
    const actionButton = screen.getByRole('button', { name: 'Undo' })
    expect(actionButton).toBeInTheDocument()
    expect(actionButton).toHaveClass(
      'inline-flex', 
      'h-8', 
      'shrink-0', 
      'items-center', 
      'justify-center', 
      'rounded-md', 
      'border', 
      'bg-transparent'
    )
  })

  it('should handle click events', async () => {
    const user = userEvent.setup()
    const mockOnClick = jest.fn()
    
    render(
      <ToastTestComponent>
        <ToastTitle>Interactive Toast</ToastTitle>
        <ToastAction altText="Action button" onClick={mockOnClick}>
          Click Me
        </ToastAction>
      </ToastTestComponent>
    )
    
    const actionButton = screen.getByRole('button', { name: 'Click Me' })
    await user.click(actionButton)
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className', () => {
    render(
      <ToastTestComponent>
        <ToastAction altText="Custom action" className="custom-action">
          Custom Action
        </ToastAction>
      </ToastTestComponent>
    )
    
    const actionButton = screen.getByRole('button', { name: 'Custom Action' })
    expect(actionButton).toHaveClass('custom-action')
  })
})

describe('ToastViewport', () => {
  it('should render with correct styling', () => {
    render(
      <ToastProvider>
        <ToastViewport data-testid="toast-viewport" />
      </ToastProvider>
    )
    
    const viewport = screen.getByTestId('toast-viewport')
    expect(viewport).toBeInTheDocument()
    expect(viewport).toHaveClass(
      'fixed', 
      'top-0', 
      'z-[100]', 
      'flex', 
      'max-h-screen', 
      'w-full', 
      'flex-col-reverse'
    )
  })

  it('should apply custom className', () => {
    render(
      <ToastProvider>
        <ToastViewport className="custom-viewport" data-testid="custom-viewport" />
      </ToastProvider>
    )
    
    const viewport = screen.getByTestId('custom-viewport')
    expect(viewport).toHaveClass('custom-viewport')
  })
})

describe('Toast Integration', () => {
  it('should work with all components together', () => {
    render(
      <ToastTestComponent>
        <div className="grid gap-1">
          <ToastTitle>Complete Toast</ToastTitle>
          <ToastDescription>This toast has all components</ToastDescription>
        </div>
        <ToastAction altText="Undo">Undo</ToastAction>
        <ToastClose />
      </ToastTestComponent>
    )
    
    expect(screen.getByText('Complete Toast')).toBeInTheDocument()
    expect(screen.getByText('This toast has all components')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument() // Close button
  })

  it('should handle controlled state', async () => {
    const user = userEvent.setup()
    
    const ControlledToast = () => {
      const [open, setOpen] = React.useState(false)
      
      return (
        <ToastProvider>
          <button onClick={() => setOpen(true)}>Show Toast</button>
          <Toast open={open} onOpenChange={setOpen}>
            <ToastTitle>Controlled Toast</ToastTitle>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )
    }
    
    render(<ControlledToast />)
    
    // Toast should not be visible initially
    expect(screen.queryByText('Controlled Toast')).not.toBeInTheDocument()
    
    // Show toast
    await user.click(screen.getByText('Show Toast'))
    
    // Toast should be visible
    await waitFor(() => {
      expect(screen.getByText('Controlled Toast')).toBeInTheDocument()
    })
    
    // Close toast
    const closeButton = screen.getByRole('button', { name: '' })
    await user.click(closeButton)
    
    // Toast should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Controlled Toast')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should support different variants with complete content', () => {
    render(
      <ToastTestComponent>
        <Toast variant="destructive" size="lg" data-testid="complete-toast">
          <div className="grid gap-1">
            <ToastTitle>Error occurred</ToastTitle>
            <ToastDescription>Something went wrong. Please try again.</ToastDescription>
          </div>
          <ToastAction altText="Retry">Retry</ToastAction>
          <ToastClose />
        </Toast>
      </ToastTestComponent>
    )
    
    const toast = screen.getByTestId('complete-toast')
    expect(toast).toHaveClass('border-destructive', 'bg-destructive', 'p-8', 'pr-10')
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})