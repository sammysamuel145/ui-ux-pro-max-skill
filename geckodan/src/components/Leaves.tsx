/**
 * Decorative tropical leaves for the edges of the home bands, drawn as flat
 * SVG shapes. They are artwork, not photographs, and are hidden from assistive
 * technology. Each cluster is cropped by its band, so only part shows.
 */

type Leaf = { x: number; y: number; r: number; s: number; tone: 0 | 1 | 2 }

// Positions inside a 260 x 420 box. r = rotation in degrees, s = scale.
const CLUSTER: Leaf[] = [
  { x: 20, y: 70, r: -38, s: 1.15, tone: 0 },
  { x: 36, y: 190, r: -12, s: 1.3, tone: 1 },
  { x: 10, y: 320, r: 24, s: 1.1, tone: 0 },
  { x: 100, y: 40, r: -58, s: 0.8, tone: 2 },
  { x: 118, y: 250, r: 8, s: 0.85, tone: 2 },
  { x: 90, y: 360, r: 40, s: 0.75, tone: 1 },
]

const FILL = ['#0c2416', '#12311d', '#1a4527']
const VEIN = ['#2f6b3d', '#3f8450', '#4d9a5d']

function LeafShape({ tone }: { tone: 0 | 1 | 2 }) {
  return (
    <>
      <path d="M0 0C46-34 124-34 176 0 124 34 46 34 0 0Z" fill={FILL[tone]} />
      <path d="M0 0H176M34 0L66-17M34 0L66 17M72 0L108-18M72 0L108 18M112 0L142-13M112 0L142 13" fill="none" stroke={VEIN[tone]} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      <path d="M26-9C70-24 118-22 150-6" fill="none" stroke="#6fc183" strokeWidth="1.4" strokeLinecap="round" opacity="0.18" />
    </>
  )
}

export function Leaves({ side }: { side: 'left' | 'right' }) {
  return (
    <svg
      className={`leaves leaves--${side}`}
      viewBox="0 0 260 420"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <g transform={side === 'right' ? 'translate(260 0) scale(-1 1)' : undefined}>
        {CLUSTER.map((l, i) => (
          <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}>
            <LeafShape tone={l.tone} />
          </g>
        ))}
      </g>
    </svg>
  )
}
