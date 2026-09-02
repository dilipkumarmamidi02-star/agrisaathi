import { createContext, useContext, useMemo, useState } from 'react';

const SceneContext = createContext(null);

export function SceneProvider({ children }) {
  const [scene, setScene] = useState({
    environment: 'farm',
    visualLevel: 'subtle',
    camera: 'overview',
    transition: 'fade',
    loading: false,
    fallback: false,
  });

  const updateScene = (updates) => {
    setScene((previous) => ({
      ...previous,
      ...updates,
    }));
  };

  const value = useMemo(
    () => ({
      scene,
      updateScene,
    }),
    [scene]
  );

  return (
    <SceneContext.Provider value={value}>
      {children}
    </SceneContext.Provider>
  );
}

export function useSceneContext() {
  const value = useContext(SceneContext);

  if (!value) {
    throw new Error(
      'useSceneContext must be used inside SceneProvider'
    );
  }

  return value;
}
