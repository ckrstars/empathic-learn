import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentViewerProps {
  url: string;
  name: string;
  type: string;
  onClose: () => void;
}

export function DocumentViewer({ url, name, type, onClose }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const isPdf = type === 'application/pdf';

  // For PDFs, we render using canvas via pdf.js
  useEffect(() => {
    if (!isPdf) return;
    setLoading(true);

    const loadPdf = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const pdf = await pdfjsLib.getDocument(url).promise;
        const pages: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          pages.push(canvas.toDataURL('image/png'));
        }

        setPdfPages(pages);
      } catch (err) {
        console.error('PDF render failed:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [url, isPdf]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80">
          <h2 className="text-sm font-semibold text-foreground truncate max-w-[50%]">{name}</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground font-mono w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <a href={url} download={name} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground text-sm">Loading document…</div>
            </div>
          )}

          {isPdf && !loading && pdfPages.length > 0 && (
            <div className="space-y-4 max-w-4xl w-full">
              {pdfPages.map((pageImg, i) => (
                <img
                  key={i}
                  src={pageImg}
                  alt={`Page ${i + 1}`}
                  className="w-full rounded-md shadow-lg border border-border"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                />
              ))}
            </div>
          )}

          {!isPdf && (
            <img
              src={url}
              alt={name}
              className="max-w-4xl w-full h-auto rounded-md shadow-lg border border-border"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
