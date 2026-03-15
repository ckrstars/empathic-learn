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
  const [gazeScore, setGazeScore] = useState(0.5);
  const [headPoseScore, setHeadPoseScore] = useState(0.5);
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

  const analyzeLandmarks = useCallback((landmarks: any) => {
    try {
      const positions = landmarks.positions;
      if (!positions || positions.length < 68) return;

      // Gaze estimation from eye + nose landmarks
      const leftEye = positions.slice(36, 42);
      const rightEye = positions.slice(42, 48);
      const leftCenter = avgPoint(leftEye);
      const rightCenter = avgPoint(rightEye);
      const noseTip = positions[30];

      const eyeMidX = (leftCenter.x + rightCenter.x) / 2;
      const eyeMidY = (leftCenter.y + rightCenter.y) / 2;
      const eyeDist = Math.max(Math.abs(rightCenter.x - leftCenter.x), 1);
      const noseOffsetX = Math.abs(noseTip.x - eyeMidX) / eyeDist;
      const noseOffsetY = Math.abs(noseTip.y - eyeMidY) / eyeDist;

      const gazeDeviation = Math.sqrt(noseOffsetX ** 2 + noseOffsetY ** 2);
      setGazeScore(Math.max(0, Math.min(1, 1 - gazeDeviation * 0.5)));

      // Head pose from jaw symmetry
      const jawLeft = positions[0];
      const jawRight = positions[16];
      const jawWidth = Math.max(Math.abs(jawRight.x - jawLeft.x), 1);
      const jawMidX = (jawLeft.x + jawRight.x) / 2;
      const headTurnRatio = Math.abs(noseTip.x - jawMidX) / jawWidth;
      setHeadPoseScore(Math.max(0, Math.min(1, 1 - headTurnRatio * 3)));
    } catch { /* keep previous values */ }
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
              if (score > maxScore) { maxScore = score; maxExpression = expr as FaceExpression; }
            }
            setEmotion(expressionToEmotion[maxExpression] || 'neutral');
            setConfidence(Math.round(maxScore * 100) / 100);
          }

          // Extract gaze + head pose from landmarks
          if (detections?.landmarks) {
            analyzeLandmarks(detections.landmarks);
          }
        } catch { /* detection frame failed */ }
      }, 2000);
    } catch {
      setError('Camera access denied');
      setIsLoading(false);
    }
  }, [loadModels, analyzeLandmarks]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => () => stopDetection(), [stopDetection]);

  return { emotion, confidence, gazeScore, headPoseScore, isActive, isLoading, error, startDetection, stopDetection };
}

function avgPoint(points: Array<{ x: number; y: number }>) {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}
