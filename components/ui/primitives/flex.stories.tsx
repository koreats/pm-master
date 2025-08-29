import type { Meta, StoryObj } from '@storybook/react';
import { Flex } from './flex';

const meta: Meta<typeof Flex> = {
  title: 'Primitives/Flex',
  component: Flex,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: { type: 'select' },
      options: ['row', 'row-reverse', 'column', 'column-reverse'],
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
    },
    justify: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
    },
    wrap: {
      control: { type: 'select' },
      options: ['nowrap', 'wrap', 'wrap-reverse'],
    },
    gap: {
      control: { type: 'select' },
      options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    asChild: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const FlexItem = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 bg-primary text-primary-foreground rounded ${className}`}>
    {children}
  </div>
);

export const Default: Story = {
  render: (args) => (
    <Flex {...args} className="w-96 p-4 border rounded">
      <FlexItem>Item 1</FlexItem>
      <FlexItem>Item 2</FlexItem>
      <FlexItem>Item 3</FlexItem>
    </Flex>
  ),
};

export const Column: Story = {
  render: () => (
    <Flex direction="column" gap={4} className="w-64 p-4 border rounded">
      <FlexItem>First Item</FlexItem>
      <FlexItem>Second Item</FlexItem>
      <FlexItem>Third Item</FlexItem>
    </Flex>
  ),
};

export const JustifyBetween: Story = {
  render: () => (
    <Flex justify="between" className="w-96 p-4 border rounded">
      <FlexItem>Left</FlexItem>
      <FlexItem>Center</FlexItem>
      <FlexItem>Right</FlexItem>
    </Flex>
  ),
};

export const AlignCenter: Story = {
  render: () => (
    <Flex align="center" justify="center" className="w-96 h-32 p-4 border rounded">
      <FlexItem>Centered</FlexItem>
    </Flex>
  ),
};

export const WithGaps: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm mb-2">Gap 0:</p>
        <Flex gap={0} className="w-96 p-4 border rounded">
          <FlexItem>Item 1</FlexItem>
          <FlexItem>Item 2</FlexItem>
          <FlexItem>Item 3</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2">Gap 4:</p>
        <Flex gap={4} className="w-96 p-4 border rounded">
          <FlexItem>Item 1</FlexItem>
          <FlexItem>Item 2</FlexItem>
          <FlexItem>Item 3</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2">Gap 8:</p>
        <Flex gap={8} className="w-96 p-4 border rounded">
          <FlexItem>Item 1</FlexItem>
          <FlexItem>Item 2</FlexItem>
          <FlexItem>Item 3</FlexItem>
        </Flex>
      </div>
    </div>
  ),
};

export const AllDirections: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm mb-2 font-semibold">Row (Default):</p>
        <Flex direction="row" gap={4} className="w-96 p-4 border rounded">
          <FlexItem>1</FlexItem>
          <FlexItem>2</FlexItem>
          <FlexItem>3</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Row Reverse:</p>
        <Flex direction="row-reverse" gap={4} className="w-96 p-4 border rounded">
          <FlexItem>1</FlexItem>
          <FlexItem>2</FlexItem>
          <FlexItem>3</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Column:</p>
        <Flex direction="column" gap={4} className="w-64 p-4 border rounded">
          <FlexItem>1</FlexItem>
          <FlexItem>2</FlexItem>
          <FlexItem>3</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Column Reverse:</p>
        <Flex direction="column-reverse" gap={4} className="w-64 p-4 border rounded">
          <FlexItem>1</FlexItem>
          <FlexItem>2</FlexItem>
          <FlexItem>3</FlexItem>
        </Flex>
      </div>
    </div>
  ),
};

export const AllJustify: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm mb-2 font-semibold">Justify Start:</p>
        <Flex justify="start" gap={2} className="w-96 p-4 border rounded">
          <FlexItem>1</FlexItem>
          <FlexItem>2</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Justify Center:</p>
        <Flex justify="center" gap={2} className="w-96 p-4 border rounded">
          <FlexItem>1</FlexItem>
          <FlexItem>2</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Justify End:</p>
        <Flex justify="end" gap={2} className="w-96 p-4 border rounded">
          <FlexItem>1</FlexItem>
          <FlexItem>2</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Justify Between:</p>
        <Flex justify="between" className="w-96 p-4 border rounded">
          <FlexItem>1</FlexItem>
          <FlexItem>2</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Justify Around:</p>
        <Flex justify="around" className="w-96 p-4 border rounded">
          <FlexItem>1</FlexItem>
          <FlexItem>2</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Justify Evenly:</p>
        <Flex justify="evenly" className="w-96 p-4 border rounded">
          <FlexItem>1</FlexItem>
          <FlexItem>2</FlexItem>
        </Flex>
      </div>
    </div>
  ),
};

export const AllAlignments: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm mb-2 font-semibold">Align Start:</p>
        <Flex align="start" gap={2} className="w-96 h-24 p-4 border rounded">
          <FlexItem>Short</FlexItem>
          <FlexItem className="py-8">Tall Item</FlexItem>
          <FlexItem>Short</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Align Center:</p>
        <Flex align="center" gap={2} className="w-96 h-24 p-4 border rounded">
          <FlexItem>Short</FlexItem>
          <FlexItem className="py-8">Tall Item</FlexItem>
          <FlexItem>Short</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Align End:</p>
        <Flex align="end" gap={2} className="w-96 h-24 p-4 border rounded">
          <FlexItem>Short</FlexItem>
          <FlexItem className="py-8">Tall Item</FlexItem>
          <FlexItem>Short</FlexItem>
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Align Stretch (Default):</p>
        <Flex align="stretch" gap={2} className="w-96 h-24 p-4 border rounded">
          <FlexItem>Stretched</FlexItem>
          <FlexItem>All Equal</FlexItem>
          <FlexItem>Height</FlexItem>
        </Flex>
      </div>
    </div>
  ),
};

export const WithWrap: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm mb-2 font-semibold">No Wrap (Default):</p>
        <Flex wrap="nowrap" gap={2} className="w-96 p-4 border rounded">
          {Array.from({ length: 8 }, (_, i) => (
            <FlexItem key={i} className="flex-shrink-0">{i + 1}</FlexItem>
          ))}
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Wrap:</p>
        <Flex wrap="wrap" gap={2} className="w-96 p-4 border rounded">
          {Array.from({ length: 8 }, (_, i) => (
            <FlexItem key={i} className="flex-shrink-0">{i + 1}</FlexItem>
          ))}
        </Flex>
      </div>
      <div>
        <p className="text-sm mb-2 font-semibold">Wrap Reverse:</p>
        <Flex wrap="wrap-reverse" gap={2} className="w-96 p-4 border rounded">
          {Array.from({ length: 8 }, (_, i) => (
            <FlexItem key={i} className="flex-shrink-0">{i + 1}</FlexItem>
          ))}
        </Flex>
      </div>
    </div>
  ),
};

export const AsChildExample: Story = {
  render: () => (
    <Flex asChild direction="column" gap={4} className="w-64">
      <section>
        <FlexItem>Section Item 1</FlexItem>
        <FlexItem>Section Item 2</FlexItem>
        <FlexItem>Section Item 3</FlexItem>
      </section>
    </Flex>
  ),
};

export const RealWorldExample: Story = {
  render: () => (
    <div className="w-96 p-6 border rounded-lg bg-card">
      <Flex direction="column" gap={4}>
        {/* Header */}
        <Flex justify="between" align="center">
          <h3 className="text-lg font-semibold">Card Header</h3>
          <button className="p-2 hover:bg-accent rounded">⋮</button>
        </Flex>
        
        {/* Content */}
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            This is an example of how Flex can be used to create real-world layouts.
          </p>
        </div>
        
        {/* Footer */}
        <Flex justify="end" gap={2}>
          <button className="px-4 py-2 border rounded hover:bg-accent">Cancel</button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Save
          </button>
        </Flex>
      </Flex>
    </div>
  ),
};