import { useState, useEffect } from 'react';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import type { BookPage } from '@/types';

export interface StatsUpdate {
  heading?: string;
  stats?: NonNullable<BookPage['stats']>;
}

interface StatsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  page: BookPage | null;
  onSave: (updates: StatsUpdate) => void;
}

/**
 * Editor for the title-stats template (Hello, Baby! page).
 * Edits the heading + 4 birth-stat fields.
 */
export function StatsSheet({ isOpen, onClose, page, onSave }: StatsSheetProps) {
  const [heading, setHeading] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');

  useEffect(() => {
    if (!page) return;
    setHeading(page.heading ?? 'Hello, Baby!');
    setBirthDate(page.stats?.birthDate ?? '');
    setBirthTime(page.stats?.birthTime ?? '');
    setWeight(page.stats?.weight ?? '');
    setLength(page.stats?.length ?? '');
  }, [page]);

  const handleSave = () => {
    onSave({
      heading: heading.trim() || 'Hello, Baby!',
      stats: { birthDate, birthTime, weight, length },
    });
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Edit Title & Birth Stats" maxHeight={70}>
      <div className="space-y-3">
        <Field label="Heading" value={heading} onChange={setHeading} placeholder="Hello, Baby!" autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Birth date" value={birthDate} onChange={setBirthDate} placeholder="Aug 1, 2026" />
          <Field label="Time" value={birthTime} onChange={setBirthTime} placeholder="9:42 am" />
          <Field label="Weight" value={weight} onChange={setWeight} placeholder="7 lb 4 oz" />
          <Field label="Length" value={length} onChange={setLength} placeholder="20 in" />
        </div>
        <Button fullWidth onClick={handleSave}>Save</Button>
      </div>
    </BottomSheet>
  );
}

function Field({
  label, value, onChange, placeholder, autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-800 focus:border-theme-primary outline-none"
      />
    </div>
  );
}
