import { useRef, useEffect, useState, useCallback, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { BookPage, PageContentItem, ImageOffset } from '@/types';
import { getTrimSize, MARGIN, NURSERY, FONTS } from './bookConstants';
import { Decoration } from './Decorations';
import { ImagePlus } from 'lucide-react';

/* ── Types ──────────────────────────────────────────────── */

export interface SlotTapEvent {
  slotIndex: number;
  slotKind: 'image' | 'text';
}

interface PageCanvasProps {
  page: BookPage;
  skuSlug?: string | null;
  /** If true, show tap-target overlays on empty slots */
  editable?: boolean;
  /** Called when user taps an empty (or filled) slot */
  onSlotTap?: (e: SlotTapEvent) => void;
  /** Persist a new pan/zoom offset for an image slot */
  onImageOffsetChange?: (slotIndex: number, offset: ImageOffset) => void;
  /** Extra className on the outer wrapper */
  className?: string;
  /** Render as a small thumbnail (hides text details, disables panning) */
  compact?: boolean;
  /** Whether this page is the currently active/selected page */
  active?: boolean;
  /** Which slot index is currently active (shows highlight border) */
  activeSlotIndex?: number;
}

/* ── Main component ─────────────────────────────────────── */

export function PageCanvas({
  page, skuSlug, editable = false, onSlotTap, onImageOffsetChange,
  className = '', compact = false, active: _active = false, activeSlotIndex,
}: PageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

  const trim = getTrimSize(skuSlug);
  const marginPctH = (MARGIN / trim.widthPt) * 100;
  const marginPctV = (MARGIN / trim.heightPt) * 100;

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const scale = containerW / trim.widthPt;

  const safeStyle: CSSProperties = {
    position: 'absolute',
    top: `${marginPctV}%`,
    left: `${marginPctH}%`,
    right: `${marginPctH}%`,
    bottom: `${marginPctV}%`,
  };

  // Bleed templates (no margins)
  const isBleed = page.templateId === 'full-bleed'
    || page.templateId === 'full-photo'
    || page.templateId === 'photo-quote'
    || page.templateId === 'polaroid'
    || page.templateId === 'quote-only'
    || page.templateId === 'blank-locked'
    || page.templateId === 'title-stats'
    || page.templateId === 'grid-5-asym'
    || page.templateId === 'grid-deco-corner'
    || page.templateId === 'grid-3-deco-text'
    || page.templateId === 'grid-3-top-bottom'
    || page.templateId === 'grid-9-deco-center';

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: `${trim.widthPt} / ${trim.heightPt}`,
        backgroundColor: NURSERY.cream,
      }}
    >
      {containerW > 0 && (
        isBleed ? (
          <div className="absolute inset-0">
            <TemplateRenderer
              page={page} scale={scale} trimAspect={trim.widthPt / trim.heightPt} editable={editable}
              onSlotTap={onSlotTap} onImageOffsetChange={onImageOffsetChange}
              compact={compact} activeSlotIndex={activeSlotIndex}
            />
          </div>
        ) : (
          <div style={safeStyle}>
            <TemplateRenderer
              page={page} scale={scale} trimAspect={trim.widthPt / trim.heightPt} editable={editable}
              onSlotTap={onSlotTap} onImageOffsetChange={onImageOffsetChange}
              compact={compact} activeSlotIndex={activeSlotIndex}
            />
          </div>
        )
      )}
    </div>
  );
}

/* ── Template renderer ──────────────────────────────────── */

interface RendererProps {
  page: BookPage;
  scale: number;
  trimAspect: number;
  editable: boolean;
  onSlotTap?: (e: SlotTapEvent) => void;
  onImageOffsetChange?: (slotIndex: number, offset: ImageOffset) => void;
  compact: boolean;
  activeSlotIndex?: number;
}

function TemplateRenderer(props: RendererProps) {
  const { page, scale, trimAspect, editable, onSlotTap, onImageOffsetChange, compact, activeSlotIndex } = props;
  const items = page.items;

  const handleTap = (slotIndex: number, slotKind: 'image' | 'text') => {
    if (onSlotTap) onSlotTap({ slotIndex, slotKind });
  };
  const handleOffset = (slotIndex: number, offset: ImageOffset) => {
    if (onImageOffsetChange) onImageOffsetChange(slotIndex, offset);
  };

  const slotProps = (i: number) => ({
    item: items[i],
    editable,
    highlighted: activeSlotIndex === i,
    panEnabled: !compact,
    onTap: () => handleTap(i, 'image'),
    onOffsetChange: (o: ImageOffset) => handleOffset(i, o),
  });

  switch (page.templateId) {
    /* ── New nursery templates ─────────────────────── */

    case 'blank-locked':
      // Rendered as plain cream — matches the PDF and the auto-pad blank page.
      return <div className="w-full h-full" />;

    case 'title-stats': {
      const heading = page.heading || 'Hello, Baby!';
      const stats = page.stats;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center px-[10%] cursor-pointer"
             style={{ color: NURSERY.charcoal }}
             onClick={() => editable && handleTap(0, 'text')}>
          <p style={{ fontFamily: FONTS.script, fontSize: Math.max(18, 56 * scale), lineHeight: 1, color: NURSERY.pink }}>
            hello,
          </p>
          <p style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: Math.max(20, 64 * scale), lineHeight: 1, marginTop: '2%' }}>
            {heading.replace(/^hello,?\s*/i, '').toUpperCase() || 'BABY!'}
          </p>
          <div className="my-[6%] flex items-center gap-[3%] w-full">
            <div className="flex-1 h-px" style={{ backgroundColor: NURSERY.sage }} />
            <Decoration kind="hearts" size="20%" color={NURSERY.pink} />
            <div className="flex-1 h-px" style={{ backgroundColor: NURSERY.sage }} />
          </div>
          {stats ? (
            <div className="grid grid-cols-2 gap-x-[8%] gap-y-[3%] mt-[2%]"
                 style={{ fontFamily: FONTS.hand, fontSize: Math.max(8, 14 * scale) }}>
              <StatLine label="born" value={stats.birthDate} />
              <StatLine label="time" value={stats.birthTime} />
              <StatLine label="weight" value={stats.weight} />
              <StatLine label="length" value={stats.length} />
            </div>
          ) : (
            editable && (
              <p className="mt-[4%]" style={{ fontFamily: FONTS.hand, fontSize: Math.max(8, 12 * scale), color: NURSERY.pencil }}>
                Tap to add birth stats
              </p>
            )
          )}
        </div>
      );
    }

    case 'full-photo':
      return (
        <div className="absolute inset-0">
          <ImageSlot {...slotProps(0)} className="absolute inset-0" />
        </div>
      );

    case 'photo-quote': {
      const quote = page.heading || items[0]?.text || items[0]?.title || '';
      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex-[7] min-h-0 relative">
            <ImageSlot {...slotProps(0)} className="absolute inset-0" />
          </div>
          <div className="flex-[3] min-h-0 relative flex items-center justify-center px-[8%]"
               style={{ backgroundColor: NURSERY.cream }}
               onClick={() => editable && handleTap(0, 'text')}>
            {page.decoration && (
              <div className="absolute" style={{ top: '12%', left: '6%', width: '14%', opacity: 0.85 }}>
                <Decoration kind={page.decoration} size="100%" />
              </div>
            )}
            {page.decoration && (
              <div className="absolute" style={{ bottom: '12%', right: '6%', width: '14%', opacity: 0.85 }}>
                <Decoration kind={page.decoration} size="100%" />
              </div>
            )}
            <p className="text-center"
               style={{
                 fontFamily: FONTS.script,
                 fontSize: Math.max(12, 28 * scale),
                 color: NURSERY.charcoal,
                 lineHeight: 1.15,
               }}>
              {quote || (editable ? 'tap to add a quote' : '')}
            </p>
          </div>
        </div>
      );
    }

    case 'two-photo-stack':
      return (
        <div className="w-full h-full flex flex-col gap-[2%] p-[3%]">
          {[0, 1].map(i => (
            <div key={i} className="flex-1 min-h-0 relative">
              <ImageSlot {...slotProps(i)} className="absolute inset-0" />
            </div>
          ))}
        </div>
      );

    case 'grid-4':
      return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[2%] p-[3%]">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="relative min-w-0 min-h-0">
              <ImageSlot {...slotProps(i)} className="absolute inset-0" />
            </div>
          ))}
        </div>
      );

    case 'grid-6':
      return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-3 gap-[1.5%] p-[3%]">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="relative min-w-0 min-h-0">
              <ImageSlot {...slotProps(i)} className="absolute inset-0" />
            </div>
          ))}
        </div>
      );

    case 'polaroid': {
      const tilts = ['-4deg', '3deg', '-2deg', '5deg'];
      // Scale frame widths down on wider trims so the bottom row doesn't overflow.
      // Reference aspect = 6/9 ≈ 0.667; on squarer trims, shrink proportionally.
      const refAspect = 6 / 9;
      const fitScale = Math.min(1, refAspect / trimAspect);
      const positions = [
        { top: '8%',  left: '8%',  width: `${42 * fitScale}%` },
        { top: '12%', left: '52%', width: `${40 * fitScale}%` },
        { top: '52%', left: '6%',  width: `${40 * fitScale}%` },
        { top: '50%', left: '52%', width: `${42 * fitScale}%` },
      ];
      return (
        <div className="absolute inset-0">
          {page.decoration && (
            <div className="absolute" style={{ top: '2%', right: '4%', width: '18%' }}>
              <Decoration kind={page.decoration} size="100%" color={NURSERY.peach} />
            </div>
          )}
          {[0, 1, 2, 3].map(i => (
            <div key={i}
                 className="absolute bg-white shadow-md"
                 style={{
                   ...positions[i],
                   transform: `rotate(${tilts[i]})`,
                   padding: '3% 3% 10% 3%',
                   aspectRatio: '1 / 1.18',
                 }}>
              <div className="relative w-full h-full">
                <ImageSlot {...slotProps(i)} className="absolute inset-0" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'quote-only': {
      const quote = page.heading || items[0]?.text || '';
      return (
        <div className="w-full h-full relative flex items-center justify-center px-[12%]">
          {page.decoration && (
            <div className="absolute" style={{ top: '14%', left: '50%', transform: 'translateX(-50%)', width: '30%' }}>
              <Decoration kind={page.decoration} size="100%" />
            </div>
          )}
          <p className="text-center"
             style={{
               fontFamily: FONTS.script,
               fontSize: Math.max(16, 44 * scale),
               color: NURSERY.charcoal,
               lineHeight: 1.1,
             }}
             onClick={() => editable && handleTap(0, 'text')}>
            {quote || (editable ? 'tap to add a quote' : '')}
          </p>
          {page.decoration && (
            <div className="absolute" style={{ bottom: '14%', left: '50%', transform: 'translateX(-50%)', width: '24%', opacity: 0.7 }}>
              <Decoration kind={page.decoration} size="100%" />
            </div>
          )}
        </div>
      );
    }

    /* ── Mixbook-style memory book templates ──── */

    case 'photo-blob-quote': {
      const quote = page.heading || 'LOVE at first sight';
      return (
        <div className="w-full h-full relative flex flex-col items-center p-[6%]">
          <div className="relative w-[75%] flex-[6] min-h-0">
            {page.blobShape !== undefined && (
              <div className="absolute -top-[8%] -right-[12%] w-[40%] h-[40%] rounded-full"
                   style={{ backgroundColor: NURSERY.peach, opacity: 0.25 }} />
            )}
            <ImageSlot {...slotProps(0)} className="absolute inset-0 rounded-md" />
          </div>
          <div className="flex-[3] flex flex-col items-center justify-center mt-[4%]"
               onClick={() => editable && handleTap(0, 'text')}>
            {page.decoration && (
              <div className="mb-[4%]" style={{ width: '20%' }}>
                <Decoration kind={page.decoration} size="100%" color={NURSERY.pink} />
              </div>
            )}
            <p className="text-center" style={{
              fontFamily: FONTS.script, fontSize: Math.max(10, 20 * scale),
              color: NURSERY.pencil, lineHeight: 1.1,
            }}>{quote.replace(/[A-Z]{2,}/g, '').trim()}</p>
            <p className="text-center" style={{
              fontFamily: FONTS.display, fontWeight: 600,
              fontSize: Math.max(14, 36 * scale), color: NURSERY.charcoal, lineHeight: 1,
            }}>{(quote.match(/[A-Z]{2,}/g) || ['LOVE']).join(' ')}</p>
          </div>
        </div>
      );
    }

    case 'quote-deco-photo-split': {
      const quote = page.heading || 'you are my SUNSHINE';
      const photoLeft = page.photoSide === 'left';
      const photoEl = (
        <div className="flex-1 min-w-0 relative">
          <ImageSlot {...slotProps(0)} className="absolute inset-0" />
        </div>
      );
      const textEl = (
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-[6%]"
             onClick={() => editable && handleTap(0, 'text')}>
          {page.decoration && (
            <div className="mb-[6%]" style={{ width: '30%' }}>
              <Decoration kind={page.decoration} size="100%" color={NURSERY.peach} />
            </div>
          )}
          <p style={{ fontFamily: FONTS.script, fontSize: Math.max(10, 18 * scale), color: NURSERY.pencil }}>
            {quote.replace(/[A-Z]{2,}/g, '').trim()}
          </p>
          <p style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: Math.max(16, 40 * scale), color: NURSERY.charcoal }}>
            {(quote.match(/[A-Z]{2,}/g) || ['']).join(' ')}
          </p>
        </div>
      );
      return (
        <div className="w-full h-full flex">
          {photoLeft ? <>{photoEl}{textEl}</> : <>{textEl}{photoEl}</>}
        </div>
      );
    }

    case 'grid-5-asym':
      return (
        <div className="absolute inset-0 flex gap-[1%]">
          <div className="flex-[2] flex flex-col gap-[1%]">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex-1 relative min-h-0">
                <ImageSlot {...slotProps(i)} className="absolute inset-0" />
              </div>
            ))}
          </div>
          <div className="flex-[3] flex flex-col gap-[1%]">
            {[3, 4].map(i => (
              <div key={i} className="flex-1 relative min-h-0">
                <ImageSlot {...slotProps(i)} className="absolute inset-0" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'grid-9-deco-center':
      return (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1%]">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="relative min-w-0 min-h-0">
              <ImageSlot {...slotProps(i)} className="absolute inset-0" />
            </div>
          ))}
          <div className="relative flex items-center justify-center" style={{ backgroundColor: NURSERY.peach + '33' }}>
            {page.decoration && <Decoration kind={page.decoration} size="60%" color={NURSERY.sage} />}
          </div>
          {[4, 5, 6, 7].map(i => (
            <div key={i} className="relative min-w-0 min-h-0">
              <ImageSlot {...slotProps(i)} className="absolute inset-0" />
            </div>
          ))}
        </div>
      );

    case 'grid-deco-corner': {
      const corner = page.decoCorner ?? 3;
      const cells = [0, 1, 2].map(i => (
        <div key={i} className="relative min-w-0 min-h-0">
          <ImageSlot {...slotProps(i)} className="absolute inset-0" />
        </div>
      ));
      const decoCell = (
        <div key="deco" className="relative flex items-center justify-center" style={{ backgroundColor: NURSERY.peach + '22' }}>
          {page.decoration && <Decoration kind={page.decoration} size="55%" color={NURSERY.sage} />}
        </div>
      );
      // Insert deco cell at corner position (0=TL,1=TR,2=BL,3=BR)
      const all = [...cells];
      all.splice(corner, 0, decoCell);
      return (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[1%]">
          {all}
        </div>
      );
    }

    case 'photo-sparkle':
      return (
        <div className="w-full h-full relative p-[8%]">
          <div className="absolute" style={{ top: '6%', right: '10%', width: '12%', opacity: 0.6 }}>
            <Decoration kind="sparkles" size="100%" color={NURSERY.butter} />
          </div>
          <div className="absolute" style={{ bottom: '8%', left: '8%', width: '10%', opacity: 0.5 }}>
            <Decoration kind="sparkles" size="100%" color={NURSERY.butter} />
          </div>
          <div className="relative w-full h-full rounded-md overflow-hidden">
            <ImageSlot {...slotProps(0)} className="absolute inset-0" />
          </div>
        </div>
      );

    case 'grid-3-deco-text': {
      const decoCorner = page.decoCorner ?? 3;
      const photoSlots = [0, 1, 2].map(i => (
        <div key={i} className="relative min-w-0 min-h-0">
          <ImageSlot {...slotProps(i)} className="absolute inset-0" />
        </div>
      ));
      const decoSlot = (
        <div key="deco" className="relative flex flex-col items-center justify-center p-[8%]"
             style={{ backgroundColor: NURSERY.cream }}>
          {page.decoration && <Decoration kind={page.decoration} size="50%" color={NURSERY.peach} />}
          <p className="mt-[8%] text-center" style={{
            fontFamily: FONTS.script, fontSize: Math.max(8, 12 * scale), color: NURSERY.pencil,
          }}>little moments</p>
        </div>
      );
      const all = [...photoSlots];
      all.splice(decoCorner, 0, decoSlot);
      return (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[1%]">
          {all}
        </div>
      );
    }

    case 'two-photo-text': {
      const photoRight = page.photoSide === 'right';
      const photosEl = (
        <div className="flex-[3] flex flex-col gap-[2%]">
          {[0, 1].map(i => (
            <div key={i} className="flex-1 relative min-h-0">
              <ImageSlot {...slotProps(i)} className="absolute inset-0" />
            </div>
          ))}
        </div>
      );
      const textEl = (
        <div className="flex-[2] flex flex-col items-center justify-center p-[6%]"
             onClick={() => editable && handleTap(0, 'text')}>
          <p style={{ fontFamily: FONTS.script, fontSize: Math.max(10, 18 * scale), color: NURSERY.pencil }}>
            tiny hands,
          </p>
          <p style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: Math.max(14, 32 * scale), color: NURSERY.charcoal }}>
            FULL HEARTS
          </p>
        </div>
      );
      return (
        <div className="w-full h-full flex gap-[2%] p-[3%]">
          {photoRight ? <>{textEl}{photosEl}</> : <>{photosEl}{textEl}</>}
        </div>
      );
    }

    case 'quote-deco-grid-3': {
      const quote = page.heading || "can't wait to WATCH YOU GROW";
      return (
        <div className="w-full h-full flex gap-[2%] p-[3%]">
          <div className="flex-1 flex flex-col items-center justify-center p-[4%]"
               onClick={() => editable && handleTap(0, 'text')}>
            {page.decoration && (
              <div className="mb-[6%]" style={{ width: '35%' }}>
                <Decoration kind={page.decoration} size="100%" color={NURSERY.sage} />
              </div>
            )}
            <p style={{ fontFamily: FONTS.script, fontSize: Math.max(9, 16 * scale), color: NURSERY.pencil }}>
              {quote.replace(/[A-Z]{2,}/g, '').trim()}
            </p>
            <p style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: Math.max(14, 30 * scale), color: NURSERY.charcoal, lineHeight: 1.1 }}>
              {(quote.match(/[A-Z]{2,}/g) || ['']).join('\n')}
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-[2%]">
            <div className="flex-[3] relative min-h-0">
              <ImageSlot {...slotProps(0)} className="absolute inset-0" />
            </div>
            <div className="flex-[2] flex gap-[2%]">
              {[1, 2].map(i => (
                <div key={i} className="flex-1 relative min-w-0">
                  <ImageSlot {...slotProps(i)} className="absolute inset-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'grid-1big-2small-deco':
      return (
        <div className="w-full h-full flex gap-[2%] p-[3%]">
          <div className="flex-[3] relative min-w-0">
            <ImageSlot {...slotProps(0)} className="absolute inset-0" />
          </div>
          <div className="flex-[2] flex flex-col gap-[2%]">
            {[1, 2].map(i => (
              <div key={i} className="flex-1 relative min-h-0">
                <ImageSlot {...slotProps(i)} className="absolute inset-0" />
              </div>
            ))}
            {page.decoration && (
              <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: NURSERY.peach + '22', borderRadius: '8px' }}>
                <Decoration kind={page.decoration} size="60%" color={NURSERY.sage} />
              </div>
            )}
          </div>
        </div>
      );

    case 'photo-1big-2small-text': {
      const quote = page.heading || 'our little ANGEL';
      return (
        <div className="w-full h-full flex flex-col gap-[2%] p-[3%]">
          <div className="flex-[3] flex gap-[2%]">
            <div className="flex-[3] relative min-w-0">
              <ImageSlot {...slotProps(0)} className="absolute inset-0" />
            </div>
            <div className="flex-[2] flex flex-col gap-[2%]">
              <div className="flex-1 relative min-h-0">
                <ImageSlot {...slotProps(1)} className="absolute inset-0" />
              </div>
              <div className="flex-1 relative min-h-0">
                <ImageSlot {...slotProps(2)} className="absolute inset-0" />
              </div>
            </div>
          </div>
          <div className="flex-[1] flex items-center px-[4%]"
               onClick={() => editable && handleTap(0, 'text')}>
            <p style={{ fontFamily: FONTS.script, fontSize: Math.max(10, 18 * scale), color: NURSERY.pencil }}>
              {quote.replace(/[A-Z]{2,}/g, '').trim()}
            </p>
            <p className="ml-[3%]" style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: Math.max(14, 32 * scale), color: NURSERY.charcoal }}>
              {(quote.match(/[A-Z]{2,}/g) || ['']).join(' ')}
            </p>
          </div>
        </div>
      );
    }

    case 'grid-3-top-bottom':
      return (
        <div className="absolute inset-0 flex flex-col gap-[1%]">
          <div className="flex-[3] relative min-h-0">
            <ImageSlot {...slotProps(0)} className="absolute inset-0" />
          </div>
          <div className="flex-[2] flex gap-[1%]">
            {[1, 2].map(i => (
              <div key={i} className="flex-1 relative min-w-0">
                <ImageSlot {...slotProps(i)} className="absolute inset-0" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'two-photo-deco-text': {
      const quote = page.heading || 'BLESSED beyond measure';
      return (
        <div className="w-full h-full flex gap-[2%] p-[3%]">
          <div className="flex-[2] flex flex-col gap-[2%]">
            <div className="flex-[2] relative min-h-0">
              <ImageSlot {...slotProps(0)} className="absolute inset-0" />
            </div>
            <div className="flex-1 flex flex-col items-start justify-center px-[4%]"
                 onClick={() => editable && handleTap(0, 'text')}>
              <p style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: Math.max(12, 26 * scale), color: NURSERY.charcoal }}>
                {(quote.match(/[A-Z]{2,}/g) || ['BLESSED']).join(' ')}
              </p>
              <p style={{ fontFamily: FONTS.script, fontSize: Math.max(9, 16 * scale), color: NURSERY.pencil }}>
                {quote.replace(/[A-Z]{2,}/g, '').trim()}
              </p>
              {page.decoration && (
                <div className="mt-[6%]" style={{ width: '35%' }}>
                  <Decoration kind={page.decoration} size="100%" color={NURSERY.peach} />
                </div>
              )}
            </div>
          </div>
          <div className="flex-[3] relative min-w-0">
            <ImageSlot {...slotProps(1)} className="absolute inset-0" />
          </div>
        </div>
      );
    }

    /* ── Legacy templates (kept for old projects) ──── */

    case 'full-bleed':
      return (
        <div className="absolute inset-0">
          <ImageSlot {...slotProps(0)} className="absolute inset-0" />
        </div>
      );

    case 'photo-text':
      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex-[6] min-h-0 relative">
            <ImageSlot {...slotProps(0)} className="absolute inset-0" />
          </div>
          <div className="flex items-center gap-[4%] px-[2%] py-[1.5%]">
            <div className="flex-1 h-px" style={{ backgroundColor: NURSERY.whisper }} />
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: NURSERY.whisper }} />
            <div className="flex-1 h-px" style={{ backgroundColor: NURSERY.whisper }} />
          </div>
          <div className="flex-[3] min-h-0 cursor-pointer px-[1%]"
               onClick={() => editable && handleTap(0, 'text')}>
            <p className="font-semibold tracking-wide"
               style={{ fontFamily: FONTS.display, color: NURSERY.charcoal, fontSize: Math.max(8, 13 * scale) }}>
              {items[0]?.title || (editable ? 'Add a title' : '')}
            </p>
            {!compact && (
              <p className="mt-[2%] line-clamp-3 leading-relaxed"
                 style={{ fontFamily: FONTS.body, color: NURSERY.pencil, fontSize: Math.max(6, 9.5 * scale) }}>
                {items[0]?.text || (editable ? 'Tap to add text...' : '')}
              </p>
            )}
          </div>
        </div>
      );

    case 'two-photo':
      return (
        <div className="w-full h-full flex gap-[1%]">
          {[0, 1].map(i => (
            <div key={i} className="flex-1 min-w-0 relative">
              <ImageSlot {...slotProps(i)} className="absolute inset-0" />
            </div>
          ))}
        </div>
      );

    case 'collage-4':
      return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[1%]">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="relative min-w-0 min-h-0">
              <ImageSlot {...slotProps(i)} className="absolute inset-0" />
            </div>
          ))}
        </div>
      );

    case 'text-only': {
      const heading = page.heading || items[0]?.title;
      return (
        <div className="w-full h-full flex flex-col justify-start cursor-pointer"
             onClick={() => editable && handleTap(0, 'text')}>
          <p className="font-bold truncate"
             style={{ fontFamily: FONTS.display, color: NURSERY.charcoal, fontSize: Math.max(10, 18 * scale) }}>
            {heading || (editable ? 'Add a heading' : 'Heading')}
          </p>
          {!compact && (
            <p className="mt-[3%] line-clamp-6 whitespace-pre-wrap"
               style={{ fontFamily: FONTS.body, color: NURSERY.pencil, fontSize: Math.max(7, 11 * scale) }}>
              {items[0]?.text || (editable ? 'Tap to add text...' : 'Your text here...')}
            </p>
          )}
        </div>
      );
    }

    case 'month-title': {
      const heading = page.heading || items[0]?.title || 'Month Title';
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          {items[0]?.image && (
            <div className="rounded-full overflow-hidden mb-[4%]"
                 style={{ width: '40%', aspectRatio: '1' }}
                 onClick={() => editable && handleTap(0, 'image')}>
              <img src={items[0].image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <p className="font-bold text-center cursor-pointer"
             style={{ fontFamily: FONTS.display, color: NURSERY.charcoal, fontSize: Math.max(10, 24 * scale) }}
             onClick={() => editable && handleTap(0, 'text')}>
            {heading}
          </p>
        </div>
      );
    }
  }

  return null;
}

/* ── Stat line for title-stats template ─────────────────── */

function StatLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="uppercase tracking-widest"
            style={{ fontFamily: FONTS.display, fontSize: '0.7em', color: NURSERY.pencil, letterSpacing: '0.18em' }}>
        {label}
      </span>
      <span style={{ color: NURSERY.charcoal }}>{value || '—'}</span>
    </div>
  );
}

/* ── Reusable image slot with drag-to-pan ───────────────── */

interface ImageSlotProps {
  item?: PageContentItem;
  className?: string;
  editable: boolean;
  highlighted?: boolean;
  panEnabled?: boolean;
  onTap: () => void;
  onOffsetChange?: (offset: ImageOffset) => void;
}

function ImageSlot({
  item, className = '', editable, highlighted, panEnabled = true, onTap, onOffsetChange,
}: ImageSlotProps) {
  const ring = highlighted ? 'ring-2 ring-theme-primary ring-inset' : '';
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; w: number; h: number; moved: boolean } | null>(null);
  const [localOffset, setLocalOffset] = useState<ImageOffset | null>(null);

  // Reset local override when the image source changes
  useEffect(() => { setLocalOffset(null); }, [item?.image, item?.sourceId]);

  const offset: ImageOffset = localOffset ?? item?.imageOffset ?? { x: 0, y: 0, scale: 1 };

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!editable || !panEnabled || !item?.image || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      baseX: offset.x, baseY: offset.y,
      w: rect.width, h: rect.height, moved: false,
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, [editable, panEnabled, item?.image, offset.x, offset.y]);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dxPct = ((e.clientX - d.startX) / d.w) * 100;
    const dyPct = ((e.clientY - d.startY) / d.h) * 100;
    if (Math.abs(dxPct) > 0.5 || Math.abs(dyPct) > 0.5) d.moved = true;
    const next: ImageOffset = {
      x: clamp(d.baseX + dxPct, -50, 50),
      y: clamp(d.baseY + dyPct, -50, 50),
      scale: offset.scale,
    };
    setLocalOffset(next);
  }, [offset.scale]);

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.moved && localOffset && onOffsetChange) {
      onOffsetChange(localOffset);
    } else if (!d.moved) {
      onTap();
    }
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }, [localOffset, onOffsetChange, onTap]);

  if (item?.image) {
    // object-position shifts by % of the difference between img and container
    const objX = 50 + offset.x;
    const objY = 50 + offset.y;
    return (
      <div
        ref={containerRef}
        className={`${className} ${ring} ${editable && panEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} touch-none select-none overflow-hidden`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(e) => { if (!panEnabled) { e.stopPropagation(); onTap(); } }}
      >
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full pointer-events-none"
          draggable={false}
          style={{
            objectFit: 'cover',
            objectPosition: `${objX}% ${objY}%`,
            transform: offset.scale !== 1 ? `scale(${offset.scale})` : undefined,
          }}
        />
      </div>
    );
  }

  // Empty slot
  return (
    <div
      className={`${className} ${ring} flex items-center justify-center ${editable ? 'cursor-pointer transition-colors' : ''}`}
      style={{ backgroundColor: NURSERY.ivory, border: `1px dashed ${NURSERY.whisper}` }}
      onClick={() => editable && onTap()}
    >
      {editable && (
        <ImagePlus style={{ width: '20%', height: '20%', minWidth: 16, minHeight: 16, color: NURSERY.whisper }} />
      )}
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
