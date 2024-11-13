import { Modal, Spinner } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { toastError } from '../toasts';

interface Transaction {
  _id: string;
  consumableName: string;
  transactionQuantity: number;
  transactionDate: string;
  remainingQuantity: number;
  addedBy?: { _id: string; name: string };
  issuedBy?: { _id: string; name: string };
  issuedTo?: { _id: string; name: string };
}

interface PersonTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: {
    _id: string;
    name: string;
  } | null;
}

const PersonTransactionsModal = ({ isOpen, onClose, person }: PersonTransactionsModalProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && person) {
      fetchTransactions();
    }
  }, [isOpen, person]);

  const fetchTransactions = async () => {
    if (!person) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/transactions/person/${person._id}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toastError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.addedBy?._id === person?._id) {
      return `Added ${transaction.remainingQuantity} ${transaction.consumableName}`;
    } else if (transaction.issuedBy?._id === person?._id) {
      return `Issued ${transaction.transactionQuantity} ${transaction.consumableName} to ${transaction.issuedTo?.name}`;
    } else if (transaction.issuedTo?._id === person?._id) {
      return `Received ${transaction.transactionQuantity} ${transaction.consumableName} from ${transaction.issuedBy?.name}`;
    }
    return `Involved in transaction of ${transaction.transactionQuantity} ${transaction.consumableName}`;
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="xl">
      <Modal.Header>
        Transactions for {person?.name}
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
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getTransactionDescription(transaction)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      No transactions found for this person.
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

export default PersonTransactionsModal;
