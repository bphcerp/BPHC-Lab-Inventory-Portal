import React, { useState } from 'react';
import { Modal, Label, TextInput, Button } from 'flowbite-react';
import { toastSuccess, toastError } from '../toasts';

interface EditVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  onVendorUpdate: (updatedVendor: { _id: string; name: string; email: string; phone: string }) => void;
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
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor/${vendor._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, phone }),
      });
      if (response.ok) {
        const updatedVendor = await response.json();
        onVendorUpdate(updatedVendor);
        toastSuccess('Vendor updated successfully');
        onClose();
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to update vendor');
        toastError(error.message || 'Failed to update vendor');
      }
    } catch (error) {
      setError('An error occurred while updating the vendor');
      toastError('An error occurred while updating the vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Edit Vendor</Modal.Header>
      <Modal.Body>
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <TextInput
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <TextInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <TextInput
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-red-500">{error}</div>}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button color="blue" onClick={handleSave} disabled={loading} isProcessing={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
        <Button color="gray" onClick={onClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditVendorModal;
