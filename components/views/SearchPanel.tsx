'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Search,
  X,
  Filter,
  History,
  Star,
  Command,
  ArrowRight,
  Hash,
  AtSign,
  Calendar,
  Tag,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command as CommandPrimitive,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Separator } from '@/components/ui/separator'

interface SearchFilter {
  type: 'status' | 'priority' | 'assignee' | 'tag' | 'date' | 'custom'
  value: string
  label: string
  icon?: React.ReactNode
}

interface SearchPanelProps {
  /**
   * 검색 쿼리
   */
  query?: string
  /**
   * 검색 쿼리 변경 핸들러
   */
  onQueryChange?: (query: string) => void
  /**
   * 검색 실행 핸들러
   */
  onSearch?: (query: string, filters?: SearchFilter[]) => void
  /**
   * 검색 기록
   */
  searchHistory?: string[]
  /**
   * 즐겨찾기 검색
   */
  favoriteSearches?: Array<{ query: string; filters?: SearchFilter[] }>
  /**
   * 자동완성 제안
   */
  suggestions?: string[]
  /**
   * 고급 검색 모드
   */
  advancedMode?: boolean
  /**
   * 실시간 검색
   */
  realtime?: boolean
  /**
   * 디바운스 지연 (ms)
   */
  debounceDelay?: number
  /**
   * 플레이스홀더
   */
  placeholder?: string
  className?: string
}

/**
 * 통합 검색 패널 컴포넌트
 * 고급 검색, 필터, 자동완성 기능 제공
 */
export function SearchPanel({
  query: controlledQuery,
  onQueryChange,
  onSearch,
  searchHistory = [],
  favoriteSearches = [],
  suggestions = [],
  advancedMode = false,
  realtime = true,
  debounceDelay = 300,
  placeholder = '검색어를 입력하세요...',
  className,
}: SearchPanelProps) {
  // 상태 관리
  const [localQuery, setLocalQuery] = useState(controlledQuery || '')
  const [filters, setFilters] = useState<SearchFilter[]>([])
  const [isAdvanced, setIsAdvanced] = useState(advancedMode)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // 실제 사용할 쿼리
  const query = controlledQuery !== undefined ? controlledQuery : localQuery

  // 검색 실행
  const executeSearch = useCallback((searchQuery: string, searchFilters?: SearchFilter[]) => {
    if (onSearch) {
      onSearch(searchQuery, searchFilters || filters)
    }
  }, [onSearch, filters])

  // 쿼리 변경 핸들러
  const handleQueryChange = useCallback((value: string) => {
    if (controlledQuery === undefined) {
      setLocalQuery(value)
    }
    
    if (onQueryChange) {
      onQueryChange(value)
    }

    // 실시간 검색
    if (realtime && value.trim()) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        executeSearch(value)
      }, debounceDelay)
    }
  }, [controlledQuery, onQueryChange, realtime, debounceDelay, executeSearch])

  // 필터 추가
  const addFilter = useCallback((filter: SearchFilter) => {
    setFilters(prev => [...prev, filter])
  }, [])

  // 필터 제거
  const removeFilter = useCallback((index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 필터 초기화
  const clearFilters = useCallback(() => {
    setFilters([])
  }, [])

  // 검색 초기화
  const clearSearch = useCallback(() => {
    handleQueryChange('')
    clearFilters()
    inputRef.current?.focus()
  }, [handleQueryChange, clearFilters])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: 검색 포커스
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      // Escape: 검색 초기화
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        clearSearch()
      }
      // Enter: 검색 실행
      if (e.key === 'Enter' && document.activeElement === inputRef.current) {
        executeSearch(query)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [query, clearSearch, executeSearch])

  // 고급 검색 명령어 파싱
  const parseAdvancedQuery = useCallback((input: string) => {
    const newFilters: SearchFilter[] = []
    let cleanQuery = input

    // 상태 필터: @status:value
    const statusMatch = input.match(/@status:(\w+)/g)
    if (statusMatch) {
      statusMatch.forEach(match => {
        const value = match.replace('@status:', '')
        newFilters.push({
          type: 'status',
          value,
          label: `상태: ${value}`,
          icon: <Hash className="h-3 w-3" />,
        })
        cleanQuery = cleanQuery.replace(match, '')
      })
    }

    // 우선순위 필터: #priority:value
    const priorityMatch = input.match(/#priority:(\w+)/g)
    if (priorityMatch) {
      priorityMatch.forEach(match => {
        const value = match.replace('#priority:', '')
        newFilters.push({
          type: 'priority',
          value,
          label: `우선순위: ${value}`,
          icon: <Tag className="h-3 w-3" />,
        })
        cleanQuery = cleanQuery.replace(match, '')
      })
    }

    // 담당자 필터: @user:value
    const assigneeMatch = input.match(/@(\w+)/g)
    if (assigneeMatch) {
      assigneeMatch.forEach(match => {
        const value = match.replace('@', '')
        if (!match.includes(':')) {
          newFilters.push({
            type: 'assignee',
            value,
            label: `담당자: ${value}`,
            icon: <AtSign className="h-3 w-3" />,
          })
          cleanQuery = cleanQuery.replace(match, '')
        }
      })
    }

    setFilters(newFilters)
    return cleanQuery.trim()
  }, [])

  // 고급 검색 토글
  const toggleAdvancedMode = useCallback(() => {
    setIsAdvanced(!isAdvanced)
    if (!isAdvanced) {
      // 고급 모드 활성화 시 쿼리 파싱
      const cleanQuery = parseAdvancedQuery(query)
      handleQueryChange(cleanQuery)
    }
  }, [isAdvanced, query, parseAdvancedQuery, handleQueryChange])

  return (
    <div className={cn('relative', className)}>
      {/* 메인 검색 바 */}
      <div className="relative">
        <div className="relative flex items-center">
          {/* 검색 아이콘 */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          
          {/* 검색 입력 */}
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className={cn(
              'pl-10 pr-24',
              filters.length > 0 && 'pb-8'
            )}
          />

          {/* 우측 액션 버튼들 */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* 고급 검색 토글 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAdvancedMode}
              className={cn(
                'h-7 w-7 p-0',
                isAdvanced && 'bg-muted'
              )}
              title="고급 검색"
            >
              <Command className="h-3 w-3" />
            </Button>

            {/* 검색 기록 */}
            {searchHistory.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="검색 기록"
                  >
                    <History className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-2" align="end">
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      최근 검색
                    </div>
                    {searchHistory.slice(0, 5).map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleQueryChange(item)
                          executeSearch(item)
                        }}
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* 검색 초기화 */}
            {(query || filters.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-7 w-7 p-0"
                title="초기화"
              >
                <X className="h-3 w-3" />
              </Button>
            )}

            {/* 검색 버튼 */}
            {!realtime && (
              <Button
                size="sm"
                onClick={() => executeSearch(query)}
                className="h-7 px-2"
              >
                <Search className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* 필터 표시 */}
          {filters.length > 0 && (
            <div className="absolute left-3 bottom-2 right-20 flex items-center gap-1 flex-wrap">
              {filters.map((filter, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="h-5 pl-1 pr-0.5 text-xs gap-1"
                >
                  {filter.icon}
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(index)}
                    className="ml-1 hover:bg-muted rounded-sm p-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 자동완성 제안 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md z-50">
          <div className="p-2 space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  handleQueryChange(suggestion)
                  executeSearch(suggestion)
                }}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm flex items-center gap-2"
              >
                <Search className="h-3 w-3 text-muted-foreground" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 고급 검색 패널 */}
      {isAdvanced && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-popover border rounded-md shadow-md z-40">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">고급 검색 명령어</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <code className="px-1 py-0.5 bg-muted rounded">@status:value</code>
                  <span>상태 필터</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-1 py-0.5 bg-muted rounded">#priority:value</code>
                  <span>우선순위 필터</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-1 py-0.5 bg-muted rounded">@username</code>
                  <span>담당자 필터</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-1 py-0.5 bg-muted rounded">#tag</code>
                  <span>태그 필터</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-1 py-0.5 bg-muted rounded">due:today</code>
                  <span>오늘 마감</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-1 py-0.5 bg-muted rounded">created:week</code>
                  <span>이번 주 생성</span>
                </div>
              </div>
            </div>

            {favoriteSearches.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">즐겨찾기 검색</h4>
                  <div className="space-y-1">
                    {favoriteSearches.map((favorite, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleQueryChange(favorite.query)
                          if (favorite.filters) {
                            setFilters(favorite.filters)
                          }
                          executeSearch(favorite.query, favorite.filters)
                        }}
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm flex items-center gap-2"
                      >
                        <Star className="h-3 w-3 text-yellow-500" />
                        {favorite.query}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchPanel