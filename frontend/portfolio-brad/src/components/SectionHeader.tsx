import Editable from './Editable';

interface SectionHeaderProps {
  label?: string;
  heading: string;
  subheading?: string;
  centered?: boolean;
  /** Optional path prefix for Editable fields. If not provided, fields are not editable. */
  editPath?: string;
}

export default function SectionHeader({ label, heading, subheading, centered = false, editPath }: SectionHeaderProps) {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
      {label && (
        <div className={`flex items-center gap-3 mb-3 ${centered ? 'justify-center' : ''}`}>
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          {editPath ? (
            <Editable path={`${editPath}.label`} as="p" className="text-sm font-medium text-txt-muted font-body uppercase tracking-wider">{label}</Editable>
          ) : (
            <p className="text-sm font-medium text-txt-muted font-body uppercase tracking-wider">{label}</p>
          )}
        </div>
      )}
      {editPath ? (
        <Editable path={`${editPath}.heading`} as="h2" className="font-heading text-3xl lg:text-4xl font-bold text-txt leading-tight">{heading}</Editable>
      ) : (
        <h2 className="font-heading text-3xl lg:text-4xl font-bold text-txt leading-tight">{heading}</h2>
      )}
      {subheading && (
        editPath ? (
          <Editable path={`${editPath}.subheading`} as="p" className="mt-4 text-lg text-txt-muted font-body max-w-2xl leading-relaxed">{subheading}</Editable>
        ) : (
          <p className="mt-4 text-lg text-txt-muted font-body max-w-2xl leading-relaxed">{subheading}</p>
        )
      )}
    </div>
  );
}
