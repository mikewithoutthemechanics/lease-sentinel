'use client'

import { useState } from 'react'
import {
  Activity, ArrowUpRight, Bell, Bot, Building2, CalendarClock,
  ChevronDown, CircleDollarSign, FileCheck2, Home, Menu, MoreHorizontal,
  Plus, Search, Settings2, Sparkles, Wrench, X, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const portfolio = [
  { name: 'The Foundry', type: 'Industrial', location: 'Germiston, GP', occupancy: '96%', income: 'R 842 500', health: 'Good', color: 'bg-emerald-500' },
  { name: 'Oak & Main', type: 'Residential', location: 'Sea Point, WC', occupancy: '100%', income: 'R 184 000', health: 'Good', color: 'bg-emerald-500' },
  { name: 'Riverside Centre', type: 'Commercial', location: 'Umhlanga, KZN', occupancy: '82%', income: 'R 396 200', health: 'Attention', color: 'bg-amber-500' },
]

const tasks = [
  { label: 'Review 3 applications', meta: 'FICA documents ready', icon: FileCheck2, tone: 'text-blue-600 bg-blue-50' },
  { label: 'Approve maintenance quote', meta: 'Unit 4B · R 2 450', icon: Wrench, tone: 'text-orange-600 bg-orange-50' },
  { label: 'Send rent reminders', meta: '5 tenants · due tomorrow', icon: Bell, tone: 'text-violet-600 bg-violet-50' },
]

export default function DashboardPage() {
  const [mobileNav, setMobileNav] = useState(false)
  const [activeNav, setActiveNav] = useState('Overview')
  const [showAssistant, setShowAssistant] = useState(false)

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3 mb-10">
          <div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#193b37] text-white"><Building2 size={18} /></div><span className="text-lg font-bold tracking-tight">Lease Sentinel</span></div>
          <button className="lg:hidden text-slate-400" onClick={() => setMobileNav(false)}><X size={20} /></button>
        </div>
        <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>
        <nav className="space-y-1">
          {[
            ['Overview', Home], ['Properties', Building2], ['Tenants & leases', FileCheck2], ['Money', CircleDollarSign], ['Maintenance', Wrench], ['Reports', Activity],
          ].map(([label, Icon]) => <button key={label as string} onClick={() => { if (label === 'Money') window.location.href = '/dashboard/finance'; if (label === 'Maintenance') window.location.href = '/dashboard/maintenance'; setActiveNav(label as string); setMobileNav(false) }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${activeNav === label ? 'bg-[#e7f1ee] text-[#193b37]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={18} />{label as string}{label === 'Maintenance' && <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">4</span>}</button>)}
        </nav>
        <p className="px-3 mb-3 mt-9 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Manage</p>
        <nav className="space-y-1">
          {[['Integrations', Zap], ['Settings', Settings2]].map(([label, Icon]) => <button key={label as string} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"><Icon size={18} />{label as string}</button>)}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#193b37] p-4 text-white"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-[#f4c95d]" /> Sentinel AI</div><p className="text-xs leading-relaxed text-emerald-100">Your portfolio copilot is ready to find savings and handle admin.</p><button onClick={() => setShowAssistant(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-xs font-semibold hover:bg-white/20">Ask anything <ArrowUpRight size={13} /></button></div>
      </aside>

      {mobileNav && <div className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden" onClick={() => setMobileNav(false)} />}
      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button className="lg:hidden" onClick={() => setMobileNav(true)}><Menu /></button><div><p className="text-xs font-medium text-slate-400">Thursday, 1 October 2026</p><h1 className="text-lg font-bold">Good morning, Alex <span>👋</span></h1></div></div><div className="flex items-center gap-2 md:gap-4"><button className="hidden rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 md:block"><Search size={18} /></button><button className="relative rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><Bell size={18} /><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-orange-500" /></button><div className="hidden h-8 w-px bg-slate-200 md:block" /><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9e9e4] text-sm font-bold text-[#193b37]">AM</div></div></header>

        <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-8 md:py-9">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-xs font-semibold text-emerald-700">Portfolio healthy</span></div><h2 className="text-2xl font-bold tracking-tight md:text-3xl">Portfolio overview</h2><p className="mt-1 text-sm text-slate-500">A clear view of what needs your attention today.</p></div><Button className="w-fit gap-2 rounded-xl bg-[#193b37] px-4 hover:bg-[#27564f]"><Plus size={17} /> Add property</Button></div>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="Collected this month" value="R 1 284 700" detail="92% of R 1 396 400 expected" trend="+4.8%" positive icon={CircleDollarSign} />
            <Metric title="Occupancy" value="94.2%" detail="47 of 50 units occupied" trend="+2.1%" positive icon={Building2} />
            <Metric title="Open maintenance" value="4" detail="1 urgent · 2 awaiting quote" trend="-18%" positive icon={Wrench} />
            <Metric title="Net operating income" value="R 618 420" detail="After costs · September" trend="+7.4%" positive icon={ArrowUpRight} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><div className="mb-6 flex items-center justify-between"><div><h3 className="font-bold">Cash flow</h3><p className="mt-1 text-xs text-slate-500">Income vs expenses · last 6 months</p></div><button className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Last 6 months <ChevronDown size={14} /></button></div><div className="relative h-52"><div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400"><span>R 1.5m</span><span>R 1.0m</span><span>R 500k</span><span>R 0</span></div><div className="absolute inset-0 left-12 flex flex-col justify-between"><div className="border-t border-dashed border-slate-200" /><div className="border-t border-dashed border-slate-200" /><div className="border-t border-dashed border-slate-200" /><div className="border-t border-slate-200" /></div><div className="absolute bottom-5 left-14 right-0 flex h-40 items-end justify-around gap-3">{[72, 63, 82, 76, 94, 88].map((height, index) => <div key={index} className="flex h-full flex-1 items-end justify-center gap-1.5"><div className="w-3 rounded-t bg-[#b8d8ce]" style={{ height: `${height * .82}%` }} /><div className="w-3 rounded-t bg-[#193b37]" style={{ height: `${height}%` }} /></div>)}</div><div className="absolute bottom-0 left-14 right-0 flex justify-around text-[10px] text-slate-400">{['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map(m => <span key={m}>{m}</span>)}</div></div><div className="mt-4 flex gap-5 text-xs text-slate-500"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#193b37]" />Income</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#b8d8ce]" />Expenses</span></div></div>
            <div className="rounded-2xl border border-[#cfe4dd] bg-[#eef7f3] p-5 md:p-6"><div className="flex items-start justify-between"><div><span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#287366]"><Sparkles size={12} /> Sentinel insight</span><h3 className="text-lg font-bold leading-snug">You could improve September NOI by <span className="text-[#287366]">R 18 600</span></h3></div><Bot className="text-[#287366]" size={24} /></div><p className="mt-3 text-sm leading-relaxed text-slate-600">3 leases at Riverside Centre are below your area average. A market-aligned renewal could add R 12 400/month.</p><div className="mt-5 rounded-xl border border-white bg-white/70 p-3"><div className="flex items-center justify-between text-xs"><span className="font-semibold">Potential action</span><span className="font-bold text-[#287366]">High impact</span></div><p className="mt-1 text-xs text-slate-500">Review below-market leases before renewal.</p></div><button onClick={() => setShowAssistant(true)} className="mt-5 flex items-center gap-2 text-xs font-bold text-[#193b37]">Explore with Sentinel AI <ArrowUpRight size={14} /></button></div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">Properties</h3><p className="mt-1 text-xs text-slate-500">Across your portfolio</p></div><button className="text-xs font-bold text-[#287366]">View all</button></div><div className="overflow-x-auto"><table className="w-full min-w-[590px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="pb-3 font-semibold">Property</th><th className="pb-3 font-semibold">Occupancy</th><th className="pb-3 font-semibold">Income / month</th><th className="pb-3 font-semibold">Status</th><th /></tr></thead><tbody>{portfolio.map(p => <tr key={p.name} className="border-b border-slate-50 last:border-0"><td className="py-4"><div className="font-semibold">{p.name}</div><div className="mt-0.5 text-xs text-slate-400">{p.type} · {p.location}</div></td><td className="py-4 font-medium">{p.occupancy}</td><td className="py-4 font-medium">{p.income}</td><td className="py-4"><span className="flex items-center gap-1.5 text-xs font-medium"><i className={`h-2 w-2 rounded-full ${p.color}`} />{p.health}</span></td><td className="py-4 text-right"><MoreHorizontal size={17} className="text-slate-400" /></td></tr>)}</tbody></table></div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">Today&apos;s priorities</h3><p className="mt-1 text-xs text-slate-500">Small actions, big momentum</p></div><CalendarClock size={19} className="text-slate-400" /></div><div className="space-y-3">{tasks.map(({ label, meta, icon: Icon, tone }) => <button key={label} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-slate-200 hover:bg-slate-50"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon size={17} /></span><span className="min-w-0"><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-xs text-slate-400">{meta}</span></span><ArrowUpRight className="ml-auto text-slate-300" size={15} /></button>)}</div><button className="mt-5 flex items-center gap-2 text-xs font-bold text-[#287366]">View task list <ArrowUpRight size={14} /></button></div>
          </section>
        </div>
      </main>
      {showAssistant && <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-900/20 p-4 md:p-8" onClick={() => setShowAssistant(false)}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7f1ee] text-[#287366]"><Bot size={17} /></span> Sentinel AI</div><button onClick={() => setShowAssistant(false)} className="text-slate-400"><X size={18} /></button></div><p className="mt-5 rounded-xl bg-[#eef7f3] p-4 text-sm leading-relaxed text-slate-600">Hi Alex. I can help draft tenant messages, explain your numbers, compare contractor quotes, or prepare a renewal plan. What would you like to do?</p><div className="mt-4 flex gap-2"><input placeholder="Ask about your portfolio..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#287366]" /><Button className="rounded-xl bg-[#193b37]">Send</Button></div><p className="mt-3 text-center text-[10px] text-slate-400">Powered by your connected MCP tools · You approve every action</p></div></div>}
    </div>
  )
}

function Metric({ title, value, detail, trend, positive, icon: Icon }: { title: string, value: string, detail: string, trend: string, positive?: boolean, icon: React.ElementType }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><span className="text-xs font-medium text-slate-500">{title}</span><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500"><Icon size={16} /></span></div><div className="mt-3 text-2xl font-bold tracking-tight">{value}</div><div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400"><span className={`flex items-center gap-0.5 font-bold ${positive ? 'text-emerald-600' : 'text-red-600'}`}><ArrowUpRight size={12} />{trend}</span>{detail}</div></div>
}
