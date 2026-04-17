import { Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';

interface CompleteStepProps {
  name: string;
  onComplete: () => void;
  onBack: () => void;
}

export function CompleteStep({ name, onComplete, onBack }: CompleteStepProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Celebration */}
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-theme-secondary-light">
        <Sparkles size={40} className="text-theme-secondary" />
      </div>

      <h1 className="text-3xl font-bold mb-2 text-theme-text">
        {name}'s journal is ready!
      </h1>
      <p className="text-base max-w-xs mb-10 text-theme-muted">
        Start capturing every adorable first bite and reaction. These memories are priceless.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <Button onClick={onComplete} size="lg" fullWidth>
          Start Tracking
        </Button>
        <Button variant="ghost" onClick={onBack} fullWidth>
          Go Back
        </Button>
      </div>
    </div>
  );
}
