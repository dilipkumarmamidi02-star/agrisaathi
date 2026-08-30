import { useEffect, useMemo, useState } from 'react';
import {
  Sprout,
  ShieldCheck,
  ScanLine,
  Plus,
  LineChart as LineChartIcon,
  MapPin,
  Droplets,
  BarChart3,
  Database,
  RefreshCw,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import api from '../api/apiClient';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { files, ai } from '../api/appClient';
import { useLang } from '../lib/i18n';
import {
  getDataGovResourceRecords,
  getDataGovResource
} from '../lib/dataGov';

import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import { Image } from '../components/ui/image';
import PageHeader from '../components/PageHeader';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8001';

const SOIL_MOISTURE_RESOURCE = 'soil_moisture';
const LAND_UTILISATION_RESOURCE = 'land_utilisation';

const toHash = async (obj) => {
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const buf = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const normaliseSoilMoisture = (record) => ({
  state: record?.state ?? record?.State ?? '',
  district: record?.district ?? record?.District ?? '',
  date: record?.date ?? record?.Date ?? '',
  year: record?.year ?? record?.Year ?? '',
  month: record?.month ?? record?.Month ?? '',
  moisture:
    record?.Avg_smlvl_at15cm ??
    record?.avg_smlvl_at15cm ??
    record?.soil_moisture ??
    null,
  agency:
    record?.Agency_name ??
    record?.agency_name ??
    '',
});

const cleanNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const formatNumber = (value) => {
  const number = cleanNumber(value);

  if (number === null) {
    return '—';
  }

  return number.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });
};


const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function SoilPassport() {
  const { t } = useLang();

  const [governmentRecords, setGovernmentRecords] = useState([]);
  const [landRecords, setLandRecords] = useState([]);

  const [loadingGovernment, setLoadingGovernment] = useState(true);
  const [loadingLand, setLoadingLand] = useState(true);

  const [governmentError, setGovernmentError] = useState('');
  const [landError, setLandError] = useState('');

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [detectedLocation, setDetectedLocation] = useState('');
  const [locationMessage, setLocationMessage] = useState('');

  const [records, setRecords] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [soilProfiles, setSoilProfiles] = useState([]);
  const [refState, setRefState] = useState('');

  const [form, setForm] = useState({
    plot_name: '',
    test_date: '',
    testing_organization: '',
    soil_type: '',
    ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    organic_carbon: '',
    ec: '',
    notes: '',
    card_file_url: '',
  });

  const [trendPlot, setTrendPlot] = useState('');

  /*
   * ------------------------------------------------------------
   * LOCATION NORMALISATION
   * ------------------------------------------------------------
   */

  const normaliseName = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  const stateMatches = (recordState, wantedState) => {
    if (!recordState || !wantedState) return false;

    const a = normaliseName(recordState);
    const b = normaliseName(wantedState);

    if (a === b) return true;

    const aliases = {
      telangana: ['telangana', 'telangana state'],
      andhra_pradesh: [
        'andhra pradesh',
        'andhra',
      ],
      tamil_nadu: [
        'tamil nadu',
        'tamilnadu',
      ],
      chhattisgarh: [
        'chhattisgarh',
        'chattisgarh',
      ],
      kerala: [
        'kerala',
        'keralam',
      ],
    };

    const groups = Object.values(aliases);

    return groups.some(
      (group) =>
        group.includes(a) &&
        group.includes(b)
    );
  };

  const districtMatches = (
    recordDistrict,
    wantedDistrict
  ) => {
    if (!recordDistrict || !wantedDistrict) return false;

    const a = normaliseName(recordDistrict);
    const b = normaliseName(wantedDistrict);

    return (
      a === b ||
      a.includes(b) ||
      b.includes(a)
    );
  };

  /*
   * ------------------------------------------------------------
   * GOVERNMENT SOIL MOISTURE
   * ------------------------------------------------------------
   *
   * soil_moisture is a historical dataset.
   *
   * We deliberately do NOT call the API with arbitrary
   * state/district parameters because the current backend
   * endpoint can return HTTP 422 for unsupported filters.
   *
   * Instead:
   *
   *   1. request a safe sample
   *   2. inspect the actual fields
   *   3. filter only records that genuinely match location
   *
   * The UI never pretends an unrelated record belongs to
   * the farmer's location.
   */

  const loadGovernmentSoil = async (state = '', district = '') => {
    setLoadingGovernment(true);
    setGovernmentError('');

    try {
      const params = { limit: 100 };
      if (state) params.state = state;
      if (district) params.district = district;

      const data = await getDataGovResource(
        'soil_moisture',
        params
      );

      const incoming = Array.isArray(data?.records)
        ? data.records
        : [];

      setGovernmentRecords(incoming);
    } catch (error) {
      console.error(
        'Data.gov soil moisture error:',
        error
      );

      setGovernmentRecords([]);

      const detail = error?.response?.data?.detail;

      const safeError =
        Array.isArray(detail)
          ? detail
              .map((item) => {
                if (typeof item === 'string') return item;
                if (item?.msg) return item.msg;
                return null;
              })
              .filter(Boolean)
              .join(', ')
          : typeof detail === 'string'
            ? detail
            : error?.message || null;

      setGovernmentError(
        safeError ||
        'Could not load government soil-moisture data.'
      );
    } finally {
      setLoadingGovernment(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * LAND UTILISATION
   * ------------------------------------------------------------
   *
   * This resource does NOT contain State/District fields.
   *
   * Therefore it is intentionally shown as national/general
   * government land-use context rather than location-specific
   * information.
   */

  const loadLandUtilisation = async () => {
    setLoadingLand(true);
    setLandError('');

    try {
      const data = await getDataGovResource(
        'land_utilisation',
        { limit: 100 }
      );

      const incoming = Array.isArray(data?.records)
        ? data.records
        : [];

      setLandRecords(incoming);
    } catch (error) {
      console.error(
        'Data.gov land utilisation error:',
        error
      );

      setLandRecords([]);

      setLandError(
        error?.response?.data?.detail ||
        error?.message ||
        'Could not load land-use statistics.'
      );
    } finally {
      setLoadingLand(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * FARMER SOIL RECORDS
   * ------------------------------------------------------------
   */

  const load = () =>
    api
      .get('/api/soil-records')
      .then((res) =>
        setRecords(
          Array.isArray(res.data)
            ? res.data
            : []
        )
      )
      .catch(() => setRecords([]));

  useEffect(() => {
    load();
    loadLandUtilisation();
    // Soil moisture is not fetched unfiltered here — see the
    // selectedState effect below. An unfiltered fetch only ever
    // returns an arbitrary slice of a 1.7M-record dataset, which
    // isn't meaningful without a state to scope it to.

    api
      .get('/api/soil-profiles')
      .then((res) =>
        setSoilProfiles(
          Array.isArray(res.data)
            ? res.data
            : []
        )
      )
      .catch(() => setSoilProfiles([]));
  }, []);

  // Re-fetch soil moisture from the server whenever the farmer
  // changes State/District, using the now-fixed server-side filter
  // (see datagov_client.py per-resource field mapping). This
  // replaces client-side filtering of a small unfiltered sample,
  // which only ever showed whichever states happened to be in the
  // first 100 of 1.7M records.
  useEffect(() => {
    if (!selectedState) {
      setGovernmentRecords([]);
      return;
    }

    loadGovernmentSoil(selectedState, selectedDistrict);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedDistrict]);

  /*
   * ------------------------------------------------------------
   * STATE / DISTRICT OPTIONS
   * ------------------------------------------------------------
   *
   * The state list is a static list of Indian states/UTs, not
   * derived from governmentRecords — deriving it from a small
   * fetched sample meant only whichever states happened to land
   * in that sample were ever selectable.
   */

  const governmentStates = INDIAN_STATES;

  const governmentDistricts = useMemo(() => {
    const state = selectedState;

    return [
      ...new Set(
        governmentRecords
          .filter((r) => {
            if (!state) return true;

            return stateMatches(
              r?.State ?? r?.state,
              state
            );
          })
          .map(
            (r) =>
              r?.District ??
              r?.district
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [
    governmentRecords,
    selectedState,
  ]);

  /*
   * ------------------------------------------------------------
   * LOCATION FILTERED GOVERNMENT RECORDS
   * ------------------------------------------------------------
   */

  const filteredGovernmentRecords = useMemo(() => {
    return governmentRecords.filter((record) => {
      const recordState =
        record?.State ??
        record?.state;

      const recordDistrict =
        record?.District ??
        record?.district;

      if (
        selectedState &&
        !stateMatches(
          recordState,
          selectedState
        )
      ) {
        return false;
      }

      if (
        selectedDistrict &&
        !districtMatches(
          recordDistrict,
          selectedDistrict
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    governmentRecords,
    selectedState,
    selectedDistrict,
  ]);

  const latestGovernmentRecord = useMemo(() => {
    if (!filteredGovernmentRecords.length) {
      return null;
    }

    return [...filteredGovernmentRecords].sort(
      (a, b) =>
        new Date(
          a?.Date ?? ''
        ).getTime() -
        new Date(
          b?.Date ?? ''
        ).getTime()
    ).at(-1);
  }, [filteredGovernmentRecords]);

  /*
   * ------------------------------------------------------------
   * LAND UTILISATION LATEST RECORD
   * ------------------------------------------------------------
   */

  const latestLandRecord = useMemo(() => {
    if (!landRecords.length) {
      return null;
    }

    return [...landRecords]
      .sort((a, b) =>
        String(
          a?._year ?? ''
        ).localeCompare(
          String(
            b?._year ?? ''
          )
        )
      )
      .at(-1);
  }, [landRecords]);

  /*
   * ------------------------------------------------------------
   * LOCATION
   * ------------------------------------------------------------
   */

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage(
        'Geolocation is not supported by this browser.'
      );
      return;
    }

    setLocationMessage(
      'Detecting your location...'
    );

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          /*
           * Use browser coordinates only for detection.
           * Do not invent a district/state from coordinates.
           *
           * If a geocoding endpoint is available later,
           * this can be connected to it safely.
           */

          const { latitude, longitude } =
            position.coords;

          setDetectedLocation(
            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          );

          setLocationMessage(
            'Location detected. Please select the matching State and District from the government dataset.'
          );
        } catch (_error) {
          setLocationMessage(
            'Location detected, but State/District could not be resolved.'
          );
        }
      },
      () => {
        setLocationMessage(
          'Could not access your location.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  /*
   * ------------------------------------------------------------
   * SOIL REFERENCE PROFILE
   * ------------------------------------------------------------
   */

  const refProfile = soilProfiles.find(
    (profile) =>
      profile.state === refState
  );

  /*
   * ------------------------------------------------------------
   * FARMER SOIL TREND
   * ------------------------------------------------------------
   */

  const plots = useMemo(
    () =>
      [
        ...new Set(
          records
            .map(
              (r) =>
                r.plot_name
            )
            .filter(Boolean)
        ),
      ].sort(),
    [records]
  );

  useEffect(() => {
    if (
      plots.length &&
      !trendPlot
    ) {
      setTrendPlot(plots[0]);
    }
  }, [
    plots,
    trendPlot,
  ]);

  const trendData = records
    .filter(
      (r) =>
        r.plot_name === trendPlot &&
        r.test_date
    )
    .sort(
      (a, b) =>
        new Date(a.test_date) -
        new Date(b.test_date)
    )
    .map((r) => ({
      date: new Date(
        r.test_date
      ).toLocaleDateString(
        'en-IN',
        {
          day: 'numeric',
          month: 'short',
        }
      ),
      pH: r.ph ?? null,
      N: r.nitrogen ?? null,
      P: r.phosphorus ?? null,
      K: r.potassium ?? null,
      OC: r.organic_carbon ?? null,
    }));

  const hasTrend =
    trendData.filter(
      (d) =>
        d.pH != null ||
        d.N != null ||
        d.P != null ||
        d.K != null
    ).length >= 2;

  /*
   * ------------------------------------------------------------
   * SAVE SOIL RECORD
   * ------------------------------------------------------------
   */

  const save = async () => {
    if (!form.plot_name) {
      alert('Plot name required');
      return;
    }

    const payload = {
      plot_name:
        form.plot_name,
      test_date:
        form.test_date ||
        undefined,
      testing_organization:
        form.testing_organization ||
        undefined,
      soil_type:
        form.soil_type ||
        undefined,
      ph: form.ph
        ? Number(form.ph)
        : undefined,
      nitrogen:
        form.nitrogen
          ? Number(form.nitrogen)
          : undefined,
      phosphorus:
        form.phosphorus
          ? Number(form.phosphorus)
          : undefined,
      potassium:
        form.potassium
          ? Number(form.potassium)
          : undefined,
      organic_carbon:
        form.organic_carbon
          ? Number(
              form.organic_carbon
            )
          : undefined,
      ec: form.ec
        ? Number(form.ec)
        : undefined,
      notes:
        form.notes ||
        undefined,
      card_file_url:
        form.card_file_url ||
        undefined,
    };

    const hash =
      await toHash({
        ...payload,
        hashed_at:
          new Date().toISOString(),
      });

    await api.post(
      '/api/soil-records',
      {
        ...payload,
        record_hash: hash,
        hashed_at:
          new Date().toISOString(),
      }
    );

    setForm({
      plot_name: '',
      test_date: '',
      testing_organization: '',
      soil_type: '',
      ph: '',
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      organic_carbon: '',
      ec: '',
      notes: '',
      card_file_url: '',
    });

    setShowAdd(false);
    load();
  };

  /*
   * ------------------------------------------------------------
   * SOIL CARD SCANNER
   * ------------------------------------------------------------
   */

  const scanCard = async (e) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    setScanning(true);

    try {
      const {
        file_url,
      } = await files.upload({
        file,
      });

      setForm((f) => ({
        ...f,
        card_file_url:
          file_url,
      }));

      const res =
        await ai.invoke({
          prompt:
            'Extract soil health values from this Soil Health Card image. Return available fields only. Leave blank if not visible.',
          file_urls: [
            file_url,
          ],
          response_json_schema:
            {
              type: 'object',
              properties: {
                ph: {
                  type: 'number',
                },
                nitrogen: {
                  type: 'number',
                },
                phosphorus: {
                  type: 'number',
                },
                potassium: {
                  type: 'number',
                },
                organic_carbon: {
                  type: 'number',
                },
                ec: {
                  type: 'number',
                },
                soil_type: {
                  type: 'string',
                },
                testing_organization: {
                  type: 'string',
                },
              },
            },
        });

      setForm((f) => ({
        ...f,
        ph:
          res.ph ??
          f.ph,
        nitrogen:
          res.nitrogen ??
          f.nitrogen,
        phosphorus:
          res.phosphorus ??
          f.phosphorus,
        potassium:
          res.potassium ??
          f.potassium,
        organic_carbon:
          res.organic_carbon ??
          f.organic_carbon,
        ec:
          res.ec ??
          f.ec,
        soil_type:
          res.soil_type ||
          f.soil_type,
        testing_organization:
          res.testing_organization ||
          f.testing_organization,
      }));

      alert(
        t('confirmValues')
      );
    } catch (_err) {
      alert(
        'Scan failed. You can enter values manually.'
      );
    } finally {
      setScanning(false);
    }
  };

  const num = (value) =>
    value == null ||
    value === ''
      ? '—'
      : value;

  /*
   * ------------------------------------------------------------
   * UI
   * ------------------------------------------------------------
   */

  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="soilPassport"
        icon={Sprout}
      />

      <Card className="border-green-200">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Soil intelligence by location
              </h2>
              <p className="text-xs text-text-secondary">
                Use your location or select State and District to filter government soil-moisture observations.
              </p>
            </div>

            <Badge className="bg-mint/20 text-mint">
              Data.gov.in
            </Badge>
          </div>

          <Button
            onClick={detectLocation}
            className="w-full bg-green-600 hover:bg-green-700 mb-3"
          >
            <Navigation className="h-4 w-4 mr-1" />
            Use My Location
          </Button>

          {detectedLocation && (
            <p className="text-[10px] text-text-muted mb-2">
              Coordinates detected: {detectedLocation}
            </p>
          )}

          {locationMessage && (
            <p className="text-xs text-text-secondary mb-3">
              {locationMessage}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select
              value={selectedState}
              onValueChange={(value) => {
                setSelectedState(
                  value === '__all__'
                    ? ''
                    : value
                );
                setSelectedDistrict('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectState')} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="__all__">
                  All States
                </SelectItem>

                {governmentStates.map(
                  (state) => (
                    <SelectItem
                      key={state}
                      value={state}
                    >
                      {state}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Select
              value={selectedDistrict}
              onValueChange={(value) =>
                setSelectedDistrict(
                  value === '__all__'
                    ? ''
                    : value
                )
              }
              disabled={!selectedState}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectDistrict')} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="__all__">
                  All Districts
                </SelectItem>

                {governmentDistricts.map(
                  (district) => (
                    <SelectItem
                      key={district}
                      value={district}
                    >
                      {district}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Government Soil Moisture
              </h3>

              <p className="text-xs text-text-muted">
                Daily soil-moisture observations at 15 cm depth.
              </p>
            </div>

            <Badge className="bg-amber-100 text-amber-400">
              HISTORICAL
            </Badge>
          </div>

          {loadingGovernment && (
            <p className="text-xs text-text-muted">
              Loading government observations...
            </p>
          )}

          {!loadingGovernment &&
            governmentError && (
              <div className="bg-red-500/10 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-400">
                  {governmentError}
                </p>
              </div>
            )}

          {!loadingGovernment &&
            !governmentError &&
            !filteredGovernmentRecords.length && (
              <div className="bg-amber-500/10 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-400">
                  {selectedState
                    ? `No government soil-moisture observation was found for ${selectedState}${selectedDistrict ? ` / ${selectedDistrict}` : ''} in the loaded historical dataset.`
                    : 'Select a State and District to view matching government soil-moisture observations.'}
                </p>
              </div>
            )}

          {!loadingGovernment &&
            !governmentError &&
            latestGovernmentRecord && (
              <div className="border border-border rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-cyan-500/10 rounded-lg p-2">
                    <p className="text-[10px] text-text-muted">
                      Moisture at 15 cm
                    </p>
                    <p className="text-lg font-semibold text-cyan-400">
                      {Number(
                        latestGovernmentRecord?.Avg_smlvl_at15cm ??
                        latestGovernmentRecord?.avg_smlvl_at15cm ??
                        0
                      ).toLocaleString(
                        'en-IN',
                        {
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>
                  </div>

                  <div className="bg-surface-hover rounded-lg p-2">
                    <p className="text-[10px] text-text-muted">
                      Observation Date
                    </p>
                    <p className="text-sm font-medium">
                      {latestGovernmentRecord?.Date ??
                        latestGovernmentRecord?.date ??
                        '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-xs text-text-secondary">
                  <p>
                    <span className="text-text-muted">
                      State:
                    </span>{' '}
                    {latestGovernmentRecord?.State ??
                      latestGovernmentRecord?.state ??
                      '—'}
                  </p>

                  <p>
                    <span className="text-text-muted">
                      District:
                    </span>{' '}
                    {latestGovernmentRecord?.District ??
                      latestGovernmentRecord?.district ??
                      '—'}
                  </p>

                  <p>
                    <span className="text-text-muted">
                      Agency:
                    </span>{' '}
                    {latestGovernmentRecord?.Agency_name ??
                      latestGovernmentRecord?.agency_name ??
                      '—'}
                  </p>
                </div>
              </div>
            )}

          <p className="text-[10px] text-gray-300 mt-2">
            Source: Data.gov.in · Resource: soil_moisture · Historical dataset
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Land Utilisation Context
              </h3>

              <p className="text-xs text-text-muted">
                Government land-use statistics supporting soil and crop planning.
              </p>
            </div>

            <Badge className="bg-mint/20 text-mint">
              CURRENT
            </Badge>
          </div>

          {loadingLand && (
            <p className="text-xs text-text-muted">
              Loading land-use statistics...
            </p>
          )}

          {!loadingLand &&
            landError && (
              <div className="bg-red-500/10 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-400">
                  {landError}
                </p>
              </div>
            )}

          {!loadingLand &&
            !landError &&
            latestLandRecord && (
              <>
                <div className="mb-3">
                  <p className="text-[10px] text-text-muted">
                    Reporting year
                  </p>
                  <p className="text-sm font-semibold">
                    {latestLandRecord?._year ??
                      '—'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    [
                      'Net Area Sown',
                      latestLandRecord?._net_area_sown_,
                    ],
                    [
                      'Total Cropped Area',
                      latestLandRecord?._total_cropped_area,
                    ],
                    [
                      'Forests',
                      latestLandRecord?._forests__,
                    ],
                    [
                      'Current Fallows',
                      latestLandRecord?.__current_fallows,
                    ],
                    [
                      'Area Sown More Than Once',
                      latestLandRecord?._area_sown_more_than_once,
                    ],
                    [
                      'Culturable Waste',
                      latestLandRecord?._culturable_waste,
                    ],
                  ].map(
                    ([label, value]) => (
                      <div
                        key={label}
                        className="bg-surface-hover rounded-lg p-2"
                      >
                        <p className="text-[10px] text-text-muted">
                          {label}
                        </p>
                        <p className="text-sm font-semibold">
                          {Number(
                            value ?? 0
                          ).toLocaleString(
                            'en-IN',
                            {
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                      </div>
                    )
                  )}
                </div>

                <div className="bg-cyan-500/10 border border-blue-100 rounded-lg p-2 mt-3">
                  <p className="text-[10px] text-cyan-400">
                    This resource does not return State or District fields. It is therefore shown as government land-use context rather than pretending it is specific to the selected location.
                  </p>
                </div>
              </>
            )}

          <p className="text-[10px] text-gray-300 mt-2">
            Source: Data.gov.in · Resource: land_utilisation
          </p>
        </CardContent>
      </Card>

      {soilProfiles.length > 0 && (
        <Card className="border-blue-200">
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Government soil reference
            </h3>

            <Select
              value={refState}
              onValueChange={setRefState}
            >
              <SelectTrigger className="h-8 text-sm mb-2">
                <SelectValue placeholder={t('selectYourState')} />
              </SelectTrigger>

              <SelectContent>
                {soilProfiles.map(
                  (profile) => (
                    <SelectItem
                      key={profile.state}
                      value={profile.state}
                    >
                      {profile.state}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            {refProfile && (
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-text-muted">
                    Dominant soil type:
                  </span>{' '}
                  {refProfile.dominant_soil_type ||
                    '—'}
                </p>

                <p>
                  <span className="text-text-muted">
                    Typical pH range:
                  </span>{' '}
                  {refProfile.typical_ph_range ||
                    '—'}
                </p>

                <p>
                  <span className="text-text-muted">
                    Characteristics:
                  </span>{' '}
                  {refProfile.characteristics ||
                    '—'}
                </p>

                <p>
                  <span className="text-text-muted">
                    Suitable crops:
                  </span>{' '}
                  {refProfile.suitable_crops ||
                    '—'}
                </p>
              </div>
            )}

            <p className="text-[10px] text-gray-300 mt-2">
              Reference values only — not a substitute for your own soil test.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">
              My Soil Records
            </h3>

            <Badge className="bg-mint/20 text-mint">
              Farmer Data
            </Badge>
          </div>

          <div className="space-y-2">
            {records.length === 0 ? (
              <p className="text-sm text-text-muted">
                No soil records yet. Add one or scan a Soil Health Card.
              </p>
            ) : (
              records.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {r.plot_name}
                      </p>

                      {r.record_hash && (
                        <Badge className="bg-mint/20 text-mint flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          {t('verifiedBadge')}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-text-muted">
                      {r.test_date ||
                        'No date'}
                      {r.testing_organization
                        ? ` · ${r.testing_organization}`
                        : ''}
                    </p>

                    <div className="grid grid-cols-5 gap-1 mt-2 text-center">
                      {[
                        ['pH', num(r.ph)],
                        ['N', num(r.nitrogen)],
                        ['P', num(r.phosphorus)],
                        ['K', num(r.potassium)],
                        ['OC', num(r.organic_carbon)],
                      ].map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="bg-surface-hover rounded p-1"
                          >
                            <div className="text-[10px] text-text-muted">
                              {key}
                            </div>

                            <div className="text-xs font-medium">
                              {value}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {r.notes && (
                      <p className="text-xs text-text-secondary mt-2">
                        {r.notes}
                      </p>
                    )}

                    <p className="text-[10px] text-gray-300 mt-1 truncate">
                      hash: {r.record_hash?.slice(0, 24)}…
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {plots.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
              <LineChartIcon className="h-4 w-4 text-green-600" />
              {t('soilTrend')}
            </h3>

            {plots.length > 1 && (
              <Select
                value={trendPlot}
                onValueChange={setTrendPlot}
              >
                <SelectTrigger className="h-8 text-sm mb-2">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {plots.map(
                    (plot) => (
                      <SelectItem
                        key={plot}
                        value={plot}
                      >
                        {plot}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            )}

            {hasTrend ? (
              <div className="h-56">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={trendData}
                    margin={{
                      top: 5,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#eee"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 10,
                      }}
                    />
                    <YAxis
                      tick={{
                        fontSize: 10,
                      }}
                    />
                    <Tooltip />
                    <Legend
                      wrapperStyle={{
                        fontSize: 10,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="pH"
                      stroke="#16a34a"
                      dot={{ r: 3 }}
                      connectNulls
                    />

                    <Line
                      type="monotone"
                      dataKey="N"
                      stroke="#3b82f6"
                      dot={{ r: 3 }}
                      connectNulls
                    />

                    <Line
                      type="monotone"
                      dataKey="P"
                      stroke="#f59e0b"
                      dot={{ r: 3 }}
                      connectNulls
                    />

                    <Line
                      type="monotone"
                      dataKey="K"
                      stroke="#ef4444"
                      dot={{ r: 3 }}
                      connectNulls
                    />

                    <Line
                      type="monotone"
                      dataKey="OC"
                      stroke="#a855f7"
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-text-muted">
                {t('soilTrendEmpty')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-text-muted">
        ⚠️ {t('blockchainUnavailable')}
      </p>

      {showAdd ? (
        <Card className="border-green-200">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                {t('addSoilRecord')}
              </Label>

              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1 text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1.5 rounded-lg">
                  <ScanLine className="h-3.5 w-3.5" />
                  {scanning
                    ? t('loading')
                    : t('scanCard')}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={scanCard}
                />
              </label>
            </div>

            {form.card_file_url && (
              <Image
                src={form.card_file_url}
                className="w-full h-32 rounded-lg"
                fittingType="fit"
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-1 block text-xs">
                  {t('plotName')}
                </Label>

                <Input
                  value={form.plot_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      plot_name:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Test date
                </Label>

                <Input
                  type="date"
                  value={form.test_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      test_date:
                        e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {[
                ['ph', 'pH'],
                ['nitrogen', 'N'],
                ['phosphorus', 'P'],
                ['potassium', 'K'],
                ['organic_carbon', 'OC'],
              ].map(
                ([key, label]) => (
                  <div key={key}>
                    <Label className="mb-1 block text-xs">
                      {label}
                    </Label>

                    <Input
                      type="number"
                      value={form[key]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [key]:
                            e.target.value,
                        })
                      }
                    />
                  </div>
                )
              )}
            </div>

            <Input
              placeholder={t('soilType')}
              value={form.soil_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  soil_type:
                    e.target.value,
                })
              }
            />

            <Textarea
              placeholder={t('notes')}
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes:
                    e.target.value,
                })
              }
              rows={2}
            />

            <div className="flex gap-2">
              <Button
                onClick={save}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {t('save')}
              </Button>

              <Button
                onClick={() =>
                  setShowAdd(false)
                }
                variant="outline"
                className="flex-1"
              >
                {t('cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() =>
            setShowAdd(true)
          }
          variant="outline"
          className="w-full border-mint/40 text-mint"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('addSoilRecord')}
        </Button>
      )}
    </div>
  );
}
