import { useState, useEffect } from 'react';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import type { BookPage } from '@/types';

interface TextSheetProps {
  isOpen: boolean;
  onClose: () => void;
  page: BookPage | null;
  /** Index of the item being edited (for photo-text body) */
  itemIndex: number;
  onSave: (updates: { heading?: string; title?: string; text?: string }) => void;
}

export function TextSheet({ isOpen, onClose, page, itemIndex, onSave }: TextSheetProps) {
  const item = page?.items[itemIndex];
  const isTextOnly = page?.templateId === 'text-only';
  const isMonthTitle = page?.templateId === 'month-title';

  const [heading, setHeading] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (!page) return;
    setHeading(page.heading ?? '');
    setTitle(item?.title ?? '');
    setText(item?.text ?? '');
  }, [page, item]);

  const handleSave = () => {
    onSave({
      heading: (isTextOnly || isMonthTitle) ? heading : undefined,
      title,
      text,
    });
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Edit Text" maxHeight={60}>
      <div className="space-y-3">
        {(isTextOnly || isMonthTitle) && (
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              {isMonthTitle ? 'Month Title' : 'Heading'}
            </label>
            <input
              type="text"
              value={heading}
              onChange={e => setHeading(e.target.value)}
              placeholder={isMonthTitle ? 'e.g. Month 3' : 'Page heading'}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-800 focus:border-theme-primary outline-none"
              autoFocus
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-800 focus:border-theme-primary outline-none"
            autoFocus={!isTextOnly && !isMonthTitle}
          />
        </div>

        {!isMonthTitle && (
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Body Text</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write your text here..."
              rows={5}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-800 focus:border-theme-primary outline-none resize-none"
            />
          </div>
        )}

        <Button fullWidth onClick={handleSave}>Save</Button>
      </div>
    </BottomSheet>
  );
}
