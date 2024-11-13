// import { useState, useEffect } from 'react';

// interface PersonTransaction {
//   _id: string;
//   consumableName: string;
//   transactionQuantity: number;
//   transactionDate: string;
//   remainingQuantity: number;
//   issuerName?: string;
// }

// interface PersonTransactionsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   person: {
//     _id: string;
//     name: string;
//   } | null;
// }

// const PersonTransactionsModal = ({ isOpen, onClose, person }: PersonTransactionsModalProps) => {
//   const [transactions, setTransactions] = useState<PersonTransaction[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchPersonTransactions = async () => {

//       if (!person || !person._id) {
//         return;
//       }

//       setLoading(true);
//       try {
//         const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/transactions?issuedToId=${person._id}`, {
//           credentials: 'include',
//         });
//         if (!response.ok) {
//           throw new Error('Failed to fetch transactions');
//         }
//         const data = await response.json();
//         setTransactions(data);
//       } catch (error) {
//         console.error('Error fetching transactions:', error);
//         alert('Failed to load transactions');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (isOpen) {
//       fetchPersonTransactions();
//     }
//   }, [isOpen, person._id]);

//     if (!person) {
//     return null;
//   }

//   return (
//     <div
//       className={`fixed z-10 inset-0 overflow-y-auto ${
//         isOpen ? 'block' : 'hidden'
//       }`}
//       aria-labelledby="modal-title"
//       role="dialog"
//       aria-modal="true"
//     >
//       <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//         <div
//           className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
//           aria-hidden="true"
//         ></div>

//         <span
//           className="hidden sm:inline-block sm:align-middle sm:h-screen"
//           aria-hidden="true"
//         >
//           &#8203;
//         </span>

//         <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
//           <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
//             <div className="sm:flex sm:items-start">
//               <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
//                 <h3
//                   className="text-lg leading-6 font-medium text-gray-900"
//                   id="modal-title"
//                 >
//                   {person.name}'s Transactions
//                 </h3>
//                 <div className="mt-2">
//                   {loading ? (
//                     <div className="flex justify-center items-center h-40">
//                       <div className="border-4 border-gray-300 rounded-full animate-spin h-12 w-12"></div>
//                     </div>
//                   ) : (
//                     <table className="min-w-full divide-y divide-gray-200">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th
//                             scope="col"
//                             className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                           >
//                             Consumable
//                           </th>
//                           <th
//                             scope="col"
//                             className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                           >
//                             Quantity
//                           </th>
//                           <th
//                             scope="col"
//                             className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                           >
//                             Date
//                           </th>
//                           <th
//                             scope="col"
//                             className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                           >
//                             Remaining
//                           </th>
//                           <th
//                             scope="col"
//                             className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                           >
//                             Issued By
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="bg-white divide-y divide-gray-200">
//                         {transactions.map((transaction) => (
//                           <tr key={transaction._id}>
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               {transaction.consumableName}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               {transaction.transactionQuantity}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               {new Date(transaction.transactionDate).toLocaleString()}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               {transaction.remainingQuantity}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               {transaction.issuerName || '-'}
//                             </td>
//                           </tr>
//                         ))}
//                         {transactions.length === 0 && (
//                           <tr>
//                             <td
//                               colSpan={5}
//                               className="px-6 py-4 whitespace-nowrap text-center"
//                             >
//                               No transactions found for this person.
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
//             <button
//               type="button"
//               className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
//               onClick={onClose}
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PersonTransactionsModal;

// TransactionsModal.tsx
// import { Button, Modal, Spinner, Table } from 'flowbite-react';
// import { useState, useEffect } from 'react';
// import { toastError } from '../toasts';
// import { IConsumableTransaction } from '../../../backend/models/consumableTransaction';


// interface TransactionsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   personId: string;
// }

// const TransactionsModal = ({ isOpen, onClose, personId }: TransactionsModalProps) => {
//   const [transactions, setTransactions] = useState<IConsumableTransaction[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchTransactions = async () => {
//       try {
//         const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/people/${personId}/transactions`, {
//           credentials: 'include',
//         });

//         if (!response.ok) {
//           throw new Error('Failed to fetch transactions');
//         }

//         const data = await response.json();
//         setTransactions(data);
//       } catch (error) {
//         console.error('Error fetching transactions:', error);
//         toastError('Failed to load transactions');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (isOpen) {
//       fetchTransactions();
//     }
//   }, [isOpen, personId]);

//   return (
//     <Modal show={isOpen} onClose={onClose}>
//       <Modal.Header>Transactions for the selected person</Modal.Header>
//       <Modal.Body>
//         {loading ? (
//           <div className="flex justify-center items-center h-64">
//             <Spinner size="xl" />
//           </div>
//         ) : (
//           <Table>
//             <Table.Head>
//               <Table.HeadCell>Consumable Name</Table.HeadCell>
//               <Table.HeadCell>Transaction Quantity</Table.HeadCell>
//               <Table.HeadCell>Transaction Date</Table.HeadCell>
//               <Table.HeadCell>Remaining Quantity</Table.HeadCell>
//             </Table.Head>
//             <Table.Body className="divide-y">
//               {transactions.map((transaction) => (
//                 <Table.Row key={transaction._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
//                   <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
//                     {transaction.consumableName}
//                   </Table.Cell>
//                   <Table.Cell>{transaction.transactionQuantity}</Table.Cell>
//                   <Table.Cell>
//                     {new Date(transaction.transactionDate).toLocaleString()}
//                   </Table.Cell>
//                   <Table.Cell>{transaction.remainingQuantity}</Table.Cell>
//                 </Table.Row>
//               ))}
//               {transactions.length === 0 && (
//                 <Table.Row>
//                   <Table.Cell colSpan={4} className="text-center py-4">
//                     No transactions found for this person.
//                   </Table.Cell>
//                 </Table.Row>
//               )}
//             </Table.Body>
//           </Table>
//         )}
//       </Modal.Body>
//       <Modal.Footer>
//         <Button onClick={onClose}>Close</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default TransactionsModal;

import { Modal, Spinner } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { toastError } from '../toasts';

interface Transaction {
  _id: string;
  consumableName: string;
  transactionQuantity: number;
  transactionDate: string;
  remainingQuantity: number;
  addedBy?: { _id: string; name: string };
  issuedBy?: { _id: string; name: string };
  issuedTo?: { _id: string; name: string };
}

interface PersonTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: {
    _id: string;
    name: string;
  } | null;
}

const PersonTransactionsModal = ({ isOpen, onClose, person }: PersonTransactionsModalProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && person) {
      fetchTransactions();
    }
  }, [isOpen, person]);

  const fetchTransactions = async () => {
    if (!person) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/transactions/person/${person._id}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toastError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.addedBy?._id === person?._id) {
      return `Added ${transaction.remainingQuantity} ${transaction.consumableName}`;
    } else if (transaction.issuedBy?._id === person?._id) {
      return `Issued ${transaction.transactionQuantity} ${transaction.consumableName} to ${transaction.issuedTo?.name}`;
    } else if (transaction.issuedTo?._id === person?._id) {
      return `Received ${transaction.transactionQuantity} ${transaction.consumableName} from ${transaction.issuedBy?.name}`;
    }
    return `Involved in transaction of ${transaction.transactionQuantity} ${transaction.consumableName}`;
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="xl">
      <Modal.Header>
        Transactions for {person?.name}
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="xl" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getTransactionDescription(transaction)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      No transactions found for this person.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PersonTransactionsModal;
