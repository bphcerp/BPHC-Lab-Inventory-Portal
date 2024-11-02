// ConsumablesPage.tsx
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
        credentials: 'include' 
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
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
      <h1 className="text-2xl font-bold mb-4">Consumables</h1>
      <Button color="blue" onClick={() => setIsModalOpen(true)}>Add Consumable</Button>
      <AddConsumableModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddConsumable} 
      />
      <div className="mt-4">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Quantity</th>
              <th className="py-2 px-4 border-b">Unit Price</th>
              <th className="py-2 px-4 border-b">Vendor</th>
              <th className="py-2 px-4 border-b">Category</th>
            </tr>
          </thead>
          <tbody>
            {consumables.length > 0 ? (
              consumables.map((consumable) => (
                <tr key={consumable._id}>
                  <td className="py-2 px-4 border-b">{consumable.consumableName}</td>
                  <td className="py-2 px-4 border-b">{consumable.quantity}</td>
                  <td className="py-2 px-4 border-b">{consumable.unitPrice}</td>
                  <td className="py-2 px-4 border-b">
                    {typeof consumable.vendor === 'string' ? consumable.vendor : consumable.vendor?.name}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {typeof consumable.category === 'string' ? consumable.category : consumable.category?.name}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-2">No consumables found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsumablesPage;
