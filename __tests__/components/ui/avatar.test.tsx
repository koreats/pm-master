import { render, screen } from '@testing-library/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

describe('Avatar', () => {
  it('should render with default size', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    const avatar = screen.getByText('JD').parentElement
    expect(avatar).toHaveClass('h-10', 'w-10')
  })

  it('should render with different sizes', () => {
    const sizes = [
      { size: 'xs', classes: ['h-6', 'w-6'] },
      { size: 'sm', classes: ['h-8', 'w-8'] },
      { size: 'md', classes: ['h-10', 'w-10'] },
      { size: 'lg', classes: ['h-12', 'w-12'] },
      { size: 'xl', classes: ['h-14', 'w-14'] },
      { size: '2xl', classes: ['h-16', 'w-16'] },
      { size: '3xl', classes: ['h-20', 'w-20'] },
    ] as const

    sizes.forEach(({ size, classes }) => {
      render(
        <Avatar size={size} data-testid={`avatar-${size}`}>
          <AvatarFallback>{size.toUpperCase()}</AvatarFallback>
        </Avatar>
      )
      
      const avatar = screen.getByTestId(`avatar-${size}`)
      classes.forEach(className => {
        expect(avatar).toHaveClass(className)
      })
    })
  })

  it('should apply custom className', () => {
    render(
      <Avatar className="custom-avatar">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    const avatar = screen.getByText('JD').parentElement
    expect(avatar).toHaveClass('custom-avatar')
  })
})

describe('AvatarImage', () => {
  it('should render image with correct attributes', () => {
    render(
      <Avatar>
        <AvatarImage src="/test-avatar.jpg" alt="John Doe" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', '/test-avatar.jpg')
    expect(image).toHaveAttribute('alt', 'John Doe')
  })

  it('should fallback to AvatarFallback when image fails to load', () => {
    render(
      <Avatar>
        <AvatarImage src="/invalid-image.jpg" alt="John Doe" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    // Initially image should be present
    const image = screen.getByRole('img')
    expect(image).toBeInTheDocument()
    
    // Fallback should also be in DOM but might be hidden
    const fallback = screen.getByText('JD')
    expect(fallback).toBeInTheDocument()
  })

  it('should apply custom className to image', () => {
    render(
      <Avatar>
        <AvatarImage src="/test-avatar.jpg" alt="Test" className="custom-image" />
        <AvatarFallback>T</AvatarFallback>
      </Avatar>
    )
    
    const image = screen.getByRole('img')
    expect(image).toHaveClass('custom-image')
  })
})

describe('AvatarFallback', () => {
  it('should render fallback text', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    const fallback = screen.getByText('JD')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveClass('flex', 'h-full', 'w-full', 'items-center', 'justify-center', 'rounded-full', 'bg-muted')
  })

  it('should apply custom className to fallback', () => {
    render(
      <Avatar>
        <AvatarFallback className="custom-fallback">JD</AvatarFallback>
      </Avatar>
    )
    
    const fallback = screen.getByText('JD')
    expect(fallback).toHaveClass('custom-fallback')
  })

  it('should render fallback with different content', () => {
    render(
      <Avatar>
        <AvatarFallback>
          <span>👤</span>
        </AvatarFallback>
      </Avatar>
    )
    
    const fallback = screen.getByText('👤')
    expect(fallback).toBeInTheDocument()
  })

  it('should handle long text in fallback', () => {
    render(
      <Avatar>
        <AvatarFallback>LONG</AvatarFallback>
      </Avatar>
    )
    
    const fallback = screen.getByText('LONG')
    expect(fallback).toBeInTheDocument()
  })
})

describe('Avatar Integration', () => {
  it('should work with both image and fallback together', () => {
    render(
      <Avatar size="lg">
        <AvatarImage src="/profile.jpg" alt="Profile Picture" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    
    // Both should be present in DOM
    const image = screen.getByRole('img')
    const fallback = screen.getByText('AB')
    
    expect(image).toBeInTheDocument()
    expect(fallback).toBeInTheDocument()
    expect(image.parentElement).toHaveClass('h-12', 'w-12')
  })

  it('should maintain semantic structure', () => {
    render(
      <Avatar role="img" aria-label="User avatar">
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    )
    
    const avatar = screen.getByRole('img', { name: 'User avatar' })
    expect(avatar).toBeInTheDocument()
  })
})