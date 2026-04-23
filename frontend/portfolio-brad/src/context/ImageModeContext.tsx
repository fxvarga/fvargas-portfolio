import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type ImageMode = 'stock' | 'placeholder';

interface ImageModeContextType {
  mode: ImageMode;
  toggle: () => void;
}

const ImageModeContext = createContext<ImageModeContextType>({
  mode: 'stock',
  toggle: () => {},
});

export function useImageMode() {
  return useContext(ImageModeContext);
}

export function ImageModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ImageMode>(() => {
    try {
      return (localStorage.getItem('brad-image-mode') as ImageMode) || 'stock';
    } catch {
      return 'stock';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('brad-image-mode', mode);
    } catch {
      // ignore
    }
  }, [mode]);

  const toggle = () => setMode((m) => (m === 'stock' ? 'placeholder' : 'stock'));

  return (
    <ImageModeContext.Provider value={{ mode, toggle }}>
      {children}
    </ImageModeContext.Provider>
  );
}
