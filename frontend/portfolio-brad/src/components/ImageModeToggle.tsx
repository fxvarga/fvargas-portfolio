import { useImageMode } from '../context/ImageModeContext';

/**
 * Floating toggle button — bottom-right corner.
 * Switches between stock photos and placeholder mode.
 */
export default function ImageModeToggle() {
  const { mode, toggle } = useImageMode();

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border transition-all text-sm font-body font-medium hover:scale-105 active:scale-95"
      style={{
        backgroundColor: mode === 'stock' ? 'rgb(var(--color-bg-alt))' : 'rgb(var(--color-surface))',
        color: mode === 'stock' ? 'rgb(var(--color-text))' : 'rgb(var(--color-text-inverse))',
        borderColor: mode === 'stock' ? 'rgb(var(--color-border))' : 'rgb(var(--color-border-dark))',
      }}
      aria-label={`Switch to ${mode === 'stock' ? 'placeholder' : 'stock image'} mode`}
      title={mode === 'stock' ? 'Showing stock images — click for placeholders' : 'Showing placeholders — click for stock images'}
    >
      {mode === 'stock' ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          Stock Images
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          Placeholders
        </>
      )}
    </button>
  );
}
