import { useState, useEffect, useRef, useCallback } from 'react';
import type { EmotionState } from '@/types/emotion';

type FaceExpression = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised';

const expressionToEmotion: Record<FaceExpression, EmotionState> = {
  neutral: 'focused',
  happy: 'flow',
  sad: 'confused',
  angry: 'fatigued',
  fearful: 'confused',
  disgusted: 'bored',
  surprised: 'focused',
};

export function useWebcamEmotion() {
  const [emotion, setEmotion] = useState<EmotionState>('neutral');
  const [confidence, setConfidence] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceApiRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadModels = useCallback(async () => {
    try {
      const faceapi = await import('@vladmandic/face-api');
      faceApiRef.current = faceapi;
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ]);
      return true;
    } catch (err) {
      console.error('Failed to load face-api models:', err);
      setError('Failed to load emotion detection models');
      return false;
    }
  }, []);

  const startDetection = useCallback(async (videoElement: HTMLVideoElement) => {
    setIsLoading(true);
    setError(null);
    videoRef.current = videoElement;

    const modelsLoaded = await loadModels();
    if (!modelsLoaded) { setIsLoading(false); return; }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: 'user' } 
      });
      streamRef.current = stream;
      videoElement.srcObject = stream;
      await videoElement.play();
      setIsActive(true);
      setIsLoading(false);

      const faceapi = faceApiRef.current;
      intervalRef.current = setInterval(async () => {
        if (!videoElement || videoElement.paused) return;
        try {
          const detections = await faceapi
            .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
            .withFaceLandmarks(true)
            .withFaceExpressions();

          if (detections?.expressions) {
            const expressions = detections.expressions as Record<FaceExpression, number>;
            let maxExpression: FaceExpression = 'neutral';
            let maxScore = 0;
            for (const [expr, score] of Object.entries(expressions)) {
              if (score > maxScore) {
                maxScore = score;
                maxExpression = expr as FaceExpression;
              }
            }
            setEmotion(expressionToEmotion[maxExpression] || 'neutral');
            setConfidence(Math.round(maxScore * 100) / 100);
          }
        } catch { /* detection frame failed, skip */ }
      }, 2000);
    } catch (err) {
      setError('Camera access denied');
      setIsLoading(false);
    }
  }, [loadModels]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => () => stopDetection(), [stopDetection]);

  return { emotion, confidence, isActive, isLoading, error, startDetection, stopDetection };
}
