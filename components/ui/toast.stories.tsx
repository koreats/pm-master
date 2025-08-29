import type { Meta, StoryObj } from '@storybook/react';
import { Toast, ToastProvider, ToastViewport } from './toast';
import { Button } from './button';
import { X } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
        <ToastViewport />
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ToastDemo = ({ variant, size, children }: any) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsVisible(true)}>
        Show {variant || 'default'} Toast
      </Button>
      {isVisible && (
        <div className="fixed bottom-4 right-4">
          <Toast variant={variant} size={size} onOpenChange={setIsVisible}>
            <div className="flex justify-between items-start">
              <div>{children}</div>
              <button
                onClick={() => setIsVisible(false)}
                className="ml-4 text-current hover:text-current/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Toast>
        </div>
      )}
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <ToastDemo>
      <div>
        <div className="font-semibold">Default Toast</div>
        <div className="text-sm opacity-90">This is a default toast message.</div>
      </div>
    </ToastDemo>
  ),
};

export const Success: Story = {
  render: () => (
    <ToastDemo variant="success">
      <div>
        <div className="font-semibold">Success</div>
        <div className="text-sm opacity-90">Your action was completed successfully.</div>
      </div>
    </ToastDemo>
  ),
};

export const Destructive: Story = {
  render: () => (
    <ToastDemo variant="destructive">
      <div>
        <div className="font-semibold">Error</div>
        <div className="text-sm opacity-90">Something went wrong. Please try again.</div>
      </div>
    </ToastDemo>
  ),
};

export const Warning: Story = {
  render: () => (
    <ToastDemo variant="warning">
      <div>
        <div className="font-semibold">Warning</div>
        <div className="text-sm opacity-90">Please check your input and try again.</div>
      </div>
    </ToastDemo>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <ToastDemo variant="default" size="sm">
      <div>
        <div className="font-semibold text-sm">Small Toast</div>
        <div className="text-xs opacity-90">This is a small toast message.</div>
      </div>
    </ToastDemo>
  ),
};

export const LargeSize: Story = {
  render: () => (
    <ToastDemo variant="default" size="lg">
      <div>
        <div className="font-semibold">Large Toast</div>
        <div className="text-sm opacity-90">
          This is a large toast message with more space for content.
        </div>
      </div>
    </ToastDemo>
  ),
};

export const SimpleMessage: Story = {
  render: () => (
    <ToastDemo>
      <div className="text-sm">Simple toast message without title.</div>
    </ToastDemo>
  ),
};

export const WithAction: Story = {
  render: () => (
    <ToastDemo>
      <div className="flex justify-between items-center">
        <div>
          <div className="font-semibold">File uploaded</div>
          <div className="text-sm opacity-90">Your file has been uploaded successfully.</div>
        </div>
        <Button variant="outline" size="sm" className="ml-4">
          View
        </Button>
      </div>
    </ToastDemo>
  ),
};

export const AllVariants: Story = {
  render: () => {
    const [toasts, setToasts] = useState<Array<{ id: number; variant: string; visible: boolean }>>([]);

    const showToast = (variant: string) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, variant, visible: true }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    return (
      <div className="space-y-2">
        <Button onClick={() => showToast('default')} variant="outline" className="w-full">
          Default Toast
        </Button>
        <Button onClick={() => showToast('success')} variant="outline" className="w-full">
          Success Toast
        </Button>
        <Button onClick={() => showToast('destructive')} variant="outline" className="w-full">
          Error Toast
        </Button>
        <Button onClick={() => showToast('warning')} variant="outline" className="w-full">
          Warning Toast
        </Button>
        
        {toasts.map((toast) => (
          <div key={toast.id} className="fixed bottom-4 right-4" style={{ bottom: `${4 + (toasts.indexOf(toast) * 80)}px` }}>
            <Toast variant={toast.variant as any}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{toast.variant.charAt(0).toUpperCase() + toast.variant.slice(1)}</div>
                  <div className="text-sm opacity-90">This is a {toast.variant} toast message.</div>
                </div>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="ml-4 text-current hover:text-current/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Toast>
          </div>
        ))}
      </div>
    );
  },
};