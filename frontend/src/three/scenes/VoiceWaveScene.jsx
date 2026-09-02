import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Spec #63 "Voice Notes": "audio-focused agricultural environment.
 * Recording -> animated waveform. Playback -> waveform responds."
 * This is a real amplitude-driven bar field: while `recording` is
 * true the bars jitter (there's no live mic amplitude piped in from
 * the browser SpeechRecognition API, so we animate a believable
 * waveform rather than claim to visualize the actual signal); once
 * recording stops the bars settle to a calm resting height.
 */
const BAR_COUNT = 20;

export default function VoiceWaveScene({ recording = false, hasTranscript = false, reducedMotion = false }) {
  const barsRef = useRef([]);
  const seeds = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => Math.random() * Math.PI * 2),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      let h;
      if (reducedMotion) {
        h = recording ? 0.5 : 0.15;
      } else if (recording) {
        h = 0.25 + Math.abs(Math.sin(t * 5 + seeds[i])) * 0.55;
      } else {
        h = 0.1 + Math.abs(Math.sin(t * 0.6 + seeds[i])) * 0.06;
      }
      bar.scale.y = h;
      bar.position.y = h / 2 - 0.3;
    });
  });

  return (
    <>
      <color attach="background" args={['#101a14']} />
      <ambientLight intensity={0.9} color="#eafaf0" />
      <pointLight position={[0, 1, 1.5]} intensity={recording ? 1.1 : 0.6} color={recording ? '#f87171' : '#4ade80'} />

      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          position={[(i - BAR_COUNT / 2) * 0.09, -0.3, 0]}
        >
          <boxGeometry args={[0.05, 1, 0.05]} />
          <meshStandardMaterial
            color={recording ? '#ef4444' : hasTranscript ? '#22c55e' : '#4b5563'}
            emissive={recording ? '#ef4444' : '#000000'}
            emissiveIntensity={recording ? 0.4 : 0}
          />
        </mesh>
      ))}
    </>
  );
}
