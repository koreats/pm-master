'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface EditableCellProps {
  value: any
  row: any
  column: any
  onUpdate: (value: any) => void | Promise<void>
  type?: 'text' | 'select' | 'date' | 'number'
  options?: Array<{ value: string; label: string }>
}

/**
 * 인라인 편집 가능한 셀 컴포넌트 (간소화 버전)
 */
export function EditableCell({
  value: initialValue,
  row,
  column,
  onUpdate,
  type = 'text',
  options = [],
}: EditableCellProps) {
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (value === initialValue) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onUpdate(value)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update:', error)
      setValue(initialValue)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setValue(initialValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isEditing) {
    return (
      <div
        className="px-2 py-1 cursor-pointer hover:bg-gray-50 rounded transition-colors min-h-[32px] flex items-center"
        onClick={() => setIsEditing(true)}
      >
        {type === 'date' && value ? (
          <span>{format(new Date(value), 'yyyy-MM-dd', { locale: ko })}</span>
        ) : type === 'select' && options.length > 0 ? (
          <span>{options.find(opt => opt.value === value)?.label || value}</span>
        ) : (
          <span>{value || <span className="text-gray-400">클릭하여 편집</span>}</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {(type === 'text' || type === 'number') && (
        <>
          <Input
            ref={inputRef}
            type={type}
            value={value}
            onChange={(e) => setValue(type === 'number' ? e.target.valueAsNumber : e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            disabled={isLoading}
            className="h-8"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </>
      )}

      {/* select와 date는 간단한 input으로 대체 */}
      {(type === 'select' || type === 'date') && (
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isLoading}
          className="h-8"
          placeholder={type === 'date' ? 'YYYY-MM-DD' : '값 입력'}
        />
      )}
    </div>
  )
}

/**
 * 인라인 편집을 지원하는 컬럼 생성 헬퍼
 */
export function createEditableColumn<T extends Record<string, any>>({
  accessorKey,
  header,
  type = 'text',
  options,
  onUpdate,
}: {
  accessorKey: keyof T
  header: string
  type?: 'text' | 'select' | 'date' | 'number'
  options?: Array<{ value: string; label: string }>
  onUpdate?: (row: T, value: any) => void | Promise<void>
}) {
  return {
    accessorKey,
    header,
    cell: ({ row, column }: any) => {
      if (!onUpdate) {
        return row.getValue(accessorKey)
      }

      return (
        <EditableCell
          value={row.getValue(accessorKey)}
          row={row}
          column={column}
          type={type}
          options={options}
          onUpdate={(value) => onUpdate(row.original, value)}
        />
      )
    },
  }
}