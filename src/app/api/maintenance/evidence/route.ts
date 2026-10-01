import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const form = await request.formData()
  const file = form.get('file')
  const requestId = String(form.get('requestId') || '')
  if (!(file instanceof File) || !requestId) return NextResponse.json({ error: 'A file and requestId are required' }, { status: 400 })
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return NextResponse.json({ error: 'Only image and video evidence is allowed' }, { status: 415 })
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: 'Evidence must be smaller than 25MB' }, { status: 413 })
  const path = `maintenance/${requestId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const { error } = await supabase.storage.from('maintenance-photos').upload(path, file, { contentType: file.type, upsert: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ path })
}
