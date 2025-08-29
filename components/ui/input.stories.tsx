import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'success', 'warning'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg'],
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'password', 'email', 'number', 'search', 'url', 'tel'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    placeholder: 'Error state',
    value: 'Invalid input',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    placeholder: 'Success state',
    value: 'Valid input',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    placeholder: 'Warning state',
    value: 'Check this input',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small input',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large input',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password...',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter email...',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <Input variant="default" placeholder="Default" />
      <Input variant="destructive" placeholder="Destructive" />
      <Input variant="success" placeholder="Success" />
      <Input variant="warning" placeholder="Warning" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <Input size="sm" placeholder="Small" />
      <Input placeholder="Default" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
};