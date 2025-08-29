import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Error',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm">Small</Badge>
      <Badge size="default">Default</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

export const WithNumbers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">1</Badge>
      <Badge variant="secondary">23</Badge>
      <Badge variant="destructive">456</Badge>
      <Badge variant="success">99+</Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">Status:</span>
        <Badge variant="success">Active</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Priority:</span>
        <Badge variant="destructive">High</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Category:</span>
        <Badge variant="secondary">Development</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Environment:</span>
        <Badge variant="outline">Production</Badge>
      </div>
    </div>
  ),
};

export const InteractiveBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default" className="cursor-pointer hover:bg-primary/90 transition-colors">
        Clickable
      </Badge>
      <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors">
        Hoverable
      </Badge>
      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors">
        Interactive
      </Badge>
    </div>
  ),
};

export const CombinedStyles: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Task Progress</span>
        <Badge variant="success" size="sm">Completed</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Bug Report #1234</span>
        <Badge variant="destructive" size="sm">Critical</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Feature Request</span>
        <Badge variant="info" size="sm">Under Review</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Security Update</span>
        <Badge variant="warning" size="sm">Pending</Badge>
      </div>
    </div>
  ),
};