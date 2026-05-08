import { pdAlertLabel, severityClass, type Severity } from '../../utils/labels';

interface BadgeProps {
  /** Code PD (ex. 'QT-KR') OU label libre */
  code?: string;
  /** Label libre (priorité sur code) */
  label?: string;
  /** Sévérité explicite (priorité sur celle déduite du code) */
  severity?: Severity;
  /** Classes additionnelles */
  className?: string;
}

export function Badge({ code, label, severity, className = '' }: BadgeProps) {
  const resolved = code ? pdAlertLabel(code) : { label: label ?? '', severity: severity ?? 'neutral' as Severity };
  const finalLabel = label ?? resolved.label;
  const finalSeverity = severity ?? resolved.severity;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${severityClass(finalSeverity)} ${className}`}
      role="status"
    >
      {finalLabel}
    </span>
  );
}
