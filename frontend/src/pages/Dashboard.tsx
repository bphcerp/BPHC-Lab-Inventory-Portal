import React, { useEffect, useState } from 'react';
import { toastError } from '../toasts';
import TableCustom from '../components/TableCustom';
import { ColumnDef } from '@tanstack/react-table';
import ConsumableDetailsModal from '../components/ConsumableDetailsModal';

export interface Consumable {
  _id: string;
  consumableName: string;
  quantity: number;
  availableQuantity: number;
  unitPrice: number;
  addedBy: string;
  vendor: { name: string } | string;
  categoryFields?: { [key: string]: any };
}

const Dashboard: React.FC = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [searchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState('');

  const fetchConsumables = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumable`, {
        headers: { 'Content-Type': 'application/json' },
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

  const getPillClass = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage < 10) return 'bg-red-100 text-red-700 border border-red-300';
    if (percentage < 30) return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
    return 'bg-green-100 text-green-700 border border-green-300';
  };

  const handleConsumableClick = (consumableName: string) => {
    setSelectedConsumable(consumableName);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchConsumables();
  }, []);

  const columns: ColumnDef<Consumable>[] = [
    {
      id: 'consumableName',
      header: 'Name',
      accessorKey: 'consumableName',
      cell: ({ row }) => {
        const consumable = row.original;
        return (
          <button
            onClick={() => handleConsumableClick(consumable.consumableName)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${getPillClass(
              consumable.availableQuantity,
              consumable.quantity
            )} hover:opacity-80 transition-opacity cursor-pointer`}
          >
            {consumable.consumableName}
          </button>
        );
      },
      meta: {
        filterType: "dropdown" as const
      }
    },
    {
      header: 'Available',
      accessorKey: 'availableQuantity',
      meta: {
        getSum: true
      }
    },
    {
      header: 'Unit Price',
      accessorKey: 'unitPrice',
      cell: ({ getValue }) => `₹${(getValue() as number).toFixed(2)}`,
      meta: {
        getSum: true,
        sumFormatter: (sum: number) => `₹${sum.toFixed(2)}`
      }
    }
  ];

  const attributeColumns = Array.from({ length: 4 }).map((_, index) => ({
    id: `attribute${index + 1}`,
    header: `Attribute ${index + 1}`,
    accessorFn: (row: Consumable) => {
      const categoryFields = row.categoryFields || {};
      const fieldEntries = Object.entries(categoryFields);
      const [key, value] = fieldEntries[index] || [];
      return key && value ? `${key}: ${value}` : '';
    },
    meta: {
      filterType: "dropdown" as const
    }
  }));

  const combinedColumns = [...columns, ...attributeColumns] as ColumnDef<Consumable>[];

  return (
    <div className="container mx-auto p-4">
      <div className="relative mb-4">
        <h1 className="text-3xl font-bold text-gray-800 text-center">Dashboard</h1>
        <div className="absolute top-0 right-0 flex items-center space-x-4">
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-green-500 inline-block"></span>
            <span className="ml-2 text-sm text-gray-700">Above 30%</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-yellow-300 inline-block"></span>
            <span className="ml-2 text-sm text-gray-700">10% - 30%</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
            <span className="ml-2 text-sm text-gray-700">Below 10%</span>
          </div>
        </div>
      </div>

      <TableCustom 
        data={consumables.filter((consumable) =>
          consumable.consumableName.toLowerCase().includes(searchText.toLowerCase())
        )}
        columns={combinedColumns}
      />

      <ConsumableDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        consumableName={selectedConsumable}
      />
    </div>
  );
};

export default Dashboard;
