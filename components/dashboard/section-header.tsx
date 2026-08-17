interface SectionHeaderProps {
  dotColor: string;
  label: string;
  subtitle: string;
}

export function SectionHeader({ dotColor, label, subtitle }: SectionHeaderProps) {
  return (
    <div className="mt-9 mb-3.5 flex items-center gap-2.5">
      <span className="h-2 w-2 rounded-full" style={{ background: dotColor }} />
      <span className="text-sm font-semi text-text-primary">{label}</span>
      <span className="text-sm text-text-faint">{subtitle}</span>
    </div>
  );
}
