import * as React from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import Crown from 'lucide-react/dist/esm/icons/crown';

type TierLook = { base: string; foil: string; text: string; sub: string; crest: string; edge: string };

/** Card finishes by tier: brushed metal tones with a foil sheen. */
const LOOKS: Record<string, TierLook> = {
  Explorer: {
    base: 'linear-gradient(135deg,#071a3a 0%,#0c2f66 38%,#14529c 70%,#1f74c4 100%)',
    foil: 'linear-gradient(115deg,rgba(125,211,252,0) 30%,rgba(125,211,252,.35) 45%,rgba(255,255,255,.55) 50%,rgba(165,180,252,.3) 55%,rgba(165,180,252,0) 70%)',
    text: 'text-white', sub: 'text-sky-100/70', crest: 'from-sky-200 to-sky-400 text-[#0b2a55]', edge: 'ring-sky-300/30',
  },
  Silver: {
    base: 'linear-gradient(135deg,#5b6472 0%,#9aa3b1 30%,#e3e7ee 50%,#a3acba 70%,#646e7d 100%)',
    foil: 'linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.55) 48%,rgba(186,230,253,.4) 52%,rgba(255,255,255,0) 70%)',
    text: 'text-slate-900', sub: 'text-slate-700/80', crest: 'from-white to-slate-300 text-slate-800', edge: 'ring-white/60',
  },
  Gold: {
    base: 'linear-gradient(135deg,#5c3d06 0%,#a8771b 28%,#f2d27a 50%,#b8862a 72%,#6b470a 100%)',
    foil: 'linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,247,214,.6) 48%,rgba(255,255,255,.7) 50%,rgba(253,224,71,.35) 54%,rgba(255,255,255,0) 70%)',
    text: 'text-[#2b1b02]', sub: 'text-[#3d2905]/75', crest: 'from-[#fff5d1] to-[#e2b54a] text-[#4a3105]', edge: 'ring-amber-200/70',
  },
  Platinum: {
    base: 'linear-gradient(135deg,#0d0f17 0%,#1d2233 35%,#3a4260 55%,#1b2030 75%,#0b0d14 100%)',
    foil: 'linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(196,181,253,.35) 45%,rgba(255,255,255,.5) 50%,rgba(125,211,252,.35) 55%,rgba(255,255,255,0) 70%)',
    text: 'text-white', sub: 'text-slate-300/80', crest: 'from-violet-200 to-sky-300 text-[#141826]', edge: 'ring-violet-200/40',
  },
};

const Chip = () => (
  <svg viewBox="0 0 52 40" className="h-9 w-12 drop-shadow" aria-hidden="true">
    <defs>
      <linearGradient id="chipg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#fbe8a6" /><stop offset=".5" stopColor="#d4a93c" /><stop offset="1" stopColor="#f6dc8a" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="50" height="38" rx="7" fill="url(#chipg)" stroke="#9c7522" strokeWidth=".8" />
    <path d="M1 14h15M1 26h15M36 14h15M36 26h15M16 1v38M36 1v38M16 20h20" stroke="#9c7522" strokeWidth=".9" fill="none" opacity=".75" />
    <rect x="20" y="10" width="12" height="20" rx="3" fill="none" stroke="#9c7522" strokeWidth=".9" opacity=".75" />
  </svg>
);

const Contactless = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`h-6 w-6 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M8.5 7.5a6 6 0 0 1 0 9" /><path d="M12 5a9.5 9.5 0 0 1 0 14" /><path d="M15.5 2.5a13 13 0 0 1 0 19" />
  </svg>
);

/** Fine guilloché lines, like a banknote or premium card. */
const Guilloche = () => (
  <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-[0.12] mix-blend-overlay" viewBox="0 0 400 250" preserveAspectRatio="none">
    {Array.from({ length: 22 }, (_, i) => (
      <path key={i} d={`M -20 ${40 + i * 9} C 80 ${-10 + i * 9}, 160 ${110 + i * 9}, 260 ${50 + i * 9} S 420 ${20 + i * 9}, 440 ${70 + i * 9}`} fill="none" stroke="white" strokeWidth=".7" />
    ))}
  </svg>
);

const fmt = (v: any) => Number(v || 0).toLocaleString('en-US');

const MembershipCard = ({ tier, points, name, memberNumber, memberSince }: {
  tier: string; points: number; name: string; memberNumber?: string; memberSince?: string;
}) => {
  const look = LOOKS[tier] || LOOKS.Explorer;
  const reduce = !!useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 180, damping: 18 });
  const foilX = useTransform(mx, [0, 1], ['-40%', '40%']);
  const glareX = useTransform(mx, [0, 1], ['0%', '100%']);
  const glareY = useTransform(my, [0, 1], ['0%', '100%']);
  const glare = useTransform([glareX, glareY] as any, ([x, y]: any) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,.35), transparent 45%)`);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { mx.set(0.5); my.set(0.5); };
  const since = memberSince ? new Date(memberSince) : null;
  const sinceText = since && !isNaN(since.getTime()) ? `${String(since.getMonth() + 1).padStart(2, '0')}/${String(since.getFullYear()).slice(2)}` : '—';
  const digits = (memberNumber || '').replace(/^HC-/, '');
  const grouped = digits.replace(/(\d{4})(?=\d)/g, '$1 ');

  return (
    <div className="mx-auto w-full max-w-[400px] [perspective:1400px]">
      <motion.div onPointerMove={onMove} onPointerLeave={reset} style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className={`relative aspect-[1.586] select-none overflow-hidden rounded-[20px] p-5 shadow-[0_40px_70px_-25px_rgba(0,0,0,0.7),0_10px_20px_-10px_rgba(0,0,0,0.4)] ring-1 sm:p-6 ${look.edge} ${look.text}`}
        role="img" aria-label={`HogiCar Rewards ${tier} card for ${name}, ${fmt(points)} points`}>
        <div aria-hidden="true" className="absolute inset-0" style={{ background: look.base }} />
        {/* brushed-metal texture */}
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.18] mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.18) 0 1px, transparent 1px 3px)' }} />
        <Guilloche />
        {/* holographic foil band */}
        <motion.div aria-hidden="true" className="absolute -inset-y-8 left-0 w-[160%] -translate-x-1/4 mix-blend-soft-light" style={{ background: look.foil, x: reduce ? 0 : foilX }} />
        {!reduce && <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: glare }} />}
        {/* large watermark crown */}
        <Crown aria-hidden="true" className="absolute -bottom-6 -right-4 h-40 w-40 opacity-[0.08]" strokeWidth={1} />

        <div className="relative flex h-full flex-col justify-between" style={{ transform: 'translateZ(30px)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[15px] font-black tracking-[0.14em]">HOGI<span className="text-[#F57C00]">CAR</span></p>
              <p className={`text-[9px] font-bold uppercase tracking-[0.32em] ${look.sub}`}>Rewards</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-br px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] shadow-sm ${look.crest}`}>
                <Crown className="h-3 w-3" /> {tier}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Chip />
            <Contactless className={look.sub} />
          </div>

          <div>
            <p className={`text-[9px] font-bold uppercase tracking-[0.24em] ${look.sub}`}>Points balance</p>
            <p className="font-mono text-[26px] font-bold leading-tight tracking-[0.06em] tabular-nums [text-shadow:0_1px_0_rgba(255,255,255,.15),0_-1px_0_rgba(0,0,0,.25)] sm:text-3xl">{fmt(points)}</p>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold uppercase tracking-[0.12em] [text-shadow:0_1px_0_rgba(0,0,0,.2)]">{name}</p>
              <p className={`font-mono text-[11px] tracking-[0.18em] ${look.sub}`}>HC {grouped}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-[8px] font-bold uppercase tracking-[0.2em] ${look.sub}`}>Member since</p>
              <p className="font-mono text-xs font-semibold">{sinceText}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MembershipCard;
