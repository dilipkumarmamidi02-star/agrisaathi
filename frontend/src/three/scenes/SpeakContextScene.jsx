import CropPreviewScene from './CropPreviewScene';
import PestScene from './PestScene';
import MandiScene from './MandiScene';
import WeatherScene from './WeatherScene';
import IrrigationScene from './IrrigationScene';
import SchemeScene from './SchemeScene';

/**
 * Spec #14/#15: the Speak to AgriSaathi environment must react to the
 * *topic* the system identified from the user's real question (and, once
 * an answer comes back, the real response) — never a guessed condition.
 * `topic` and its accompanying value (`crop`/`commodity`/`weather`) are
 * derived by the page from the real transcript/KCC result; this
 * component only renders what it's told, same discipline as MandiScene.
 */
export default function SpeakContextScene({ topic, crop, commodity, weatherCondition, reducedMotion = false }) {
  switch (topic) {
    case 'pest':
      return <PestScene cropName={crop} type="pest" />;
    case 'market':
      return <MandiScene commodities={commodity ? [{ name: commodity, active: true }] : []} reducedMotion={reducedMotion} />;
    case 'weather':
      return <WeatherScene condition={weatherCondition || 'default'} reducedMotion={reducedMotion} />;
    case 'irrigation':
      return <IrrigationScene reducedMotion={reducedMotion} />;
    case 'scheme':
      return <SchemeScene reducedMotion={reducedMotion} />;
    case 'crop':
      return (
        <>
          <ambientLight intensity={0.8} color="#eafff0" />
          <directionalLight position={[3, 4, 2]} intensity={0.9} color="#fff6dc" />
          <CropPreviewScene cropName={crop} reducedMotion={reducedMotion} />
        </>
      );
    default:
      // Idle/unknown topic: calm neutral field rather than inventing a topic.
      return (
        <>
          <ambientLight intensity={0.75} color="#eafff0" />
          <directionalLight position={[3, 4, 2]} intensity={0.7} color="#fff6dc" />
          <CropPreviewScene cropName={null} reducedMotion={reducedMotion} autoRotateSpeed={0.15} />
        </>
      );
  }
}
