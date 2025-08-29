import * as React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose
} from '@/components/ui/modal'

describe('Modal', () => {
  it('should render trigger and open modal on click', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal>
        <ModalTrigger>Open Modal</ModalTrigger>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Test Modal</ModalTitle>
          </ModalHeader>
        </ModalContent>
      </Modal>
    )
    
    const trigger = screen.getByText('Open Modal')
    expect(trigger).toBeInTheDocument()
    
    // Modal should not be visible initially
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    
    // Click trigger to open modal
    await user.click(trigger)
    
    // Modal should now be visible
    await waitFor(() => {
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })
  })

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal>
        <ModalTrigger>Open Modal</ModalTrigger>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Test Modal</ModalTitle>
          </ModalHeader>
        </ModalContent>
      </Modal>
    )
    
    // Open modal
    await user.click(screen.getByText('Open Modal'))
    await waitFor(() => {
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })
    
    // Find and click close button
    const closeButton = screen.getByRole('button', { name: 'Close' })
    await user.click(closeButton)
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })
  })

  it('should close modal when ESC key is pressed', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal>
        <ModalTrigger>Open Modal</ModalTrigger>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Test Modal</ModalTitle>
          </ModalHeader>
        </ModalContent>
      </Modal>
    )
    
    // Open modal
    await user.click(screen.getByText('Open Modal'))
    await waitFor(() => {
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })
    
    // Press ESC key
    await user.keyboard('{Escape}')
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })
  })
})

describe('ModalContent', () => {
  it('should render with default size', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent data-testid="modal-content">
          <ModalTitle>Default Size Modal</ModalTitle>
        </ModalContent>
      </Modal>
    )
    
    await user.click(screen.getByText('Open'))
    
    await waitFor(() => {
      const content = screen.getByTestId('modal-content')
      expect(content).toHaveClass('max-w-lg')
    })
  })

  it('should render with different sizes', async () => {
    const user = userEvent.setup()
    const sizes = [
      { size: 'sm', class: 'max-w-sm' },
      { size: 'lg', class: 'max-w-2xl' },
      { size: 'xl', class: 'max-w-4xl' },
      { size: 'full', class: 'max-w-[95vw]' },
    ] as const

    for (const { size, class: expectedClass } of sizes) {
      render(
        <Modal>
          <ModalTrigger>Open {size}</ModalTrigger>
          <ModalContent size={size} data-testid={`modal-${size}`}>
            <ModalTitle>{size} Modal</ModalTitle>
          </ModalContent>
        </Modal>
      )
      
      await user.click(screen.getByText(`Open ${size}`))
      
      await waitFor(() => {
        const content = screen.getByTestId(`modal-${size}`)
        expect(content).toHaveClass(expectedClass)
      })
      
      // Close modal for next iteration
      await user.keyboard('{Escape}')
      await waitFor(() => {
        expect(screen.queryByText(`${size} Modal`)).not.toBeInTheDocument()
      })
    }
  })

  it('should apply custom className', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent className="custom-modal" data-testid="custom-modal">
          <ModalTitle>Custom Modal</ModalTitle>
        </ModalContent>
      </Modal>
    )
    
    await user.click(screen.getByText('Open'))
    
    await waitFor(() => {
      const content = screen.getByTestId('custom-modal')
      expect(content).toHaveClass('custom-modal')
    })
  })
})

describe('ModalHeader', () => {
  it('should render with correct styling', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent>
          <ModalHeader data-testid="modal-header">
            <ModalTitle>Header Title</ModalTitle>
          </ModalHeader>
        </ModalContent>
      </Modal>
    )
    
    await user.click(screen.getByText('Open'))
    
    await waitFor(() => {
      const header = screen.getByTestId('modal-header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'text-center', 'sm:text-left')
    })
  })
})

describe('ModalTitle', () => {
  it('should render with correct styling and semantics', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent>
          <ModalTitle>Modal Title</ModalTitle>
        </ModalContent>
      </Modal>
    )
    
    await user.click(screen.getByText('Open'))
    
    await waitFor(() => {
      const title = screen.getByText('Modal Title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-lg', 'font-semibold', 'leading-none', 'tracking-tight')
    })
  })
})

describe('ModalDescription', () => {
  it('should render with correct styling', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent>
          <ModalDescription>Modal description text</ModalDescription>
        </ModalContent>
      </Modal>
    )
    
    await user.click(screen.getByText('Open'))
    
    await waitFor(() => {
      const description = screen.getByText('Modal description text')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })
})

describe('ModalFooter', () => {
  it('should render with correct styling', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent>
          <ModalFooter data-testid="modal-footer">
            <button>Cancel</button>
            <button>Save</button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
    
    await user.click(screen.getByText('Open'))
    
    await waitFor(() => {
      const footer = screen.getByTestId('modal-footer')
      expect(footer).toHaveClass('flex', 'flex-col-reverse', 'sm:flex-row', 'sm:justify-end', 'sm:space-x-2')
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
  })
})

describe('Modal Integration', () => {
  it('should work with all components together', async () => {
    const user = userEvent.setup()
    const handleSave = jest.fn()
    
    render(
      <Modal>
        <ModalTrigger>Open Complete Modal</ModalTrigger>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Complete Modal</ModalTitle>
            <ModalDescription>This modal has all components</ModalDescription>
          </ModalHeader>
          <div className="p-4">
            <p>Modal body content</p>
          </div>
          <ModalFooter>
            <ModalClose asChild>
              <button>Cancel</button>
            </ModalClose>
            <button onClick={handleSave}>Save</button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
    
    // Open modal
    await user.click(screen.getByText('Open Complete Modal'))
    
    await waitFor(() => {
      expect(screen.getByText('Complete Modal')).toBeInTheDocument()
      expect(screen.getByText('This modal has all components')).toBeInTheDocument()
      expect(screen.getByText('Modal body content')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
    
    // Test save button
    await user.click(screen.getByText('Save'))
    expect(handleSave).toHaveBeenCalledTimes(1)
    
    // Test cancel button (should close modal)
    await user.click(screen.getByText('Cancel'))
    
    await waitFor(() => {
      expect(screen.queryByText('Complete Modal')).not.toBeInTheDocument()
    })
  })

  it('should handle controlled state', async () => {
    const user = userEvent.setup()
    const TestComponent = () => {
      const [open, setOpen] = React.useState(false)
      
      return (
        <div>
          <button onClick={() => setOpen(true)}>External Open</button>
          <Modal open={open} onOpenChange={setOpen}>
            <ModalContent>
              <ModalTitle>Controlled Modal</ModalTitle>
              <button onClick={() => setOpen(false)}>Internal Close</button>
            </ModalContent>
          </Modal>
        </div>
      )
    }
    
    render(<TestComponent />)
    
    // Modal should be closed initially
    expect(screen.queryByText('Controlled Modal')).not.toBeInTheDocument()
    
    // Open via external button
    await user.click(screen.getByText('External Open'))
    
    await waitFor(() => {
      expect(screen.getByText('Controlled Modal')).toBeInTheDocument()
    })
    
    // Close via internal button
    await user.click(screen.getByText('Internal Close'))
    
    await waitFor(() => {
      expect(screen.queryByText('Controlled Modal')).not.toBeInTheDocument()
    })
  })
})