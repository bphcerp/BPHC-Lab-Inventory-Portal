import React, { useState, useEffect } from 'react';
import { Modal, Spinner } from 'flowbite-react';

interface Consumable {
  _id: string;
  consumableName: string;
  quantity: number;
  date: string;
  categoryFields: Record<string, any>;
}

interface VendorStats {
  totalTransactions: number;
  uniqueItems: number;
  mostRecentTransaction: string;
  oldestTransaction: string;
}

interface VendorDetailsModalProps {
  vendorName: string;
  isOpen: boolean;
  onClose: () => void;
}

const VendorDetailsModal: React.FC<VendorDetailsModalProps> = ({
  vendorName,
  isOpen,
  onClose,
}) => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && vendorName) {
      fetchVendorDetails();
    }
  }, [isOpen, vendorName]);

  const fetchVendorDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/vendorTransactions/${encodeURIComponent(vendorName)}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch vendor details');
      }

      const data = await response.json();
      setConsumables(data.consumables);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vendor details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="7xl">
      <Modal.Header>Details for Vendor: {vendorName}</Modal.Header>
      <Modal.Body>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? (
          <div className="flex justify-center">
            <Spinner size="xl" />
          </div>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800">Total Transactions</h3>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalTransactions}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800">Unique Items</h3>
                  <p className="text-2xl font-bold text-green-900">{stats.uniqueItems}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-800">Most Recent</h3>
                  <p className="text-lg font-bold text-purple-900">
                    {new Date(stats.mostRecentTransaction).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-800">First Transaction</h3>
                  <p className="text-lg font-bold text-orange-900">
                    {new Date(stats.oldestTransaction).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full border divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consumable Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category Fields
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consumables.map((consumable) => (
                    <tr key={consumable._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{consumable.consumableName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{consumable.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(consumable.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {Object.entries(consumable.categoryFields).map(([key, value]) => (
                          <p key={key}>
                            <strong>{key}:</strong> {value}
                          </p>
                        ))}
                      </td>
                    </tr>
                  ))}
                  {consumables.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No consumables found for this vendor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={onClose}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default VendorDetailsModal;
