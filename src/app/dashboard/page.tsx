import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome, {profile?.full_name || user.email}</h1>
      <p className="text-slate-600 mb-8">You are logged in as a {profile?.role || 'tenant'}.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow border">
          <h2 className="font-semibold text-lg mb-2">Properties</h2>
          <p className="text-sm text-slate-500">View and manage your properties.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow border">
          <h2 className="font-semibold text-lg mb-2">Leases</h2>
          <p className="text-sm text-slate-500">Track your active leases and applications.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow border">
          <h2 className="font-semibold text-lg mb-2">Maintenance</h2>
          <p className="text-sm text-slate-500">Report or manage maintenance issues.</p>
        </div>
      </div>
    </div>
  )
}
