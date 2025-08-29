import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './text';

const meta: Meta<typeof Text> = {
  title: 'Primitives/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
    weight: {
      control: { type: 'select' },
      options: ['normal', 'medium', 'semibold', 'bold'],
    },
    align: {
      control: { type: 'select' },
      options: ['left', 'center', 'right', 'justify'],
    },
    color: {
      control: { type: 'select' },
      options: ['inherit', 'current', 'primary', 'secondary', 'muted', 'success', 'warning', 'error', 'info'],
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
    children: 'This is default text',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-2">
      <Text size="xs">Extra small text (xs)</Text>
      <Text size="sm">Small text (sm)</Text>
      <Text size="base">Base text (base)</Text>
      <Text size="lg">Large text (lg)</Text>
      <Text size="xl">Extra large text (xl)</Text>
      <Text size="2xl">2XL text (2xl)</Text>
      <Text size="3xl">3XL text (3xl)</Text>
      <Text size="4xl">4XL text (4xl)</Text>
    </div>
  ),
};

export const AllWeights: Story = {
  render: () => (
    <div className="space-y-2">
      <Text weight="normal">Normal weight text</Text>
      <Text weight="medium">Medium weight text</Text>
      <Text weight="semibold">Semibold weight text</Text>
      <Text weight="bold">Bold weight text</Text>
    </div>
  ),
};

export const AllAlignments: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <Text align="left">Left aligned text that wraps to multiple lines to show alignment</Text>
      <Text align="center">Center aligned text that wraps to multiple lines to show alignment</Text>
      <Text align="right">Right aligned text that wraps to multiple lines to show alignment</Text>
      <Text align="justify">Justified text that wraps to multiple lines to show how text is distributed evenly across the width</Text>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div className="space-y-2">
      <Text color="primary">Primary colored text</Text>
      <Text color="secondary">Secondary colored text</Text>
      <Text color="muted">Muted colored text</Text>
      <Text color="success">Success colored text</Text>
      <Text color="error">Error colored text</Text>
    </div>
  ),
};

export const CombinedStyles: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Text size="2xl" weight="bold" align="center" color="primary">
        Large Bold Centered Primary Heading
      </Text>
      <Text size="lg" weight="semibold" color="secondary">
        Large Semibold Secondary Subheading
      </Text>
      <Text size="base" weight="normal" align="justify" color="muted">
        This is a paragraph with base size, normal weight, justified alignment, and muted color. 
        It demonstrates how multiple text properties work together to create readable content.
      </Text>
      <Text size="sm" weight="medium" align="right" color="success">
        Small medium-weight right-aligned accent text
      </Text>
    </div>
  ),
};

export const AsChild: Story = {
  render: () => (
    <div className="space-y-2">
      <Text asChild size="lg" weight="bold" color="primary">
        <h2>This is an h2 element styled as Text</h2>
      </Text>
      <Text asChild size="sm" color="muted">
        <em>This is an em element styled as Text</em>
      </Text>
      <Text asChild weight="semibold" color="error">
        <strong>This is a strong element styled as Text</strong>
      </Text>
    </div>
  ),
};