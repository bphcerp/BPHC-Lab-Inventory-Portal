import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VendorDetailsModal from './VendorDetailsModal';

interface Consumable {
  _id: string;
  consumableName: string;
  quantity: number;
  unitPrice: number;
  vendor: {
    name: string;
  };
  totalCost: number;
  date: string;
}

const ConsumablesList: React.FC = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const fetchConsumables = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/consumable`, { withCredentials: true });
      setConsumables(response.data);
    } catch (error) {
      console.error('Error fetching consumables:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsumables();
  }, []);

  const handleVendorClick = (vendorName: string) => {
    setSelectedVendor(vendorName);
    setIsVendorModalOpen(true);
  };

  const closeVendorModal = () => {
    setIsVendorModalOpen(false);
    setSelectedVendor(null);
  };

  if (loading) return <div>Loading...</div>;

  const consumablesByVendor = consumables.filter(
    (consumable) => consumable.vendor.name === selectedVendor
  );

  return (
    <div>
      <h2>Consumables List</h2>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Quantity</th>
            <th className="px-4 py-2">Unit Price</th>
            <th className="px-4 py-2">Vendor</th>
            <th className="px-4 py-2">Total Cost</th>
            <th className="px-4 py-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {consumables.map((consumable) => (
            <tr key={consumable._id}>
              <td className="border px-4 py-2">{consumable.consumableName}</td>
              <td className="border px-4 py-2">{consumable.quantity}</td>
              <td className="border px-4 py-2">{consumable.unitPrice}</td>
              <td
                className="border px-4 py-2 text-blue-600 cursor-pointer"
                onClick={() => handleVendorClick(consumable.vendor.name)}
              >
                {consumable.vendor.name}
              </td>
              <td className="border px-4 py-2">{consumable.totalCost}</td>
              <td className="border px-4 py-2">{new Date(consumable.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedVendor && (
        <VendorDetailsModal
          vendorName={selectedVendor}
          consumables={consumablesByVendor}
          isOpen={isVendorModalOpen}
          onClose={closeVendorModal}
        />
      )}
    </div>
  );
};

export default ConsumablesList;
