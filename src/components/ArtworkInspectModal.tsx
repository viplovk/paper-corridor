/**
 * ArtworkInspectModal: Displays the focused pencil artwork in high resolution
 * with museum curation notes and archival paper frame.
 */
import React from 'react';
import { ArtworkData } from '../utils/proceduralArtworks';
import { X, ZoomIn } from 'lucide-react';

interface Props {
  artwork: ArtworkData | null;
  onClose: () => void;
}

export const ArtworkInspectModal: React.FC<Props> = ({ artwork, onClose }) => {
  if (!artwork) return null;

  // Extract canvas image source from the THREE CanvasTexture
  const canvasImageSrc = (artwork.texture.image as HTMLCanvasElement)?.toDataURL?.() || '';

  return (
    <div
      id="artwork-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1815]/75 p-4 backdrop-blur-xs transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        id="artwork-modal-card"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-none border border-[#2b2520] bg-[#f5efe4] p-6 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 45px rgba(25, 20, 16, 0.4), inset 0 0 40px rgba(70, 55, 40, 0.08)',
        }}
      >
        {/* Close Button */}
        <button
          id="btn-close-inspect-modal"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center border border-[#3b342e] text-[#2c2621] transition-colors hover:bg-[#2c2621] hover:text-[#f5efe4]"
          title="Close Inspection (Esc)"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Artwork Header */}
        <div className="mb-4 text-center">
          <p className="font-['Courier_Prime'] text-xs tracking-widest text-[#72675b] uppercase">
            Curatorial Archive · Gallery Inventory
          </p>
          <h2 className="mt-1 font-['Playfair_Display'] text-2xl font-semibold tracking-wide text-[#221c17] md:text-3xl">
            {artwork.title}
          </h2>
          <p className="mt-1 font-['Architects_Daughter'] text-base text-[#4a4036]">
            {artwork.artist} — {artwork.year}
          </p>
        </div>

        {/* Artwork Display with Hand-Drawn Frame */}
        <div className="relative mx-auto my-4 max-w-md border-4 border-[#2b2520] bg-[#eee6d8] p-3 shadow-inner">
          <div className="relative border border-dashed border-[#554b41] p-1">
            {canvasImageSrc ? (
              <img
                src={canvasImageSrc}
                alt={artwork.title}
                className="h-auto w-full object-contain filter contrast-105"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center font-mono text-sm text-[#665a4e]">
                Original Pencil Drawing
              </div>
            )}
            <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 bg-[#f5efe4]/85 px-1.5 py-0.5 text-[10px] font-mono text-[#443b32]">
              <ZoomIn className="h-3 w-3" />
              <span>100% GRAPHITE</span>
            </div>
          </div>
        </div>

        {/* Medium and Accession Info */}
        <div className="mt-5 border-t border-[#3c342d]/30 pt-3 text-center">
          <p className="font-['Courier_Prime'] text-xs text-[#52493f]">
            <strong className="font-semibold text-[#29231d]">Medium:</strong> {artwork.medium}
          </p>
          <p className="mt-1 font-['Courier_Prime'] text-[11px] text-[#7a6f62]">
            Acquired from the architectural studies collection. Exhibited along the endless corridor.
          </p>
        </div>

        {/* Step back prompt */}
        <div className="mt-6 flex justify-center">
          <button
            id="btn-return-corridor"
            onClick={onClose}
            className="cursor-pointer border border-[#2b2520] px-6 py-2 font-['Courier_Prime'] text-xs font-bold tracking-widest text-[#2b2520] uppercase transition-all hover:bg-[#2b2520] hover:text-[#f5efe4]"
          >
            [ Step Back into Corridor ]
          </button>
        </div>
      </div>
    </div>
  );
};
