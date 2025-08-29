import type { Meta, StoryObj } from '@storybook/react';
import { Stack, HStack } from './stack';

const meta: Meta<typeof Stack> = {
  title: 'Primitives/Stack',
  component: Stack,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    spacing: {
      control: { type: 'select' },
      options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    gap: {
      control: { type: 'select' },
      options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
    },
    justify: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
    },
    asChild: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const StackItem = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 bg-primary text-primary-foreground rounded text-center ${className}`}>
    {children}
  </div>
);

export const Default: Story = {
  render: (args) => (
    <Stack {...args} className="w-64">
      <StackItem>Item 1</StackItem>
      <StackItem>Item 2</StackItem>
      <StackItem>Item 3</StackItem>
    </Stack>
  ),
};

export const WithSpacing: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm mb-4 font-semibold">Spacing 0:</p>
        <Stack spacing={0} className="w-64">
          <StackItem>Item 1</StackItem>
          <StackItem>Item 2</StackItem>
          <StackItem>Item 3</StackItem>
        </Stack>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Spacing 4:</p>
        <Stack spacing={4} className="w-64">
          <StackItem>Item 1</StackItem>
          <StackItem>Item 2</StackItem>
          <StackItem>Item 3</StackItem>
        </Stack>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Spacing 8:</p>
        <Stack spacing={8} className="w-64">
          <StackItem>Item 1</StackItem>
          <StackItem>Item 2</StackItem>
          <StackItem>Item 3</StackItem>
        </Stack>
      </div>
    </div>
  ),
};

export const WithAlignment: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm mb-4 font-semibold">Align Start:</p>
        <Stack align="start" spacing={4} className="w-64">
          <StackItem className="w-32">Short</StackItem>
          <StackItem className="w-48">Medium Width</StackItem>
          <StackItem className="w-24">Small</StackItem>
        </Stack>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Align Center:</p>
        <Stack align="center" spacing={4} className="w-64">
          <StackItem className="w-32">Short</StackItem>
          <StackItem className="w-48">Medium Width</StackItem>
          <StackItem className="w-24">Small</StackItem>
        </Stack>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Align End:</p>
        <Stack align="end" spacing={4} className="w-64">
          <StackItem className="w-32">Short</StackItem>
          <StackItem className="w-48">Medium Width</StackItem>
          <StackItem className="w-24">Small</StackItem>
        </Stack>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Align Stretch (Default):</p>
        <Stack align="stretch" spacing={4} className="w-64">
          <StackItem>Full Width 1</StackItem>
          <StackItem>Full Width 2</StackItem>
          <StackItem>Full Width 3</StackItem>
        </Stack>
      </div>
    </div>
  ),
};

export const NestedStacks: Story = {
  render: () => (
    <Stack spacing={6} className="w-80">
      <StackItem>Header Item</StackItem>
      <Stack spacing={2} className="p-4 bg-muted rounded">
        <p className="text-sm font-medium text-muted-foreground">Nested Stack:</p>
        <StackItem>Nested Item 1</StackItem>
        <StackItem>Nested Item 2</StackItem>
      </Stack>
      <StackItem>Footer Item</StackItem>
    </Stack>
  ),
};

export const HStackDefault: Story = {
  render: () => (
    <HStack spacing={4} className="w-96">
      <StackItem>Item 1</StackItem>
      <StackItem>Item 2</StackItem>
      <StackItem>Item 3</StackItem>
    </HStack>
  ),
};

export const HStackWithAlignment: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm mb-4 font-semibold">HStack Align Start:</p>
        <HStack align="start" spacing={4} className="w-96 h-24 p-4 border rounded">
          <StackItem className="h-8">Short</StackItem>
          <StackItem className="h-16">Tall</StackItem>
          <StackItem className="h-12">Medium</StackItem>
        </HStack>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">HStack Align Center:</p>
        <HStack align="center" spacing={4} className="w-96 h-24 p-4 border rounded">
          <StackItem className="h-8">Short</StackItem>
          <StackItem className="h-16">Tall</StackItem>
          <StackItem className="h-12">Medium</StackItem>
        </HStack>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">HStack Align Stretch:</p>
        <HStack align="stretch" spacing={4} className="w-96 h-24 p-4 border rounded">
          <StackItem>Stretched 1</StackItem>
          <StackItem>Stretched 2</StackItem>
          <StackItem>Stretched 3</StackItem>
        </HStack>
      </div>
    </div>
  ),
};

export const HStackJustify: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm mb-4 font-semibold">Justify Start:</p>
        <HStack justify="start" spacing={2} className="w-96 p-4 border rounded">
          <StackItem>1</StackItem>
          <StackItem>2</StackItem>
        </HStack>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Justify Center:</p>
        <HStack justify="center" spacing={2} className="w-96 p-4 border rounded">
          <StackItem>1</StackItem>
          <StackItem>2</StackItem>
        </HStack>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Justify Between:</p>
        <HStack justify="between" className="w-96 p-4 border rounded">
          <StackItem>1</StackItem>
          <StackItem>2</StackItem>
        </HStack>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Justify End:</p>
        <HStack justify="end" spacing={2} className="w-96 p-4 border rounded">
          <StackItem>1</StackItem>
          <StackItem>2</StackItem>
        </HStack>
      </div>
    </div>
  ),
};

export const FormLayout: Story = {
  render: () => (
    <Stack spacing={6} className="w-96 p-6 border rounded-lg bg-card">
      <div>
        <h2 className="text-xl font-semibold mb-2">User Profile</h2>
        <p className="text-sm text-muted-foreground">Update your profile information</p>
      </div>
      
      <Stack spacing={4}>
        <div>
          <label className="text-sm font-medium mb-2 block">Name</label>
          <input 
            type="text" 
            placeholder="Enter your name" 
            className="w-full p-3 border rounded-md"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Email</label>
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="w-full p-3 border rounded-md"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Bio</label>
          <textarea 
            rows={3}
            placeholder="Tell us about yourself" 
            className="w-full p-3 border rounded-md resize-none"
          />
        </div>
      </Stack>
      
      <HStack justify="end" spacing={3}>
        <button className="px-4 py-2 border rounded-md hover:bg-accent">
          Cancel
        </button>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Save Changes
        </button>
      </HStack>
    </Stack>
  ),
};

export const CardWithActions: Story = {
  render: () => (
    <div className="w-80 p-6 border rounded-lg bg-card shadow-sm">
      <Stack spacing={4}>
        <div>
          <h3 className="text-lg font-semibold">Card Title</h3>
          <p className="text-sm text-muted-foreground mt-1">
            This is an example of using Stack for card layouts with consistent spacing.
          </p>
        </div>
        
        <Stack spacing={2}>
          <div className="flex justify-between text-sm">
            <span>Status:</span>
            <span className="font-medium text-green-600">Active</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Created:</span>
            <span className="text-muted-foreground">2 days ago</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Priority:</span>
            <span className="font-medium text-orange-600">High</span>
          </div>
        </Stack>
        
        <HStack spacing={2}>
          <button className="flex-1 px-3 py-2 border rounded-md hover:bg-accent text-sm">
            Edit
          </button>
          <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm">
            View
          </button>
        </HStack>
      </Stack>
    </div>
  ),
};

export const AsChildExample: Story = {
  render: () => (
    <Stack asChild spacing={4} className="w-64">
      <section>
        <StackItem>Section Item 1</StackItem>
        <StackItem>Section Item 2</StackItem>
        <StackItem>Section Item 3</StackItem>
      </section>
    </Stack>
  ),
};

export const ComparisonWithFlex: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-2xl">
      <div>
        <p className="text-sm mb-4 font-semibold">Using Stack (simplified):</p>
        <Stack spacing={4} className="w-64 p-4 border rounded">
          <StackItem>Item 1</StackItem>
          <StackItem>Item 2</StackItem>
          <StackItem>Item 3</StackItem>
        </Stack>
      </div>
      
      <div>
        <p className="text-sm mb-4 font-semibold">Using HStack (simplified):</p>
        <HStack spacing={4} className="w-96 p-4 border rounded">
          <StackItem>Item 1</StackItem>
          <StackItem>Item 2</StackItem>
          <StackItem>Item 3</StackItem>
        </HStack>
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>Stack components are simplified versions of Flex:</p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Stack = Flex with direction="column"</li>
          <li>HStack = Flex with direction="row"</li>
          <li>Both use "spacing" prop instead of "gap" for convenience</li>
        </ul>
      </div>
    </div>
  ),
};