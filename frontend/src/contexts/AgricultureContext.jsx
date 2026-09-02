import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';

/**
 * Global "context engine" (spec #66).
 *
 * This is the single object every 3D scene reads from. Pages update it
 * as the user makes real selections (crop, weather, animal, pest, ...);
 * scenes never invent their own state. Only relevant keys are populated
 * — everything else stays null/undefined.
 */
const initialContext = {
  page: null,
  crop: null,
  cropStage: null,
  animal: null,
  animalCategory: null,
  pest: null,
  diagnosis: null,
  fertilizer: null,
  weather: null, // 'sunny' | 'cloudy' | 'rain' | 'storm' | 'fog'
  marketCommodity: null,
  market: null,
  location: null,
  scheme: null,
  insurance: null,
  training: null,
  harvest: null,
  alert: null,
  sensor: null,
  speakTopic: null,
};

const AgricultureContext = createContext(null);

export function AgricultureProvider({ children }) {
  const [ctx, setCtx] = useState(initialContext);

  // Merge a partial patch in — pages call this instead of replacing the
  // whole object, so unrelated keys set by other modules aren't clobbered
  // when that matters (most scenes clear on unmount instead, see below).
  const updateContext = useCallback((patch) => {
    setCtx((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetContext = useCallback(() => setCtx(initialContext), []);

  const value = useMemo(
    () => ({ context: ctx, updateContext, resetContext }),
    [ctx, updateContext, resetContext]
  );

  return (
    <AgricultureContext.Provider value={value}>
      {children}
    </AgricultureContext.Provider>
  );
}

export function useAgricultureContext() {
  const ctx = useContext(AgricultureContext);
  if (!ctx) {
    throw new Error(
      'useAgricultureContext must be used within an AgricultureProvider'
    );
  }
  return ctx;
}

/**
 * Convenience hook for a page to declare "this is my context" on mount
 * and clean up on unmount, so navigating away doesn't leave stale state
 * (e.g. leaving /crops with "paddy" still selected while on /market-prices).
 *
 * Usage in a page:
 *   usePageContext({ page: 'crops', crop: selectedCrop });
 */
export function usePageContext(patch) {
  const { updateContext } = useAgricultureContext();
  const key = JSON.stringify(patch);
  useEffect(() => {
    updateContext(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
