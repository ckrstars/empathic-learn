import { useState, useCallback, useRef } from 'react';

interface GazeData {
  gazeScore: number;      // 0-1, how centered the gaze is
  headPoseScore: number;  // 0-1, how upright/forward the head is
}

export function useGazeTracking() {
  const [gazeData, setGazeData] = useState<GazeData>({ gazeScore: 0.5, headPoseScore: 0.5 });
  const faceApiRef = useRef<any>(null);

  const analyzeLandmarks = useCallback((detections: any) => {
    if (!detections?.landmarks) {
      return;
    }

    try {
      const landmarks = detections.landmarks;
      const positions = landmarks.positions;

      if (!positions || positions.length < 68) return;

      // Gaze estimation from eye landmarks
      // Left eye: points 36-41, Right eye: points 42-47
      const leftEye = positions.slice(36, 42);
      const rightEye = positions.slice(42, 48);

      // Eye center
      const leftCenter = avgPoint(leftEye);
      const rightCenter = avgPoint(rightEye);

      // Nose tip: point 30
      const noseTip = positions[30];

      // Estimate gaze: if nose tip is between eye centers, gaze is forward
      const eyeMidX = (leftCenter.x + rightCenter.x) / 2;
      const eyeMidY = (leftCenter.y + rightCenter.y) / 2;
      const noseOffsetX = Math.abs(noseTip.x - eyeMidX) / Math.max(Math.abs(rightCenter.x - leftCenter.x), 1);
      const noseOffsetY = Math.abs(noseTip.y - eyeMidY) / Math.max(Math.abs(rightCenter.x - leftCenter.x), 1);

      // Closer to 0 = more centered gaze
      const gazeDeviation = Math.sqrt(noseOffsetX * noseOffsetX + noseOffsetY * noseOffsetY);
      const gazeScore = Math.max(0, Math.min(1, 1 - gazeDeviation * 0.5));

      // Head pose from face symmetry
      // Jaw outline: points 0-16
      const jawLeft = positions[0];
      const jawRight = positions[16];
      const jawWidth = Math.abs(jawRight.x - jawLeft.x);
      const jawMidX = (jawLeft.x + jawRight.x) / 2;

      // How centered is nose relative to jaw
      const headTurnRatio = Math.abs(noseTip.x - jawMidX) / Math.max(jawWidth, 1);
      const headPoseScore = Math.max(0, Math.min(1, 1 - headTurnRatio * 3));

      setGazeData({ gazeScore, headPoseScore });
    } catch {
      // Landmark analysis failed, keep previous values
    }
  }, []);

  return { ...gazeData, analyzeLandmarks };
}

function avgPoint(points: Array<{ x: number; y: number }>) {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}
