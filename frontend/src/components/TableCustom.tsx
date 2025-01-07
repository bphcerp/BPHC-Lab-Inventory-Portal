import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    Column,
    getFacetedRowModel,
    getFacetedUniqueValues,
    InitialTableState,
    RowData,
    FilterFn
} from "@tanstack/react-table";
import { TextInput, Table } from "flowbite-react";
import { FunctionComponent, useMemo } from "react";

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        getSum?: boolean;
        sumFormatter?: (sum: number) => string;
        filterType?: "dropdown" | "numeric";
    }
}

const numericFilter: FilterFn<any> = (row, columnId, filterValue) => {
    if (!filterValue) return true;
    const rowValue = row.getValue(columnId) as number;
    return rowValue <= Number(filterValue);
};

interface TableCustomProps {
    data: Array<any>;
    columns: Array<any>;
    initialState?: InitialTableState;
}

const TableCustom: FunctionComponent<TableCustomProps> = ({ data, columns, initialState }) => {
    const getSortedUniqueValues = (column: Column<any, unknown>) => {
        return useMemo(
            () =>
                Array.from(column.getFacetedUniqueValues().keys())
                    .sort()
                    .slice(0, 5000),
            [column.getFacetedUniqueValues()]
        );
    };

    columns = useMemo(() =>
        columns.map(column =>
            column.meta?.filterType === "dropdown"
                ? { ...column, filterFn: "equalsString" }
                : column.meta?.filterType === "numeric"
                ? { ...column, filterFn: numericFilter }
                : column
        ),
        [columns]
    );

    const table = useReactTable({
        data,
        columns,
        initialState,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <>
            <div className="flex flex-col w-full bg-white shadow-md rounded-lg">
                <Table>
                    {table.getHeaderGroups().map(headerGroup => (
                        <Table.Head className="bg-gray-200" key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <Table.HeadCell 
                                    className={`bg-gray-300 px-4 py-3 text-left font-medium text-sm text-gray-700 border-b-2 border-gray-200 
                                                ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}
                                    key={header.id} 
                                    colSpan={header.colSpan}
                                >
                                    {header.isPlaceholder ? null : (
                                        <>
                                            <div
                                                {...{
                                                    className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                                                    onClick: header.column.getToggleSortingHandler(),
                                                }}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: ' 🔼',
                                                    desc: ' 🔽',
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                            {header.column.getCanFilter() ? (
                                                <div className="mt-2">
                                                    {header.column.columnDef.meta?.filterType === "dropdown" ? (
                                                        <select
                                                            onChange={e => header.column.setFilterValue(e.target.value)}
                                                            value={(header.column.getFilterValue() ?? "") as string}
                                                            className="bg-white border border-gray-300 p-2 rounded-md text-sm"
                                                        >
                                                            <option value="">All</option>
                                                            {getSortedUniqueValues(header.column).map(value => (
                                                                <option value={value} key={value}>{value}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <TextInput
                                                            className="w-36"
                                                            color="blue"
                                                            onChange={e => header.column.setFilterValue(e.target.value)}
                                                            placeholder={header.column.columnDef.meta?.filterType === "numeric" ? "Search..." : "Search..."}
                                                            type={header.column.columnDef.meta?.filterType === "numeric" ? "number" : "text"}
                                                            value={(header.column.getFilterValue() ?? '') as string}
                                                        />
                                                    )}
                                                </div>
                                            ) : null}
                                        </>
                                    )}
                                </Table.HeadCell>
                            ))}
                        </Table.Head>
                    ))}
                    <Table.Body>
                        {table.getRowModel().rows.map((row, index) => (
                            <Table.Row key={row.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                {row.getVisibleCells().map(cell => (
                                    <Table.Cell
                                        className="text-sm text-gray-700 px-4 py-3 border-b border-gray-200"
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

            <div className="flex justify-center items-center space-x-2 my-4">
                <button
                    className="bg-blue-500 text-white border rounded p-2"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<<'}
                </button>
                <button
                    className="bg-blue-500 text-white border rounded p-2"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<'}
                </button>
                <button
                    className="bg-blue-500 text-white border rounded p-2"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    {'>'}
                </button>
                <button
                    className="bg-blue-500 text-white border rounded p-2"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                >
                    {'>>'}
                </button>
                <span className="flex items-center gap-1">
                    <div>Page</div>
                    <strong>
                        {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </strong>
                </span>
                <span className="flex items-center gap-1">
                    | Go to page:
                    <input
                        type="number"
                        min="1"
                        max={table.getPageCount()}
                        defaultValue={table.getState().pagination.pageIndex + 1}
                        onChange={e => {
                            const page = e.target.value ? Number(e.target.value) - 1 : 0;
                            table.setPageIndex(page);
                        }}
                        className="border p-2 rounded w-20"
                    />
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
