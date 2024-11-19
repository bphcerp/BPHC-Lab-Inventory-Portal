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
  categoryFields?: { [key: string]: any }; // Dynamic key-value pairs for fields
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
  const getTransactionType = (transaction: Transaction) => {
    if (transaction.addedBy?._id === person?._id) return 'ADDED';
    if (transaction.issuedBy?._id === person?._id) return `ISSUED TO ${transaction.issuedTo?.name}`;
    if (transaction.issuedTo?._id === person?._id) return `ISSUED FROM ${transaction.issuedBy?.name}`;
    return 'UNKNOWN';
  };

  const getTransactionTypeStyles = (transactionType: string) => {
    switch (transactionType) {
      case 'ADDED':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const renderCategoryFields = (fields: { [key: string]: any } = {}) => {
    if (Object.keys(fields).length === 0) {
      return <span className="italic text-gray-400">No category fields</span>;
    }

    return Object.entries(fields).map(([key, value]) => (
      <div key={`${key}-${value}`}>
        <strong>{key}:</strong> {value}
      </div>
    ));
  };

return (
  <Modal show={isOpen} onClose={onClose} size="full">
    <Modal.Header>Transactions for {person?.name}</Modal.Header>
    <Modal.Body>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner size="xl" />
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full table-auto divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consumable Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category Fields
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => {
                const transactionType = getTransactionType(transaction);

                return (
                  <tr key={transaction._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full font-semibold ${getTransactionTypeStyles(transactionType)}`}
                      >
                        {transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.transactionQuantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.consumableName || <span className="italic text-gray-400">Unknown</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {renderCategoryFields(transaction.categoryFields)}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
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
