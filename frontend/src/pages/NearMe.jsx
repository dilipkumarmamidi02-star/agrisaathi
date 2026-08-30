import { useState, useEffect } from 'react'
import { MapPin, Phone, Building2, Sprout, Navigation, ExternalLink, Store, Leaf, FlaskConical } from 'lucide-react';
import { useLang } from '../lib/i18n';
import api from '../api/apiClient';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const SHOP_TYPES = {
  agrarian: { label: 'Agro shop (pesticides/fertilizers)', icon: FlaskConical, color: 'bg-purple-100 text-purple-700' },
  garden_centre: { label: 'Nursery / seeds', icon: Sprout, color: 'bg-green-100 text-green-700' },
  health_food: { label: 'Organic products', icon: Leaf, color: 'bg-emerald-100 text-emerald-700' },
  florist: { label: 'Florist / seeds', icon: Leaf, color: 'bg-teal-100 text-teal-700' },
};

export default function NearMe() {
  const { t } = useLang();
  const [kvks, setKvks] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [shops, setShops] = useState([]);
  const [origin, setOrigin] = useState(null);
  const [filter, setFilter] = useState('all');
  const [radius, setRadius] = useState(50);
  const [selected, setSelected] = useState(null);
  const [shopsLoading, setShopsLoading] = useState(false);

  useEffect(() => {
    api.get('/api/kvk')
      .then((res) => setKvks((res.data || []).map((k, idx) => ({
        id: `kvk_${k.state}_${k.serial_no ?? 'na'}_${idx}`,
        address: k.address,
        state_ut: k.state,
        host_institution_approx: k.host_institution,
        year_of_sanction: k.year_of_sanction,
        kvk_type: k.type,
        lat_approx: null,
        lng_approx: null,
        VERIFY_AT: k.verify_at,
      }))))
      .catch(() => setKvks([]));
    api.get('/api/gov-markets')
      .then((res) => setMarkets((res.data || []).map((m) => ({
        id: `market_${m.market_name}_${m.state}`,
        market_name: m.market_name,
        state: m.state,
        district_region: m.district_region,
        lat_approx: m.lat,
        lng_approx: m.lng,
        commodities_traded: m.commodities_traded,
      }))))
      .catch(() => setMarkets([]));
  }, []);

  const useLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const o = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(o);
        fetchShops(o);
      },
      () => alert('Could not get location. You can still browse saved centres.')
    );
  };

  const fetchShops = async (o) => {
    setShopsLoading(true);
    try {
      const query = `[out:json][timeout:25];(node["shop"="agrarian"](around:30000,${o.lat},${o.lng});node["shop"="garden_centre"](around:30000,${o.lat},${o.lng});node["shop"="health_food"](around:30000,${o.lat},${o.lng});node["shop"="florist"](around:30000,${o.lat},${o.lng}););out body;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      });
      const data = await res.json();
      setShops((data.elements || []).map((e) => ({
        id: 'shop_' + e.id,
        name: e.tags?.name || SHOP_TYPES[e.tags?.shop]?.label || 'Shop',
        shop_type: e.tags?.shop,
        lat_approx: e.lat,
        lng_approx: e.lon,
        _type: 'shop',
      })));
    } catch { setShops([]); }
    finally { setShopsLoading(false); }
  };

  const withDist = (items) =>
    items.map((i) => ({
      ...i,
      _dist: origin && i.lat_approx != null ? haversine(origin.lat, origin.lng, i.lat_approx, i.lng_approx) : null,
    }));

  let all = [
    ...withDist(kvks.map((k) => ({ ...k, _type: 'kvk' }))),
    ...withDist(markets.map((m) => ({ ...m, _type: 'market' }))),
    ...withDist(shops),
  ];
  if (filter !== 'all') all = all.filter((i) => i._type === filter);
  if (origin) all = all.filter((i) => i._dist == null || i._dist <= radius);
  all.sort((a, b) => (a._dist == null) - (b._dist == null) || a._dist - b._dist);

  const mapCenter = selected?.lat_approx != null ? { lat: selected.lat_approx, lng: selected.lng_approx } : origin || { lat: 20.5937, lng: 78.9629 };
  const delta = 0.05;
  const bbox = `${mapCenter.lng - delta},${mapCenter.lat - delta},${mapCenter.lng + delta},${mapCenter.lat + delta}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`;

  const iconFor = (i) => {
    if (i._type === 'shop') return SHOP_TYPES[i.shop_type]?.icon || Store;
    return i._type === 'kvk' ? Sprout : Building2;
  };
  const colorFor = (i) => {
    if (i._type === 'shop') return SHOP_TYPES[i.shop_type]?.color || 'bg-gray-100 text-gray-700';
    return i._type === 'kvk' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
  };
  const nameFor = (i) => i.name || i.market_name || i.address || 'KVK';
  const subFor = (i) => {
    if (i._type === 'shop') return SHOP_TYPES[i.shop_type]?.label;
    if (i._type === 'kvk') return (i.host_institution_approx || '').slice(0, 70) + (i.state_ut ? ` · ${i.state_ut}` : '');
    return (i.district_region || '') + (i.state ? ` · ${i.state}` : '');
  };

  return (
    <div>
      <PageHeader titleKey="nearMe" icon={MapPin} />

      <div className="rounded-xl overflow-hidden border mb-3 h-44">
        <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="map" />
      </div>

      <div className="flex gap-2 mb-3">
        <Button onClick={useLocation} className="flex-1 bg-green-600 hover:bg-green-700"><Navigation className="h-4 w-4 mr-1" />{t('useMyLocation')}</Button>
      </div>

      <div className="flex gap-2 mb-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="kvk">{t('kvks')}</SelectItem>
            <SelectItem value="market">{t('markets')}</SelectItem>
            <SelectItem value="shop">{t('shops')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[5, 10, 25, 50, 100].map((r) => <SelectItem key={r} value={String(r)}>{r} km</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!origin && <p className="text-xs text-gray-400 mb-3">Showing saved centres. Tap "{t('useMyLocation')}" to find nearby shops and sort by distance.</p>}
      {shopsLoading && <p className="text-xs text-gray-400 mb-3">{t('loading')}</p>}

      <div className="space-y-2">
        {all.map((i) => {
          const Icon = iconFor(i);
          return (
            <Card key={i.id} className="hover:shadow-md cursor-pointer" onClick={() => setSelected(i)}>
              <CardContent className="pt-3 flex items-start gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${colorFor(i)}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{nameFor(i)}</p>
                  <p className="text-xs text-gray-400 truncate">{subFor(i)}</p>
                  {i._dist != null && <Badge className="mt-1 bg-gray-100 text-gray-600">{i._dist.toFixed(1)} {t('distance')}</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-md mx-auto rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
            <CardContent className="pt-5 pb-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${colorFor(selected)}`}>
                  {(() => { const Icon = iconFor(selected); return <Icon className="h-5 w-5" />; })()}
                </span>
                <h3 className="font-bold">{nameFor(selected)}</h3>
              </div>
              <p className="text-sm text-gray-600">{subFor(selected)}</p>
              {selected._dist != null && <Badge className="bg-green-100 text-green-700">{selected._dist.toFixed(1)} {t('distance')}</Badge>}
              {selected.host_institution_approx && <p className="text-sm"><span className="text-gray-400">Host:</span> {selected.host_institution_approx}</p>}
              {selected.commodities_traded && <p className="text-sm"><span className="text-gray-400">{t('commodities')}:</span> {selected.commodities_traded}</p>}
              {selected.shop_type && <p className="text-sm"><span className="text-gray-400">{t('type')}:</span> {SHOP_TYPES[selected.shop_type]?.label}</p>}
              <p className="text-xs text-gray-400">{selected.VERIFY_AT ? `Verify at: ${selected.VERIFY_AT}` : 'Verify on official portal'}</p>
              {selected.phone && (
                <a href={`tel:${selected.phone}`}><Button className="w-full bg-green-600 hover:bg-green-700"><Phone className="h-4 w-4 mr-1" />{t('callNow')}</Button></a>
              )}
              {selected._type === 'kvk' && (
                <a href="https://kvk.icar.gov.in/" target="_blank" rel="noopener noreferrer"><Button variant="outline" className="w-full"><ExternalLink className="h-4 w-4 mr-1" />{t('kvkPortal')}</Button></a>
              )}
              {selected._type === 'market' && (
                <>
                  <a href="https://agmarknet.gov.in/" target="_blank" rel="noopener noreferrer"><Button variant="outline" className="w-full"><ExternalLink className="h-4 w-4 mr-1" />{t('marketPortal')}</Button></a>
                  <a href="https://enam.gov.in/" target="_blank" rel="noopener noreferrer"><Button variant="outline" className="w-full"><ExternalLink className="h-4 w-4 mr-1" />eNAM Portal</Button></a>
                </>
              )}
              {selected.lat_approx != null && (
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat_approx},${selected.lng_approx}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full"><Navigation className="h-4 w-4 mr-1" />{t('directions')}</Button>
                </a>
              )}
              {selected._type === 'kvk' && (
                <a href="/near-me"><Button variant="outline" className="w-full">{t('consultExpert')}</Button></a>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <DataGovFeaturePanel feature="Near Me" />
    </div>
  );
}
