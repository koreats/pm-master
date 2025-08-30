'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Task } from '@/lib/core/domain/entities/Task'

interface EditableCellProps {
  value: any
  row: any
  column: any
  onUpdate: (value: any) => void | Promise<void>
  type?: 'text' | 'select' | 'date' | 'number'
  options?: Array<{ value: string; label: string }>
}

/**
 * 인라인 편집 가능한 셀 컴포넌트
 * 다양한 타입의 입력을 지원
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
      {type === 'text' && (
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isLoading}
          className="h-8"
        />
      )}

      {type === 'number' && (
        <Input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.valueAsNumber)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isLoading}
          className="h-8"
        />
      )}

      {type === 'select' && (
        <Select
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue)
            handleSave()
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {type === 'date' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-8 justify-start text-left font-normal',
                !value && 'text-muted-foreground'
              )}
              disabled={isLoading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), 'yyyy-MM-dd', { locale: ko }) : '날짜 선택'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => {
                setValue(date?.toISOString())
                handleSave()
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}

      {(type === 'text' || type === 'number') && (
        <>
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