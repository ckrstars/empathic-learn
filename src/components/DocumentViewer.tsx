import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Download, Loader2 } from 'lucide-react';
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
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [renderedPages, setRenderedPages] = useState<Map<number, string>>(new Map());
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const isPdf = type === 'application/pdf';
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Load PDF document (metadata only, no rendering yet)
  useEffect(() => {
    if (!isPdf) return;
    setLoading(true);
    let cancelled = false;

    const loadPdf = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (!cancelled) {
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setLoading(false);
        }
      } catch (err) {
        console.error('PDF load failed:', err);
        if (!cancelled) setLoading(false);
      }
    };
    loadPdf();
    return () => { cancelled = true; };
  }, [url, isPdf]);

  // Render a single page on demand
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || renderedPages.has(pageNum)) return;
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/png');
      setRenderedPages(prev => new Map(prev).set(pageNum, dataUrl));
    } catch (err) {
      console.error(`Failed to render page ${pageNum}:`, err);
    }
  }, [pdfDoc, renderedPages]);

  // Lazy-load pages with IntersectionObserver
  useEffect(() => {
    if (!pdfDoc || totalPages === 0) return;

    // Render first 2 pages immediately
    renderPage(1);
    if (totalPages > 1) renderPage(2);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page'));
            if (pageNum) renderPage(pageNum);
          }
        });
      },
      { root: containerRef.current, rootMargin: '200px' }
    );

    // Observe all page placeholders
    pageRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pdfDoc, totalPages, renderPage]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const setPageRef = useCallback((pageNum: number, el: HTMLDivElement | null) => {
    if (el) pageRefs.current.set(pageNum, el);
    else pageRefs.current.delete(pageNum);
  }, []);

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
              <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
            </a>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div ref={containerRef} className="flex-1 overflow-auto p-4 flex justify-center">
          {loading && (
            <div className="flex items-center justify-center h-full gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-muted-foreground text-sm">Loading document…</span>
            </div>
          )}

          {isPdf && !loading && totalPages > 0 && (
            <div className="space-y-4 max-w-4xl w-full">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  ref={(el) => setPageRef(pageNum, el)}
                  data-page={pageNum}
                  className="min-h-[400px]"
                >
                  {renderedPages.has(pageNum) ? (
                    <img
                      src={renderedPages.get(pageNum)!}
                      alt={`Page ${pageNum}`}
                      className="w-full rounded-md shadow-lg border border-border"
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                    />
                  ) : (
                    <div className="w-full h-[600px] rounded-md bg-secondary/30 border border-border flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                    </div>
                  )}
                </div>
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
