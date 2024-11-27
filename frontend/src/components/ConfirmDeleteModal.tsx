import React, { useState } from 'react';
import { Modal, Button } from 'flowbite-react';
import { toastError, toastSuccess } from '../toasts';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  deleteEndpoint: string;
  onItemDeleted: (id: string) => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  itemId,
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
      // Check if the vendor has transactions
      const transactionCheckResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/vendorTransactions/${itemName}`,
        { credentials: 'include' }
      );

      if (transactionCheckResponse.ok) {
        const data = await transactionCheckResponse.json();
        if (data.consumables && data.consumables.length > 0) {
          throw new Error('Vendor has transactions and cannot be deleted');
        }
      } else {
        throw new Error('Failed to check vendor transactions');
      }

      // Proceed with deletion
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/${deleteEndpoint}/${itemId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete vendor');
      }

      onItemDeleted(itemId);
      toastSuccess('Vendor deleted successfully');
      onClose();
    } catch (error) {
      // Use the `message` property of the Error object
      const errorMessage = (error as Error).message || 'Error deleting vendor';
      setError(errorMessage);
      toastError(errorMessage); // Pass the string message here
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

export default ConfirmDeleteModal;
