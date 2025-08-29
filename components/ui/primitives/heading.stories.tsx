import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from './heading';

const meta: Meta<typeof Heading> = {
  title: 'Primitives/Heading',
  component: Heading,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: { type: 'select' },
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description: 'The semantic heading level',
    },
    children: {
      control: 'text',
      description: 'The content of the heading',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default Heading (H2)',
  },
};

export const AllLevels: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <div>
        <p className="text-sm text-muted-foreground mb-2">H1 - Main Page Title</p>
        <Heading level="h1">Main Page Title</Heading>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">H2 - Section Heading</p>
        <Heading level="h2">Section Heading</Heading>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">H3 - Subsection</p>
        <Heading level="h3">Subsection Title</Heading>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">H4 - Component Title</p>
        <Heading level="h4">Component Title</Heading>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">H5 - Small Section</p>
        <Heading level="h5">Small Section</Heading>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">H6 - Smallest Heading</p>
        <Heading level="h6">Smallest Heading</Heading>
      </div>
    </div>
  ),
};

export const WithCustomStyling: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-2">With Color Classes:</p>
        <Heading level="h2" className="text-primary">
          Primary Colored Heading
        </Heading>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">With Text Alignment:</p>
        <Heading level="h3" className="text-center">
          Centered Heading
        </Heading>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">With Custom Margin:</p>
        <Heading level="h4" className="mb-8">
          Heading with Extra Margin
        </Heading>
      </div>
    </div>
  ),
};

export const TypographyHierarchy: Story = {
  render: () => (
    <article className="max-w-2xl space-y-6">
      <Heading level="h1">The Complete Guide to Typography</Heading>
      <p className="text-muted-foreground">
        This article demonstrates the proper hierarchy of headings in a document structure.
      </p>
      
      <Heading level="h2">Understanding Typography</Heading>
      <p className="text-sm">
        Typography is the art and technique of arranging type to make written language legible, 
        readable, and appealing when displayed.
      </p>
      
      <Heading level="h3">Font Selection</Heading>
      <p className="text-sm">
        Choosing the right font is crucial for effective communication and user experience.
      </p>
      
      <Heading level="h4">Sans-serif Fonts</Heading>
      <p className="text-xs text-muted-foreground">
        Clean and modern fonts without decorative strokes.
      </p>
      
      <Heading level="h5">Popular Sans-serif Options</Heading>
      <p className="text-xs text-muted-foreground">
        Helvetica, Arial, Open Sans, and Inter are widely used.
      </p>
      
      <Heading level="h6">Font Pairing</Heading>
      <p className="text-xs text-muted-foreground">
        Combining fonts effectively creates visual hierarchy.
      </p>
    </article>
  ),
};

export const SemanticUsage: Story = {
  render: () => (
    <div className="space-y-8 max-w-3xl">
      <section>
        <Heading level="h1" className="mb-4">Website Header</Heading>
        <p className="text-sm text-muted-foreground">
          The H1 should be used once per page as the main heading.
        </p>
      </section>
      
      <section>
        <Heading level="h2" className="mb-3">Main Sections</Heading>
        <p className="text-sm text-muted-foreground mb-4">
          H2 elements represent the main sections of your content.
        </p>
        
        <Heading level="h3" className="mb-2">Subsections</Heading>
        <p className="text-xs text-muted-foreground mb-3">
          H3 elements break down H2 sections into more specific topics.
        </p>
        
        <Heading level="h4" className="mb-2">Detailed Topics</Heading>
        <p className="text-xs text-muted-foreground">
          H4 through H6 provide increasingly specific subdivision of content.
        </p>
      </section>
    </div>
  ),
};

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div className="p-4 border rounded-lg">
        <Heading level="h2" className="mb-3">
          Accessibility Best Practices
        </Heading>
        <p className="text-sm text-muted-foreground mb-4">
          Screen readers use heading structure to navigate content. Proper heading hierarchy 
          is essential for accessibility.
        </p>
        
        <Heading level="h3" className="mb-2">
          Sequential Order
        </Heading>
        <p className="text-xs text-muted-foreground mb-3">
          Headings should follow a logical sequence without skipping levels.
        </p>
        
        <div className="bg-muted p-3 rounded">
          <Heading level="h4" className="mb-2 text-green-700">
            ✓ Correct: H2 → H3 → H4
          </Heading>
          <Heading level="h4" className="text-red-700">
            ✗ Incorrect: H2 → H4 (skipped H3)
          </Heading>
        </div>
      </div>
    </div>
  ),
};

export const ResponsiveHeadings: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Responsive H1 (large on desktop, smaller on mobile):</p>
        <Heading level="h1" className="text-2xl md:text-4xl">
          Responsive Main Title
        </Heading>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Responsive H2:</p>
        <Heading level="h2" className="text-xl md:text-3xl">
          Responsive Section Title
        </Heading>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Responsive H3:</p>
        <Heading level="h3" className="text-lg md:text-2xl">
          Responsive Subsection
        </Heading>
      </div>
    </div>
  ),
};

export const DarkModeCompatible: Story = {
  render: () => (
    <div className="space-y-4 p-6 rounded-lg bg-background">
      <Heading level="h2" className="text-foreground">
        Dark Mode Compatible
      </Heading>
      <Heading level="h3" className="text-muted-foreground">
        Muted Foreground Heading
      </Heading>
      <Heading level="h4" className="text-primary">
        Primary Colored Heading
      </Heading>
      <div className="p-4 bg-card rounded border">
        <Heading level="h5" className="text-card-foreground mb-2">
          Card Header
        </Heading>
        <p className="text-xs text-muted-foreground">
          This demonstrates how headings work across different theme contexts.
        </p>
      </div>
    </div>
  ),
};