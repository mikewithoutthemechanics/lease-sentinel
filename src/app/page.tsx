import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Shield, Zap, TrendingUp, Users, PenTool } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Lease Sentinel</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-600">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-extrabold text-slate-900 leading-tight mb-6">
              Property Management <br/>
              <span className="text-blue-600">Built for South Africa.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Automate your rental business with FICA-compliant applications, digital lease signing, AI-powered maintenance, and Payfast payments.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-200">
                  Start Managing for Free
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-slate-200">
                  See Features
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">POPIA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">FICA Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">VAT Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-50">
           <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl" />
           <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-100 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to scale</h2>
            <p className="text-slate-600">A unified platform for landlords, tenants, and contractors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-blue-600" />}
              title="FICA & Screening"
              description="Securely collect ID, bank statements, and proof of residence. Fully POPIA compliant document storage."
            />
            <FeatureCard
              icon={<PenTool className="w-6 h-6 text-blue-600" />}
              title="Digital Leases"
              description="Draw-to-sign custom lease agreements with secure PDF generation and cryptographic audit trails."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-blue-600" />}
              title="AI Maintenance"
              description="Tenants report issues with photos; Groq AI auto-assigns the best contractor from your preferred list."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
              title="Payfast Integration"
              description="Collect rent and levies via Payfast. Automatic invoice generation with VAT and South African tax logic."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-blue-600" />}
              title="Utility Tracking"
              description="Track electricity and water usage. Beautiful monthly spend charts for tenants to monitor trends."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-blue-600" />}
              title="Multi-Language"
              description="Full support for English, Zulu, Afrikaans, and Xhosa to serve all South African citizens."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-slate-900 mb-8">Simplified for Landlords. <br/> Seamless for Tenants.</h2>
              <div className="space-y-8">
                <Step num="01" title="List & Apply" desc="Landlords create units and share application links. Tenants upload FICA documents instantly." />
                <Step num="02" title="Sign & Pay" desc="Sign lease agreements digitally. Pay deposit and rent via secure Payfast checkout." />
                <Step num="03" title="Manage & Scale" desc="Handle maintenance via AI and track utilities with automated reporting." />
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-900 aspect-video rounded-2xl shadow-2xl flex items-center justify-center p-12 overflow-hidden relative">
               <div className="absolute inset-0 bg-blue-500/10" />
               <div className="relative z-10 w-full h-full border border-slate-700 rounded-lg bg-slate-800/50 backdrop-blur-xl p-4 shadow-inner">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                    <div className="h-4 bg-slate-700 rounded w-1/2" />
                    <div className="h-20 bg-slate-700/50 rounded w-full mt-6" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 text-white">
              <Shield className="w-6 h-6" />
              <span className="text-lg font-bold">Lease Sentinel</span>
            </div>
            <div className="flex gap-8 text-sm">
              <Link href="#" className="hover:text-white">Privacy</Link>
              <Link href="#" className="hover:text-white">Terms</Link>
              <Link href="#" className="hover:text-white">Contact</Link>
            </div>
            <div className="text-sm">
              © 2024 Lease Sentinel. Proudly South African.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors group">
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  )
}

function Step({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex gap-6">
      <div className="text-3xl font-black text-blue-100">{num}</div>
      <div>
        <h4 className="text-lg font-bold text-slate-900 mb-1">{title}</h4>
        <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
