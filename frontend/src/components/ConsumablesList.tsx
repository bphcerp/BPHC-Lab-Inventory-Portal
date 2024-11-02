import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

  if (loading) return <div>Loading...</div>;

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
              <td className="border px-4 py-2">{consumable.vendor.name}</td>
              <td className="border px-4 py-2">{consumable.totalCost}</td>
              <td className="border px-4 py-2">{new Date(consumable.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConsumablesList;
