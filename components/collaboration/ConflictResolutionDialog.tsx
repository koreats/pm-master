'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  Clock, 
  Server, 
  GitMerge,
  Check,
  X
} from 'lucide-react'
import type { ConflictResolution, ConflictField } from '@/lib/collaboration/conflict'

interface ConflictResolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conflict: ConflictResolution
  onResolve: (resolution: 'local' | 'remote' | 'merge') => void
  onCancel: () => void
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflict,
  onResolve,
  onCancel
}: ConflictResolutionDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'remote' | 'merge'>('remote')
  
  const handleResolve = () => {
    onResolve(selectedResolution)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  const getStrategyIcon = (strategy: ConflictResolution['strategy']) => {
    switch (strategy) {
      case 'last_write_wins':
        return <Clock className="h-4 w-4" />
      case 'server_authority':
        return <Server className="h-4 w-4" />
      case 'merge':
        return <GitMerge className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const renderFieldConflict = (field: ConflictField) => {
    return (
      <div key={field.field} className="border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{field.field}</span>
          {field.resolution && (
            <Badge variant={field.resolution === 'local' ? 'default' : 'secondary'}>
              {field.resolution}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Your Version</Label>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(field.local, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Server Version</Label>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(field.remote, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {field.base !== undefined && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Original Version</Label>
            <div className="p-2 bg-gray-50 dark:bg-gray-900/20 rounded border border-gray-200 dark:border-gray-800">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(field.base, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Conflict Resolution Required
          </DialogTitle>
          <DialogDescription>
            A conflict was detected while syncing your changes. Please choose how to resolve it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Strategy */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {getStrategyIcon(conflict.strategy)}
            <span className="text-sm font-medium">
              Strategy: {conflict.strategy.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Conflict Fields */}
          {conflict.conflicts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Conflicting Fields:</Label>
              <div className="space-y-2">
                {conflict.conflicts.map(renderFieldConflict)}
              </div>
            </div>
          )}

          {/* Resolution Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Choose Resolution:</Label>
            <RadioGroup value={selectedResolution} onValueChange={(value: any) => setSelectedResolution(value)}>
              <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="local" id="local" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="local" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Keep Your Version</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use your local changes and overwrite the server version
                    </p>
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="remote" id="remote" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="remote" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Keep Server Version</Badge>
                      <Badge variant="outline" className="text-xs">Recommended</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Discard your changes and use the server version
                    </p>
                  </Label>
                </div>
              </div>

              {conflict.mergedData && (
                <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="merge" id="merge" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="merge" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <GitMerge className="h-3 w-3 mr-1" />
                          Merge Changes
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Combine both versions intelligently
                      </p>
                    </Label>
                  </div>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Warning */}
          {conflict.requiresUserIntervention && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This conflict requires manual intervention. The automatic resolution strategy
                could not determine the best approach. Please review the changes carefully.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleResolve}>
            <Check className="h-4 w-4 mr-2" />
            Apply Resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}