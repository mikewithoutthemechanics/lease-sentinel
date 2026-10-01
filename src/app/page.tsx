'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, type ComponentType } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bot,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  Globe2,
  Landmark,
  Menu,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from './landing.module.css'

const formatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0,
})

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

const features: { icon: ComponentType<{ size?: number; strokeWidth?: number }>; title: string; text: string; tag: string }[] = [
  { icon: Landmark, title: 'Portfolio intelligence', text: 'See performance by building, unit and owner before the month closes.', tag: 'Live rent roll' },
  { icon: FileCheck2, title: 'Lease certainty', text: 'Every expiry, signature and escalation is visible in one elegant timeline.', tag: 'Never miss a date' },
  { icon: CircleDollarSign, title: 'Collections, resolved', text: 'Make every incoming Rand visible, matched and ready to explain.', tag: 'Payfast-ready' },
  { icon: Wrench, title: 'Maintenance momentum', text: 'Turn a tenant report into an approved, tracked job without the email chase.', tag: 'Photo-first jobs' },
  { icon: Bot, title: 'A copilot with context', text: 'Prepare owner updates and uncover signals with permission-aware AI.', tag: 'Approval-first AI' },
  { icon: Globe2, title: 'One connected operation', text: 'Bring your accounting, payments, listings and people into the same flow.', tag: 'Built to integrate' },
]

const dashboardPanels = [
  {
    id: 'cash',
    eyebrow: 'Cash position',
    title: 'Collection is ahead of plan.',
    copy: 'R 1.28m received across your portfolio. Three receipts are ready to match.',
    metric: '96.4%',
    metricLabel: 'collected this month',
    bars: [42, 56, 48, 66, 58, 82, 72, 93],
    accent: 'mint',
  },
  {
    id: 'leases',
    eyebrow: 'Lease desk',
    title: 'Three important moments this week.',
    copy: 'Two renewals are ready to send and one commercial lease needs a decision.',
    metric: '12',
    metricLabel: 'renewals in motion',
    bars: [73, 52, 88, 64, 90, 58, 76, 84],
    accent: 'gold',
  },
  {
    id: 'work',
    eyebrow: 'Maintenance desk',
    title: 'Your team is moving fast.',
    copy: 'Eight jobs were closed within SLA. One contractor quote is waiting for approval.',
    metric: '8.6h',
    metricLabel: 'average first response',
    bars: [35, 63, 78, 52, 88, 94, 69, 86],
    accent: 'blue',
  },
]

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)

  function toggleFilm() {
    setIsPlaying((current) => !current)
  }

  return (
    <main className={styles.site}>
      <section className={styles.hero} id="top">
        <div className={styles.heroBackdrop} aria-hidden="true">
          <Image src="/hero-property.png" alt="" fill priority sizes="100vw" className={`${styles.heroPoster} ${isPlaying ? styles.posterPlaying : ''}`} />
          <div className={styles.heroShade} />
          <div className={styles.noise} />
          <div className={styles.heroGrid} />
        </div>

        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/" className={styles.brand} onClick={() => setMobileOpen(false)}>
            <span className={styles.brandMark}><Building2 size={18} /></span>
            <span>Lease <i>Sentinel</i></span>
          </Link>
          <div className={styles.desktopLinks}>
            <a href="#platform">Platform</a>
            <a href="#calculator">Calculator</a>
            <Link href="/pricing">Pricing</Link>
            <Link href="/trust">Trust centre</Link>
          </div>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.loginLink}>Sign in</Link>
            <Link href="/demo"><Button className={styles.navButton}>Book a demo <ArrowRight size={15} /></Button></Link>
            <button className={styles.menuButton} onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
          {mobileOpen && <div className={styles.mobileMenu}>
            <a href="#platform" onClick={() => setMobileOpen(false)}>Platform</a>
            <a href="#calculator" onClick={() => setMobileOpen(false)}>Calculator</a>
            <Link href="/pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
            <Link href="/trust" onClick={() => setMobileOpen(false)}>Trust centre</Link>
            <Link href="/login" onClick={() => setMobileOpen(false)}>Sign in</Link>
          </div>}
        </nav>

        <div className={styles.heroContent}>
          <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.11, delayChildren: 0.08 }}>
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className={styles.kicker}>
              <span className={styles.pulseDot} />
              Designed for property, built for certainty
            </motion.div>
            <motion.h1 variants={fadeUp} transition={{ duration: 0.7 }} className={styles.heroTitle}>
              Every property move,<br />
              <em>in its right place.</em>
            </motion.h1>
            <motion.p variants={fadeUp} transition={{ duration: 0.7 }} className={styles.heroCopy}>
              The quietly powerful operating system for South African property teams that want a sharper view of every Rand, resident and renewal.
            </motion.p>
            <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className={styles.heroCtas}>
              <Link href="/demo"><Button size="lg" className={styles.primaryCta}>Explore the live workspace <ArrowRight size={17} /></Button></Link>
              <a href="#calculator" className={styles.textCta}>Calculate your upside <ArrowDownIcon /></a>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75, duration: 0.9 }} className={styles.proofLine}>
            <div className={styles.avatarStack} aria-hidden="true"><span>AM</span><span>KM</span><span>TN</span></div>
            <p><strong>Built with teams who manage real places.</strong><br />Apartments, offices, retail and industrial portfolios.</p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.8 }} className={styles.heroConsole}>
          <div className={styles.consoleTopline}>
            <span><span className={styles.liveDot} /> LIVE PORTFOLIO SIGNAL</span>
            <button onClick={toggleFilm} className={styles.filmToggle} aria-label={isPlaying ? 'Pause background film' : 'Play background film'}>
              {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />} {isPlaying ? 'PAUSE FILM' : 'PLAY FILM'}
            </button>
          </div>
          <div className={styles.consoleMetric}>
            <div><p>Rent collected</p><strong>R 1.28<span>m</span></strong><small><TrendingUp size={12} /> 4.8% above last month</small></div>
            <div className={styles.radial}><span>94<small>%</small></span><p>occupied</p></div>
          </div>
          <div className={styles.consoleFooter}>
            <span><Check size={13} /> All systems in rhythm</span>
            <ChevronRight size={15} />
          </div>
        </motion.div>

        <div className={styles.scrollCue}><span>SCROLL TO EXPLORE</span><i /></div>
      </section>

      <section className={styles.statsBand} aria-label="Platform capabilities">
        <div className={styles.stat}><strong>01</strong><span>portfolio<br />command centre</span></div>
        <div className={styles.stat}><strong>24/7</strong><span>visibility across<br />every property</span></div>
        <div className={styles.stat}><strong>ZAR</strong><span>local payments,<br />local precision</span></div>
        <div className={styles.stat}><strong>1</strong><span>calm system for<br />your entire operation</span></div>
      </section>

      <section className={styles.introSection} id="platform">
        <Reveal className={styles.sectionEyebrow}><span>01</span> THE CLEARER WAY TO OPERATE</Reveal>
        <div className={styles.introGrid}>
          <Reveal delay={0.06}><h2>Less switching.<br /><em>More seeing.</em></h2></Reveal>
          <Reveal delay={0.14} className={styles.introRight}>
            <p>Lease Sentinel brings the pieces of property management into a composed, live view. Not another dashboard to check. The place your operation starts to make sense.</p>
            <a className={styles.arrowLink} href="#workspace">See the signal in action <ArrowUpRight size={18} /></a>
          </Reveal>
        </div>
      </section>

      <section className={styles.workspaceSection} id="workspace">
        <Reveal className={styles.workspaceFrame}>
          <div className={styles.windowBar}>
            <div className={styles.windowBrand}><span className={styles.windowMark}><Building2 size={13} /></span> SENTINEL / ALEX MORGAN</div>
            <div className={styles.windowDate}><CalendarClock size={14} /> Tuesday, 1 October</div>
            <span className={styles.windowStatus}><i /> all synced</span>
          </div>
          <WorkspacePreview />
        </Reveal>
        <div className={styles.frameCaption}><span>ONE VIEW. A BETTER NEXT MOVE.</span><span>← DRAG NOTHING. MISS NOTHING. →</span></div>
      </section>

      <section className={styles.featuresSection}>
        <Reveal className={styles.sectionEyebrow}><span>02</span> THE SENTINEL SYSTEM</Reveal>
        <Reveal delay={0.05} className={styles.featuresHeading}>
          <h2>Everything important.<br /><em>Nothing noisy.</em></h2>
          <p>Purposeful tools that help your team turn property work into a fluid, accountable rhythm.</p>
        </Reveal>
        <div className={styles.featureGrid}>
          {features.map((feature, index) => <FeatureCard key={feature.title} feature={feature} index={index} />)}
        </div>
      </section>

      <section className={styles.calculatorSection} id="calculator">
        <div className={styles.calculatorGlow} />
        <Reveal className={styles.calculatorIntro}>
          <div className={styles.sectionEyebrow}><span>03</span> THE UPSIDE CALCULATOR</div>
          <h2>Your portfolio<br /><em>has a next gear.</em></h2>
          <p>Move the controls. See what more collection clarity and fewer manual hours could be worth each month.</p>
          <div className={styles.calculatorTrust}><ShieldCheck size={17} /> An illustrative estimate, based on your inputs.</div>
        </Reveal>
        <Reveal delay={0.12}><YieldCalculator /></Reveal>
      </section>

      <section className={styles.assuranceSection}>
        <Reveal className={styles.assuranceText}>
          <div className={styles.sectionEyebrow}><span>04</span> BUILT FOR REAL-WORLD TRUST</div>
          <h2>The details<br />are <em>the difference.</em></h2>
          <p>From local payments to permission-aware AI, Sentinel is designed around the confidence property teams need to act quickly and carefully.</p>
          <Link href="/trust" className={styles.lightLink}>Visit the trust centre <ArrowRight size={17} /></Link>
        </Reveal>
        <Reveal delay={0.1} className={styles.assuranceCards}>
          <AssuranceCard icon={ShieldCheck} label="Protected by design" text="Role-aware access, audit trails and clear approval steps." />
          <AssuranceCard icon={Zap} label="Automation with intent" text="Nothing is sent, paid or promised without your say-so." />
          <AssuranceCard icon={Sparkles} label="AI you can verify" text="Useful context, transparent answers and human control." />
        </Reveal>
      </section>

      <section className={styles.closingSection}>
        <Reveal>
          <p className={styles.closingKicker}>YOUR OPERATION, IN FLOW</p>
          <h2>Make every property<br /><em>feel looked after.</em></h2>
          <p className={styles.closingCopy}>Start with a clearer picture of the work in front of you. We&apos;ll help you shape the rest.</p>
          <div className={styles.closingActions}>
            <Link href="/demo"><Button size="lg" className={styles.closingButton}>Explore the workspace <ArrowRight size={17} /></Button></Link>
            <Link href="/pricing" className={styles.closingSecondary}>View simple pricing <ArrowUpRight size={16} /></Link>
          </div>
        </Reveal>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.brand}><span className={styles.brandMark}><Building2 size={18} /></span><span>Lease <i>Sentinel</i></span></Link>
        <div className={styles.footerLinks}><Link href="/pricing">Pricing</Link><Link href="/trust">Trust</Link><Link href="/login">Sign in</Link></div>
        <p>Property operations, made clearer. © 2026</p>
      </footer>
    </main>
  )
}

function ArrowDownIcon() {
  return <ChevronDown size={16} />
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reducedMotion = useReducedMotion()
  return <motion.div className={className} initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: reducedMotion ? 0.1 : 0.65, delay }}>{children}</motion.div>
}

function WorkspacePreview() {
  const [panelIndex, setPanelIndex] = useState(0)
  const panel = dashboardPanels[panelIndex]

  return <div className={styles.workspaceBody}>
    <aside className={styles.workspaceNav}>
      <div className={styles.navProfile}><span>AM</span><div><strong>Alex Morgan</strong><small>West Coast portfolio</small></div></div>
      <div className={styles.workspaceNavTitle}>WORKSPACE</div>
      {dashboardPanels.map((item, index) => <button key={item.id} onClick={() => setPanelIndex(index)} className={panelIndex === index ? styles.activeWorkspaceTab : ''}><span>{index + 1}</span>{item.eyebrow}</button>)}
      <div className={styles.workspaceNavTitle}>MANAGE</div>
      <button><span>+</span> Properties</button>
      <button><span>+</span> People</button>
      <div className={styles.workspaceNavBottom}><Bell size={15} /><span>2 actions need you</span></div>
    </aside>
    <div className={styles.workspaceContent}>
      <div className={styles.workspaceContentTop}><div><p>GOOD MORNING, ALEX</p><h3>Here&apos;s your day in view.</h3></div><button className={styles.addAction}>+ ADD PROPERTY</button></div>
      <div className={styles.workspaceCards}>
        <div className={styles.mainMetricCard} data-accent={panel.accent}>
          <div className={styles.cardTop}><span>{panel.eyebrow.toUpperCase()}</span><span className={styles.cardLive}><i /> LIVE</span></div>
          <div className={styles.workspaceMetric}><strong>{panel.metric}</strong><span>{panel.metricLabel}</span></div>
          <div className={styles.chartArea}>{panel.bars.map((height, index) => <i key={`${panel.id}-${index}`} style={{ height: `${height}%` }} />)}</div>
          <div className={styles.chartLabels}><span>APR</span><span>MAY</span><span>JUN</span><span>JUL</span><span>AUG</span><span>SEP</span><span>OCT</span><span>NOV</span></div>
        </div>
        <div className={styles.insightCard}>
          <span className={styles.insightIcon}><Sparkles size={16} /></span>
          <p className={styles.insightEyebrow}>SENTINEL SIGNAL</p>
          <h4>{panel.title}</h4>
          <p>{panel.copy}</p>
          <button>Open focus view <ArrowRight size={14} /></button>
        </div>
      </div>
      <div className={styles.activityList}>
        <div><span className={styles.activityCheck}><Check size={13} /></span><p><strong>12 Jacana Road</strong><small>Lease signed by Thandi M.</small></p><time>09:42</time></div>
        <div><span className={`${styles.activityCheck} ${styles.activityGold}`}><Wrench size={13} /></span><p><strong>Harbour Point 4B</strong><small>Quote ready for your approval</small></p><time>08:31</time></div>
      </div>
    </div>
  </div>
}

function FeatureCard({ feature, index }: { feature: typeof features[number]; index: number }) {
  const Icon = feature.icon
  return <Reveal delay={(index % 3) * 0.07} className={styles.featureCard}>
    <div className={styles.featureTop}><span className={styles.featureIcon}><Icon size={20} strokeWidth={1.75} /></span><span>{feature.tag}</span></div>
    <h3>{feature.title}</h3>
    <p>{feature.text}</p>
    <span className={styles.featureLine}><i /><ArrowUpRight size={16} /></span>
  </Reveal>
}

function RangeControl({ label, value, min, max, step, prefix = '', suffix = '', onChange }: { label: string; value: number; min: number; max: number; step: number; prefix?: string; suffix?: string; onChange: (value: number) => void }) {
  const safeValue = Math.min(max, Math.max(min, value))
  const progress = ((safeValue - min) / (max - min)) * 100
  return <label className={styles.rangeControl}>
    <span className={styles.rangeLabel}>{label}</span>
    <span className={styles.rangeValue}><b>{prefix}</b><input aria-label={label} value={safeValue} type="number" min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value) || min)} /><b>{suffix}</b></span>
    <input className={styles.rangeInput} value={safeValue} style={{ '--range-progress': `${progress}%` } as React.CSSProperties} type="range" min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    <span className={styles.rangeBounds}><i>{prefix}{min.toLocaleString()}{suffix}</i><i>{prefix}{max.toLocaleString()}{suffix}</i></span>
  </label>
}

function YieldCalculator() {
  const [units, setUnits] = useState(24)
  const [monthlyRent, setMonthlyRent] = useState(14500)
  const [collectionRate, setCollectionRate] = useState(93)
  const [manualHours, setManualHours] = useState(12)
  const [mode, setMode] = useState<'steady' | 'growth'>('steady')

  const calculation = useMemo(() => {
    const potential = units * monthlyRent
    const targetRate = mode === 'growth' ? 99.35 : 98.8
    const recoveredRent = Math.max(0, potential * ((targetRate - collectionRate) / 100))
    const teamTime = manualHours * (mode === 'growth' ? 520 : 380)
    const monthly = Math.round(recoveredRent + teamTime)
    return { potential, recoveredRent: Math.round(recoveredRent), teamTime: Math.round(teamTime), monthly, annual: monthly * 12, targetRate }
  }, [units, monthlyRent, collectionRate, manualHours, mode])

  return <div className={styles.calculatorCard}>
    <div className={styles.calcHeader}><div><p>YOUR SCENARIO</p><h3>Collection opportunity</h3></div><div className={styles.modeSwitch}><button onClick={() => setMode('steady')} className={mode === 'steady' ? styles.modeActive : ''}>STEADY</button><button onClick={() => setMode('growth')} className={mode === 'growth' ? styles.modeActive : ''}>GROWTH</button></div></div>
    <div className={styles.calculatorBody}>
      <div className={styles.controlsColumn}>
        <RangeControl label="Units in your portfolio" value={units} min={1} max={250} step={1} onChange={setUnits} />
        <RangeControl label="Average monthly rent" value={monthlyRent} min={3000} max={50000} step={500} prefix="R " onChange={setMonthlyRent} />
        <RangeControl label="Current collection rate" value={collectionRate} min={70} max={100} step={1} suffix="%" onChange={setCollectionRate} />
        <RangeControl label="Manual hours each week" value={manualHours} min={1} max={40} step={1} suffix=" hrs" onChange={setManualHours} />
      </div>
      <div className={styles.calculatorResult}>
        <div className={styles.resultHalo} />
        <p>ESTIMATED MONTHLY UPSIDE</p>
        <strong>{formatter.format(calculation.monthly)}</strong>
        <span>or <b>{formatter.format(calculation.annual)}</b> a year</span>
        <div className={styles.resultBreakdown}>
          <div><span>From clearer collections</span><b>{formatter.format(calculation.recoveredRent)}</b></div>
          <div><span>From reclaimed team time</span><b>{formatter.format(calculation.teamTime)}</b></div>
        </div>
        <div className={styles.resultNote}><TrendingUp size={15} /> A {calculation.targetRate.toFixed(1)}% collection rhythm could change the picture.</div>
      </div>
    </div>
    <div className={styles.calcFooter}><span>Potential gross rent: <b>{formatter.format(calculation.potential)}</b> / month</span><Link href="/demo">See how the workspace gets you there <ArrowRight size={15} /></Link></div>
  </div>
}

function AssuranceCard({ icon: Icon, label, text }: { icon: ComponentType<{ size?: number; strokeWidth?: number }>; label: string; text: string }) {
  return <div className={styles.assuranceCard}><span><Icon size={19} strokeWidth={1.75} /></span><div><h3>{label}</h3><p>{text}</p></div><ArrowUpRight size={16} /></div>
}
