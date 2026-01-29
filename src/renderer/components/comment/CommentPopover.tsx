import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface CommentPopoverProps {
  comment?: string
  onSave: (comment: string) => Promise<void>
}

export function CommentPopover({ comment, onSave }: CommentPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(comment || '')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setValue(comment || '')
  }, [comment])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(value)
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${comment ? 'text-yellow-600' : 'text-muted-foreground'}`}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <p className="text-sm font-medium">备注</p>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="请输入备注..."
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setValue(comment || '')
                setIsOpen(false)
              }}
            >
              取消
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
