import React, { useEffect, useState } from 'react';
import { Button } from 'flowbite-react';
import { toastError } from '../toasts';
import ClaimConsumableModal from '../components/ClaimConsumableModal';

interface Consumable {
  _id: string;
  consumableName: string;
  quantity: number;
  unitPrice: number;
  vendor: { name: string } | null;
  consumableCategory: { name: string } | null;
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
      <h1 className="text-3xl font-semibold mb-8 text-center text-gray-900">Claim Consumable</h1>
      {consumables.length > 0 ? (
          <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm font-semibold">
                <th className="py-3 px-4 border-b border-gray-200 text-left">Name</th>
                <th className="py-3 px-4 border-b border-gray-200 text-left">Available</th>
                <th className="py-3 px-4 border-b border-gray-200 text-left">Vendor</th>
                <th className="py-3 px-4 border-b border-gray-200 text-left">Category</th>
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
                  <td className="py-2 px-4 border-b border-gray-200 text-gray-700 text-sm">{consumable.quantity}</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-gray-700 text-sm">{consumable.vendor?.name || 'N/A'}</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-gray-700 text-sm">{consumable.consumableCategory?.name || 'N/A'}</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-center flex justify-center items-center">
                    <Button
                      color="blue"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                      onClick={() => openClaimModal(consumable)}
                    >
                      Claim
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      ) : (
        <p className="text-center text-gray-600">No consumables available to claim.</p>
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

// import React, { useEffect, useState } from 'react';
// import { Button } from 'flowbite-react';
// import { toastError } from '../toasts';
// import ClaimConsumableModal from '../components/ClaimConsumableModal';

// interface Consumable {
//   _id: string;
//   consumableName: string;
//   quantity: number;
//   unitPrice: number;
//   vendor: { name: string } | null;
//   consumableCategory: { name: string } | null;
// }

// const OutPage: React.FC = () => {
//   const [consumables, setConsumables] = useState<Consumable[]>([]);
//   const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
//   const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

//   const fetchConsumables = async () => {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       toastError("You are not logged in. Please log in to continue.");
//       return;
//     }

//     try {
//       const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumable`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         if (response.status === 401) {
//           throw new Error("Unauthorized access");
//         }
//         throw new Error(`Failed to fetch consumables: ${response.statusText}`);
//       }

//       const data = await response.json();
//       if (Array.isArray(data)) {
//         setConsumables(data);
//       } else {
//         throw new Error("Unexpected data format from API");
//       }
//     } catch (error) {
//       toastError("Error fetching consumables");
//       console.error("Error fetching consumables:", error);
//     }
//   };

//   useEffect(() => {
//     fetchConsumables();
//   }, []);

//   const openClaimModal = (consumable: Consumable) => {
//     setSelectedConsumable(consumable);
//     setIsClaimModalOpen(true);
//   };

//   const closeClaimModal = () => {
//     setIsClaimModalOpen(false);
//   };

//   const handleConsumableClaimed = () => {
//     fetchConsumables();
//     closeClaimModal();
//   };

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       <h1 className="text-3xl font-semibold mb-8 text-center text-gray-900">Claim Consumable</h1>
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
//         {consumables.length > 0 ? (
//           consumables.map((consumable) => (
//             <div key={consumable._id} className="p-5 border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out bg-white flex flex-col border-gray-200">
//               <div className="flex-grow space-y-2">
//                 <p className="text-lg font-medium text-gray-700">{consumable.consumableName}</p>
//                 <p className="text-sm text-gray-500"><strong>Available:</strong> {consumable.quantity}</p>
//                 <p className="text-sm text-gray-500"><strong>Vendor:</strong> {consumable.vendor?.name || 'N/A'}</p>
//                 <p className="text-sm text-gray-500"><strong>Category:</strong> {consumable.consumableCategory?.name || 'N/A'}</p>
//               </div>
//               <Button color="white" className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg" onClick={() => openClaimModal(consumable)}>
//                 Claim
//               </Button>
//             </div>
//           ))
//         ) : (
//           <p className="text-center text-gray-600">No consumables available to claim.</p>
//         )}
//       </div>

//       <ClaimConsumableModal 
//         isOpen={isClaimModalOpen}
//         onClose={closeClaimModal}
//         consumable={selectedConsumable}
//         onClaimSuccess={handleConsumableClaimed}
//       />
//     </div>
//   );
// };

// export default OutPage;
