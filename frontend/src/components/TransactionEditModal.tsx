import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Label, TextInput } from 'flowbite-react';
import { HiPencilAlt } from 'react-icons/hi';
import { toastSuccess } from '../toasts';

interface TransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    _id: string;
    consumableName: string;
    transactionQuantity: number;
    transactionType: 'ADD' | 'ISSUE';
    transactionDate: string;
    entryReferenceNumber?: string;
    referenceNumber?: string;
    categoryFields?: { [key: string]: any };
    addedBy?: string;
    issuedByName?: string;
    issuedToName?: string;
  };
  onTransactionUpdated: () => void;
}

const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    transactionQuantity: transaction.transactionQuantity,
    entryReferenceNumber: transaction.entryReferenceNumber || '',
    referenceNumber: transaction.referenceNumber || '',
  });
  
  // Reset form data when transaction changes
  useEffect(() => {
    setFormData({
      transactionQuantity: transaction.transactionQuantity,
      entryReferenceNumber: transaction.entryReferenceNumber || '',
      referenceNumber: transaction.referenceNumber || '',
    });
    setError(null);
  }, [transaction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'transactionQuantity' ? Number(value) : value
    }));
  };

  const validateForm = () => {
    if (formData.transactionQuantity <= 0) {
      setError('Quantity must be greater than zero');
      return false;
    }
    
    if (transaction.transactionType === 'ADD' && !formData.entryReferenceNumber) {
      setError('Entry reference number is required for ADD transactions');
      return false;
    }
    
    if (transaction.transactionType === 'ISSUE' && !formData.referenceNumber) {
      setError('Reference number is required for ISSUE transactions');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    const requestData = {
      _id: transaction._id,
      transactionQuantity: formData.transactionQuantity,
      entryReferenceNumber: formData.entryReferenceNumber,
      referenceNumber: formData.referenceNumber,
      transactionType: transaction.transactionType
      // Date field removed from the request
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumable/transaction/edit`, {
        method: 'PUT',
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

      toastSuccess(`Transaction for ${transaction.consumableName} updated successfully`);
      onTransactionUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError((error as Error).message || 'Failed to update transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md" popup>
      <Modal.Header>
        <div className="text-xl font-medium text-gray-900 dark:text-white">
          Edit Transaction
        </div>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-gray-900 font-medium">
            {transaction.consumableName}
          </div>
          
          <div className="mb-2 text-sm text-gray-600">
            <p className="mb-2">Transaction Type: <span className="font-medium">{transaction.transactionType}</span></p>
            {transaction.transactionType === 'ADD' && 
              <p>Added By: <span className="font-medium">{transaction.addedBy}</span></p>
            }
            {transaction.transactionType === 'ISSUE' && (
              <>
                <p>Issued By: <span className="font-medium">{transaction.issuedByName}</span></p>
                <p>Issued To: <span className="font-medium">{transaction.issuedToName}</span></p>
              </>
            )}
          </div>

          {error && (
            <div className="p-4 text-sm text-red-800 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <div className="mb-2 block">
              <Label htmlFor="transactionQuantity" value="Quantity" />
            </div>
            <TextInput
              id="transactionQuantity"
              name="transactionQuantity"
              type="number"
              min="1"
              required
              value={formData.transactionQuantity}
              onChange={handleChange}
            />
          </div>

          {/* Date/time field removed */}

          {transaction.transactionType === 'ADD' && (
            <div>
              <div className="mb-2 block">
                <Label htmlFor="entryReferenceNumber" value="Entry Reference Number" />
              </div>
              <TextInput
                id="entryReferenceNumber"
                name="entryReferenceNumber"
                required
                value={formData.entryReferenceNumber}
                onChange={handleChange}
              />
            </div>
          )}

          {transaction.transactionType === 'ISSUE' && (
            <div>
              <div className="mb-2 block">
                <Label htmlFor="referenceNumber" value="Reference Number" />
              </div>
              <TextInput
                id="referenceNumber"
                name="referenceNumber"
                required
                value={formData.referenceNumber}
                onChange={handleChange}
              />
            </div>
          )}

          {transaction.categoryFields && Object.keys(transaction.categoryFields).length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Category Fields:</p>
              {Object.entries(transaction.categoryFields).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium">{key}:</span> {value}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between gap-4 mt-6">
            <Button
              color="blue"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-3">
                    <Spinner size="sm" light={true} />
                  </div>
                  Updating...
                </>
              ) : (
                <>
                  <HiPencilAlt className="mr-2 h-5 w-5" />
                  Update
                </>
              )}
            </Button>
            <Button
              color="gray"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default TransactionEditModal;
