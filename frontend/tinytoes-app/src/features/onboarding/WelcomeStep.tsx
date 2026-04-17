import { UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/Button';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Hero illustration */}
      <div className="w-28 h-28 rounded-full flex items-center justify-center mb-8 bg-theme-primary-light">
        <UtensilsCrossed size={48} className="text-theme-primary" />
      </div>

      <h1 className="text-3xl font-bold mb-3 text-theme-text">
        Welcome to TinyToesAndUs
      </h1>
      <p className="text-lg mb-2 text-theme-primary">
        Baby First Bites
      </p>
      <p className="text-base max-w-xs mb-10 text-theme-muted">
        Create a beautiful memory journal of your baby's first food adventures.
      </p>

      <Button onClick={onNext} size="lg" fullWidth className="max-w-xs">
        Get Started
      </Button>
    </div>
  );
}
