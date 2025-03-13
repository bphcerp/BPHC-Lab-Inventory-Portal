// import React, { useState, useEffect } from 'react';

// interface Consumable {
//   _id: string;
//   consumableName: string;
//   quantity: number;
//   unitPrice: number;
//   date: string;
//   totalCost: number;
//   vendor: {
//     _id: string;
//     name: string;
//   };
// }

// interface VendorDetailsProps {
//   vendorId: string;
//   vendorName: string;
//   isOpen: boolean;
//   onClose: () => void;
// }

// const formatDate = (dateString: string): string => {
//   const date = new Date(dateString);
//   const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//   return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()}`;
// };

// const VendorDetails: React.FC<VendorDetailsProps> = ({
//   vendorId,
//   vendorName,
//   isOpen,
//   onClose
// }) => {
//   const [consumables, setConsumables] = useState<Consumable[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchConsumables = async () => {
//       if (!isOpen) return;
      
//       setLoading(true);
//       try {
//         const response = await fetch(
//           `${import.meta.env.VITE_BACKEND_URL}/consumable`,
//           { credentials: 'include' }
//         );
//         const data = await response.json();
//         // Filter consumables for this vendor
//         const vendorConsumables = data.filter(
//           (item: Consumable) => item.vendor._id === vendorId
//         );
//         setConsumables(vendorConsumables);
//       } catch (error) {
//         console.error('Error fetching consumables:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchConsumables();
//   }, [vendorId, isOpen]);

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-4">
//         {/* Modal Header */}
//         <div className="flex items-center justify-between p-4 border-b">
//           <h2 className="text-xl font-semibold">{vendorName}'s Consumables</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700"
//           >
//             <span className="text-2xl">&times;</span>
//           </button>
//         </div>

//         {/* Modal Body */}
//         <div className="p-4">
//           {loading ? (
//             <div className="text-center py-4">Loading consumables...</div>
//           ) : consumables.length > 0 ? (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Name
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Quantity
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Unit Price
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Total Cost
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Procurement Date
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {consumables.map((item) => (
//                     <tr key={item._id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {item.consumableName}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {item.quantity}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         ₹{item.unitPrice.toFixed(2)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         ₹{item.totalCost.toFixed(2)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {formatDate(item.date)}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <div className="text-center py-4 text-gray-500">
//               No consumables found for this vendor.
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VendorDetails;
