import React, { useEffect, useState } from 'react';
import { toastError } from '../toasts';
import TransactionDeleteModal from '../components/TransactionDeleteModal';

interface CreditTransaction {
    _id: string;
    consumableName: string;
    transactionQuantity: number;
    categoryFields?: { [key: string]: any };
    addedBy: string;
    transactionDate: string;
    transactionType: 'ADD';
    isDeleted?: boolean;
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
    transactionType: 'ISSUE';
    isDeleted?: boolean;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
    </div>
);

const ConsumableHistory: React.FC = () => {
    const [history, setHistory] = useState<(CreditTransaction | DebitTransaction)[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreditHistory, setIsCreditHistory] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<CreditTransaction | DebitTransaction | null>(null);

    const sortByDateTime = (transactions: (CreditTransaction | DebitTransaction)[]) => {
        return [...transactions].sort((a, b) => 
            new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
    };

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);

        const url = isCreditHistory
            ? `${import.meta.env.VITE_BACKEND_URL}/history/add`
            : `${import.meta.env.VITE_BACKEND_URL}/history/issue`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Unauthorized access");
                }
                throw new Error(`Failed to fetch ${isCreditHistory ? 'credit' : 'debit'} history: ${response.statusText}`);
            }

            const data = await response.json();
            if (Array.isArray(data)) {
                setHistory(data.map(item => ({ ...item, isDeleted: false })));
            } else {
                throw new Error("Unexpected data format from API");
            }
        } catch (error) {
            toastError(`Error fetching ${isCreditHistory ? 'credit' : 'debit'} history`);
            setError("Failed to load history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [isCreditHistory]);

    const toggleHistoryType = () => {
        setIsCreditHistory(!isCreditHistory);
    };

    const handleDelete = (transaction: CreditTransaction | DebitTransaction) => {
        setSelectedTransaction(transaction);
        setIsDeleteModalOpen(true);
    };

    const handleTransactionDeleted = async () => {
        setIsDeleteModalOpen(false);
        if (selectedTransaction) {
            setHistory(prevHistory => {
                const updatedHistory = prevHistory.map(item =>
                    item._id === selectedTransaction._id
                        ? { ...item, isDeleted: true }
                        : item
                );
                // Sort after updating deletion status
                return sortByDateTime(updatedHistory);
            });
        }
        setSelectedTransaction(null);
    };


    const renderCategoryFields = (fields?: { [key: string]: any }) => {
        if (!fields || Object.keys(fields).length === 0) return <div>N/A</div>;
        return (
            <div>
                {Object.entries(fields).map(([key, value]) => (
                    <div key={`${key}-${value}`}>
                        <strong>{key}:</strong> {value}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
                {isCreditHistory ? 'Credit Transaction History' : 'Debit Transaction History'}
            </h2>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
                <button
                    onClick={toggleHistoryType}
                    className={`px-4 py-2 flex items-center bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={loading}
                >
                    {loading && <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white"></span>}
                    Show {isCreditHistory ? 'Debit' : 'Credit'} History
                </button>
            </div>
            {loading ? (
                <LoadingSpinner />
            ) : error ? (
                <div className="text-center text-red-600">{error}</div>
            ) : history.length === 0 ? (
                <div className="text-center text-gray-600 flex flex-col items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-gray-400 mb-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M3 4a2 2 0 012-2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V4z" />
                    </svg>
                    No transactions found.
                </div>
            ) : (
                <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
                  <thead className="bg-gray-100 border-b">
    <tr>
        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
            {isCreditHistory ? 'Consumable Added' : 'Consumable Issued'}
        </th>
        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
            Consumable Details
        </th>
        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
            {isCreditHistory ? 'Quantity Added' : 'Issued Quantity'}
        </th>
        {!isCreditHistory && (
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Reference Number
            </th>
        )}
        {isCreditHistory ? (
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Added By
            </th>
        ) : (
            <>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Issued To
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Issued By
                </th>
            </>
        )}
        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
            Date
        </th>
        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
            Actions
        </th>
    </tr>
</thead>
<tbody>
    {history.map((item, index) => (
        <tr 
            key={index} 
            className={`
                transition-colors 
                ${item.isDeleted 
                    ? 'bg-red-100 hover:bg-red-200' 
                    : index % 2 === 0  // Use even/odd for alternating colors
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                }
            `}
        >
            <td className="px-6 py-4 text-sm text-gray-800">
                {item.consumableName}
            </td>
            <td className="px-6 py-4 text-sm text-gray-800">
                {renderCategoryFields(item.categoryFields)}
            </td>
            <td className="px-6 py-4 text-sm text-gray-800">
                {item.transactionQuantity}
            </td>
            {!isCreditHistory && (
                <td className="px-6 py-4 text-sm text-gray-800">
                    {(item as DebitTransaction).referenceNumber}
                </td>
            )}
            {isCreditHistory ? (
                <td className="px-6 py-4 text-sm text-gray-800">
                    {(item as CreditTransaction).addedBy}
                </td>
            ) : (
                <>
                    <td className="px-6 py-4 text-sm text-gray-800">
                        {(item as DebitTransaction).issuedToName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                        {(item as DebitTransaction).issuedByName}
                    </td>
                </>
            )}
            <td className="px-6 py-4 text-sm text-gray-800">
                {new Date(item.transactionDate).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}
            </td>
            <td className="px-6 py-4 text-sm text-gray-800 flex space-x-2">
                {!item.isDeleted && (
                    <button
                        onClick={() => handleDelete(item)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                        Delete
                    </button>
                )}
                {item.isDeleted && (
                    <span className="text-red-600 font-medium">Deleted</span>
                )}
            </td>
        </tr>
    ))}
</tbody>
                </table>
            )}
            {selectedTransaction && (
                <TransactionDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    transaction={selectedTransaction}
                    onTransactionDeleted={handleTransactionDeleted}
                />
            )}
        </div>
    );
};

export default ConsumableHistory;
