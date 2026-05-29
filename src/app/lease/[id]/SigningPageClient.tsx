'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateLeasePDF } from '@/lib/lease-utils'
import SignaturePad from '@/components/lease/SignaturePad'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function LeaseSigningPage({ leaseId, leaseData }: { leaseId: string, leaseData: any }) {
  const [loading, setLoading] = useState(false)
  const [isSigned, setIsSigned] = useState(false)
  const supabase = createClient()

  const handleSignLease = async (signatureDataUrl: string) => {
    setLoading(true)
    try {
      const auditHash = crypto.randomUUID()
      const pdfBytes = await generateLeasePDF({
        tenantName: leaseData.tenant_name,
        landlordName: leaseData.landlord_name,
        propertyAddress: leaseData.property_address,
        rentAmount: leaseData.rent_amount,
        startDate: leaseData.start_date,
        endDate: leaseData.end_date,
        signatureDataUrl,
        auditHash,
      })

      const fileName = `signed_lease_${leaseId}.pdf`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('leases')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('leases')
        .update({
          signed_lease_url: uploadData.path,
          signature_hash: auditHash,
          status: 'active'
        })
        .eq('id', leaseId)

      if (updateError) throw updateError

      setIsSigned(true)
      toast.success('Lease signed and uploaded successfully!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (isSigned) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white border rounded-lg shadow-sm text-center">
        <h2 className="text-2xl font-bold mb-4">Lease Signed!</h2>
        <p className="text-slate-600 mb-6">Your lease has been legally signed and is now active. You can download it from your dashboard.</p>
        <Button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Lease Signing</CardTitle>
          <CardDescription>Review the lease agreement below and sign in the pad provided.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-md border text-sm prose max-w-none">
            <h3>Standard Lease Agreement</h3>
            <p><strong>Property:</strong> {leaseData.property_address}</p>
            <p><strong>Tenant:</strong> {leaseData.tenant_name}</p>
            <p><strong>Rent:</strong> R{leaseData.rent_amount} per month</p>
            <p><strong>Duration:</strong> {leaseData.start_date} to {leaseData.end_date}</p>
            <hr />
            <p>I hereby agree to the terms and conditions outlined in this lease agreement...</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Signature</label>
            <SignaturePad onSave={handleSignLease} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
