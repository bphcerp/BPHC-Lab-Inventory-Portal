import React, { useEffect, useState } from 'react';
import { Button } from 'flowbite-react';
import { toastError } from '../toasts';
import AddConsumableModal from '../components/AddConsumableModal';

export interface Consumable {
  _id: string;
  consumableName: string;
  quantity: number;
  unitPrice: number;
  vendor: { name: string } | string;
  category: {
    _id: string;
    categoryName: string;
  };
}

const ConsumablesPage: React.FC = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  
  const fetchConsumables = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumable`, { 
         headers: {'Content-Type': 'application/json'},
         credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch consumables: ${errorText}`);
      }
      
      const data = await response.json();

      if (Array.isArray(data)) {
        setConsumables(data);
      } else {
        console.error('Expected an array but received:', data);
        setConsumables([]);
      }
    } catch (error) {
      toastError('Error fetching consumables');
      console.error('Error fetching consumables:', error);
      setConsumables([]);
    }
  };

  const handleAddConsumable = async (newConsumable: Consumable) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumable`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(newConsumable),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add consumable: ${errorText}`);
      }

      const addedConsumable = await response.json();
      setConsumables((prev) => [...prev, addedConsumable]);
    } catch (error) {
      toastError('Error adding consumable');
      console.error('Error adding consumable:', error);
    }
  };

  useEffect(() => {
    fetchConsumables();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Consumables</h1>
      <Button color="blue" onClick={() => setIsModalOpen(true)} className="mx-auto block">Add Consumable</Button>
      <AddConsumableModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddConsumable} 
      />
      <div className="mt-6 overflow-hidden shadow-lg rounded-lg border border-gray-200">
        <table className="min-w-full bg-white text-left">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm font-semibold uppercase">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Quantity</th>
              <th className="py-3 px-4">Unit Price</th>
              <th className="py-3 px-4">Vendor</th>
              <th className="py-3 px-4">Category</th>
            </tr>
          </thead>
          <tbody>
            {consumables.length > 0 ? (
              consumables.map((consumable) => (
                <tr key={consumable._id} className="border-t">
                  <td className="py-3 px-4 text-gray-800">{consumable.consumableName}</td>
                  <td className="py-3 px-4 text-gray-800">{consumable.quantity}</td>
                  <td className="py-3 px-4 text-gray-800">₹{consumable.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-800">
                    {typeof consumable.vendor === 'string' ? consumable.vendor : consumable.vendor?.name}
                  </td>
                  <td className="py-3 px-4 text-gray-800">
                     {consumable.category?.categoryName || 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">No consumables found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsumablesPage;
