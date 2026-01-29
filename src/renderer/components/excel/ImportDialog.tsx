import { useState, useEffect } from 'react'
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ImportResult {
  success: boolean
  categoriesCreated: number
  customersCreated: number
  transactionsCreated: number
  orderItemsCreated: number
  errors: string[]
}

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

const MONTHS = [
  { value: '01', label: '1月' },
  { value: '02', label: '2月' },
  { value: '03', label: '3月' },
  { value: '04', label: '4月' },
  { value: '05', label: '5月' },
  { value: '06', label: '6月' },
  { value: '07', label: '7月' },
  { value: '08', label: '8月' },
  { value: '09', label: '9月' },
  { value: '10', label: '10月' },
  { value: '11', label: '11月' },
  { value: '12', label: '12月' },
]

export function ImportDialog({ isOpen, onClose, onImportComplete }: ImportDialogProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'importing' | 'result'>('select')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [month, setMonth] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('select')
      setFilePath(null)
      setYear(new Date().getFullYear().toString())
      setMonth('')
      setResult(null)
    }
  }, [isOpen])

  const handleSelectFile = async () => {
    const path = await window.api.excel.selectFile()
    if (path) {
      setFilePath(path)
      // Try to detect month from file
      const detectedMonth = await window.api.excel.detectMonth(path)
      if (detectedMonth) {
        setMonth(detectedMonth)
      }
      setStep('configure')
    }
  }

  const handleImport = async () => {
    if (!filePath || !year || !month) return

    setStep('importing')
    setIsImporting(true)

    try {
      const importResult = await window.api.excel.import(filePath, year, month)
      setResult(importResult)
      if (importResult.success) {
        onImportComplete()
        onClose()
      } else {
        setStep('result')
      }
    } catch (error) {
      setResult({
        success: false,
        categoriesCreated: 0,
        customersCreated: 0,
        transactionsCreated: 0,
        orderItemsCreated: 0,
        errors: [String(error)],
      })
      setStep('result')
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    if (!isImporting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            导入Excel数据
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && '选择要导入的Excel文件'}
            {step === 'configure' && '设置导入的年份和月份'}
            {step === 'importing' && '正在导入数据...'}
            {step === 'result' && (result?.success ? '导入完成' : '导入出错')}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select File */}
        {step === 'select' && (
          <div className="py-8">
            <div
              onClick={handleSelectFile}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">点击选择Excel文件</p>
              <p className="text-gray-400 text-sm mt-1">支持 .xlsx, .xls 格式</p>
            </div>
          </div>
        )}

        {/* Step 2: Configure Year and Month */}
        {step === 'configure' && (
          <div className="py-4 space-y-4">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">
                <span className="font-medium">已选择文件:</span>{' '}
                {filePath?.split('/').pop() || filePath?.split('\\').pop()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">年份</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2026"
                  min="2000"
                  max="2100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">月份</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择月份" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              数据将导入到分类: <span className="font-medium">{year}-{month || 'XX'}</span>
            </p>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">正在导入数据，请稍候...</p>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 'result' && result && (
          <div className="py-4">
            {result.success ? (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-4">导入成功!</p>
                <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">新建分类:</span> {result.categoriesCreated}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">新建客户:</span> {result.customersCreated}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">新建交易:</span> {result.transactionsCreated}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">新建订单项:</span> {result.orderItemsCreated}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-4">导入失败</p>
                <div className="bg-red-50 rounded-lg p-4 text-left">
                  {result.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'select' && (
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
          )}
          {step === 'configure' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')}>
                返回
              </Button>
              <Button onClick={handleImport} disabled={!year || !month}>
                开始导入
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={handleClose}>
              {result?.success ? '完成' : '关闭'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
