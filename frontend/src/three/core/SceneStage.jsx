import SceneCanvas from './SceneCanvas';
import SceneFallback from './SceneFallback';
import SceneErrorBoundary from './SceneErrorBoundary';

/**
 * The single import a page needs to mount a contextual 3D scene safely:
 *   <SceneStage tone="green" camera={{ position: [0,2,6], fov: 45 }}>
 *     {(quality) => <MyScene quality={quality} />}
 *   </SceneStage>
 */
export default function SceneStage({ tone = 'green', camera, className, style, children }) {
  const fallback = <SceneFallback tone={tone} />;
  return (
    <SceneErrorBoundary fallback={fallback}>
      <SceneCanvas fallback={fallback} camera={camera} className={className} style={style}>
        {children}
      </SceneCanvas>
    </SceneErrorBoundary>
  );
}
