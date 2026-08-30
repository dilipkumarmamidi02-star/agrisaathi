import { useState, useEffect } from 'react'
import { Store, Navigation, Phone, BadgeCheck, Star } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import PageHeader from '../components/PageHeader';

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const CATEGORIES = [
  { value: '', label: 'all' },
  { value: 'fertilizer', label: 'fertilizer' },
  { value: 'seeds', label: 'seeds' },
  { value: 'equipment', label: 'equipment' },
  { value: 'pesticide', label: 'pesticide' },
  { value: 'general', label: 'general' },
];

export default function InputMarketplace() {
  const { t } = useLang();
  const [shops, setShops] = useState([]);
  const [origin, setOrigin] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => { appClient.entities.InputShop.list('name', 200).then(setShops).catch(() => {}); }, []);

  const useLocation = () => {
    if (!navigator.geolocation) { alert(t('geoUnsupported')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert(t('locationDenied'))
    );
  };

  let list = shops
    .filter((s) => !filter || s.category === filter)
    .map((s) => ({ ...s, _dist: origin && s.lat != null ? haversine(origin.lat, origin.lng, s.lat, s.lng) : null }));
  list.sort((a, b) => (a._dist == null) - (b._dist == null) || a._dist - b._dist);

  return (
    <div>
      <PageHeader titleKey="inputMarketplace" icon={Store} />
      <p className="text-xs text-text-secondary mb-3">{t('marketplaceIntro')}</p>

      <Button onClick={useLocation} className="w-full mb-3 bg-green-600 hover:bg-green-700"><Navigation className="h-4 w-4 mr-1" />{t('useMyLocation')}</Button>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setFilter(c.value)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filter === c.value ? 'bg-green-600 text-white' : 'bg-surface-hover text-text-secondary'}`}>
            {t(c.label)}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-text-muted">{t('noShops')}</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {list.map((s) => (
            <Card key={s.id}><CardContent className="pt-3 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm truncate">{s.name}</h3>
                    {s.verified && <BadgeCheck className="h-4 w-4 text-green-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-text-secondary">{[s.category && t(s.category), s.district, s.state].filter(Boolean).join(' · ')}</p>
                  {s.address && <p className="text-xs text-text-muted mt-0.5">{s.address}</p>}
                </div>
                <div className="text-right shrink-0">
                  {s._dist != null && <Badge variant="secondary">{s._dist < 1 ? `${Math.round(s._dist * 1000)}m` : `${s._dist.toFixed(1)}km`}</Badge>}
                  {s.rating != null && <p className="text-xs text-amber-500 flex items-center gap-0.5 justify-end mt-1"><Star className="h-3 w-3 fill-amber-400" />{s.rating}</p>}
                </div>
              </div>
              {s.phone && (
                <Button size="sm" variant="outline" asChild className="mt-2 w-full">
                  <a href={`tel:${s.phone}`}><Phone className="h-3 w-3 mr-1" />{s.phone}</a>
                </Button>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
