import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to set up your workspace.' }, { status: 401 })
  const body = await request.json() as { action?: string; property?: Record<string, unknown>; units?: Array<Record<string, unknown>> }
  if (body.action !== 'create-property' || !body.property?.name || !body.property.city || !body.property.province) return NextResponse.json({ error: 'Property name, city and province are required.' }, { status: 400 })
  const { data: property, error: propertyError } = await supabase.from('properties').insert({ owner_id: user.id, name: body.property.name, address: body.property.address || '', city: body.property.city, province: body.property.province, postal_code: body.property.postalCode || '' }).select().single()
  if (propertyError) return NextResponse.json({ error: propertyError.message }, { status: 400 })
  const units = (body.units || []).filter(unit => unit.unitNumber).map(unit => ({ property_id: property.id, unit_number: unit.unitNumber, rent_amount: Number(unit.rentAmount || 0), is_occupied: false }))
  if (units.length) { const { error } = await supabase.from('units').insert(units); if (error) return NextResponse.json({ error: error.message }, { status: 400 }) }
  await supabase.from('audit_events').insert({ actor_id: user.id, action: 'workspace_property_created', entity_type: 'property', entity_id: property.id, source: 'user', metadata: { units: units.length } })
  return NextResponse.json({ property, units }, { status: 201 })
}
