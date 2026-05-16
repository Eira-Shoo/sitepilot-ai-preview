import { SECTION_LABEL, SECTION_LEAD, SECTION_TITLE } from "./section-styles";

type Props = {
  label: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeader({ label, title, description, className = "" }: Props) {
  return (
    <div className={`mx-auto max-w-2xl text-center ${className}`}>
      <p className={SECTION_LABEL}>{label}</p>
      <h2 className={SECTION_TITLE}>{title}</h2>
      {description ? <p className={SECTION_LEAD}>{description}</p> : null}
    </div>
  );
}
