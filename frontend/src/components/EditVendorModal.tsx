import React, { useState } from 'react';
import { Modal, Button, TextInput } from 'flowbite-react';
import { toastError, toastSuccess } from '../toasts';

interface Vendor {
  vendorId: string; // Add vendorId to the Vendor interface
  name: string;
  email: string;
  phone: string;
}

interface EditVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onVendorUpdate: (updatedVendor: Vendor) => void;
}

const EditVendorModal: React.FC<EditVendorModalProps> = ({
  isOpen,
  onClose,
  vendor,
  onVendorUpdate,
}) => {
  const [name, setName] = useState(vendor.name);
  const [email, setEmail] = useState(vendor.email);
  const [phone, setPhone] = useState(vendor.phone);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/vendor/${vendor.vendorId}`, // Use vendorId here
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ name, email, phone }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update vendor');
      }

      const updatedVendor = await response.json();
      onVendorUpdate(updatedVendor);
      toastSuccess('Vendor updated successfully');
      onClose();
    } catch (error) {
      toastError((error as Error).message || 'Error updating vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Edit Vendor</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <TextInput
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vendor Name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <TextInput
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Vendor Email"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <TextInput
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Vendor Phone"
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
        <Button color="gray" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditVendorModal;
