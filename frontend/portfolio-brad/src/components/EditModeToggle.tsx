import { useEditMode } from '../context/EditModeContext';

/**
 * Floating pencil toggle — sits above ImageModeToggle in the bottom-right stack.
 * Activates/deactivates inline editing across all <Editable> fields.
 */
export default function EditModeToggle() {
  const { editMode, toggleEditMode } = useEditMode();

  return (
    <button
      onClick={toggleEditMode}
      data-editor-ui
      className={`fixed bottom-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border transition-all text-sm font-body font-medium hover:scale-105 active:scale-95 ${
        editMode
          ? 'bg-primary text-white border-primary'
          : 'bg-[rgb(var(--color-bg-alt))] text-[rgb(var(--color-text))] border-[rgb(var(--color-border))]'
      }`}
      aria-label={editMode ? 'Exit edit mode' : 'Enter edit mode'}
      title={editMode ? 'Editing — click to exit' : 'Click to edit text'}
    >
      {/* Lucide Pencil icon */}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
      {editMode ? 'Editing' : 'Edit'}
    </button>
  );
}
