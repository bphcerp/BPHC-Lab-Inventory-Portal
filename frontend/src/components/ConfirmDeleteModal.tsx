import React, { useState } from 'react';
import { Modal, Button } from 'flowbite-react';
import { toastError, toastSuccess } from '../toasts';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string; // Changed from itemName to itemId
  itemName: string; // Keep this for display purposes
  deleteEndpoint: string;
  onItemDeleted: (id: string) => void; // Changed parameter type to string
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
      // Proceed with deletion
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/${deleteEndpoint}/${itemId}`, // Use itemId here
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete item');
      }

      onItemDeleted(itemId); // Pass itemId
      toastSuccess(`"${itemName}" deleted successfully`);
      onClose();
    } catch (error) {
      const errorMessage = (error as Error).message || 'Error deleting item';
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
        <p>Are you sure you want to delete "{itemName}"?</p>
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
