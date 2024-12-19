import React, { useState } from 'react';
import { Modal, Button } from 'flowbite-react';
import { toastError, toastSuccess } from '../toasts';

interface DeleteConsumableCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  onCategoryDeleted: (id: string) => void;
}

const DeleteConsumableCategoryModal: React.FC<DeleteConsumableCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  onCategoryDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if the category is being used in any transactions
      // const transactionCheckResponse = await fetch(
      //   `${import.meta.env.VITE_BACKEND_URL}/category/${categoryId}`,
      //   { credentials: 'include' }
      // );

      // if (transactionCheckResponse.ok) {
      //   const data = await transactionCheckResponse.json();
      //   if (data.hasTransactions) {
      //     throw new Error('Category is in use and cannot be deleted');
      //   }
      // }

      // Proceed with deletion if no transactions found
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/category/${categoryId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }

      onCategoryDeleted(categoryId);
      toastSuccess('Category deleted successfully');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error deleting category';
      setError(errorMessage);
      toastError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Delete Category</Modal.Header>
      <Modal.Body>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <p>Are you sure you want to delete the category "{categoryName}"?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          color="failure" 
          onClick={handleDelete} 
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
        <Button 
          color="gray" 
          onClick={onClose} 
          disabled={loading}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConsumableCategoryModal;
