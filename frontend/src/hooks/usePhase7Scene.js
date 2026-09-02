import { useMemo } from "react";
import { getPhase7Scene } from "../config/scenes/phase7Scenes";

export function usePhase7Scene(route, context = {}) {
  return useMemo(() => {
    const scene = getPhase7Scene(route);

    if (!scene) {
      return {
        scene: null,
        context,
        active: false,
      };
    }

    return {
      scene,
      context,
      active: true,
      isImmersive: scene.level === "immersive",
      isContextual: scene.level === "contextual",
      isSubtle: scene.level === "subtle",
    };
  }, [route, context]);
}
