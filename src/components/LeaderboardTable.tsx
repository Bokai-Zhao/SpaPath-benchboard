import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownUp, Download } from "lucide-react";
import { downloadCsv } from "../lib/exportCsv";
import { asText } from "../lib/formatting";
import { EmptyState } from "./EmptyState";

export interface SimpleColumn<T extends Record<string, unknown>> {
  key: keyof T & string;
  header: string;
  numeric?: boolean;
  render?: (row: T) => React.ReactNode;
}

export function LeaderboardTable<T extends Record<string, unknown>>({
  rows,
  columns,
  filename,
  onRowClick,
}: {
  rows: T[];
  columns: Array<SimpleColumn<T>>;
  filename: string;
  onRowClick?: (row: T) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columnDefs = useMemo<Array<ColumnDef<T>>>(
    () =>
      columns.map((column) => ({
        accessorKey: column.key,
        header: column.header,
        cell: ({ row }) => (column.render ? column.render(row.original) : asText(row.original[column.key])),
      })),
    [columns],
  );
  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!rows.length) return <EmptyState title="No rows match the current filters" />;

  return (
    <div className="rounded-lg border border-line bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-sm font-semibold text-slate-700">{rows.length.toLocaleString()} rows</span>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => downloadCsv(filename, rows, columns.map((column) => column.key))}
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      </div>
      <div className="table-scroll max-h-[640px] overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="border-b border-line px-3 py-2 font-semibold">
                    <button className="inline-flex items-center gap-1" onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowDownUp className="h-3 w-3" />
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-line hover:bg-blue-50/50"
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="border-b border-line px-3 py-2 text-slate-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
