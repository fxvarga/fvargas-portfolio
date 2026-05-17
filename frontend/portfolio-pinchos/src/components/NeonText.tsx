interface NeonTextProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p';
  variant?: 'pink' | 'green';
  className?: string;
  pulse?: boolean;
}

function NeonText({ children, as: Tag = 'span', variant = 'pink', className = '', pulse = false }: NeonTextProps) {
  const glowClass = variant === 'green' ? 'neon-text-green' : 'neon-text';
  const pulseClass = pulse ? 'neon-pulse' : '';

  return (
    <Tag className={`${glowClass} ${pulseClass} ${className}`}>
      {children}
    </Tag>
  );
}

export default NeonText;
