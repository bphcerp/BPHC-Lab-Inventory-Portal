import React, { useState } from 'react';
import { Modal, Button } from 'flowbite-react';
import { toastError, toastSuccess } from '../toasts';

interface ConfirmVendorDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string; // Vendor name instead of ID
  deleteEndpoint: string;
  onItemDeleted: (name: string) => void;
}

const ConfirmVendorDeleteModal: React.FC<ConfirmVendorDeleteModalProps> = ({
  isOpen,
  onClose,
  itemName,
  deleteEndpoint,
  onItemDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      // Proceed with deletion
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/${deleteEndpoint}/${itemName}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete vendor');
      }

      onItemDeleted(itemName);
      toastSuccess(`Vendor "${itemName}" deleted successfully`);
      onClose();
    } catch (error) {
      const errorMessage = (error as Error).message || 'Error deleting vendor';
      setError(errorMessage);
      toastError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Confirm Deletion</Modal.Header>
      <Modal.Body>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <p>Are you sure you want to delete the vendor "{itemName}"?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleDelete} disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
        <Button color="gray" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmVendorDeleteModal;
