import { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { OceanEngine } from './OceanEngine';

/**
 * The fixed, full-screen background. It is purely decorative:
 * aria-hidden, pointer-events: none, and never focusable.
 *
 * Layers (back to front):
 *  1. A CSS gradient that matches the palette. This is the instant "loading state"
 *     and also the fallback if WebGL is unavailable or fails.
 *  2. The WebGL canvas, which fades in once the first frame is drawn.
 */

function CssFallback() {
  return <div className="ocean-fallback" aria-hidden="true" />;
}

function WebGLLayer({ onFail }: { onFail: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: OceanEngine | null = null;
    try {
      engine = new OceanEngine(canvas, { onFirstFrame: () => setReady(true) });
      engine.start();
    } catch (err) {
      console.warn('[CosmicOcean] WebGL unavailable, using CSS fallback.', err);
      onFail();
    }
    return () => engine?.dispose(); // removes listeners, stops the loop, frees the GPU
  }, [onFail]);

  return (
    <canvas
      ref={canvasRef}
      className={`ocean-canvas${ready ? ' is-ready' : ''}`}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function CosmicOcean() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="ocean" aria-hidden="true">
      <CssFallback />
      {!failed && (
        <SceneBoundary fallback={null}>
          <WebGLLayer onFail={() => setFailed(true)} />
        </SceneBoundary>
      )}
    </div>
  );
}
