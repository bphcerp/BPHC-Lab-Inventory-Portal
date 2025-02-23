import { useEffect, useState, useCallback } from 'react';
import { Button } from 'flowbite-react';
import { toastError } from '../toasts';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import ClaimConsumableModal from '../components/ClaimConsumableModal';
import TableCustom from '../components/TableCustom';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';

interface Consumable {
  _id: string;
  consumableName: string;
  availableQuantity: number;
  categoryFields?: { [key: string]: any };
}

const OutPage = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [selectedConsumables, setSelectedConsumables] = useState<Consumable[]>([]);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns: ColumnDef<Consumable>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="px-2">
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
            className="h-4 w-4 rounded border-gray-200"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-2">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(!!e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-gray-200"
          />
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      header: 'Name',
      accessorKey: 'consumableName',
      meta: { filterType: 'dropdown' }
    },
    {
      header: 'Available',
      accessorKey: 'availableQuantity',
      meta: { filterType: 'numeric' },
      cell: ({ row }) => {
        const quantity = row.original?.availableQuantity;
        return <span className="font-medium">{quantity}</span>;
      }
    }
  ];

  const fetchConsumables = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumable`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) throw new Error(`Failed to fetch consumables: ${response.statusText}`);

      const data = await response.json();
      if (Array.isArray(data)) {
        const sortedData = [...data].sort((a, b) => 
          a.consumableName.toLowerCase().localeCompare(b.consumableName.toLowerCase())
        );
        setConsumables(sortedData);
      } else {
        throw new Error("Unexpected data format from API");
      }
    } catch (error) {
      toastError("Error fetching consumables");
      console.error("Error fetching consumables:", error);
    }
  }, []);

  useEffect(() => {
    fetchConsumables();
  }, [fetchConsumables]);

  const handleRowSelection = useCallback((selectedRows: Consumable[]) => {
    setSelectedConsumables(selectedRows);
  }, []);

  const handleIssueClick = () => {
    if (selectedConsumables.length === 0) {
      toastError("Please select at least one consumable to issue");
      return;
    }
    setIsClaimModalOpen(true);
  };

  const handleConsumableClaimed = () => {
    fetchConsumables();
    setSelectedConsumables([]);
    setIsClaimModalOpen(false);
  };

  const getMaxAttributeCount = (data: Consumable[]) => {
    let maxCount = 0;
    data.forEach(item => {
      if (item.categoryFields) {
        maxCount = Math.max(maxCount, Object.keys(item.categoryFields).length);
      }
    });
    return maxCount;
  };

  const attributeColumns = Array.from({ length: getMaxAttributeCount(consumables) }).map((_, index) => ({
    id: `attribute${index + 1}`,
    header: `Attribute ${index + 1}`,
    accessorFn: (row: Consumable) => {
      const categoryFields = row.categoryFields || {};
      const fieldEntries = Object.entries(categoryFields);
      const [key, value] = fieldEntries[index] || [];
      return key && value ? `${key}: ${value}` : '';
    },
    meta: { filterType: "dropdown" as const }
  }));

  useEffect(() => {
    const initialVisibility: VisibilityState = {};
    attributeColumns.forEach((col, index) => {
      // Always show first two attributes in initial state
      initialVisibility[col.id] = index < 2;
    });
    setColumnVisibility(initialVisibility);
  }, [consumables.length]);

  const toggleAllColumns = () => {
    const newShowAllColumns = !showAllColumns;
    setShowAllColumns(newShowAllColumns);
    
    const newVisibility: VisibilityState = {};
    attributeColumns.forEach((col, index) => {
      // Keep first two attributes visible, toggle others based on showAllColumns
      newVisibility[col.id] = index < 2 ? true : newShowAllColumns;
    });
    
    setColumnVisibility(prevState => ({
      ...prevState,
      ...newVisibility
    }));
  };

  return (
    <div className="w-full px-4 py-8" style={{ 
      maxWidth: showAllColumns ? 'none' : '6xl',
      transition: 'max-width 0.3s ease-in-out'
    }}>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-medium text-gray-800">Issue Consumables</h1>
          <div className="flex gap-4">
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
            <Button
              color="blue"
              size="sm"
              onClick={handleIssueClick}
              disabled={selectedConsumables.length === 0}
            >
              {selectedConsumables.length > 0 ? (
                `Issue Selected (${selectedConsumables.length})`
              ) : (
                'Issue Selected'
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 ${
        showAllColumns ? 'max-w-full' : ''
      }`}>
        {consumables.length > 0 ? (
          <TableCustom
            data={consumables}
            columns={[...columns, ...attributeColumns]}
            initialState={{
              pagination: { pageSize: 10 },
              sorting: [{ id: 'consumableName', desc: false }],
              columnVisibility
            }}
            enableRowSelection={true}
            onRowSelectionChange={handleRowSelection}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              No consumables available to issue.
            </p>
          </div>
        )}
      </div>

      <ClaimConsumableModal 
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        consumables={selectedConsumables}
        onClaimSuccess={handleConsumableClaimed}
      />
    </div>
  );
};

export default OutPage;
