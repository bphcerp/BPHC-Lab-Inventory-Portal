import React, { useEffect, useState } from 'react';
import { Button, TextInput } from 'flowbite-react';
import { toastError } from '../toasts';  
import AddConsumableModal from '../components/AddConsumableModal';

export interface Consumable {
  _id: string;
  consumableName: string;
  quantity: number;      // Total/initial quantity
  availableQuantity: number;  // Current available quantity
  unitPrice: number;
  addedBy: string;
  vendor: { name: string } | string;
  categoryFields?: { [key: string]: any };
}

const ConsumablesPage: React.FC = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

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

      const updatedConsumable = await response.json();
      
      setConsumables(prevConsumables => {
        const existingIndex = prevConsumables.findIndex(c => 
          c.consumableName === updatedConsumable.consumableName && 
          c.unitPrice === updatedConsumable.unitPrice &&
          JSON.stringify(c.categoryFields) === JSON.stringify(updatedConsumable.categoryFields)
        );

        if (existingIndex !== -1) {
          const updatedConsumables = [...prevConsumables];
          updatedConsumables[existingIndex] = updatedConsumable;
          return updatedConsumables;
        } else {
          return [...prevConsumables, updatedConsumable];
        }
      });
    } catch (error) {
      toastError('Error adding consumable');
      console.error('Error adding consumable:', error);
    }
  };

  const filteredConsumables = consumables.filter(consumable =>
    consumable.consumableName.toLowerCase().includes(searchText.toLowerCase())
  );

  const getRowKey = (consumable: Consumable) => {
    return `${consumable.consumableName}-${consumable.unitPrice}-${JSON.stringify(consumable.categoryFields)}`;
  };

  useEffect(() => {
    fetchConsumables();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Consumables</h1>
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
        <Button color="blue" onClick={() => setIsModalOpen(true)} className="mr-4">
          Add Consumable
        </Button>
        <TextInput
          type="text"
          placeholder="Search consumables..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full max-w-xs"
        />
      </div>
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
              <th className="py-3 px-4">Category Fields</th>
              <th className="py-3 px-4">Quantity</th>
              <th className="py-3 px-4">Available</th>
              <th className="py-3 px-4">Unit Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredConsumables.length > 0 ? (
              filteredConsumables.map((consumable) => (
                <tr key={getRowKey(consumable)} className="border-t">
                  <td className="py-3 px-4 text-gray-800">{consumable.consumableName}</td>
                   <td className="py-3 px-4 text-gray-800">
                    {consumable.categoryFields && Object.keys(consumable.categoryFields).length > 0 ? (
                      Object.entries(consumable.categoryFields).map(([key, value]) => (
                        <div key={`${key}-${value}`}>
                          <strong>{key}:</strong> {value}
                        </div>
                      ))
                    ) : (
                      <div>N/A</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-800">{consumable.quantity}</td>
                  <td className="py-3 px-4 text-gray-800">{consumable.availableQuantity}</td>
                  <td className="py-3 px-4 text-gray-800">₹{consumable.unitPrice.toFixed(2)}</td>
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
