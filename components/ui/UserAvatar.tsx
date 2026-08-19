import { HardHat, Hammer, Wrench, Ruler, PaintRoller, TrafficCone, Forklift, Drill, Pickaxe, Truck } from 'lucide-react'

const AVATAR_ICONS = [HardHat, Hammer, Wrench, Ruler, PaintRoller, TrafficCone, Forklift, Drill, Pickaxe, Truck]

function iconForId(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_ICONS[hash % AVATAR_ICONS.length]
}

export function UserAvatar({ id, color, size = 32 }: { id: string; color?: string; size?: number }) {
  const Icon = iconForId(id || '?')
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color || 'var(--maf)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <Icon size={Math.round(size * 0.52)} color="#fff" strokeWidth={2.2} />
    </div>
  )
}
