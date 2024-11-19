import React, { useEffect, useState } from 'react';
import { Button } from 'flowbite-react';
import { toastError } from '../toasts';
import ClaimConsumableModal from '../components/ClaimConsumableModal';

interface Consumable {
  _id: string;
  consumableName: string;
  availableQuantity: number;
  unitPrice: number;
  categoryFields?: { [key: string]: any };
}

const OutPage: React.FC = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const fetchConsumables = async () => {

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumable`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
          credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized access");
        }
        throw new Error(`Failed to fetch consumables: ${response.statusText}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setConsumables(data);
      } else {
        throw new Error("Unexpected data format from API");
      }
    } catch (error) {
      toastError("Error fetching consumables");
      console.error("Error fetching consumables:", error);
    }
  };

  useEffect(() => {
    fetchConsumables();
  }, []);

  const openClaimModal = (consumable: Consumable) => {
    setSelectedConsumable(consumable);
    setIsClaimModalOpen(true);
  };

  const closeClaimModal = () => {
    setIsClaimModalOpen(false);
  };

  const handleConsumableClaimed = () => {
    fetchConsumables();
    closeClaimModal();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-semibold mb-8 text-center text-gray-900">Issue Consumable</h1>
      {consumables.length > 0 ? (
          <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm font-semibold">
                <th className="py-3 px-4 border-b border-gray-200 text-left">Name</th>
                <th className="py-3 px-4 border-b border-gray-200 text-left">Available</th>
                <th className="py-3 px-4 border-b border-gray-200 text-left">Description</th>
                <th className="py-3 px-4 border-b border-gray-200 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consumables.map((consumable, index) => (
                <tr
                  key={consumable._id}
                  className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="py-2 px-4 border-b border-gray-200 text-gray-700 text-sm">{consumable.consumableName}</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-gray-700 text-sm">{consumable.availableQuantity}</td>
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
                  <td className="py-2 px-4 border-b border-gray-200 text-center flex justify-center items-center">
                    <Button
                      color="blue"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                      onClick={() => openClaimModal(consumable)}
                    >
                      Issue
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      ) : (
        <p className="text-center text-gray-600">No consumables available to issue.</p>
      )}

      <ClaimConsumableModal 
        isOpen={isClaimModalOpen}
        onClose={closeClaimModal}
        consumable={selectedConsumable}
        onClaimSuccess={handleConsumableClaimed}
      />
    </div>
  );
};

export default OutPage;
