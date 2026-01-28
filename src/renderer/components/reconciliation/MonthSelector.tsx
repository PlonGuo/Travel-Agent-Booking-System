import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface MonthSelectorProps {
  selectedYear: number
  selectedMonth: number
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
}

const MONTHS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月'
]

export function MonthSelector({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange
}: MonthSelectorProps) {
  const currentYear = new Date().getFullYear()
  // Generate year options (current year - 2 to current year + 1)
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label className="text-base font-medium text-gray-700">选择月份:</Label>
        <Select value={String(selectedYear)} onValueChange={(value) => onYearChange(parseInt(value))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="选择年份" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Select value={String(selectedMonth)} onValueChange={(value) => onMonthChange(parseInt(value))}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="选择月份" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((month, index) => (
            <SelectItem key={index} value={String(index + 1)}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
