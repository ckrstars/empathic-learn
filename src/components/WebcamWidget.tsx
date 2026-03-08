import { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WebcamWidgetProps {
  onVideoReady: (video: HTMLVideoElement) => void;
  onStop: () => void;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
}

export function WebcamWidget({ onVideoReady, onStop, isActive, isLoading, error }: WebcamWidgetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(true);

  const handleStart = () => {
    if (videoRef.current) onVideoReady(videoRef.current);
  };

  return (
    <div className="glass rounded-lg overflow-hidden">
      <div className="p-3 flex items-center justify-between border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Webcam Feed</span>
        <div className="flex gap-1">
          {isActive && (
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showVideo ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
      </div>

      <div className="relative aspect-video bg-secondary/50">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!showVideo || !isActive ? 'hidden' : ''}`}
          muted
          playsInline
        />

        {!isActive && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <CameraOff className="w-8 h-8 text-muted-foreground" />
            <Button size="sm" onClick={handleStart} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Camera className="w-4 h-4 mr-1.5" />
              Enable Camera
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Loading models...</span>
          </div>
        )}

        {isActive && (
          <div className="absolute bottom-2 right-2">
            <button
              onClick={onStop}
              className="p-1.5 rounded-md bg-destructive/80 hover:bg-destructive text-destructive-foreground transition-colors"
            >
              <CameraOff className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {isActive && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emotion-focused animate-pulse" />
            <span className="text-[10px] font-mono text-foreground/70">LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
}
