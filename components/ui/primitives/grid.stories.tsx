import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from './grid';

const meta: Meta<typeof Grid> = {
  title: 'Primitives/Grid',
  component: Grid,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    cols: {
      control: { type: 'select' },
      options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 'none'],
    },
    rows: {
      control: { type: 'select' },
      options: [1, 2, 3, 4, 5, 6, 'none'],
    },
    gap: {
      control: { type: 'select' },
      options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    gapX: {
      control: { type: 'select' },
      options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    gapY: {
      control: { type: 'select' },
      options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    flow: {
      control: { type: 'select' },
      options: ['row', 'col', 'dense', 'row-dense', 'col-dense'],
    },
    asChild: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const GridItem = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 bg-primary text-primary-foreground rounded text-center ${className}`}>
    {children}
  </div>
);

export const Default: Story = {
  render: (args) => (
    <Grid {...args} className="w-96">
      <GridItem>Item 1</GridItem>
      <GridItem>Item 2</GridItem>
      <GridItem>Item 3</GridItem>
    </Grid>
  ),
};

export const TwoColumns: Story = {
  render: () => (
    <Grid cols={2} gap={4} className="w-96">
      <GridItem>Item 1</GridItem>
      <GridItem>Item 2</GridItem>
      <GridItem>Item 3</GridItem>
      <GridItem>Item 4</GridItem>
    </Grid>
  ),
};

export const ThreeColumns: Story = {
  render: () => (
    <Grid cols={3} gap={4} className="w-96">
      <GridItem>1</GridItem>
      <GridItem>2</GridItem>
      <GridItem>3</GridItem>
      <GridItem>4</GridItem>
      <GridItem>5</GridItem>
      <GridItem>6</GridItem>
    </Grid>
  ),
};

export const FourColumns: Story = {
  render: () => (
    <Grid cols={4} gap={3} className="w-96">
      {Array.from({ length: 8 }, (_, i) => (
        <GridItem key={i}>{i + 1}</GridItem>
      ))}
    </Grid>
  ),
};

export const WithRows: Story = {
  render: () => (
    <Grid cols={3} rows={2} gap={4} className="w-96 h-64">
      <GridItem>1</GridItem>
      <GridItem>2</GridItem>
      <GridItem>3</GridItem>
      <GridItem>4</GridItem>
      <GridItem>5</GridItem>
      <GridItem>6</GridItem>
    </Grid>
  ),
};

export const DifferentGaps: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm mb-4 font-semibold">Gap 0:</p>
        <Grid cols={3} gap={0} className="w-80">
          <GridItem>1</GridItem>
          <GridItem>2</GridItem>
          <GridItem>3</GridItem>
        </Grid>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Gap 2:</p>
        <Grid cols={3} gap={2} className="w-80">
          <GridItem>1</GridItem>
          <GridItem>2</GridItem>
          <GridItem>3</GridItem>
        </Grid>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Gap 6:</p>
        <Grid cols={3} gap={6} className="w-80">
          <GridItem>1</GridItem>
          <GridItem>2</GridItem>
          <GridItem>3</GridItem>
        </Grid>
      </div>
    </div>
  ),
};

export const AsymmetricGaps: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm mb-4 font-semibold">Gap X: 8, Gap Y: 2</p>
        <Grid cols={3} gapX={8} gapY={2} className="w-96">
          {Array.from({ length: 6 }, (_, i) => (
            <GridItem key={i}>{i + 1}</GridItem>
          ))}
        </Grid>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Gap X: 2, Gap Y: 8</p>
        <Grid cols={3} gapX={2} gapY={8} className="w-96">
          {Array.from({ length: 6 }, (_, i) => (
            <GridItem key={i}>{i + 1}</GridItem>
          ))}
        </Grid>
      </div>
    </div>
  ),
};

export const GridFlow: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm mb-4 font-semibold">Flow Row (Default):</p>
        <Grid cols={3} rows={2} flow="row" gap={4} className="w-80">
          {Array.from({ length: 7 }, (_, i) => (
            <GridItem key={i}>{i + 1}</GridItem>
          ))}
        </Grid>
      </div>
      <div>
        <p className="text-sm mb-4 font-semibold">Flow Column:</p>
        <Grid cols={3} rows={2} flow="col" gap={4} className="w-80">
          {Array.from({ length: 7 }, (_, i) => (
            <GridItem key={i}>{i + 1}</GridItem>
          ))}
        </Grid>
      </div>
    </div>
  ),
};

export const ResponsiveGrid: Story = {
  render: () => (
    <Grid 
      cols={1} 
      gap={4} 
      className="w-full max-w-4xl sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <GridItem key={i} className="h-24">
          <div>Item {i + 1}</div>
          <div className="text-xs opacity-70 mt-1">Responsive</div>
        </GridItem>
      ))}
    </Grid>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <Grid cols={3} gap={6} className="w-full max-w-4xl">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Card {i + 1}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This is a card with some content to demonstrate grid layouts.
          </p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">
            Action
          </button>
        </div>
      ))}
    </Grid>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="p-6 border rounded-lg bg-card">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Grid layout example</p>
      </div>
      
      {/* Stats Grid */}
      <Grid cols={4} gap={4}>
        <div className="p-4 border rounded-lg bg-card text-center">
          <div className="text-2xl font-bold text-blue-600">1,234</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </div>
        <div className="p-4 border rounded-lg bg-card text-center">
          <div className="text-2xl font-bold text-green-600">98.5%</div>
          <div className="text-sm text-muted-foreground">Uptime</div>
        </div>
        <div className="p-4 border rounded-lg bg-card text-center">
          <div className="text-2xl font-bold text-purple-600">5.67s</div>
          <div className="text-sm text-muted-foreground">Avg Response</div>
        </div>
        <div className="p-4 border rounded-lg bg-card text-center">
          <div className="text-2xl font-bold text-red-600">12</div>
          <div className="text-sm text-muted-foreground">Issues</div>
        </div>
      </Grid>
      
      {/* Content Grid */}
      <Grid cols={3} gap={6}>
        <div className="col-span-2 p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">Chart Area</h2>
          <div className="h-48 bg-muted rounded flex items-center justify-center">
            <span className="text-muted-foreground">Chart Placeholder</span>
          </div>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="p-2 bg-muted/50 rounded text-sm">
                Activity item {i + 1}
              </div>
            ))}
          </div>
        </div>
      </Grid>
    </div>
  ),
};

export const AsChildExample: Story = {
  render: () => (
    <Grid asChild cols={2} gap={4} className="w-80">
      <section>
        <GridItem>Section Item 1</GridItem>
        <GridItem>Section Item 2</GridItem>
        <GridItem>Section Item 3</GridItem>
        <GridItem>Section Item 4</GridItem>
      </section>
    </Grid>
  ),
};