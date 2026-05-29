'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function ManualUtilityEntry({ unitId }: { unitId: string }) {
  const [type, setType] = useState('electricity')
  const [reading, setReading] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleTypeChange = (val: string | null) => {
    if (val) setType(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('utilities').insert({
        unit_id: unitId,
        type,
        reading_value: parseFloat(reading),
        amount_due: parseFloat(amount),
        reading_date: date
      })

      if (error) throw error
      toast.success('Utility reading recorded!')
      setReading('')
      setAmount('')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="font-semibold text-lg">Record Utility Usage</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="electricity">Electricity</SelectItem>
              <SelectItem value="water">Water</SelectItem>
              <SelectItem value="refuse">Refuse</SelectItem>
              <SelectItem value="sewage">Sewage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Reading Value</Label>
        <Input type="number" step="0.01" value={reading} onChange={(e) => setReading(e.target.value)} placeholder="e.g. 1250.5" />
      </div>
      <div className="space-y-2">
        <Label>Amount Due (R)</Label>
        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 450.00" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving...' : 'Record Reading'}
      </Button>
    </form>
  )
}
