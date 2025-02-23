import React, { useEffect, useState } from 'react';
import { toastError } from '../toasts';
import TableCustom from '../components/TableCustom';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';
import ConsumableDetailsModal from '../components/ConsumableDetailsModal';
import { Button } from 'flowbite-react';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export interface Consumable {
  _id: string;
  consumableName: string;
  quantity: number;
  availableQuantity: number;
  totalConsumableCost: number;
  addedBy: string;
  vendor: { name: string } | string;
  categoryFields?: { [key: string]: any };
}

const Dashboard: React.FC = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [searchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConsumable, setModalConsumable] = useState<Consumable | null>(null);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

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
        const sortedData = [...data].sort((a, b) => 
          a.consumableName.toLowerCase().localeCompare(b.consumableName.toLowerCase())
        );
        setConsumables(sortedData);
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

  const handleConsumableClick = (consumable: Consumable) => {
    setModalConsumable(consumable);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchConsumables();
  }, []);

  const getMaxAttributeCount = (data: Consumable[]) => {
    let maxCount = 0;
    data.forEach(item => {
      if (item.categoryFields) {
        maxCount = Math.max(maxCount, Object.keys(item.categoryFields).length);
      }
    });
    return maxCount;
  };

  const mainColumns: ColumnDef<Consumable>[] = [
    {
      id: 'consumableName',
      header: 'Name',
      accessorKey: 'consumableName',
      cell: ({ row }) => {
        const consumable = row.original;
        return (
          <button
            onClick={() => handleConsumableClick(consumable)}
            className={`px-3 py-1.5 text-sm font-medium ${getPillClass(
              consumable.availableQuantity,
              consumable.quantity
            )} hover:opacity-80 transition-opacity cursor-pointer text-left w-full max-w-[200px] truncate`}
          >
            {consumable.consumableName}
          </button>
        );
      },
      sortingFn: 'alphanumeric',
      meta: {
        filterType: "dropdown" as const
      }
    }
  ];

  const attributeColumns = Array.from({ length: getMaxAttributeCount(consumables) }).map((_, index) => ({
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

  const availableColumn: ColumnDef<Consumable> = {
    header: 'Available',
    accessorKey: 'availableQuantity',
    meta: {
      getSum: true,
      filterType: "numeric"
    }
  };

  const combinedColumns = [...mainColumns, ...attributeColumns, availableColumn] as ColumnDef<Consumable>[];

  useEffect(() => {
    const initialVisibility: VisibilityState = {};
    attributeColumns.forEach((col, index) => {
      // Show first two attributes by default
      initialVisibility[col.id] = index < 2;
    });
    setColumnVisibility(initialVisibility);
  }, [consumables.length]); // Update when consumables change

  const toggleAllColumns = () => {
    const newShowAllColumns = !showAllColumns;
    setShowAllColumns(newShowAllColumns);
    
    const newVisibility: VisibilityState = {};
    attributeColumns.forEach((col, index) => {
      // Always show first two attributes, toggle others based on showAllColumns
      newVisibility[col.id] = index < 2 ? true : newShowAllColumns;
    });
    
    setColumnVisibility(prevState => ({
      ...prevState,
      ...newVisibility
    }));
  };

  return (
<div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ 
      maxWidth: showAllColumns ? 'none' : '6xl',
      transition: 'max-width 0.3s ease-in-out'
    }}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-medium text-gray-800 mb-4">Inventory Dashboard</h1>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <div className="inline-flex gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="ml-2 text-xs text-gray-600">Above 30%</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-300"></span>
              <span className="ml-2 text-xs text-gray-600">10% - 30%</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="ml-2 text-xs text-gray-600">Below 10%</span>
            </div>
          </div>
            <Button
              size="sm"
              color="gray"
              onClick={toggleAllColumns}
              className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex items-center">
                {showAllColumns ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                <span className="ml-2">{showAllColumns ? 'Hide Extra Attributes' : 'Show All Attributes'}</span>
              </div>
            </Button>
        </div>
      </div>

      <div className={`bg-white rounded-lg shadow-sm overflow-x-auto transition-all duration-300 ${
        showAllColumns ? 'max-w-full' : ''
      }`}>
        <TableCustom 
          data={consumables.filter((consumable) =>
            consumable.consumableName.toLowerCase().includes(searchText.toLowerCase())
          )}
          columns={combinedColumns}
          initialState={{
            sorting: [{ id: 'consumableName', desc: false }],
            columnVisibility
          }}
        />
      </div>

      <ConsumableDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalConsumable(null);
        }}
        consumable={modalConsumable}
      />
    </div>
  );
};

export default Dashboard;
