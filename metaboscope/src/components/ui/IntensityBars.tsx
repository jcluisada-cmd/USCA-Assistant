// 3 barres verticales remplies selon level (1, 2, 3 = max).
// Couleur héritée via currentColor — placer dans un parent qui définit la couleur (text-red-700 etc.).

interface IntensityBarsProps {
  level: 1 | 2 | 3;
  /** Label optionnel à côté (fort/modéré/faible) */
  label?: string;
}

export function IntensityBars({ level, label }: IntensityBarsProps) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={label ?? `intensité ${level}/3`}>
      <span className="inline-flex gap-0.5">
        <span className="block h-3 w-1 rounded-sm bg-current" style={{ opacity: level >= 1 ? 1 : 0.2 }} />
        <span className="block h-3 w-1 rounded-sm bg-current" style={{ opacity: level >= 2 ? 1 : 0.2 }} />
        <span className="block h-3 w-1 rounded-sm bg-current" style={{ opacity: level >= 3 ? 1 : 0.2 }} />
      </span>
      {label && <span className="text-[9px] uppercase font-bold">{label}</span>}
    </span>
  );
}
