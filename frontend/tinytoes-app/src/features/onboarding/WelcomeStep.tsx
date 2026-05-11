import { Button } from '@/components/Button';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Brand illustration */}
      <div className="w-36 h-36 rounded-full overflow-hidden mb-8 shadow-lg">
        <img
          src="/brand.webp"
          alt="Tiny Toes"
          className="w-full h-full object-cover"
        />
      </div>

      <h1 className="text-3xl font-bold font-display tracking-tight mb-3 text-theme-text">
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
