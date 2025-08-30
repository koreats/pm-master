'use client'

import React, { memo, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  PaginationState,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown, MoreHorizontal } from 'lucide-react'
import type { TableViewProps } from '@/lib/views/types'
import type { Task } from '@/lib/core/domain/entities/Task'
import { useTableColumns } from './hooks/useTableColumns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * 테이블 뷰 컴포넌트
 * TanStack Table을 활용한 정렬, 필터링, 페이지네이션 기능 제공
 */
export const TableView = memo(function TableView({
  data = [],
  config,
  loading,
  error,
  onItemClick,
  onItemUpdate,
  onItemDelete,
  onBulkAction,
  onConfigChange,
  className,
  columns: customColumns,
  enableRowSelection = true,
  enableColumnResize = true,
  enableSorting = true,
}: TableViewProps) {
  // 상태 관리
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: config?.pagination?.pageIndex || 0,
    pageSize: config?.pagination?.pageSize || 10,
  })

  // 컬럼 정의
  const defaultColumns = useTableColumns({
    onEdit: onItemUpdate,
    onDelete: onItemDelete,
    onView: onItemClick,
  })

  const columns = useMemo(() => {
    const baseColumns: ColumnDef<Task>[] = []

    // 선택 컬럼
    if (enableRowSelection) {
      baseColumns.push({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
            aria-label="Select all"
            className="w-4 h-4 rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(!!e.target.checked)}
            aria-label="Select row"
            className="w-4 h-4 rounded border-gray-300"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      })
    }

    // 커스텀 컬럼 또는 기본 컬럼 사용
    const dataColumns = customColumns || defaultColumns
    baseColumns.push(...dataColumns)

    // 액션 컬럼
    baseColumns.push({
      id: 'actions',
      header: '작업',
      cell: ({ row }) => {
        const task = row.original

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onItemClick?.(task)}
              className="h-8 px-2"
            >
              보기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onItemUpdate?.(task)}
              className="h-8 px-2"
            >
              편집
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onItemDelete?.(task.getId())}
              className="h-8 px-2 text-red-600 hover:text-red-700"
            >
              삭제
            </Button>
          </div>
        )
      },
      size: 80,
    })

    return baseColumns
  }, [customColumns, defaultColumns, enableRowSelection, onItemClick, onItemUpdate, onItemDelete])

  // 테이블 인스턴스 생성
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    enableRowSelection,
    enableColumnResizing: enableColumnResize,
  })

  // 선택된 행 처리
  React.useEffect(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedIds = new Set(selectedRows.map((row) => row.original.getId()))
    
    if (config?.selection && onConfigChange) {
      onConfigChange({
        ...config,
        selection: {
          ...config.selection,
          selectedIds,
        },
      })
    }
  }, [rowSelection, table, config, onConfigChange])

  // 페이지네이션 설정 동기화
  React.useEffect(() => {
    if (config?.pagination && onConfigChange) {
      onConfigChange({
        ...config,
        pagination: {
          ...config.pagination,
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          totalItems: data.length,
          totalPages: Math.ceil(data.length / pagination.pageSize),
        },
      })
    }
  }, [pagination, data.length, config, onConfigChange])

  // 로딩 상태
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-600">오류: {error.message}</div>
      </div>
    )
  }

  return (
    <div className={cn('w-full h-full flex flex-col', className)}>
      {/* 테이블 */}
      <div className="flex-1 overflow-auto rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'h-12 px-4 text-left align-middle font-medium text-gray-600',
                      header.column.getCanSort() && 'cursor-pointer select-none'
                    )}
                    style={{
                      width: header.getSize(),
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {enableSorting && header.column.getCanSort() && (
                          <span className="ml-auto">
                            {{
                              asc: <ChevronUp className="h-4 w-4" />,
                              desc: <ChevronDown className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'border-b transition-colors hover:bg-gray-50',
                    row.getIsSelected() && 'bg-blue-50'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 align-middle"
                      style={{
                        width: cell.column.getSize(),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            {table.getFilteredRowModel().rows.length}개 중{' '}
            {table.getFilteredSelectedRowModel().rows.length}개 선택됨
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            이전
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  )
})

export default TableView