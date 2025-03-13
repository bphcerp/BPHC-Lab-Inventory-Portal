import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    getFacetedRowModel,
    getFacetedUniqueValues,
    InitialTableState,
    RowData,
    FilterFn,
    RowSelectionState,
    OnChangeFn,
    VisibilityState
} from "@tanstack/react-table";
import { TextInput, Table, Button, Checkbox } from "flowbite-react";
import { FunctionComponent, useMemo, useState, useEffect, useCallback } from "react";

// Add type for multi-select filter values
type MultiSelectFilterValue = string[];

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        getSum?: boolean;
        sumFormatter?: (sum: number) => string;
        filterType?: "dropdown" | "numeric" | "multi-select";
    }
}

// Updated filter function to handle arrays of values
const multiSelectFilter: FilterFn<any> = (row, columnId, filterValue: MultiSelectFilterValue) => {
    if (!filterValue?.length) return true;
    const rowValue = row.getValue(columnId) as string;
    return filterValue.includes(rowValue);
};

const numericFilter: FilterFn<any> = (row, columnId, filterValue) => {
    if (!filterValue) return true;
    const rowValue = row.getValue(columnId) as number;
    return rowValue <= Number(filterValue);
};

interface TableCustomProps {
    data: Array<any>;
    columns: Array<any>;
    initialState?: InitialTableState;
    enableRowSelection?: boolean;
    onRowSelectionChange?: (selectedRows: any[]) => void;
}

const TableCustom: FunctionComponent<TableCustomProps> = ({ 
    data, 
    columns, 
    initialState,
    //enableRowSelection = false,
    onRowSelectionChange 
}) => {
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);

    useEffect(() => {
        if (initialState?.columnVisibility) {
            setColumnVisibility(initialState.columnVisibility);
        }
    }, [initialState?.columnVisibility]);

    const processedColumns = useMemo(() =>
        columns.map(column =>
            column.meta?.filterType === "dropdown"
                ? { ...column, filterFn: "equalsString" }
                : column.meta?.filterType === "multi-select"
                ? { ...column, filterFn: multiSelectFilter }
                : column.meta?.filterType === "numeric"
                ? { ...column, filterFn: numericFilter }
                : column
        ),
        [columns]
    );

    const handleRowSelectionChange: OnChangeFn<RowSelectionState> = useCallback((updater) => {
        setRowSelection(old => {
            return typeof updater === 'function' ? updater(old) : updater;
        });
    }, []);

    const notifyParentOfSelection = useCallback((tableInstance: any) => {
        if (onRowSelectionChange) {
            const selectedRows = tableInstance
                .getSelectedRowModel()
                .rows.map((row: any) => row.original);
            onRowSelectionChange(selectedRows);
        }
    }, [onRowSelectionChange]);

    const table = useReactTable({
        data,
        columns: processedColumns,
        initialState,
        state: {
            rowSelection,
            columnVisibility,
        },
        enableRowSelection: true,
        onRowSelectionChange: handleRowSelectionChange,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Helper function to handle multi-select changes
    const handleMultiSelectChange = (column: any, value: string) => {
        const currentValues = (column.getFilterValue() || []) as string[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        column.setFilterValue(newValues);
    };

    // Close filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.filter-dropdown') && !target.closest('.filter-button')) {
                setOpenFilterDropdown(null);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        notifyParentOfSelection(table);
    }, [rowSelection, notifyParentOfSelection, table]);

    return (
        <>
            <div className="flex flex-col w-full bg-white shadow-md rounded-lg">
                <Table>
                    <Table.Head className="bg-gray-200">
                        {table.getHeaderGroups().map(headerGroup => (
                            headerGroup.headers.map(header => (
                                <Table.HeadCell 
                                    className="bg-gray-300 px-4 py-3 text-left font-medium text-sm text-gray-700 border-b-2 border-gray-200"
                                    key={header.id}
                                >
                                    {header.isPlaceholder ? null : (
                                        <>
                                            <div
                                                className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </div>
                                            {header.column.getCanFilter() ? (
                                                <div className="mt-2">
                                                    {header.column.columnDef.meta?.filterType === "dropdown" ? (
                                                        <div className="relative">
                                                            <button
                                                                className="filter-button bg-white border border-gray-300 p-2 rounded-md text-sm w-full flex justify-between items-center"
                                                                onClick={() => setOpenFilterDropdown(openFilterDropdown === header.id ? null : header.id)}
                                                            >
                                                                <span>
                                                                    {(header.column.getFilterValue() as string) || "All"}
                                                                </span>
                                                                <span className="ml-2">▼</span>
                                                            </button>
                                                            <select
                                                                onChange={e => header.column.setFilterValue(e.target.value)}
                                                                value={(header.column.getFilterValue() ?? "") as string}
                                                                className="sr-only"
                                                            >
                                                                <option value="">All</option>
                                                                {Array.from(header.column.getFacetedUniqueValues().keys())
                                                                    .sort()
                                                                    .map(value => (
                                                                        <option key={value} value={value}>{value}</option>
                                                                    ))}
                                                            </select>
                                                            {openFilterDropdown === header.id && (
                                                                <div className="filter-dropdown absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                                                    <div 
                                                                        className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                                                                        onClick={() => {
                                                                            header.column.setFilterValue("");
                                                                            setOpenFilterDropdown(null);
                                                                        }}
                                                                    >
                                                                        All
                                                                    </div>
                                                                    {Array.from(header.column.getFacetedUniqueValues().keys())
                                                                        .sort()
                                                                        .filter(value => value)
                                                                        .map(value => (
                                                                            <div
                                                                                key={value}
                                                                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                                                                onClick={() => {
                                                                                    header.column.setFilterValue(value);
                                                                                    setOpenFilterDropdown(null);
                                                                                }}
                                                                            >
                                                                                {value}
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : header.column.columnDef.meta?.filterType === "multi-select" ? (
                                                        <div className="relative">
                                                            <button
                                                                className="filter-button bg-white border border-gray-300 p-2 rounded-md text-sm w-full flex justify-between items-center"
                                                                onClick={() => setOpenFilterDropdown(openFilterDropdown === header.id ? null : header.id)}
                                                            >
                                                                <span>
                                                                    {(header.column.getFilterValue() as string[])?.length 
                                                                        ? `${(header.column.getFilterValue() as string[]).length} selected` 
                                                                        : "All"}
                                                                </span>
                                                                <span className="ml-2">▼</span>
                                                            </button>
                                                            {openFilterDropdown === header.id && (
                                                                <div className="filter-dropdown absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                                                    <div 
                                                                        className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                                                                        onClick={() => {
                                                                            header.column.setFilterValue([]);
                                                                        }}
                                                                    >
                                                                        Clear all
                                                                    </div>
                                                                    {Array.from(header.column.getFacetedUniqueValues().keys())
                                                                        .sort()
                                                                        .filter(value => value)
                                                                        .map(value => {
                                                                            const isSelected = (header.column.getFilterValue() as string[])?.includes(value);
                                                                            return (
                                                                                <div
                                                                                    key={value}
                                                                                    className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                                                                    onClick={() => handleMultiSelectChange(header.column, value)}
                                                                                >
                                                                                    <Checkbox 
                                                                                        className="mr-2" 
                                                                                        checked={isSelected}
                                                                                        onChange={() => {}}
                                                                                    />
                                                                                    {value}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <TextInput
                                                            className="w-full"
                                                            onChange={e => header.column.setFilterValue(e.target.value)}
                                                            placeholder="Search..."
                                                            type={header.column.columnDef.meta?.filterType === "numeric" ? "number" : "text"}
                                                            value={(header.column.getFilterValue() ?? '') as string}
                                                        />
                                                    )}
                                                </div>
                                            ) : null}
                                        </>
                                    )}
                                </Table.HeadCell>
                            ))
                        ))}
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {table.getRowModel().rows.map((row, index) => (
                            <Table.Row 
                                key={row.id}
                                className={`
                                    ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                                    ${row.getIsSelected() ? "bg-blue-100" : ""}
                                    hover:bg-gray-100
                                `}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <Table.Cell
                                        className="text-sm text-gray-700 px-4 py-3 border-b border-gray-200 whitespace-normal break-words"
                                        key={cell.id}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-2 my-4">
                <Button.Group>
                    <Button
                        color="gray"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        {'<<'}
                    </Button>
                    <Button
                        color="gray"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        {'<'}
                    </Button>
                    <Button
                        color="gray"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        {'>'}
                    </Button>
                    <Button
                        color="gray"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        {'>>'}
                    </Button>
                </Button.Group>
                
                <span className="flex items-center gap-1">
                    <div>Page</div>
                    <strong>
                        {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </strong>
                </span>
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => {
                        table.setPageSize(Number(e.target.value));
                    }}
                    className="border p-2 rounded"
                >
                    {[5, 10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
}

export default TableCustom;
