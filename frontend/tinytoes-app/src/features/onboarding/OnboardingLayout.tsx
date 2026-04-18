import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useThemeContext } from '@/components/ThemeProvider';
import type { AgeRange, ThemeName } from '@/types';
import { WelcomeStep } from './WelcomeStep';
import { NameStep } from './NameStep';
import { AgeStep } from './AgeStep';
import { ThemeStep } from './ThemeStep';
import { PhotoStep } from './PhotoStep';
import { CompleteStep } from './CompleteStep';

const TOTAL_STEPS = 6;

export function OnboardingLayout() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { setTheme } = useThemeContext();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name || '');
  const [ageRange, setAgeRange] = useState<AgeRange>(profile.ageRange || '6–9 months');
  const [themeName, setThemeName] = useState<ThemeName>(profile.theme || 'Neutral');
  const [photo, setPhoto] = useState<string | null>(profile.photo || null);

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const handleComplete = async () => {
    await updateProfile({
      name,
      ageRange,
      theme: themeName,
      photo,
      onboardingComplete: true,
    });
    navigate('/year-recap', { replace: true });
  };

  const handleThemeChange = (t: ThemeName) => {
    setThemeName(t);
    setTheme(t);
  };

  const steps: ReactNode[] = [
    <WelcomeStep key="welcome" onNext={next} />,
    <NameStep key="name" value={name} onChange={setName} onNext={next} onBack={back} />,
    <AgeStep key="age" value={ageRange} onChange={setAgeRange} onNext={next} onBack={back} />,
    <ThemeStep key="theme" value={themeName} onChange={handleThemeChange} onNext={next} onBack={back} />,
    <PhotoStep key="photo" value={photo} onChange={setPhoto} onNext={next} onBack={back} />,
    <CompleteStep key="complete" name={name} onComplete={handleComplete} onBack={back} />,
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Step indicator */}
      {step > 0 && (
        <div className="flex justify-center gap-2.5 pt-7 px-4">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? '2rem' : '0.5rem',
                backgroundColor: i <= step ? 'var(--color-primary)' : 'var(--color-accent)',
              }}
            />
          ))}
        </div>
      )}

      {/* Current step */}
      <div className="flex-1 flex flex-col">
        {steps[step]}
      </div>
    </div>
  );
}
