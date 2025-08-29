import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

export const WithFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://invalid-url.com/image.png" alt="User Avatar" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackOnly: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>AB</AvatarFallback>
    </Avatar>
  ),
};

export const ExtraSmall: Story = {
  render: () => (
    <Avatar size="xs">
      <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
      <AvatarFallback>XS</AvatarFallback>
    </Avatar>
  ),
};

export const Small: Story = {
  render: () => (
    <Avatar size="sm">
      <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
      <AvatarFallback>SM</AvatarFallback>
    </Avatar>
  ),
};

export const Medium: Story = {
  render: () => (
    <Avatar size="md">
      <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
      <AvatarFallback>MD</AvatarFallback>
    </Avatar>
  ),
};

export const Large: Story = {
  render: () => (
    <Avatar size="lg">
      <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
      <AvatarFallback>LG</AvatarFallback>
    </Avatar>
  ),
};

export const ExtraLarge: Story = {
  render: () => (
    <Avatar size="xl">
      <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
      <AvatarFallback>XL</AvatarFallback>
    </Avatar>
  ),
};

export const DoubleExtraLarge: Story = {
  render: () => (
    <Avatar size="2xl">
      <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
      <AvatarFallback>2XL</AvatarFallback>
    </Avatar>
  ),
};

export const TripleExtraLarge: Story = {
  render: () => (
    <Avatar size="3xl">
      <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
      <AvatarFallback>3XL</AvatarFallback>
    </Avatar>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <div className="text-center">
        <Avatar size="xs">
          <AvatarImage src="https://github.com/shadcn.png" alt="XS Avatar" />
          <AvatarFallback>XS</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">xs</p>
      </div>
      <div className="text-center">
        <Avatar size="sm">
          <AvatarImage src="https://github.com/shadcn.png" alt="SM Avatar" />
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">sm</p>
      </div>
      <div className="text-center">
        <Avatar size="md">
          <AvatarImage src="https://github.com/shadcn.png" alt="MD Avatar" />
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">md</p>
      </div>
      <div className="text-center">
        <Avatar size="lg">
          <AvatarImage src="https://github.com/shadcn.png" alt="LG Avatar" />
          <AvatarFallback>LG</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">lg</p>
      </div>
      <div className="text-center">
        <Avatar size="xl">
          <AvatarImage src="https://github.com/shadcn.png" alt="XL Avatar" />
          <AvatarFallback>XL</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">xl</p>
      </div>
      <div className="text-center">
        <Avatar size="2xl">
          <AvatarImage src="https://github.com/shadcn.png" alt="2XL Avatar" />
          <AvatarFallback>2XL</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">2xl</p>
      </div>
      <div className="text-center">
        <Avatar size="3xl">
          <AvatarImage src="https://github.com/shadcn.png" alt="3XL Avatar" />
          <AvatarFallback>3XL</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">3xl</p>
      </div>
    </div>
  ),
};

export const UserGroup: Story = {
  render: () => (
    <div className="flex -space-x-2">
      <Avatar className="border-2 border-background">
        <AvatarImage src="https://github.com/shadcn.png" alt="User 1" />
        <AvatarFallback>U1</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarImage src="https://github.com/vercel.png" alt="User 2" />
        <AvatarFallback>U2</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>U3</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>+2</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const WithNames: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <AvatarImage src="https://github.com/shadcn.png" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">John Doe</p>
          <p className="text-xs text-muted-foreground">john.doe@example.com</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <AvatarImage src="https://github.com/vercel.png" alt="Jane Smith" />
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">Jane Smith</p>
          <p className="text-xs text-muted-foreground">jane.smith@example.com</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">Alex Brown</p>
          <p className="text-xs text-muted-foreground">alex.brown@example.com</p>
        </div>
      </div>
    </div>
  ),
};

export const WithStatus: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="relative">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="Online User" />
          <AvatarFallback>ON</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0 -right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"></div>
      </div>
      <div className="relative">
        <Avatar>
          <AvatarImage src="https://github.com/vercel.png" alt="Away User" />
          <AvatarFallback>AW</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0 -right-0 h-3 w-3 rounded-full border-2 border-background bg-yellow-500"></div>
      </div>
      <div className="relative">
        <Avatar>
          <AvatarFallback>OF</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0 -right-0 h-3 w-3 rounded-full border-2 border-background bg-gray-400"></div>
      </div>
    </div>
  ),
};