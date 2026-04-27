import { BottomSheet } from '@/components/BottomSheet';
import { PICKABLE_TEMPLATES } from '../PageTemplates';
import type { PageTemplateId, BookPage } from '@/types';
import { Lock } from 'lucide-react';

interface LayoutsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: BookPage | null;
  onChangeLayout: (templateId: PageTemplateId) => void;
}

export function LayoutsSheet({ isOpen, onClose, currentPage, onChangeLayout }: LayoutsSheetProps) {
  const locked = currentPage?.locked === true;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Layouts" maxHeight={45}>
      {locked ? (
        <div className="py-8 flex flex-col items-center text-center text-gray-500">
          <Lock size={28} className="mb-2 text-gray-400" />
          <p className="text-sm font-semibold">Inside cover is locked</p>
          <p className="text-xs text-gray-400 mt-1">This page is intentionally left blank.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {PICKABLE_TEMPLATES.map(t => {
            const isActive = currentPage?.templateId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { onChangeLayout(t.id); onClose(); }}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  isActive ? 'border-theme-primary bg-theme-primary/5' : 'border-gray-200 hover:border-theme-primary/50'
                }`}
              >
                <t.icon size={24} className={`mx-auto mb-1 ${isActive ? 'text-theme-primary' : 'text-gray-400'}`} />
                <p className="text-[10px] font-semibold text-gray-700">{t.label}</p>
                <p className="text-[8px] text-gray-400 mt-0.5">{t.description}</p>
              </button>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}
