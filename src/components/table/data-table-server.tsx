import {
  ColumnDef,
  PaginationState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import ErrorBoundary from "../ui/error-boundary";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  showOptions?: boolean;
  hideFilterButton?: boolean;
  hideColumnsInMobile?: boolean;
  totalPage: number;
  page?: number;
  showSearch?: boolean;
  changePage: (page: PaginationState) => void;
  showHeader?: boolean;
  children?: ReactNode;
  selectedRows?: any;
  className?: string;
  rowClassName?: string;
  setSelectedRows?: (data: any) => void;
}

export default function DataTable<TData, TValue>({
  columns,
  totalPage,
  data,
  page = 0,
  rowClassName,
  className,
  showHeader = true,
  changePage,
  selectedRows,
  setSelectedRows,
}: DataTableProps<TData, TValue>) {
  const [rowSelection] = useState(selectedRows ?? {});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page,
    pageSize: 10,
  });

  useEffect(() => {
    changePage(pagination);
  }, [pagination]);

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    enableGlobalFilter: true,
    state: { pagination: pagination },
    pageCount: totalPage,
    onPaginationChange: setPagination,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    if (setSelectedRows) {
      setSelectedRows(rowSelection);
    }
  }, [rowSelection]);

  return (
    <div>
      <div className={cn("rounded-md", className)}>
        <Table>
          {showHeader && (
            <TableHeader>
              {table?.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-border/60 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-9 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap bg-muted/30"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
          )}
          <TableBody>
            {table?.getRowModel().rows?.length ? (
              table?.getRowModel().rows.map((row) => (
                <TableRow
                  className={cn(
                    "border-b border-border/40 hover:bg-muted/30 transition-colors",
                    rowClassName
                  )}
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row?.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      <ErrorBoundary>
                        {flexRender(
                          cell?.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </ErrorBoundary>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          Page {pagination.pageIndex + 1} of {totalPage || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={!table.getCanPreviousPage()}
            onClick={table.previousPage}
          >
            <ChevronLeft size={14} />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={!table.getCanNextPage()}
            onClick={table.nextPage}
          >
            Next
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
