import { ReactNode } from 'react';
import Container from '../ui/Container';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
}

export default function Section({ children, className = '', id, dark = false }: SectionProps) {
  return (
    <section
      id={id}
      className={`py-16 sm:py-20 ${dark ? 'bg-primary-800 text-white' : ''} ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}
