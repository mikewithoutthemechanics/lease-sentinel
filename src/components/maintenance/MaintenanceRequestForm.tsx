'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const categories = ['general', 'plumbing', 'electrical', 'hvac', 'security', 'appliance', 'structural']

export default function MaintenanceRequestForm({ unitId }: { unitId: string }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState('normal')
  const [media, setMedia] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in before submitting a request.')
      let mediaPath: string | null = null
      if (media) {
        const extension = media.name.split('.').pop() || 'bin'
        const upload = await supabase.storage.from('maintenance-photos').upload(`${user.id}/${Date.now()}_issue.${extension}`, media, { contentType: media.type, upsert: false })
        if (upload.error) throw upload.error
        mediaPath = upload.data.path
      }
      const response = await fetch('/api/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', unitId, title, description, category, priority, photoUrl: mediaPath }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      toast.success('Request submitted. We will keep you updated.')
      setTitle(''); setDescription(''); setCategory('general'); setPriority('normal'); setMedia(null)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to submit request.') } finally { setLoading(false) }
  }

  return <Card><CardHeader><CardTitle>Report an issue</CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="maintenance-title">Short title</Label><Input id="maintenance-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Kitchen tap is leaking" required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="maintenance-category">Category</Label><select id="maintenance-category" value={category} onChange={event => setCategory(event.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm capitalize"><option value="general">General</option>{categories.slice(1).map(item => <option key={item} value={item}>{item}</option>)}</select></div><div className="space-y-2"><Label htmlFor="maintenance-priority">Urgency</Label><select id="maintenance-priority" value={priority} onChange={event => setPriority(event.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="emergency">Emergency</option></select></div></div><div className="space-y-2"><Label htmlFor="maintenance-description">What happened?</Label><Textarea id="maintenance-description" rows={4} value={description} onChange={event => setDescription(event.target.value)} placeholder="Tell us what happened, when it started and whether anything is unsafe..." required /></div><div className="space-y-2"><Label htmlFor="maintenance-media">Photo or video (optional)</Label><Input id="maintenance-media" type="file" accept="image/*,video/*" onChange={event => setMedia(event.target.files?.[0] || null)} /><p className="text-xs text-muted-foreground">A photo helps us send the right contractor first time.</p></div><Button type="submit" disabled={loading} className="w-full bg-[#193b37] hover:bg-[#27564f]">{loading ? 'Submitting…' : 'Submit request'}</Button></form></CardContent></Card>
}
