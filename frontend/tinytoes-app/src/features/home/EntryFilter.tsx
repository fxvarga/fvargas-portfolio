import { SegmentedControl } from '@/components/SegmentedControl';
import type { FilterType } from '@/types';

interface EntryFilterProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'loved', label: 'Loved' },
  { value: 'neutral', label: 'Okay' },
  { value: 'disliked', label: 'Nope' },
];

export function EntryFilter({ value, onChange }: EntryFilterProps) {
  return (
    <SegmentedControl
      options={FILTER_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
