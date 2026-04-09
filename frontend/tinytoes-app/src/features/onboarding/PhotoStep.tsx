import { Button } from '@/components/Button';
import { PhotoUpload } from '@/components/PhotoUpload';

interface PhotoStepProps {
  value: string | null;
  onChange: (photo: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PhotoStep({ value, onChange, onNext, onBack }: PhotoStepProps) {
  return (
    <div className="flex-1 flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--color-text)' }}>
          Add a profile photo
        </h2>
        <p className="text-sm text-center mb-8" style={{ color: 'var(--color-muted)' }}>
          A photo of your little one for their journal.
        </p>

        <PhotoUpload
          value={value}
          onChange={onChange}
          circular
          label=""
        />
      </div>

      <div className="flex gap-3 pt-6 max-w-sm mx-auto w-full">
        <Button variant="ghost" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={onNext} className="flex-1">
          {value ? 'Continue' : 'Skip'}
        </Button>
      </div>
    </div>
  );
}
