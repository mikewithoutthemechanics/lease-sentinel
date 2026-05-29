import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 text-center bg-slate-50">
      <h1 className="text-5xl font-extrabold text-slate-900 mb-6">Lease Sentinel</h1>
      <p className="text-xl text-slate-600 max-w-2xl mb-10">
        The ultimate property management solution for South African landlords and tenants.
        Streamline applications, leases, payments, and maintenance.
      </p>

      <div className="flex gap-4">
        {user ? (
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        ) : (
          <>
            <Link href="/login">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </>
        )}
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3 className="text-lg font-bold mb-2">Smart Applications</h3>
          <p className="text-sm text-slate-500">Secure FICA document uploads and automated tenant screening.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3 className="text-lg font-bold mb-2">Digital Leases</h3>
          <p className="text-sm text-slate-500">Legally binding digital signatures with secure PDF generation.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3 className="text-lg font-bold mb-2">AI Maintenance</h3>
          <p className="text-sm text-slate-500">Groq-powered auto-assignment of contractors for property issues.</p>
        </div>
      </div>
    </div>
  )
}
