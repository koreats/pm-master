import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './box';

const meta: Meta<typeof Box> = {
  title: 'Primitives/Box',
  component: Box,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    display: {
      control: { type: 'select' },
      options: ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'hidden'],
    },
    position: {
      control: { type: 'select' },
      options: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    },
    overflow: {
      control: { type: 'select' },
      options: ['visible', 'hidden', 'scroll', 'auto'],
    },
    asChild: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a Box component',
    className: 'p-4 bg-blue-50 border border-blue-200 rounded',
  },
};

export const Flex: Story = {
  args: {
    display: 'flex',
    className: 'p-4 bg-green-50 border border-green-200 rounded gap-2',
    children: (
      <>
        <div className="p-2 bg-green-200 rounded">Item 1</div>
        <div className="p-2 bg-green-200 rounded">Item 2</div>
        <div className="p-2 bg-green-200 rounded">Item 3</div>
      </>
    ),
  },
};

export const Grid: Story = {
  args: {
    display: 'grid',
    className: 'p-4 bg-purple-50 border border-purple-200 rounded grid-cols-2 gap-2',
    children: (
      <>
        <div className="p-2 bg-purple-200 rounded">Grid 1</div>
        <div className="p-2 bg-purple-200 rounded">Grid 2</div>
        <div className="p-2 bg-purple-200 rounded">Grid 3</div>
        <div className="p-2 bg-purple-200 rounded">Grid 4</div>
      </>
    ),
  },
};

export const RelativePositioning: Story = {
  args: {
    position: 'relative',
    className: 'p-8 bg-yellow-50 border border-yellow-200 rounded',
    children: (
      <>
        Base content
        <Box
          position="absolute"
          className="top-2 right-2 p-2 bg-yellow-200 rounded text-xs"
        >
          Positioned
        </Box>
      </>
    ),
  },
};

export const HiddenOverflow: Story = {
  args: {
    overflow: 'hidden',
    className: 'w-32 h-16 bg-red-50 border border-red-200 rounded',
    children: (
      <div className="w-64 h-32 bg-red-200 p-2">
        This content is larger than the container and will be clipped.
      </div>
    ),
  },
};

export const AllDisplayTypes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <Box display="block" className="p-2 bg-gray-100 border rounded">
        Block display
      </Box>
      <div>
        <Box display="inline" className="p-2 bg-blue-100 border rounded mr-2">
          Inline
        </Box>
        <Box display="inline" className="p-2 bg-blue-100 border rounded">
          Inline
        </Box>
      </div>
      <Box display="flex" className="p-2 bg-green-100 border rounded gap-2">
        <div className="p-1 bg-green-200 rounded">Flex 1</div>
        <div className="p-1 bg-green-200 rounded">Flex 2</div>
      </Box>
      <Box display="grid" className="p-2 bg-purple-100 border rounded grid-cols-3 gap-2">
        <div className="p-1 bg-purple-200 rounded">Grid 1</div>
        <div className="p-1 bg-purple-200 rounded">Grid 2</div>
        <div className="p-1 bg-purple-200 rounded">Grid 3</div>
      </Box>
    </div>
  ),
};