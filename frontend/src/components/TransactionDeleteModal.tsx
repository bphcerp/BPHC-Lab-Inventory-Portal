import React, { useState } from 'react';
import { Modal, Button, Spinner } from 'flowbite-react';
import { HiExclamation } from 'react-icons/hi';
import { toastSuccess } from '../toasts';

interface TransactionDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    _id: string;
    consumableName: string;
    transactionQuantity: number;
    transactionType: 'ADD' | 'ISSUE';
  };
  onTransactionDeleted: () => void;
}

const TransactionDeleteModal: React.FC<TransactionDeleteModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onTransactionDeleted,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    const requestData = {
      _id: transaction._id,
      consumableName: transaction.consumableName,
      transactionQuantity: transaction.transactionQuantity,
      transactionType: transaction.transactionType
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumable/transaction/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message;
        } catch {
          const textError = await response.text();
          errorMessage = textError || `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Show success toast, close modal and refresh data
      toastSuccess(`Transaction for ${transaction.consumableName} deleted successfully`);
      onTransactionDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      // Only show error in the modal, don't use toast
      setError((error as Error).message || 'Failed to delete transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md" popup>
      <Modal.Header />
      <Modal.Body>
        <div className="text-center">
          <HiExclamation className="mx-auto mb-4 h-14 w-14 text-yellow-400" />
          <h3 className="mb-5 text-lg font-normal text-gray-500">
            Are you sure you want to delete this transaction for{' '}
            <span className="font-medium text-gray-900">{transaction.consumableName}</span>?
          </h3>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-800 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-5 text-sm text-gray-600">
            <p className="mb-2">Transaction Details:</p>
            <ul className="list-disc text-left ml-6">
              <li>Transaction Type: {transaction.transactionType}</li>
              <li>Quantity: {transaction.transactionQuantity}</li>
              <li>ID: {transaction._id}</li>
            </ul>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              color="failure"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-3">
                    <Spinner size="sm" light={true} />
                  </div>
                  Deleting...
                </>
              ) : (
                'Yes, delete'
              )}
            </Button>
            <Button
              color="gray"
              onClick={onClose}
              disabled={isLoading}
            >
              No, cancel
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default TransactionDeleteModal;
