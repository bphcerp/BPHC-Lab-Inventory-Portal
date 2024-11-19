import React, { useEffect, useState } from 'react';
import { toastError } from '../toasts';

interface CreditTransaction {
    consumableName: string;
    transactionQuantity: number;
    categoryFields?: { [key: string]: any };
    addedBy: string;
    transactionDate: string;
}

interface DebitTransaction {
    referenceNumber: string;
    consumableName: string;
    transactionQuantity: number;
    categoryFields?: { [key: string]: any };
    issuedToName: string;
    issuedByName: string;
    transactionDate: string;
    remainingQuantity: number;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
    </div>
);

const ConsumableHistory: React.FC = () => {
    const [history, setHistory] = useState<CreditTransaction[] | DebitTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreditHistory, setIsCreditHistory] = useState(true);

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
                setHistory(data);
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
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                                {isCreditHistory ? 'Consumable Added' : 'Consumable Issued'}
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Consumable Details</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                                {isCreditHistory ? 'Quantity Added' : 'Issued Quantity'}
                            </th>
                            {isCreditHistory ? (
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Added By</th>
                            ) : (
                                <>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Issued To</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Issued By</th>
                                </>
                            )}
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                            {!isCreditHistory && (
                                <>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                                        Remaining Quantity
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                                        Reference Number
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-800">
                                    {isCreditHistory
                                        ? (item as CreditTransaction).consumableName
                                        : (item as DebitTransaction).consumableName}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-800">
                                    {isCreditHistory
                                        ? renderCategoryFields((item as CreditTransaction).categoryFields)
                                        : renderCategoryFields((item as DebitTransaction).categoryFields)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-800">
                                    {isCreditHistory
                                        ? (item as CreditTransaction).transactionQuantity
                                        : (item as DebitTransaction).transactionQuantity}
                                </td>
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
                                    {new Date(
                                        isCreditHistory
                                            ? (item as CreditTransaction).transactionDate
                                            : (item as DebitTransaction).transactionDate
                                    ).toLocaleDateString()}
                                </td>
                                {!isCreditHistory && (
                                    <>
                                        <td className="px-6 py-4 text-sm text-gray-800">
                                            {(item as DebitTransaction).remainingQuantity}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-800">
                                            {(item as DebitTransaction).referenceNumber}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ConsumableHistory;
