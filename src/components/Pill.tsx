type PillVariant = 'success' | 'warning' | 'muted' | 'danger'

const styles: Record<PillVariant, { bg: string; dot: string; text: string }> = {
  success: { bg: '#DCFCE7', dot: '#16A34A', text: '#15803D' },
  warning: { bg: '#FEF3C7', dot: '#D97706', text: '#92400E' },
  muted: { bg: '#F3F4F6', dot: '#9CA3AF', text: '#6B7280' },
  danger: { bg: '#FEE2E2', dot: '#DC2626', text: '#991B1B' },
}

export default function Pill({
  variant = 'muted',
  children,
  showDot = true,
}: {
  variant?: PillVariant
  children: React.ReactNode
  showDot?: boolean
}) {
  const s = styles[variant]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.text }}
    >
      {showDot && (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      )}
      {children}
    </span>
  )
}
