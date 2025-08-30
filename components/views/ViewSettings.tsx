'use client'

import React, { useCallback } from 'react'
import {
  Settings,
  Eye,
  EyeOff,
  Grid3x3,
  Maximize2,
  Minimize2,
  ToggleLeft,
  ToggleRight,
  Palette,
  Layout,
  Save,
  RotateCcw,
  Download,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { ViewType, ViewConfig } from '@/lib/views/types'

interface ViewSettingsProps {
  /**
   * 현재 뷰 타입
   */
  viewType: ViewType
  /**
   * 뷰 설정
   */
  config: ViewConfig
  /**
   * 설정 변경 핸들러
   */
  onConfigChange: (config: Partial<ViewConfig>) => void
  /**
   * 설정 리셋 핸들러
   */
  onReset?: () => void
  /**
   * 설정 저장 핸들러
   */
  onSave?: () => void
  /**
   * 설정 내보내기 핸들러
   */
  onExport?: () => void
  /**
   * 설정 가져오기 핸들러
   */
  onImport?: (file: File) => void
  /**
   * 컴팩트 모드
   */
  compact?: boolean
  className?: string
}

/**
 * 뷰별 설정 및 커스터마이징 컴포넌트
 * 각 뷰의 표시 옵션, 레이아웃, 스타일 등을 설정
 */
export function ViewSettings({
  viewType,
  config,
  onConfigChange,
  onReset,
  onSave,
  onExport,
  onImport,
  compact = false,
  className,
}: ViewSettingsProps) {
  // 표시 설정 변경
  const handleDisplaySettingChange = useCallback((key: string, value: any) => {
    onConfigChange({
      displaySettings: {
        ...config.displaySettings,
        [key]: value,
      },
    })
  }, [config.displaySettings, onConfigChange])

  // 페이지네이션 설정 변경
  const handlePaginationChange = useCallback((key: string, value: any) => {
    onConfigChange({
      pagination: {
        ...config.pagination,
        [key]: value,
      },
    })
  }, [config.pagination, onConfigChange])

  // 파일 입력 핸들러
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImport) {
      onImport(file)
    }
  }, [onImport])

  // 뷰별 특정 설정 렌더링
  const renderViewSpecificSettings = () => {
    switch (viewType) {
      case 'table':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>컬럼 고정</Label>
              <Select
                value={config.displaySettings?.frozenColumns?.toString() || '0'}
                onValueChange={(value) => handleDisplaySettingChange('frozenColumns', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">없음</SelectItem>
                  <SelectItem value="1">1개 컬럼</SelectItem>
                  <SelectItem value="2">2개 컬럼</SelectItem>
                  <SelectItem value="3">3개 컬럼</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-row-numbers">행 번호 표시</Label>
              <Switch
                id="show-row-numbers"
                checked={config.displaySettings?.showRowNumbers || false}
                onCheckedChange={(checked) => handleDisplaySettingChange('showRowNumbers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enable-column-resize">컬럼 크기 조절</Label>
              <Switch
                id="enable-column-resize"
                checked={config.displaySettings?.enableColumnResize !== false}
                onCheckedChange={(checked) => handleDisplaySettingChange('enableColumnResize', checked)}
              />
            </div>
          </div>
        )

      case 'kanban':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>컬럼 너비</Label>
              <Select
                value={config.displaySettings?.columnWidth || 'medium'}
                onValueChange={(value) => handleDisplaySettingChange('columnWidth', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">컴팩트 (250px)</SelectItem>
                  <SelectItem value="medium">보통 (300px)</SelectItem>
                  <SelectItem value="wide">넓게 (350px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-empty-columns">빈 컬럼 표시</Label>
              <Switch
                id="show-empty-columns"
                checked={config.displaySettings?.showEmptyColumns !== false}
                onCheckedChange={(checked) => handleDisplaySettingChange('showEmptyColumns', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enable-drag-drop">드래그 앤 드롭</Label>
              <Switch
                id="enable-drag-drop"
                checked={config.displaySettings?.enableDragDrop !== false}
                onCheckedChange={(checked) => handleDisplaySettingChange('enableDragDrop', checked)}
              />
            </div>
          </div>
        )

      case 'calendar':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>기본 뷰</Label>
              <RadioGroup
                value={config.displaySettings?.defaultCalendarView || 'month'}
                onValueChange={(value) => handleDisplaySettingChange('defaultCalendarView', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="month" id="month" />
                  <Label htmlFor="month">월간</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="week" id="week" />
                  <Label htmlFor="week">주간</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="day" id="day" />
                  <Label htmlFor="day">일간</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-weekends">주말 표시</Label>
              <Switch
                id="show-weekends"
                checked={config.displaySettings?.showWeekends !== false}
                onCheckedChange={(checked) => handleDisplaySettingChange('showWeekends', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-week-numbers">주 번호 표시</Label>
              <Switch
                id="show-week-numbers"
                checked={config.displaySettings?.showWeekNumbers || false}
                onCheckedChange={(checked) => handleDisplaySettingChange('showWeekNumbers', checked)}
              />
            </div>
          </div>
        )

      case 'timeline':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>시간 단위</Label>
              <Select
                value={config.displaySettings?.timelineScale || 'days'}
                onValueChange={(value) => handleDisplaySettingChange('timelineScale', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">시간</SelectItem>
                  <SelectItem value="days">일</SelectItem>
                  <SelectItem value="weeks">주</SelectItem>
                  <SelectItem value="months">월</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-dependencies">의존성 표시</Label>
              <Switch
                id="show-dependencies"
                checked={config.displaySettings?.showDependencies !== false}
                onCheckedChange={(checked) => handleDisplaySettingChange('showDependencies', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-milestones">마일스톤 표시</Label>
              <Switch
                id="show-milestones"
                checked={config.displaySettings?.showMilestones !== false}
                onCheckedChange={(checked) => handleDisplaySettingChange('showMilestones', checked)}
              />
            </div>
          </div>
        )

      case 'gallery':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>카드 크기</Label>
              <RadioGroup
                value={config.displaySettings?.cardSize || 'medium'}
                onValueChange={(value) => handleDisplaySettingChange('cardSize', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="small" id="small" />
                  <Label htmlFor="small">작게</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">보통</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large" id="large" />
                  <Label htmlFor="large">크게</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>컬럼 수</Label>
              <Slider
                value={[config.displaySettings?.galleryColumns || 3]}
                onValueChange={([value]) => handleDisplaySettingChange('galleryColumns', value)}
                min={1}
                max={6}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-center">
                {config.displaySettings?.galleryColumns || 3}개 컬럼
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enable-masonry">Masonry 레이아웃</Label>
              <Switch
                id="enable-masonry"
                checked={config.displaySettings?.enableMasonry || false}
                onCheckedChange={(checked) => handleDisplaySettingChange('enableMasonry', checked)}
              />
            </div>
          </div>
        )

      case 'list':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>들여쓰기 크기</Label>
              <Slider
                value={[config.displaySettings?.indentSize || 24]}
                onValueChange={([value]) => handleDisplaySettingChange('indentSize', value)}
                min={16}
                max={48}
                step={4}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-center">
                {config.displaySettings?.indentSize || 24}px
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-hierarchy">계층 구조 표시</Label>
              <Switch
                id="show-hierarchy"
                checked={config.displaySettings?.showHierarchy !== false}
                onCheckedChange={(checked) => handleDisplaySettingChange('showHierarchy', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="default-expanded">기본 펼침 상태</Label>
              <Switch
                id="default-expanded"
                checked={config.displaySettings?.defaultExpanded || false}
                onCheckedChange={(checked) => handleDisplaySettingChange('defaultExpanded', checked)}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (compact) {
    // 컴팩트 모드
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">뷰 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 공통 설정 */}
          <div className="space-y-2">
            <Label className="text-xs">표시 밀도</Label>
            <Select
              value={config.displaySettings?.density || 'normal'}
              onValueChange={(value) => handleDisplaySettingChange('density', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">컴팩트</SelectItem>
                <SelectItem value="normal">보통</SelectItem>
                <SelectItem value="comfortable">넓게</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 뷰별 설정 */}
          {renderViewSpecificSettings()}

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-2">
            {onReset && (
              <Button variant="outline" size="sm" onClick={onReset} className="flex-1">
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            {onSave && (
              <Button size="sm" onClick={onSave} className="flex-1">
                <Save className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 전체 모드
  return (
    <div className={cn('space-y-6', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">뷰 설정</h2>
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          )}
          {onImport && (
            <label>
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  가져오기
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
          )}
        </div>
      </div>

      <Tabs defaultValue="display" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="display">표시</TabsTrigger>
          <TabsTrigger value="layout">레이아웃</TabsTrigger>
          <TabsTrigger value="advanced">고급</TabsTrigger>
        </TabsList>

        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">표시 옵션</CardTitle>
              <CardDescription>데이터 표시 방식을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 공통 표시 설정 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-subtasks">하위 작업 표시</Label>
                  <Switch
                    id="show-subtasks"
                    checked={config.displaySettings?.showSubtasks !== false}
                    onCheckedChange={(checked) => handleDisplaySettingChange('showSubtasks', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-attachments">첨부파일 표시</Label>
                  <Switch
                    id="show-attachments"
                    checked={config.displaySettings?.showAttachments || false}
                    onCheckedChange={(checked) => handleDisplaySettingChange('showAttachments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-comments">댓글 표시</Label>
                  <Switch
                    id="show-comments"
                    checked={config.displaySettings?.showComments || false}
                    onCheckedChange={(checked) => handleDisplaySettingChange('showComments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-time-tracking">시간 추적 표시</Label>
                  <Switch
                    id="show-time-tracking"
                    checked={config.displaySettings?.showTimeTracking || false}
                    onCheckedChange={(checked) => handleDisplaySettingChange('showTimeTracking', checked)}
                  />
                </div>
              </div>

              <Separator />

              {/* 뷰별 표시 설정 */}
              {renderViewSpecificSettings()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">레이아웃</CardTitle>
              <CardDescription>화면 레이아웃을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>표시 밀도</Label>
                <RadioGroup
                  value={config.displaySettings?.density || 'normal'}
                  onValueChange={(value) => handleDisplaySettingChange('density', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compact" id="compact" />
                    <Label htmlFor="compact">컴팩트</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label htmlFor="normal">보통</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comfortable" id="comfortable" />
                    <Label htmlFor="comfortable">넓게</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>페이지 크기</Label>
                <Select
                  value={config.pagination?.pageSize?.toString() || '20'}
                  onValueChange={(value) => handlePaginationChange('pageSize', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10개</SelectItem>
                    <SelectItem value="20">20개</SelectItem>
                    <SelectItem value="50">50개</SelectItem>
                    <SelectItem value="100">100개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">고급 설정</CardTitle>
              <CardDescription>고급 옵션을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-shortcuts">키보드 단축키</Label>
                <Switch
                  id="enable-shortcuts"
                  checked={config.displaySettings?.enableShortcuts !== false}
                  onCheckedChange={(checked) => handleDisplaySettingChange('enableShortcuts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enable-animations">애니메이션</Label>
                <Switch
                  id="enable-animations"
                  checked={config.displaySettings?.enableAnimations !== false}
                  onCheckedChange={(checked) => handleDisplaySettingChange('enableAnimations', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-save">자동 저장</Label>
                <Switch
                  id="auto-save"
                  checked={config.displaySettings?.autoSave || false}
                  onCheckedChange={(checked) => handleDisplaySettingChange('autoSave', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end gap-2">
        {onReset && (
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            초기화
          </Button>
        )}
        {onSave && (
          <Button onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            저장
          </Button>
        )}
      </div>
    </div>
  )
}

export default ViewSettings