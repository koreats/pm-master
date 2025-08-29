import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outline', 'ghost'],
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
  render: (args) => (
    <Card {...args} className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
  },
  render: (args) => (
    <Card {...args} className="w-[350px]">
      <CardHeader>
        <CardTitle>Elevated Card</CardTitle>
        <CardDescription>This card has enhanced shadow.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content with elevated styling.</p>
      </CardContent>
    </Card>
  ),
};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
  render: (args) => (
    <Card {...args} className="w-[350px]">
      <CardHeader>
        <CardTitle>Outline Card</CardTitle>
        <CardDescription>This card has a bold border.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content with outline styling.</p>
      </CardContent>
    </Card>
  ),
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
  render: (args) => (
    <Card {...args} className="w-[350px]">
      <CardHeader>
        <CardTitle>Ghost Card</CardTitle>
        <CardDescription>This card has minimal styling.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content with ghost styling.</p>
      </CardContent>
    </Card>
  ),
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
  render: (args) => (
    <Card {...args} className="w-[280px]">
      <CardHeader>
        <CardTitle>Small Card</CardTitle>
        <CardDescription>Compact card size.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Less padding for smaller spaces.</p>
      </CardContent>
    </Card>
  ),
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
  render: (args) => (
    <Card {...args} className="w-[450px]">
      <CardHeader>
        <CardTitle>Large Card</CardTitle>
        <CardDescription>Spacious card with generous padding.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>More padding for detailed content and better readability.</p>
      </CardContent>
    </Card>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[750px]">
      <Card variant="default" className="w-full">
        <CardHeader>
          <CardTitle>Default</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Standard card styling.</p>
        </CardContent>
      </Card>
      <Card variant="elevated" className="w-full">
        <CardHeader>
          <CardTitle>Elevated</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Enhanced shadow.</p>
        </CardContent>
      </Card>
      <Card variant="outline" className="w-full">
        <CardHeader>
          <CardTitle>Outline</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Bold border styling.</p>
        </CardContent>
      </Card>
      <Card variant="ghost" className="w-full">
        <CardHeader>
          <CardTitle>Ghost</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Minimal styling.</p>
        </CardContent>
      </Card>
    </div>
  ),
};