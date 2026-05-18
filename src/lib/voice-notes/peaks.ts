const PEAK_COUNT = 30;

/** Downsample live analyser samples to 30 normalized peaks (0–1). */
export function downsamplePeaks(samples: number[], target = PEAK_COUNT): number[] {
  if (samples.length === 0) {
    return Array.from({ length: target }, () => 0.08);
  }

  const bucketSize = Math.max(1, Math.floor(samples.length / target));
  const peaks: number[] = [];

  for (let i = 0; i < target; i++) {
    const start = i * bucketSize;
    const slice = samples.slice(start, start + bucketSize);
    const max = slice.length > 0 ? Math.max(...slice) : 0;
    peaks.push(Math.min(1, Math.max(0.06, max)));
  }

  return peaks;
}

export function readAnalyserLevel(analyser: AnalyserNode): number {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  const sum = data.reduce((acc, value) => acc + value, 0);
  return sum / data.length / 255;
}

export const MAX_RECORDING_SECONDS = 90;
