import React, { useState, useEffect } from 'react';
import { Modal, Spinner } from 'flowbite-react';
import { toastError } from '../toasts';
import { Consumable } from '../pages/Dashboard';

interface Transaction {
  _id: string;
  consumableName: string;
  transactionQuantity: number;
  remainingQuantity: number;
  transactionType: 'ADD' | 'UPDATE' | 'ISSUE';
  transactionDate: string;
  addedBy?: { _id: string; name: string };
  issuedBy?: { _id: string; name: string };
  issuedTo?: { _id: string; name: string };
  categoryFields?: Record<string, any>;
}

interface ConsumableDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumable: Consumable | null;
}

const ConsumableDetailsModal: React.FC<ConsumableDetailsModalProps> = ({
  isOpen,
  onClose,
  consumable
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && consumable) {
      fetchTransactions();
    }
  }, [isOpen, consumable]);

  const fetchTransactions = async () => {
    if (!consumable) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        consumableName: consumable.consumableName,
        categoryFields: JSON.stringify(consumable.categoryFields || {})
      });

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/consumable-details?${queryParams}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      // Sort transactions by date in descending order (most recent first)
      const sortedTransactions = [...data].sort((a, b) => 
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toastError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeDisplay = (transaction: Transaction) => {
    switch (transaction.transactionType) {
      case 'ADD':
        return {
          text: 'ADDED',
          className: 'bg-green-100 text-green-800'
        };
      case 'ISSUE':
        return {
          text: `ISSUED TO ${transaction.issuedTo?.name}`,
          className: 'bg-yellow-100 text-yellow-800'
        };
      case 'UPDATE':
        return {
          text: 'UPDATED',
          className: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          text: transaction.transactionType,
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const getTransactionDescription = (transaction: Transaction) => {
    switch (transaction.transactionType) {
      case 'ADD':
        return `Added ${transaction.transactionQuantity} units by ${transaction.addedBy?.name}`;
      case 'UPDATE':
        return `Updated quantity to ${transaction.remainingQuantity} units by ${transaction.addedBy?.name}`;
      case 'ISSUE':
        return `${transaction.issuedBy?.name} issued ${transaction.transactionQuantity} units to ${transaction.issuedTo?.name}`;
      default:
        return 'Unknown transaction type';
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="7xl">
      <Modal.Header>
        Transaction History for {consumable?.consumableName}
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="xl" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => {
                  const { text, className } = getTransactionTypeDisplay(transaction);
                  return (
                    <tr key={transaction._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-md text-sm font-medium ${className}`}>
                          {text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {getTransactionDescription(transaction)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.transactionQuantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.remainingQuantity}
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No transaction history found for this consumable.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ConsumableDetailsModal;
