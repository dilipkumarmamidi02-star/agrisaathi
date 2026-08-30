import { useEffect, useState } from 'react';
import {
  getDataGovHealth,
  getDataGovResources,
} from '../lib/dataGov';

export default function DataGovResourceTest() {
  const [health, setHealth] = useState(null);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [healthData, resourceData] = await Promise.all([
          getDataGovHealth(),
          getDataGovResources(),
        ]);

        if (!active) return;

        setHealth(healthData);
        setResources(resourceData.resources || []);
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.detail ||
          err?.message ||
          'Data.gov connection failed'
        );
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div>Backend configured: {health?.configured ? 'YES' : 'NO'}</div>
        <div>Registered resources: {health?.registered_resources ?? 0}</div>
      </div>

      <div className="space-y-2">
        {resources.map((resource) => (
          <div
            key={resource.resource_id || resource.title || 'resource'}
            className="rounded border p-3"
          >
            <div className="font-semibold">
              {resource.title || 'Data.gov Resource'}
            </div>
            <div className="text-sm">
              {resource.title}
            </div>
            <div className="text-xs text-lt-text-secondary">
              {resource.resource_id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
