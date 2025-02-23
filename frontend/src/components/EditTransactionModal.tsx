import React, { useState } from 'react';
import { Modal, Button, TextInput } from 'flowbite-react';
import { toastError, toastSuccess } from '../toasts';

interface CreditTransaction {
  _id: string;
  consumableName: string;
  transactionQuantity: number;
  categoryFields?: { [key: string]: any };
  addedBy: string;
  transactionDate: string;
}

interface DebitTransaction {
  _id: string;
  referenceNumber: string;
  consumableName: string;
  transactionQuantity: number;
  categoryFields?: { [key: string]: any };
  issuedToName: string;
  issuedByName: string;
  transactionDate: string;
  remainingQuantity: number;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: CreditTransaction | DebitTransaction;
  isCreditTransaction: boolean;
  onTransactionUpdate: () => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdate,
}) => {
  const [transactionQuantity, setTransactionQuantity] = useState(transaction.transactionQuantity);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (transactionQuantity <= 0) {
      toastError('Quantity must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const endpoint = `${import.meta.env.VITE_BACKEND_URL}/consumable/transaction/edit`;

      const updatedTransaction = {
        _id: transaction._id,
        consumableName: transaction.consumableName,
        transactionQuantity: Number(transactionQuantity),
        oldQuantity: transaction.transactionQuantity,
      };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedTransaction),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update transaction');
      }

      toastSuccess('Transaction updated successfully');
      onTransactionUpdate();
      onClose();
    } catch (error) {
      toastError((error as Error).message || 'Error updating transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      <Modal.Header>Edit Transaction Quantity</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Consumable Name
            </label>
            <TextInput
              value={transaction.consumableName}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <TextInput
              type="number"
              value={transactionQuantity}
              onChange={(e) => setTransactionQuantity(Number(e.target.value))}
              placeholder="Enter Quantity"
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button color="gray" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditTransactionModal;
