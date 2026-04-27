import type { CoverConfig } from '@/types';
import { getTrimSize, NURSERY, FONTS } from './bookConstants';
import { Decoration } from './Decorations';

interface CoverCanvasProps {
  cover: CoverConfig;
  skuSlug?: string | null;
  className?: string;
  onClick?: () => void;
}

/**
 * Square nursery-style cover matching screenshots/1762827486000.webp:
 *   - Top: large square baby photo
 *   - Mid: handwritten script tagline ("welcome to the world")
 *   - Bottom: chunky display baby NAME
 *   - Sparkle clusters bottom-left + bottom-right
 */
export function CoverCanvas({ cover, skuSlug, className = '', onClick }: CoverCanvasProps) {
  const trim = getTrimSize(skuSlug);
  const tagline = 'welcome to the world';

  return (
    <div
      className={`relative overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        aspectRatio: `${trim.widthPt} / ${trim.heightPt}`,
        backgroundColor: NURSERY.cream,
      }}
      onClick={onClick}
    >
      {/* Photo block — square, occupying the upper ~62% */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '8%', left: '10%', right: '10%',
          aspectRatio: '1 / 1',
          backgroundColor: NURSERY.ivory,
          border: `1px solid ${NURSERY.whisper}`,
        }}
      >
        {cover.photo ? (
          <img src={cover.photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
               style={{ fontFamily: FONTS.hand, color: NURSERY.whisper, fontSize: '1.2em' }}>
            tap to add a photo
          </div>
        )}
      </div>

      {/* Tagline — script */}
      <p
        className="absolute text-center w-full"
        style={{
          top: '74%',
          fontFamily: FONTS.script,
          color: NURSERY.pink,
          fontSize: 'clamp(16px, 7vw, 38px)',
          lineHeight: 1,
        }}
      >
        {tagline}
      </p>

      {/* Baby name — chunky display */}
      <p
        className="absolute text-center w-full uppercase"
        style={{
          top: '83%',
          fontFamily: FONTS.display,
          fontWeight: 600,
          color: NURSERY.charcoal,
          fontSize: 'clamp(18px, 8vw, 44px)',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}
      >
        {cover.babyName || 'Baby Name'}
      </p>

      {/* Sparkle clusters */}
      <div className="absolute" style={{ bottom: '4%', left: '6%', width: '14%' }}>
        <Decoration kind="sparkles" size="100%" color={NURSERY.peach} />
      </div>
      <div className="absolute" style={{ bottom: '4%', right: '6%', width: '14%' }}>
        <Decoration kind="sparkles" size="100%" color={NURSERY.sage} />
      </div>
    </div>
  );
}
