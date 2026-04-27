import type { DecorationKind } from '@/types';

/**
 * Inline SVG decoration motifs for nursery-style book pages.
 * Sized to fit a percentage of the page (controlled by parent).
 *
 * All paths use `currentColor` so callers can theme via CSS color.
 */
export function Decoration({
  kind,
  className = '',
  style,
  size,
  color,
}: {
  kind: DecorationKind;
  className?: string;
  style?: React.CSSProperties;
  /** CSS width (e.g. '100%', '64px'). Height auto-matches via 1:1 viewBox. */
  size?: string | number;
  /** CSS color applied via `currentColor` */
  color?: string;
}) {
  const merged: React.CSSProperties = {
    width: size ?? '100%',
    height: size ?? '100%',
    color,
    display: 'block',
    ...style,
  };
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={merged}
      aria-hidden="true"
    >
      {RENDERERS[kind]?.()}
    </svg>
  );
}

/* ── Decoration paths ──────────────────────────────────── */

const RENDERERS: Record<DecorationKind, () => React.ReactNode> = {
  sparkles: () => (
    <g fill="currentColor" stroke="currentColor" strokeWidth="0.5">
      {/* 4-point sparkle stars in a loose cluster */}
      <Sparkle cx={25} cy={20} size={9} />
      <Sparkle cx={70} cy={35} size={6} />
      <Sparkle cx={45} cy={60} size={11} />
      <Sparkle cx={20} cy={75} size={5} />
      <Sparkle cx={82} cy={78} size={7} />
      <circle cx={60} cy={15} r={0.8} />
      <circle cx={15} cy={45} r={0.6} />
      <circle cx={88} cy={55} r={0.6} />
      <circle cx={35} cy={85} r={0.7} />
    </g>
  ),
  hearts: () => (
    <g fill="currentColor">
      <Heart cx={25} cy={30} size={10} />
      <Heart cx={60} cy={20} size={7} />
      <Heart cx={75} cy={55} size={12} />
      <Heart cx={35} cy={70} size={8} />
      <Heart cx={15} cy={85} size={6} />
    </g>
  ),
  'moon-stars': () => (
    <g fill="currentColor" stroke="currentColor" strokeWidth="0.6">
      {/* Crescent moon */}
      <path d="M 50 25 a 22 22 0 1 0 18 35 a 17 17 0 1 1 -18 -35 z" />
      <Sparkle cx={20} cy={20} size={6} />
      <Sparkle cx={80} cy={30} size={5} />
      <Sparkle cx={25} cy={75} size={7} />
      <circle cx={75} cy={75} r={1} />
      <circle cx={15} cy={50} r={0.8} />
    </g>
  ),
  sun: () => (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx={50} cy={50} r={16} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 50 + Math.cos(a) * 24;
        const y1 = 50 + Math.sin(a) * 24;
        const x2 = 50 + Math.cos(a) * 32;
        const y2 = 50 + Math.sin(a) * 32;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </g>
  ),
  rainbow: () => (
    <g fill="none" strokeWidth="3.2" strokeLinecap="round">
      <path d="M 12 75 A 38 38 0 0 1 88 75" stroke="#E8A0BF" />
      <path d="M 18 75 A 32 32 0 0 1 82 75" stroke="#F4C28C" />
      <path d="M 24 75 A 26 26 0 0 1 76 75" stroke="#F5E5A3" />
      <path d="M 30 75 A 20 20 0 0 1 70 75" stroke="#A8C5A0" />
      <path d="M 36 75 A 14 14 0 0 1 64 75" stroke="#B7D6E5" />
      {/* Cloud bumps under */}
      <g fill="currentColor" stroke="none" opacity="0.85">
        <circle cx={20} cy={78} r={6} />
        <circle cx={80} cy={78} r={6} />
      </g>
    </g>
  ),
  sailboat: () => (
    <g fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <line x1={50} y1={20} x2={50} y2={70} stroke="currentColor" strokeWidth="1.5" />
      <path d="M 50 22 L 75 65 L 50 65 Z" fill="#F4C28C" stroke="none" />
      <path d="M 50 28 L 32 65 L 50 65 Z" fill="#E8A0BF" stroke="none" />
      <path d="M 22 70 Q 50 82 78 70 L 70 78 L 30 78 Z" fill="currentColor" stroke="none" />
      <path d="M 10 86 Q 25 82 40 86 T 70 86 T 95 86" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </g>
  ),
  lion: () => (
    <g fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      {/* Mane */}
      <circle cx={50} cy={50} r={32} fill="#F4C28C" stroke="none" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <circle key={i} cx={50 + Math.cos(a) * 32} cy={50 + Math.sin(a) * 32} r={6} fill="#F4C28C" stroke="none" />
        );
      })}
      {/* Face */}
      <circle cx={50} cy={52} r={20} fill="#FFE9C9" stroke="none" />
      <circle cx={43} cy={48} r={1.8} />
      <circle cx={57} cy={48} r={1.8} />
      <path d="M 47 56 Q 50 60 53 56" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </g>
  ),
  giraffe: () => (
    <g fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <rect x={40} y={20} width={10} height={45} rx={4} fill="#F5E5A3" stroke="none" />
      <ellipse cx={45} cy={20} rx={9} ry={7} fill="#F5E5A3" stroke="none" />
      <circle cx={42} cy={19} r={1.2} />
      <rect x={28} y={62} width={28} height={20} rx={4} fill="#F5E5A3" stroke="none" />
      <rect x={30} y={80} width={4} height={10} fill="#F5E5A3" stroke="none" />
      <rect x={50} y={80} width={4} height={10} fill="#F5E5A3" stroke="none" />
      {/* Spots */}
      <circle cx={42} cy={32} r={1.8} fill="currentColor" />
      <circle cx={48} cy={42} r={1.6} fill="currentColor" />
      <circle cx={36} cy={70} r={2} fill="currentColor" />
      <circle cx={48} cy={75} r={1.8} fill="currentColor" />
    </g>
  ),
  elephant: () => (
    <g fill="#C9BEC0" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <ellipse cx={55} cy={55} rx={28} ry={22} />
      <ellipse cx={30} cy={45} rx={14} ry={16} />
      <path d="M 22 50 Q 14 60 18 75 Q 24 80 26 70" fill="#C9BEC0" />
      <circle cx={28} cy={43} r={1.6} fill="currentColor" />
      <rect x={45} y={75} width={5} height={10} fill="#C9BEC0" />
      <rect x={65} y={75} width={5} height={10} fill="#C9BEC0" />
      {/* Ear */}
      <ellipse cx={45} cy={42} rx={8} ry={10} fill="#B0A4A6" />
    </g>
  ),
  cupcake: () => (
    <g fill="currentColor" strokeLinejoin="round">
      <path d="M 30 55 L 70 55 L 64 85 L 36 85 Z" fill="#F4C28C" />
      {/* Liner stripes */}
      <line x1={42} y1={55} x2={40} y2={85} stroke="#3D2C2E" strokeWidth="0.6" opacity="0.5" />
      <line x1={50} y1={55} x2={50} y2={85} stroke="#3D2C2E" strokeWidth="0.6" opacity="0.5" />
      <line x1={58} y1={55} x2={60} y2={85} stroke="#3D2C2E" strokeWidth="0.6" opacity="0.5" />
      {/* Frosting */}
      <path d="M 28 55 Q 32 38 50 38 Q 68 38 72 55 Z" fill="#E8A0BF" />
      <circle cx={50} cy={32} r={3.5} fill="#E8A0BF" />
      {/* Cherry */}
      <circle cx={50} cy={28} r={3} fill="#C4816B" />
    </g>
  ),
  floral: () => (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <line x1={50} y1={30} x2={50} y2={90} />
      <line x1={50} y1={50} x2={30} y2={42} />
      <line x1={50} y1={60} x2={70} y2={52} />
      <line x1={50} y1={72} x2={32} y2={68} />
      {/* Flowers */}
      <Flower cx={50} cy={28} size={8} />
      <Flower cx={28} cy={40} size={6} />
      <Flower cx={72} cy={50} size={5} />
      <Flower cx={30} cy={66} size={5} />
    </g>
  ),
  angel: () => (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Halo */}
      <ellipse cx={50} cy={28} rx={14} ry={4} />
      {/* Head */}
      <circle cx={50} cy={42} r={9} fill="#FFE9C9" stroke="currentColor" />
      {/* Body / dress */}
      <path d="M 38 55 L 30 80 L 70 80 L 62 55 Z" fill="#FFFCF6" />
      {/* Wings */}
      <path d="M 38 55 Q 18 48 18 70 Q 30 70 38 60" fill="#FFFCF6" />
      <path d="M 62 55 Q 82 48 82 70 Q 70 70 62 60" fill="#FFFCF6" />
    </g>
  ),
};

/* ── Tiny shape helpers ──────────────────────────────── */

function Sparkle({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const s = size;
  // 4-point burst
  return (
    <path
      d={`M ${cx} ${cy - s} L ${cx + s * 0.18} ${cy - s * 0.18} L ${cx + s} ${cy} L ${cx + s * 0.18} ${cy + s * 0.18} L ${cx} ${cy + s} L ${cx - s * 0.18} ${cy + s * 0.18} L ${cx - s} ${cy} L ${cx - s * 0.18} ${cy - s * 0.18} Z`}
    />
  );
}

function Heart({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const s = size / 2;
  return (
    <path
      d={`M ${cx} ${cy + s} C ${cx - s * 1.4} ${cy - s * 0.2}, ${cx - s * 0.6} ${cy - s * 1.4}, ${cx} ${cy - s * 0.4} C ${cx + s * 0.6} ${cy - s * 1.4}, ${cx + s * 1.4} ${cy - s * 0.2}, ${cx} ${cy + s} Z`}
    />
  );
}

function Flower({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  return (
    <g>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle key={i} cx={cx + Math.cos(a) * size * 0.5} cy={cy + Math.sin(a) * size * 0.5} r={size * 0.4} fill="currentColor" stroke="none" opacity="0.9" />
        );
      })}
      <circle cx={cx} cy={cy} r={size * 0.3} fill="#F5E5A3" stroke="none" />
    </g>
  );
}

/* ── Decoration metadata for picker UI ──────────────── */

export const DECORATIONS: { kind: DecorationKind; label: string }[] = [
  { kind: 'sparkles',    label: 'Sparkles' },
  { kind: 'hearts',      label: 'Hearts' },
  { kind: 'moon-stars',  label: 'Moon & Stars' },
  { kind: 'sun',         label: 'Sun' },
  { kind: 'rainbow',     label: 'Rainbow' },
  { kind: 'sailboat',    label: 'Sailboat' },
  { kind: 'lion',        label: 'Lion' },
  { kind: 'giraffe',     label: 'Giraffe' },
  { kind: 'elephant',    label: 'Elephant' },
  { kind: 'cupcake',     label: 'Cupcake' },
  { kind: 'floral',      label: 'Floral' },
  { kind: 'angel',       label: 'Angel' },
];
