'use client'

import Link from 'next/link'
import { ArrowRight, Check, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'

const money = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 })

export default function RoiCalculator() {
  const [units, setUnits] = useState(24)
  const [rent, setRent] = useState(9500)
  const [arrears, setArrears] = useState(6)
  const [hours, setHours] = useState(12)

  const result = useMemo(() => {
    const recovered = units * rent * (arrears / 100) * 0.35
    const reclaimed = hours * 0.65
    const subscription = units <= 25 ? 799 : units <= 100 ? 1499 : 2999
    return { recovered, reclaimed, upside: recovered + reclaimed * 180 - subscription, subscription }
  }, [units, rent, arrears, hours])

  return (
    <div className="grid overflow-hidden rounded-[2rem] border border-[#cfe4dd] bg-white shadow-[0_30px_90px_-35px_rgba(25,59,55,.35)] lg:grid-cols-[.9fr_1.1fr]">
      <div className="bg-[#eef7f3] p-7 md:p-10">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#287366]"><SlidersHorizontal size={15} /> Your portfolio</div>
        <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">See what less chasing is worth.</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">Move the sliders to estimate the monthly upside Sentinel could help you protect.</p>
        <div className="mt-8 space-y-7">
          <Slider label="Rental units" value={units} min={5} max={250} step={1} display={units.toString()} onChange={setUnits} />
          <Slider label="Average monthly rent" value={rent} min={4000} max={30000} step={500} display={money.format(rent)} onChange={setRent} />
          <Slider label="Current arrears rate" value={arrears} min={1} max={20} step={1} display={`${arrears}%`} onChange={setArrears} />
          <Slider label="Admin hours per month" value={hours} min={2} max={60} step={1} display={`${hours} hrs`} onChange={setHours} />
        </div>
      </div>
      <div className="flex flex-col justify-between bg-[#193b37] p-7 text-white md:p-10">
        <div><p className="text-sm text-emerald-100">Estimated monthly upside</p><p className="mt-2 text-5xl font-bold tracking-tight text-[#f4c95d]">{money.format(Math.max(0, result.upside))}</p><p className="mt-3 max-w-sm text-sm leading-relaxed text-emerald-100">That is recovered rent plus the value of time returned, less an estimated Sentinel subscription.</p></div>
        <div className="my-9 grid gap-3 sm:grid-cols-2"><Result label="Potential rent recovered" value={money.format(result.recovered)} /><Result label="Hours reclaimed" value={`${Math.round(result.reclaimed)} hrs`} /></div>
        <div><Link href="/demo" className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#193b37] transition hover:bg-[#f4c95d]">Run your real numbers <ArrowRight size={16} /></Link><p className="mt-4 text-[11px] text-emerald-200">Illustrative estimate, not a guarantee. Based on 35% arrears recovery and R180/hour admin value.</p></div>
      </div>
    </div>
  )
}

function Slider({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void }) {
  return <label className="block"><span className="flex items-center justify-between text-sm font-semibold text-slate-700"><span>{label}</span><span className="text-[#287366]">{display}</span></span><input className="mt-3 h-2 w-full cursor-pointer accent-[#287366]" type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} /></label>
}
function Result({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/15 bg-white/10 p-4"><div className="flex items-center gap-2 text-xs text-emerald-100"><Check size={14} className="text-[#f4c95d]" />{label}</div><p className="mt-2 text-xl font-bold">{value}</p></div> }
