import React, { useEffect, useState } from 'react';
import { toastError } from '../toasts';

interface ConsumableTransaction {
    consumableName: string;
    transactionQuantity: number;
    issuerName: string;
    transactionDate: string;
    remainingQuantity: number;
}

const ConsumablesHistoryPage: React.FC = () => {
    const [history, setHistory] = useState<ConsumableTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toastError("You are not logged in. Please log in to continue.");
            setError("Authentication error.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumable/history`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Unauthorized access");
                }
                throw new Error(`Failed to fetch consumable history: ${response.statusText}`);
            }

            const data = await response.json();
            if (Array.isArray(data)) {
                setHistory(data);
            } else {
                throw new Error("Unexpected data format from API");
            }
        } catch (error) {
            toastError("Error fetching consumable history");
            console.error("Error fetching consumable history:", error);
            setError("Failed to load history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    if (loading) {
        return <div className="text-center text-lg">Loading history...</div>;
    }

    if (error) {
        return <div className="text-center text-red-600">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-semibold mb-8 text-center text-gray-800">Consumables Transaction History</h2>
            <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Issuer</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Remaining</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-800">{item.consumableName}</td>
                            <td className="px-6 py-4 text-sm text-gray-800">{item.transactionQuantity}</td>
                            <td className="px-6 py-4 text-sm text-gray-800">{item.issuerName}</td>
                            <td className="px-6 py-4 text-sm text-gray-800">{new Date(item.transactionDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-sm text-gray-800">{item.remainingQuantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ConsumablesHistoryPage;
