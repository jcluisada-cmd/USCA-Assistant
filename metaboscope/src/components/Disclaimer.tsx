// Disclaimer clinique imposé par CLAUDE.md — visible page d'accueil + pied de fiche + écran first-use.

export const DISCLAIMER_TEXT =
  "MétaboScope est un outil d'aide à la décision. Il ne se substitue pas au jugement clinique du prescripteur, ni à la validation du pharmacien clinicien USCA pour toute co-prescription à haut risque. Les recommandations pharmacogénétiques nécessitent confirmation par le laboratoire de pharmacogénomique. Les données sur les NPS sont par nature évolutives."

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      role="note"
      aria-label="Disclaimer clinique"
      className={[
        'border-t border-amber-700/40 bg-amber-900/20 text-amber-100',
        compact ? 'text-[11px] px-3 py-2' : 'text-xs px-4 py-3',
      ].join(' ')}
    >
      <p className="max-w-5xl mx-auto leading-snug">
        <span className="font-semibold text-amber-300">Avertissement —</span>{' '}
        {DISCLAIMER_TEXT}
      </p>
    </aside>
  )
}
