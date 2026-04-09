import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { AGE_RANGES, type AgeRange } from '@/types';

interface AgeStepProps {
  value: AgeRange;
  onChange: (age: AgeRange) => void;
  onNext: () => void;
  onBack: () => void;
}

const AGE_ICONS = ['&#x1F476;', '&#x1F37C;', '&#x1F34C;', '&#x1F382;'];

export function AgeStep({ value, onChange, onNext, onBack }: AgeStepProps) {
  return (
    <div className="flex-1 flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--color-text)' }}>
          How old is your baby?
        </h2>
        <p className="text-sm text-center mb-8" style={{ color: 'var(--color-muted)' }}>
          This helps us tailor the experience.
        </p>

        <div className="grid grid-cols-2 gap-3 w-full">
          {AGE_RANGES.map((age, i) => {
            const isSelected = value === age;
            return (
              <Card
                key={age}
                hoverable
                padding="md"
                onClick={() => onChange(age)}
                className="text-center transition-all duration-200"
                style={{
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: isSelected ? 'var(--color-primary)' : 'transparent',
                  backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--color-panel)',
                }}
              >
                <div className="text-2xl mb-2" dangerouslySetInnerHTML={{ __html: AGE_ICONS[i] }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{age}</p>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-6 max-w-sm mx-auto w-full">
        <Button variant="ghost" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={onNext} className="flex-1">Continue</Button>
      </div>
    </div>
  );
}
