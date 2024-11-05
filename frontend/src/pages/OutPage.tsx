import React, { useEffect, useState } from 'react';
import { Button } from 'flowbite-react';
import { toastError } from '../toasts';
import ClaimConsumableModal from '../components/ClaimConsumableModal';

interface Consumable {
  _id: string;
  consumableName: string;
  quantity: number;
  unitPrice: number;
  vendor: { name: string } | null; // Allow vendor to be null
  consumableCategory: { name: string } | null; // Allow consumableCategory to be null
}

const OutPage: React.FC = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Fetch consumables available for claiming
  const fetchConsumables = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toastError("You are not logged in. Please log in to continue.");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumable`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Set token in Authorization header
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized access");
        }
        throw new Error(`Failed to fetch consumables: ${response.statusText}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setConsumables(data); // Set consumables if data is an array
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
    fetchConsumables(); // Refresh consumables list after claiming
    closeClaimModal(); // Close the modal after claiming
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Claim Consumable</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {consumables.length > 0 ? (
          consumables.map((consumable) => (
            <div key={consumable._id} className="p-4 border rounded-lg shadow-md flex flex-col items-start space-y-4">
              <div className="flex-grow">
                <p><strong>Name:</strong> {consumable.consumableName}</p>
                <p><strong>Available Quantity:</strong> {consumable.quantity}</p>
                <p><strong>Vendor:</strong> {consumable.vendor?.name || 'N/A'}</p>
                <p><strong>Category:</strong> {consumable.consumableCategory?.name || 'N/A'}</p>
              </div>
              <Button color="blue" onClick={() => openClaimModal(consumable)}>
                Claim
              </Button>
            </div>
          ))
        ) : (
          <p>No consumables available to claim.</p>
        )}
      </div>

      {/* Claim Modal */}
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
