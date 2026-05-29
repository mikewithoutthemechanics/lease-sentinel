'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function TenantApplicationForm({ unitId }: { unitId: string }) {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    id_doc: null,
    bank_statements: null,
    proof_res: null,
  })
  const supabase = createClient()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [key]: e.target.files[0] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const uploadFile = async (file: File, path: string) => {
        const { data, error } = await supabase.storage
          .from('fica-documents')
          .upload(`${user.id}/${Date.now()}_${path}`, file)
        if (error) throw error
        return data.path
      }

      const idPath = files.id_doc ? await uploadFile(files.id_doc, 'id_doc') : null
      const bankPath = files.bank_statements ? await uploadFile(files.bank_statements, 'bank_statements') : null
      const proofPath = files.proof_res ? await uploadFile(files.proof_res, 'proof_res') : null

      const { error: appError } = await supabase.from('applications').insert({
        unit_id: unitId,
        tenant_id: user.id,
        id_document_url: idPath,
        bank_statements_url: bankPath,
        proof_of_residence_url: proofPath,
        status: 'pending'
      })

      if (appError) throw appError

      toast.success('Application submitted successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Tenant Application</CardTitle>
        <CardDescription>Please upload your FICA documents to proceed with the application.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="id_doc">Identity Document (ID/Passport)</Label>
            <Input id="id_doc" type="file" accept=".pdf,image/*" onChange={(e) => handleFileChange(e, 'id_doc')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_statements">3 Months Bank Statements</Label>
            <Input id="bank_statements" type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'bank_statements')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proof_res">Proof of Residence</Label>
            <Input id="proof_res" type="file" accept=".pdf,image/*" onChange={(e) => handleFileChange(e, 'proof_res')} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Uploading...' : 'Submit Application'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
