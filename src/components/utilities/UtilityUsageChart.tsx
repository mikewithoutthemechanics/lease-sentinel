'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function UtilityUsageChart({ data }: { data: any[] }) {
  return (
    <Card className="w-full h-80">
      <CardHeader>
        <CardTitle>Utility Spend Trends</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="reading_date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="amount_due" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
