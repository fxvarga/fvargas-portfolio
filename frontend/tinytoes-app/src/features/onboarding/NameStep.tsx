import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface NameStepProps {
  value: string;
  onChange: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function NameStep({ value, onChange, onNext, onBack }: NameStepProps) {
  return (
    <div className="flex-1 flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        <h2 className="text-2xl font-bold font-display tracking-tight text-center mb-2 text-theme-text">
          What's your little one's name?
        </h2>
        <p className="text-sm text-center mb-8 text-theme-muted">
          We'll personalize the journal just for them.
        </p>

        <Input
          placeholder="Baby's name"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus
          className="text-center text-lg"
        />
      </div>

      <div className="flex gap-3 pt-6 max-w-sm mx-auto w-full">
        <Button variant="ghost" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={onNext} disabled={!value.trim()} className="flex-1">Continue</Button>
      </div>
    </div>
  );
}
