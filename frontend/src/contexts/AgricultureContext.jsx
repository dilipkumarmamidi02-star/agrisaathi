import { createContext, useContext, useMemo, useState } from 'react';

const AgricultureContext = createContext(null);

export function AgricultureProvider({ children }) {
  const [context, setContext] = useState({
    page: null,

    crop: null,
    cropStage: null,

    animal: null,
    animalCategory: null,

    pest: null,
    diagnosis: null,
    fertilizer: null,

    weather: null,
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
  });

  const updateContext = (updates) => {
    setContext((previous) => ({
      ...previous,
      ...updates,
    }));
  };

  const resetContext = () => {
    setContext({
      page: null,
      crop: null,
      cropStage: null,
      animal: null,
      animalCategory: null,
      pest: null,
      diagnosis: null,
      fertilizer: null,
      weather: null,
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
    });
  };

  const value = useMemo(
    () => ({
      context,
      updateContext,
      resetContext,
    }),
    [context]
  );

  return (
    <AgricultureContext.Provider value={value}>
      {children}
    </AgricultureContext.Provider>
  );
}

export function useAgricultureContext() {
  const value = useContext(AgricultureContext);

  if (!value) {
    throw new Error(
      'useAgricultureContext must be used inside AgricultureProvider'
    );
  }

  return value;
}
