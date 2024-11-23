import React, { useEffect, useState } from 'react';
import { Button } from 'flowbite-react';
import { toastError } from '../toasts';
import ClaimConsumableModal from '../components/ClaimConsumableModal';
import TableCustom from '../components/TableCustom';
import { ColumnDef } from '@tanstack/react-table';

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

  const columns: ColumnDef<Consumable>[] = [
    {
      header: 'Name',
      accessorKey: 'consumableName',
      meta: {
        filterType: 'dropdown'
      }
    },
    {
      header: 'Available',
      accessorKey: 'availableQuantity',
      enableColumnFilter: false
    },
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

  const actionsColumn: ColumnDef<Consumable> = {
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Button
          color="blue"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm"
          onClick={() => openClaimModal(row.original)}
        >
          Issue
        </Button>
      </div>
    ),
  };

  const combinedColumns = [...columns, ...attributeColumns, actionsColumn] as ColumnDef<Consumable>[];

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

  const initialState = {
    pagination: {
      pageSize: 10,
    },
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-semibold mb-8 text-center text-gray-900">Issue Consumable</h1>
      {consumables.length > 0 ? (
        <TableCustom
          data={consumables}
          initialState={initialState}
          columns={combinedColumns}
        />
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
