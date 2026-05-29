import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { categorizeIssueAndSuggestContractor } from '@/lib/ai-service'

export async function POST(request: Request) {
  const { requestId } = await request.json()
  const supabase = await createClient()

  const { data: maintenanceReq, error: reqError } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (reqError) return NextResponse.json({ error: reqError.message }, { status: 400 })

  const { data: contractors, error: conError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'contractor')

  if (conError) return NextResponse.json({ error: conError.message }, { status: 400 })

  const aiResult = await categorizeIssueAndSuggestContractor(maintenanceReq.description, contractors || [])

  if (aiResult.suggested_contractor_id) {
    await supabase
      .from('maintenance_requests')
      .update({
        contractor_id: aiResult.suggested_contractor_id,
        status: 'assigned'
      })
      .eq('id', requestId)
  }

  return NextResponse.json({ aiResult })
}
