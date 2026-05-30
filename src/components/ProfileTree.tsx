import { Droplets, Leaf, ShieldCheck, Sprout, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

type ProfileTreeProps = {
  followers: number
  plantedTrees: number
  donatedTrees: number
  verificationRate: number
  streakDays: number
}

type BranchPoint = {
  x1: number
  y1: number
  x2: number
  y2: number
  label: string
}

const branchTemplates: BranchPoint[] = [
  { x1: 100, y1: 154, x2: 68, y2: 126, label: 'early supporters' },
  { x1: 100, y1: 150, x2: 132, y2: 124, label: 'local planters' },
  { x1: 100, y1: 132, x2: 54, y2: 104, label: 'village reach' },
  { x1: 100, y1: 128, x2: 146, y2: 98, label: 'mandal reach' },
  { x1: 100, y1: 112, x2: 74, y2: 78, label: 'verified proof' },
  { x1: 100, y1: 108, x2: 126, y2: 76, label: 'return visits' },
  { x1: 100, y1: 96, x2: 48, y2: 68, label: 'district support' },
  { x1: 100, y1: 94, x2: 152, y2: 64, label: 'shared impact' },
  { x1: 100, y1: 82, x2: 84, y2: 52, label: 'badge growth' },
  { x1: 100, y1: 80, x2: 116, y2: 50, label: 'community trust' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatCompact(value: number) {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function resolveTreeStage(score: number) {
  if (score >= 85) return 'Mature grove'
  if (score >= 55) return 'Healthy tree'
  if (score >= 25) return 'Growing sapling'
  return 'New sapling'
}

export default function ProfileTree({
  followers,
  plantedTrees,
  donatedTrees,
  verificationRate,
  streakDays,
}: ProfileTreeProps) {
  const [activeBranch, setActiveBranch] = useState<number | null>(null)
  const totalTrees = plantedTrees + donatedTrees
  const growthScore = clamp(
    totalTrees * 7 + followers * 2 + verificationRate * 0.45 + streakDays * 3,
    0,
    100
  )
  const branchCount = clamp(Math.ceil(growthScore / 10), 2, branchTemplates.length)
  const canopyOpacity = 0.28 + growthScore / 180
  const trunkHeight = 58 + growthScore * 0.34
  const waterLevel = clamp(verificationRate, 0, 100)
  const branches = useMemo(() => branchTemplates.slice(0, branchCount), [branchCount])
  const treeStage = resolveTreeStage(growthScore)
  const active = activeBranch === null ? null : branches[activeBranch]

  const metrics = [
    {
      label: 'Trees',
      value: formatCompact(totalTrees),
      detail: `${formatCompact(plantedTrees)} planted`,
      icon: Sprout,
      tone: 'text-emerald-700',
    },
    {
      label: 'Trust',
      value: `${Math.round(verificationRate)}%`,
      detail: 'verified rate',
      icon: ShieldCheck,
      tone: 'text-sky-700',
    },
    {
      label: 'Reach',
      value: formatCompact(followers),
      detail: 'followers',
      icon: Users,
      tone: 'text-violet-700',
    },
    {
      label: 'Care',
      value: `${streakDays}d`,
      detail: 'streak',
      icon: Droplets,
      tone: 'text-cyan-700',
    },
  ]

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white">
      <style>{`
        @keyframes tree-grow {
          from { stroke-dashoffset: 110; opacity: .35; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes leaf-rise {
          from { transform: translateY(5px) scale(.86); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      <div className="grid gap-0 sm:grid-cols-[1.05fr_.95fr]">
        <div className="relative min-h-[18rem] bg-gradient-to-b from-sky-50 via-emerald-50 to-lime-50 px-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Living profile
              </p>
              <h4 className="mt-1 text-lg font-semibold text-slate-900">{treeStage}</h4>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white/80 px-3 py-2 text-right shadow-sm">
              <p className="text-xs text-slate-500">Growth</p>
              <p className="text-lg font-bold text-emerald-700">{Math.round(growthScore)}%</p>
            </div>
          </div>

          <svg
            viewBox="0 0 200 238"
            className="mx-auto mt-1 w-full max-w-[18rem]"
            role="img"
            aria-label={`${treeStage} with ${branchCount} active branches`}
          >
            <defs>
              <linearGradient id="trunkGradient" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#854d0e" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
              <radialGradient id="canopyGradient" cx="50%" cy="38%" r="62%">
                <stop offset="0%" stopColor="#bbf7d0" />
                <stop offset="64%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#047857" />
              </radialGradient>
            </defs>

            <path d="M30 207 C66 196 135 196 170 207 L180 228 H20 Z" fill="#d9f99d" opacity="0.95" />
            <path d="M42 211 C78 203 124 203 158 211" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
            <ellipse cx="100" cy="108" rx={38 + growthScore * 0.28} ry={34 + growthScore * 0.2} fill="url(#canopyGradient)" opacity={canopyOpacity} />
            <ellipse cx="72" cy="116" rx={24 + growthScore * 0.08} ry="22" fill="#86efac" opacity={canopyOpacity * 0.85} />
            <ellipse cx="128" cy="112" rx={24 + growthScore * 0.08} ry="23" fill="#4ade80" opacity={canopyOpacity * 0.9} />

            <path
              d={`M100 ${206 - trunkHeight} C92 ${170 - trunkHeight * 0.18} 93 162 98 136 C101 159 106 174 111 206`}
              fill="url(#trunkGradient)"
            />
            <path d="M101 142 C98 166 100 184 102 204" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

            {branches.map((branch, index) => {
              const selected = activeBranch === index
              return (
                <g key={branch.label}>
                  <line
                    x1={branch.x1}
                    y1={branch.y1}
                    x2={branch.x2}
                    y2={branch.y2}
                    stroke={selected ? '#047857' : '#78350f'}
                    strokeWidth={selected ? 7 : 5}
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: 110,
                      strokeDashoffset: 110,
                      animation: 'tree-grow 520ms ease forwards',
                      animationDelay: `${index * 60}ms`,
                    }}
                    onMouseEnter={() => setActiveBranch(index)}
                    onMouseLeave={() => setActiveBranch((current) => (current === index ? null : current))}
                    onClick={() => setActiveBranch((current) => (current === index ? null : index))}
                  />
                  <ellipse
                    cx={branch.x2}
                    cy={branch.y2}
                    rx={selected ? 11 : 8}
                    ry={selected ? 8 : 6}
                    fill={selected ? '#059669' : '#16a34a'}
                    transform={`rotate(${index % 2 === 0 ? -24 : 24} ${branch.x2} ${branch.y2})`}
                    style={{
                      transformOrigin: `${branch.x2}px ${branch.y2}px`,
                      animation: 'leaf-rise 340ms ease forwards',
                      animationDelay: `${260 + index * 55}ms`,
                      opacity: 0,
                    }}
                    onMouseEnter={() => setActiveBranch(index)}
                    onMouseLeave={() => setActiveBranch((current) => (current === index ? null : current))}
                    onClick={() => setActiveBranch((current) => (current === index ? null : index))}
                  />
                </g>
              )
            })}

            <circle cx="52" cy="198" r="3" fill="#16a34a" opacity="0.9" />
            <circle cx="151" cy="198" r="3" fill="#65a30d" opacity="0.9" />
            <circle cx="132" cy="207" r="2" fill="#15803d" opacity="0.75" />
          </svg>

          {active ? (
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-emerald-200 bg-white/95 px-3 py-2 text-sm shadow-sm">
              <p className="font-semibold text-emerald-800">{active.label}</p>
              <p className="text-xs text-slate-500">Branch #{activeBranch! + 1} is active in your network.</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 border-t border-emerald-100 p-4 sm:border-l sm:border-t-0">
          <div>
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-emerald-600" />
              <p className="text-sm font-semibold text-slate-900">Tree health</p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${growthScore}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {metrics.map((metric) => {
              const Icon = metric.icon
              return (
                <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                    <Icon size={15} className={metric.tone} />
                  </div>
                  <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">{metric.value}</p>
                  <p className="text-[11px] text-slate-500">{metric.detail}</p>
                </div>
              )
            })}
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3">
            <div className="flex items-center justify-between text-xs font-medium text-cyan-800">
              <span>Verification waterline</span>
              <span>{Math.round(waterLevel)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-cyan-500" style={{ width: `${waterLevel}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
