import type { Meta, StoryObj } from '@storybook/react';
import { Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalClose } from './modal';
import { Button } from './button';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="outline">Open Modal</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Modal Title</ModalTitle>
          <ModalDescription>
            This is a modal description that provides context about the modal content.
          </ModalDescription>
        </ModalHeader>
        <div className="py-4">
          <p>This is the main content area of the modal.</p>
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Cancel</Button>
          </ModalClose>
          <Button>Confirm</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="outline">Small Modal</Button>
      </ModalTrigger>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Small Modal</ModalTitle>
          <ModalDescription>
            This is a small modal for simple confirmations.
          </ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline" size="sm">Cancel</Button>
          </ModalClose>
          <Button size="sm">Confirm</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

export const LargeSize: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="outline">Large Modal</Button>
      </ModalTrigger>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>Large Modal</ModalTitle>
          <ModalDescription>
            This is a large modal with more content space.
          </ModalDescription>
        </ModalHeader>
        <div className="py-6">
          <p className="mb-4">This modal has more space for content.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded">Left content</div>
            <div className="p-4 bg-muted rounded">Right content</div>
          </div>
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Cancel</Button>
          </ModalClose>
          <Button>Save Changes</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

export const ExtraLargeSize: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="outline">Extra Large Modal</Button>
      </ModalTrigger>
      <ModalContent size="xl">
        <ModalHeader>
          <ModalTitle>Extra Large Modal</ModalTitle>
          <ModalDescription>
            This is an extra large modal for complex forms or detailed content.
          </ModalDescription>
        </ModalHeader>
        <div className="py-6 space-y-4">
          <p>This modal provides maximum space for complex content.</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded">Column 1</div>
            <div className="p-4 bg-muted rounded">Column 2</div>
            <div className="p-4 bg-muted rounded">Column 3</div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold">Left Section</h4>
              <p className="text-sm text-muted-foreground">
                Detailed information and controls can be placed here.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Right Section</h4>
              <p className="text-sm text-muted-foreground">
                Additional content and options are available in this section.
              </p>
            </div>
          </div>
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Cancel</Button>
          </ModalClose>
          <Button variant="destructive">Delete</Button>
          <Button>Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

export const FullScreenSize: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="outline">Full Screen Modal</Button>
      </ModalTrigger>
      <ModalContent size="full">
        <ModalHeader>
          <ModalTitle>Full Screen Modal</ModalTitle>
          <ModalDescription>
            This modal takes up almost the full screen for immersive experiences.
          </ModalDescription>
        </ModalHeader>
        <div className="flex-1 py-6">
          <p className="mb-6">This modal provides maximum screen space.</p>
          <div className="grid grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="p-6 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Section {i + 1}</h4>
                <p className="text-sm text-muted-foreground">
                  Content for section {i + 1} with detailed information.
                </p>
              </div>
            ))}
          </div>
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Close</Button>
          </ModalClose>
          <Button>Apply</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

export const WithoutDescription: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="outline">Simple Modal</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Simple Modal</ModalTitle>
        </ModalHeader>
        <div className="py-4">
          <p>This modal doesn't have a description, just a title.</p>
        </div>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Close</Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};

export const DestructiveAction: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="destructive">Delete Item</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Delete Item</ModalTitle>
          <ModalDescription>
            Are you sure you want to delete this item? This action cannot be undone.
          </ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Cancel</Button>
          </ModalClose>
          <Button variant="destructive">Delete</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};