import React, { useEffect, useState } from "react";

const phase7State = {
  page: null,
  crop: null,
  cropStage: null,
  sensor: null,
  sensorValue: null,
  moisture: 50,
  waterFlow: 50,
  irrigationSchedule: null,
  harvest: null,
  inventoryItem: null,
  inventoryQuantity: 0,
  equipment: null,
  equipmentType: null,
  selectedObject: null,
};

const listeners = new Set();

export function publishPhase7Context(data = {}) {
  Object.assign(phase7State, data);

  listeners.forEach((listener) => {
    listener({ ...phase7State });
  });
}

export function getPhase7Context() {
  return { ...phase7State };
}

export function usePhase7Context() {
  const [state, setState] = useState(() => ({
    ...phase7State,
  }));

  useEffect(() => {
    const listener = (nextState) => {
      setState(nextState);
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}

export function Phase7RouteIntegration({
  route,
  className = "",
  style = {},
}) {
  const context = usePhase7Context();

  useEffect(() => {
    publishPhase7Context({
      page: route,
    });
  }, [route]);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        minHeight: "420px",
        borderRadius: "16px",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          minHeight: "420px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div>
          <h2>🌾 AgriSaathi Phase 7</h2>
          <p>Active route: {route}</p>

          {context.crop && (
            <p>
              Crop: <strong>{context.crop}</strong>
            </p>
          )}

          {context.sensor && (
            <p>
              Sensor: <strong>{context.sensor}</strong>
            </p>
          )}

          {context.moisture !== undefined && (
            <p>
              Soil Moisture: <strong>{context.moisture}%</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
