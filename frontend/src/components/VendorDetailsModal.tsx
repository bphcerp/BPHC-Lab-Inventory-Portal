import React, { useState, useEffect } from 'react';
import { Modal, Spinner } from 'flowbite-react';

interface Consumable {
  _id: string;
  consumableName: string;
  quantity: number;
  date: string;
  categoryFields: Record<string, any>;
}

interface VendorDetailsModalProps {
  vendorName: string;
  isOpen: boolean;
  onClose: () => void;
  consumables?: Consumable[]; // Add the consumables prop here, making it optional
}

const VendorDetailsModal: React.FC<VendorDetailsModalProps> = ({
  vendorName,
  isOpen,
  onClose,
  consumables: initialConsumables, // Rename to avoid conflict with state variable
}) => {
  const [consumables, setConsumables] = useState<Consumable[]>(initialConsumables || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If initialConsumables is provided, use those instead of fetching
    if (initialConsumables && initialConsumables.length > 0) {
      setConsumables(initialConsumables);
      return;
    }
    
    // Otherwise, fetch from the API as before
    if (isOpen && vendorName) {
      fetchVendorDetails();
    }
  }, [isOpen, vendorName, initialConsumables]);

  const fetchVendorDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/vendorTransactions/${vendorName}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch vendor details');
      }

      const data = await response.json();
      setConsumables(data.consumables);
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
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <div className="flex justify-center">
            <Spinner size="xl" />
          </div>
        ) : (
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
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(consumable.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {Object.entries(consumable.categoryFields || {}).map(([key, value]) => (
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
