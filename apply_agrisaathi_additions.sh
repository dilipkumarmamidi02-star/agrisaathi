#!/usr/bin/env bash
set -euo pipefail

# AgriSaathi additions: Weather page, admin bootstrap, real blockchain anchoring.
# Run this from your project root (the folder containing backend/ and frontend/).

if [ ! -d backend ] || [ ! -d frontend ]; then
  echo "Run this script from the agrisaathi project root (must contain backend/ and frontend/)."
  exit 1
fi

echo "== 1/8: Weather page (frontend) =="
mkdir -p frontend/src/pages
cat > frontend/src/pages/Weather.jsx << 'JSEOF'
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Cloud, CloudRain, Sun, CloudDrizzle, CloudLightning, CloudSnow,
  CloudFog, Wind, Droplets, Loader2, MapPin, X, Layers,
} from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// --- WMO weather code -> icon + label (used by Open-Meteo) ---
const WMO = {
  0: { label: 'Clear sky', icon: Sun },
  1: { label: 'Mainly clear', icon: Sun },
  2: { label: 'Partly cloudy', icon: Cloud },
  3: { label: 'Overcast', icon: Cloud },
  45: { label: 'Fog', icon: CloudFog },
  48: { label: 'Depositing rime fog', icon: CloudFog },
  51: { label: 'Light drizzle', icon: CloudDrizzle },
  53: { label: 'Moderate drizzle', icon: CloudDrizzle },
  55: { label: 'Dense drizzle', icon: CloudDrizzle },
  61: { label: 'Slight rain', icon: CloudRain },
  63: { label: 'Moderate rain', icon: CloudRain },
  65: { label: 'Heavy rain', icon: CloudRain },
  71: { label: 'Slight snow', icon: CloudSnow },
  73: { label: 'Moderate snow', icon: CloudSnow },
  75: { label: 'Heavy snow', icon: CloudSnow },
  80: { label: 'Rain showers', icon: CloudRain },
  81: { label: 'Rain showers', icon: CloudRain },
  82: { label: 'Violent rain showers', icon: CloudRain },
  95: { label: 'Thunderstorm', icon: CloudLightning },
  96: { label: 'Thunderstorm with hail', icon: CloudLightning },
  99: { label: 'Thunderstorm with hail', icon: CloudLightning },
};
function weatherFor(code) {
  return WMO[code] || { label: 'Unknown', icon: Cloud };
}

const DEFAULT_CITIES = [
  { name: 'Hyderabad', admin1: 'Telangana', country: 'India', latitude: 17.385, longitude: 78.4867 },
  { name: 'New Delhi', admin1: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.209 },
  { name: 'Mumbai', admin1: 'Maharashtra', country: 'India', latitude: 19.076, longitude: 72.8777 },
  { name: 'Bengaluru', admin1: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
];

async function fetchForecast(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m');
  url.searchParams.set('hourly', 'temperature_2m,weather_code');
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
  );
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '10');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Weather data unavailable');
  return res.json();
}

async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '6');
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

// Latest RainViewer precipitation radar frame, as a Leaflet tile URL template.
async function getRadarTileUrl() {
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    const data = await res.json();
    const frames = data?.radar?.past || [];
    const latest = frames[frames.length - 1];
    if (!latest) return null;
    return `${data.host}${latest.path}/256/{z}/{x}/{y}/4/1_1.png`;
  } catch {
    return null;
  }
}

function CityCard({ city, current, onClick, active }) {
  const w = current ? weatherFor(current.weather_code) : null;
  const Icon = w?.icon || Cloud;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-colors ${
        active ? 'border-[#2d6a4f] bg-[#f0f7f2]' : 'border-green-100 bg-white hover:bg-green-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-[#1b4332]">{city.name}</div>
          <div className="text-xs text-muted-foreground">{w?.label || 'Loading...'}</div>
        </div>
        <div className="flex items-center gap-2">
          <Icon size={22} className="text-[#2d6a4f]" />
          <span className="text-2xl font-bold text-[#1b4332]">
            {current ? Math.round(current.temperature_2m) : '--'}°
          </span>
        </div>
      </div>
    </button>
  );
}

export default function Weather() {
  const [cities, setCities] = useState(DEFAULT_CITIES);
  const [selected, setSelected] = useState(DEFAULT_CITIES[0]);
  const [forecasts, setForecasts] = useState({}); // key: "lat,lon" -> forecast data
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [radarUrl, setRadarUrl] = useState(null);
  const debounceRef = useRef(null);

  const cityKey = (c) => `${c.latitude.toFixed(2)},${c.longitude.toFixed(2)}`;

  const loadCity = useCallback(async (city) => {
    const key = cityKey(city);
    try {
      const data = await fetchForecast(city.latitude, city.longitude);
      setForecasts((prev) => ({ ...prev, [key]: data }));
    } catch (e) {
      // leave missing — card just shows "Loading..." indefinitely on failure
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all(cities.map(loadCity)).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getRadarTileUrl().then(setRadarUrl);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      const r = await searchCities(query);
      setResults(r);
      setSearching(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const addCity = (result) => {
    const city = {
      name: result.name,
      admin1: result.admin1,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
    };
    setCities((prev) => {
      if (prev.some((c) => cityKey(c) === cityKey(city))) return prev;
      return [...prev, city];
    });
    loadCity(city);
    setSelected(city);
    setQuery('');
    setResults([]);
  };

  const removeCity = (city, e) => {
    e.stopPropagation();
    setCities((prev) => prev.filter((c) => cityKey(c) !== cityKey(city)));
    if (cityKey(selected) === cityKey(city) && cities.length > 1) {
      setSelected(cities.find((c) => cityKey(c) !== cityKey(city)));
    }
  };

  const selectedData = forecasts[cityKey(selected)];
  const currentW = selectedData ? weatherFor(selectedData.current?.weather_code) : null;
  const CurrentIcon = currentW?.icon || Cloud;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1b4332]">Weather</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live conditions, 10-day forecast, and precipitation radar for your farm regions
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a city, district, or town..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-green-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30"
        />
        {searching && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-green-100 rounded-lg shadow-lg overflow-hidden">
            {results.map((r) => (
              <button
                key={`${r.latitude}-${r.longitude}`}
                onClick={() => addCity(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-green-50 text-sm flex items-center gap-2"
              >
                <MapPin size={14} className="text-[#2d6a4f]" />
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground text-xs">
                  {[r.admin1, r.country].filter(Boolean).join(', ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City list */}
        <div className="space-y-3">
          {cities.map((city) => (
            <div key={cityKey(city)} className="relative group">
              <CityCard
                city={city}
                current={forecasts[cityKey(city)]?.current}
                active={cityKey(selected) === cityKey(city)}
                onClick={() => setSelected(city)}
              />
              {cities.length > 1 && (
                <button
                  onClick={(e) => removeCity(city, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-white/80 hover:bg-red-50"
                >
                  <X size={14} className="text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div className="lg:col-span-2 space-y-6">
          {loading && !selectedData ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-[#2d6a4f]" size={28} />
            </div>
          ) : selectedData ? (
            <>
              {/* Current conditions */}
              <div className="bg-white rounded-2xl p-6 border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin size={14} /> {selected.name}
                      {selected.admin1 ? `, ${selected.admin1}` : ''}
                    </div>
                    <div className="text-5xl font-bold text-[#1b4332] mt-1">
                      {Math.round(selectedData.current.temperature_2m)}°
                    </div>
                    <div className="text-muted-foreground">{currentW.label}</div>
                  </div>
                  <CurrentIcon size={56} className="text-[#2d6a4f]" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wind size={16} /> Wind {Math.round(selectedData.current.wind_speed_10m)} km/h
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Droplets size={16} /> Humidity {selectedData.current.relative_humidity_2m}%
                  </div>
                </div>
              </div>

              {/* Hourly strip */}
              <div className="bg-white rounded-2xl p-5 border border-green-100 overflow-x-auto">
                <h3 className="font-bold text-[#1b4332] mb-3 text-sm">Hourly Forecast</h3>
                <div className="flex gap-5 min-w-max">
                  {selectedData.hourly.time.slice(0, 24).map((t, i) => {
                    const hw = weatherFor(selectedData.hourly.weather_code[i]);
                    const HIcon = hw.icon;
                    return (
                      <div key={t} className="flex flex-col items-center gap-1 text-sm">
                        <span className="text-muted-foreground text-xs">
                          {new Date(t).toLocaleTimeString([], { hour: 'numeric' })}
                        </span>
                        <HIcon size={20} className="text-[#2d6a4f]" />
                        <span className="font-medium">{Math.round(selectedData.hourly.temperature_2m[i])}°</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 10-day forecast */}
              <div className="bg-white rounded-2xl p-5 border border-green-100">
                <h3 className="font-bold text-[#1b4332] mb-3 text-sm">10-Day Forecast</h3>
                <div className="divide-y divide-green-50">
                  {selectedData.daily.time.map((t, i) => {
                    const dw = weatherFor(selectedData.daily.weather_code[i]);
                    const DIcon = dw.icon;
                    const day = i === 0 ? 'Today' : new Date(t).toLocaleDateString([], { weekday: 'short' });
                    return (
                      <div key={t} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="w-16 font-medium text-[#1b4332]">{day}</span>
                        <div className="flex items-center gap-2 w-32">
                          <DIcon size={18} className="text-[#2d6a4f]" />
                          <span className="text-xs text-blue-500">
                            {selectedData.daily.precipitation_probability_max[i]}%
                          </span>
                        </div>
                        <span className="text-muted-foreground w-10 text-right">
                          {Math.round(selectedData.daily.temperature_2m_min[i])}°
                        </span>
                        <span className="font-bold text-[#1b4332] w-10 text-right">
                          {Math.round(selectedData.daily.temperature_2m_max[i])}°
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Precipitation radar map */}
              <div className="bg-white rounded-2xl p-5 border border-green-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[#1b4332] text-sm flex items-center gap-2">
                    <Layers size={16} /> Precipitation Radar
                  </h3>
                  <button
                    onClick={() => setShowRadar((v) => !v)}
                    className="text-xs text-[#2d6a4f] font-medium"
                  >
                    {showRadar ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showRadar && (
                  <div className="rounded-xl overflow-hidden border border-green-50" style={{ height: 360 }}>
                    <MapContainer
                      center={[selected.latitude, selected.longitude]}
                      zoom={6}
                      style={{ height: '100%', width: '100%' }}
                      key={cityKey(selected)}
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {radarUrl && <TileLayer url={radarUrl} opacity={0.6} />}
                    </MapContainer>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Radar data: RainViewer · Forecast data: Open-Meteo
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Couldn't load weather for this location.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
JSEOF

echo "== 2/8: Smart contract + ABI =="
mkdir -p backend/contracts
cat > backend/contracts/AgriSaathiRegistry.sol << 'SOLEOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgriSaathiRegistry
/// @notice Tamper-evident hash-anchoring registry for AgriSaathi lots and
/// quality reports. Anyone can verify a record's hash was anchored at a
/// given block/timestamp; only authorized backend wallets can write, and a
/// record can never be overwritten once anchored (append-only).
contract AgriSaathiRegistry {
    struct Record {
        bytes32 dataHash;
        uint256 timestamp;
        address submitter;
    }

    address public owner;
    mapping(address => bool) public authorizedWriters;
    mapping(string => Record) private records;

    event RecordAnchored(
        string indexed recordId,
        bytes32 dataHash,
        address indexed submitter,
        uint256 timestamp
    );
    event WriterUpdated(address indexed account, bool allowed);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "AgriSaathiRegistry: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedWriters[msg.sender] || msg.sender == owner,
            "AgriSaathiRegistry: caller is not authorized"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedWriters[msg.sender] = true;
        emit WriterUpdated(msg.sender, true);
    }

    /// @notice Owner-only: grant or revoke write access for a backend wallet.
    function setAuthorized(address account, bool allowed) external onlyOwner {
        authorizedWriters[account] = allowed;
        emit WriterUpdated(account, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AgriSaathiRegistry: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Anchor a record's hash on-chain. Reverts if recordId was already anchored
    /// (append-only — this is what makes tampering detectable).
    function anchorRecord(string calldata recordId, bytes32 dataHash) external onlyAuthorized {
        require(records[recordId].timestamp == 0, "AgriSaathiRegistry: record already anchored");
        require(dataHash != bytes32(0), "AgriSaathiRegistry: empty hash");
        records[recordId] = Record({dataHash: dataHash, timestamp: block.timestamp, submitter: msg.sender});
        emit RecordAnchored(recordId, dataHash, msg.sender, block.timestamp);
    }

    /// @notice Anyone can read back an anchored record to verify it independently.
    function getRecord(string calldata recordId)
        external
        view
        returns (bytes32 dataHash, uint256 timestamp, address submitter)
    {
        Record memory r = records[recordId];
        return (r.dataHash, r.timestamp, r.submitter);
    }
}
SOLEOF
cat > backend/contracts/AgriSaathiRegistry.abi.json << 'ABIEOF'
[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "recordId", "type": "string" },
      { "indexed": false, "internalType": "bytes32", "name": "dataHash", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "submitter", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "RecordAnchored",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "account", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "allowed", "type": "bool" }
    ],
    "name": "WriterUpdated",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "recordId", "type": "string" },
      { "internalType": "bytes32", "name": "dataHash", "type": "bytes32" }
    ],
    "name": "anchorRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "recordId", "type": "string" }],
    "name": "getRecord",
    "outputs": [
      { "internalType": "bytes32", "name": "dataHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "address", "name": "submitter", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "bool", "name": "allowed", "type": "bool" }
    ],
    "name": "setAuthorized",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "authorizedWriters",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
]
ABIEOF

echo "== 3/8: Blockchain client (backend) =="
cat > backend/app/blockchain.py << 'PYEOF1'
"""
Real blockchain anchoring for Lot / QualityReport provenance records.

Uses web3.py against any EVM-compatible chain (defaults to the Polygon
Amoy testnet). Nothing here is Base44-specific or requires any Base44
service — it's a plain smart-contract call using your own wallet + RPC.

SECURITY — read before using in anything beyond a testnet:
  - BLOCKCHAIN_PRIVATE_KEY must live ONLY in your untracked .env file.
    Never commit it, never log it, never put it in a frontend bundle.
  - Use a DEDICATED wallet for this service with a small gas balance —
    never your main/treasury wallet. If this key leaks, the blast radius
    should be "someone can write junk to the registry", not "someone
    drains funds".
  - The contract's anchorRecord() is append-only (reverts if the record
    already exists), so a compromised key can add bogus NEW records but
    cannot alter or delete previously anchored ones.
  - All writes still require a valid backend JWT (see routers/functions.py)
    — the chain call happens server-side only, never triggered directly
    from the browser.
  - For production, prefer a secrets manager (AWS Secrets Manager, GCP
    Secret Manager, Vault) over a raw .env value, and consider a
    multisig or a KMS-backed signer instead of a plain private key.
"""
import json
import os

from .config import settings

_w3 = None
_contract = None
_account = None

_ABI_PATH = os.path.join(os.path.dirname(__file__), "..", "contracts", "AgriSaathiRegistry.abi.json")


def _load_abi():
    with open(_ABI_PATH) as f:
        return json.load(f)


def _get_web3():
    global _w3
    if _w3 is None:
        from web3 import Web3

        if not settings.BLOCKCHAIN_RPC_URL:
            return None
        _w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
    return _w3


def _get_account():
    global _account
    if _account is None and settings.BLOCKCHAIN_PRIVATE_KEY:
        from eth_account import Account

        _account = Account.from_key(settings.BLOCKCHAIN_PRIVATE_KEY)
    return _account


def _get_contract():
    global _contract
    if _contract is None:
        w3 = _get_web3()
        if not w3 or not settings.BLOCKCHAIN_CONTRACT_ADDRESS:
            return None
        _contract = w3.eth.contract(
            address=w3.to_checksum_address(settings.BLOCKCHAIN_CONTRACT_ADDRESS),
            abi=_load_abi(),
        )
    return _contract


def is_configured() -> bool:
    return bool(
        settings.BLOCKCHAIN_RPC_URL
        and settings.BLOCKCHAIN_PRIVATE_KEY
        and settings.BLOCKCHAIN_CONTRACT_ADDRESS
    )


def anchor_hash(record_id: str, sha256_hex: str) -> dict:
    """Writes (record_id -> sha256_hex) to the chain. Returns a dict describing
    the outcome; never raises — callers should check `status`."""
    if not is_configured():
        return {"status": "not_configured"}

    try:
        w3 = _get_web3()
        acct = _get_account()
        contract = _get_contract()

        data_hash_bytes = bytes.fromhex(sha256_hex)
        nonce = w3.eth.get_transaction_count(acct.address, "pending")
        tx = contract.functions.anchorRecord(record_id, data_hash_bytes).build_transaction(
            {
                "from": acct.address,
                "nonce": nonce,
                "chainId": settings.BLOCKCHAIN_CHAIN_ID,
                "gas": 200000,
                "gasPrice": w3.eth.gas_price,
            }
        )
        signed = acct.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        return {
            "status": "anchored" if receipt.status == 1 else "failed",
            "tx_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "explorer_url": (
                f"{settings.BLOCKCHAIN_EXPLORER_BASE}/tx/{tx_hash.hex()}"
                if settings.BLOCKCHAIN_EXPLORER_BASE
                else None
            ),
        }
    except Exception as e:  # noqa: BLE001 — never let a chain hiccup break the request
        # "already anchored" is expected if this record was retried — treat as anchored.
        if "already anchored" in str(e).lower():
            return {"status": "anchored", "note": "already anchored previously"}
        return {"status": "failed", "error": str(e)}


def verify_hash(record_id: str, expected_sha256_hex: str) -> dict:
    """Reads the on-chain record back and compares it to the hash you expect."""
    if not is_configured():
        return {"verified": False, "reason": "not_configured"}

    try:
        contract = _get_contract()
        data_hash, timestamp, submitter = contract.functions.getRecord(record_id).call()
        if timestamp == 0:
            return {"verified": False, "reason": "not_found_on_chain"}
        on_chain_hash = data_hash.hex()
        matches = on_chain_hash == expected_sha256_hex.lower()
        return {
            "verified": matches,
            "on_chain_hash": on_chain_hash,
            "anchored_at": timestamp,
            "submitter": submitter,
        }
    except Exception as e:  # noqa: BLE001
        return {"verified": False, "reason": str(e)}
PYEOF1

echo "== 4/8: Admin seed script (backend) =="
cat > backend/seed_admin.py << 'PYEOF2'
"""
One-time admin bootstrap. Reads credentials from environment variables —
NEVER hardcode credentials in source. Run once:

    cd backend
    python seed_admin.py

Set these in backend/.env first (not .env.example — keep real creds out of
anything you might commit):

    ADMIN_EMAIL=youradmin@example.com
    ADMIN_BOOTSTRAP_PASSWORD=a-strong-password-here

The script creates the admin if it doesn't exist, or updates the password
and role if it does. It marks the account as verified so it can log in
immediately (skipping the normal email-OTP flow, which doesn't make sense
for an admin you're creating yourself from the server).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, Base, engine  # noqa: E402
from app import models  # noqa: E402
from app.security import hash_password  # noqa: E402

EMAIL = os.environ.get("ADMIN_EMAIL")
PASSWORD = os.environ.get("ADMIN_BOOTSTRAP_PASSWORD")

if not EMAIL or not PASSWORD:
    print(
        "Set ADMIN_EMAIL and ADMIN_BOOTSTRAP_PASSWORD in backend/.env first, "
        "then re-run: python seed_admin.py"
    )
    sys.exit(1)

if len(PASSWORD) < 8:
    print("ADMIN_BOOTSTRAP_PASSWORD is too short — use at least 8 characters.")
    sys.exit(1)

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    user = db.query(models.User).filter(models.User.email == EMAIL).first()
    if user:
        user.password_hash = hash_password(PASSWORD)
        user.role = "admin"
        user.is_verified = True
        user.is_active = True
        print(f"Updated existing user {EMAIL} to admin.")
    else:
        user = models.User(
            email=EMAIL,
            full_name="Administrator",
            password_hash=hash_password(PASSWORD),
            role="admin",
            portal_type="farmer",
            is_verified=True,
            is_active=True,
        )
        db.add(user)
        print(f"Created new admin user {EMAIL}.")
    db.commit()
    print("Done. You can log in at /login with this email and password.")
finally:
    db.close()
PYEOF2


echo "== 5/8: requirements.txt (add web3 + eth-account, fix bcrypt bug) =="
python3 << 'PYEOF3'
path = "backend/requirements.txt"
with open(path) as f:
    content = f.read()

# passlib 1.7.4 breaks with bcrypt>=4.1 (removed the __about__ attribute
# passlib's version-detection relies on) — every password hash/verify call
# fails, including registration and this admin seed script. Pin it.
if "bcrypt==" not in content:
    content = content.rstrip("\n") + "\nbcrypt==4.0.1\n"
    print("Pinned bcrypt==4.0.1 (fixes a passlib incompatibility with bcrypt>=4.1).")

added = []
for pkg in ["web3==7.6.0", "eth-account==0.13.4"]:
    name = pkg.split("==")[0]
    if name not in content:
        content = content.rstrip("\n") + f"\n{pkg}\n"
        added.append(pkg)

with open(path, "w") as f:
    f.write(content)
print("Added:", added if added else "(already present)")
PYEOF3

echo "== 6/8: backend/.env.example (append new vars) =="
python3 << 'PYEOF4'
path = "backend/.env.example"
with open(path) as f:
    content = f.read()
marker = "ADMIN_BOOTSTRAP_PASSWORD"
if marker not in content:
    content += """
# --- Admin bootstrap (run: python seed_admin.py) ---
# Put your REAL admin credentials in backend/.env (not this example file).
ADMIN_BOOTSTRAP_PASSWORD=

# --- Blockchain anchoring (Lot / QualityReport provenance) ---
# Defaults target Polygon Amoy testnet. Use a DEDICATED wallet with a small
# gas balance only — never your main wallet. Deploy contracts/AgriSaathiRegistry.sol
# (e.g. via Remix or Hardhat) and paste the deployed address below.
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_PRIVATE_KEY=
BLOCKCHAIN_CONTRACT_ADDRESS=
BLOCKCHAIN_CHAIN_ID=80002
BLOCKCHAIN_EXPLORER_BASE=https://amoy.polygonscan.com

# --- Groq (OpenAI-compatible endpoint — used by OPENAI_* settings above) ---
# Set OPENAI_BASE_URL=https://api.groq.com/openai/v1 and OPENAI_API_KEY=<your groq key>
# in your .env (not here) to route agriHelperChat / analyzeQuality / diagnoseImage through Groq.
"""
    with open(path, "w") as f:
        f.write(content)
    print("Appended new variables.")
else:
    print("Already present, skipped.")
PYEOF4

echo "== 7/8: backend/app/config.py (add blockchain + admin settings) =="
python3 << 'PYEOF5'
path = "backend/app/config.py"
with open(path) as f:
    content = f.read()

old = '''    ADMIN_EMAIL: str = ""

    class Config:'''

new = '''    ADMIN_EMAIL: str = ""
    ADMIN_BOOTSTRAP_PASSWORD: str = ""

    # --- Blockchain anchoring (Lot / QualityReport provenance) ---
    # Defaults target Polygon Amoy testnet — override for a different chain.
    BLOCKCHAIN_RPC_URL: str = ""
    BLOCKCHAIN_PRIVATE_KEY: str = ""
    BLOCKCHAIN_CONTRACT_ADDRESS: str = ""
    BLOCKCHAIN_CHAIN_ID: int = 80002
    BLOCKCHAIN_EXPLORER_BASE: str = "https://amoy.polygonscan.com"

    class Config:'''

if "BLOCKCHAIN_RPC_URL" in content:
    print("config.py already patched, skipped.")
elif old in content:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("Patched config.py.")
else:
    print("MANUAL PATCH NEEDED in backend/app/config.py — couldn't find the expected")
    print("anchor text (your file may have been edited). Add these fields to the")
    print("Settings class yourself:")
    print(new)
PYEOF5

echo "== 8/8: backend/app/routers/functions.py (real blockchain anchoring) =="
python3 << 'PYEOF6'
path = "backend/app/routers/functions.py"
with open(path) as f:
    content = f.read()

if "from .. import blockchain" in content:
    print("functions.py already patched, skipped.")
else:
    # 1. import
    old_import = "from ..integrations import invoke_llm, send_email"
    new_import = "from ..integrations import invoke_llm, send_email\nfrom .. import blockchain"
    assert old_import in content, "MANUAL PATCH NEEDED: import line not found in functions.py"
    content = content.replace(old_import, new_import, 1)

    # 2. createLot — anchor after commit
    old_lot = '''    db.add(lot)
    db.commit()
    db.refresh(lot)
    return {"success": True, "lot": {c.name: getattr(lot, c.name) for c in lot.__table__.columns}}'''
    new_lot = '''    db.add(lot)
    db.commit()
    db.refresh(lot)

    chain_result = blockchain.anchor_hash(lot.lot_id, lot.blockchain_hash)
    lot.blockchain_status = chain_result.get("status", "not_configured")
    db.commit()
    db.refresh(lot)

    return {
        "success": True,
        "lot": {c.name: getattr(lot, c.name) for c in lot.__table__.columns},
        "blockchain": chain_result,
    }'''
    assert old_lot in content, "MANUAL PATCH NEEDED: createLot return block not found in functions.py"
    content = content.replace(old_lot, new_lot, 1)

    # 3. analyzeQuality — anchor after commit
    old_report = '''    db.commit()
    db.refresh(report)
    return {"success": True, "report": {c.name: getattr(report, c.name) for c in report.__table__.columns}}'''
    new_report = '''    db.commit()
    db.refresh(report)

    chain_result = blockchain.anchor_hash(report.report_id, report.report_hash)
    report.blockchain_status = chain_result.get("status", "not_configured")
    db.commit()
    db.refresh(report)

    return {
        "success": True,
        "report": {c.name: getattr(report, c.name) for c in report.__table__.columns},
        "blockchain": chain_result,
    }'''
    assert old_report in content, "MANUAL PATCH NEEDED: analyzeQuality return block not found in functions.py"
    content = content.replace(old_report, new_report, 1)

    # 4. verifyLot — real on-chain verification
    old_verify = "    integrity_verified = bool(quality_report and quality_report.report_hash)\n\n    return {"
    new_verify = '''    integrity_verified = bool(quality_report and quality_report.report_hash)
    chain_verification = blockchain.verify_hash(lot.lot_id, lot.blockchain_hash) if lot.blockchain_hash else {"verified": False, "reason": "no_hash"}

    return {'''
    assert old_verify in content, "MANUAL PATCH NEEDED: verifyLot integrity_verified line not found in functions.py"
    content = content.replace(old_verify, new_verify, 1)

    old_verify_tail = '        "integrity_verified": integrity_verified,\n    }'
    new_verify_tail = '        "integrity_verified": integrity_verified,\n        "blockchain_verification": chain_verification,\n    }'
    assert old_verify_tail in content, "MANUAL PATCH NEEDED: verifyLot final dict not found in functions.py"
    content = content.replace(old_verify_tail, new_verify_tail, 1)

    with open(path, "w") as f:
        f.write(content)
    print("Patched functions.py (createLot, analyzeQuality, verifyLot now anchor/verify on-chain).")
PYEOF6

python3 -c "import ast; ast.parse(open('backend/app/routers/functions.py').read()); print('functions.py syntax OK')"
python3 -c "import ast; ast.parse(open('backend/app/config.py').read()); print('config.py syntax OK')"
python3 -c "import ast; ast.parse(open('backend/app/blockchain.py').read()); print('blockchain.py syntax OK')"
python3 -c "import ast; ast.parse(open('backend/seed_admin.py').read()); print('seed_admin.py syntax OK')"

echo "== bonus: frontend App.jsx route + AppShell.jsx nav link =="
python3 << 'PYEOF7'
path = "frontend/src/App.jsx"
with open(path) as f:
    content = f.read()

if "@/pages/Weather" in content:
    print("App.jsx already patched, skipped.")
else:
    old_import = "import Notifications from '@/pages/Notifications';"
    new_import = "import Notifications from '@/pages/Notifications';\nimport Weather from '@/pages/Weather';"
    assert old_import in content, "MANUAL PATCH NEEDED: Notifications import not found in App.jsx"
    content = content.replace(old_import, new_import, 1)

    old_route = '<Route path="/notifications" element={<Notifications />} />'
    new_route = '<Route path="/notifications" element={<Notifications />} />\n          <Route path="/weather" element={<Weather />} />'
    assert old_route in content, "MANUAL PATCH NEEDED: Notifications route not found in App.jsx"
    content = content.replace(old_route, new_route, 1)

    with open(path, "w") as f:
        f.write(content)
    print("Patched App.jsx — added /weather route.")
PYEOF7

python3 << 'PYEOF8'
path = "frontend/src/components/AppShell.jsx"
with open(path) as f:
    content = f.read()

if "CloudSun" in content:
    print("AppShell.jsx already patched, skipped.")
else:
    old_import = "ShieldCheck, Users, AlertTriangle, UserCircle, Trophy, CalendarClock, Route, Stethoscope, Map } from 'lucide-react';"
    new_import = "ShieldCheck, Users, AlertTriangle, UserCircle, Trophy, CalendarClock, Route, Stethoscope, Map, CloudSun } from 'lucide-react';"
    assert old_import in content, "MANUAL PATCH NEEDED: lucide-react import line not found in AppShell.jsx"
    content = content.replace(old_import, new_import, 1)

    old_iconmap = '''const iconMap = {
  LayoutDashboard, Warehouse, TrendingUp, BellRing, ScanSearch, Package,
  Handshake, ShoppingCart, Snowflake, Truck, Wallet, LifeBuoy,
  ShieldCheck, Users, AlertTriangle, Trophy, CalendarClock, Route, Stethoscope, Map
};'''
    new_iconmap = '''const iconMap = {
  LayoutDashboard, Warehouse, TrendingUp, BellRing, ScanSearch, Package,
  Handshake, ShoppingCart, Snowflake, Truck, Wallet, LifeBuoy,
  ShieldCheck, Users, AlertTriangle, Trophy, CalendarClock, Route, Stethoscope, Map, CloudSun
};'''
    assert old_iconmap in content, "MANUAL PATCH NEEDED: iconMap not found in AppShell.jsx"
    content = content.replace(old_iconmap, new_iconmap, 1)

    old_nav_item = "{ label: 'Market Prices', path: '/market-prices', icon: 'TrendingUp' },"
    new_nav_item = "{ label: 'Market Prices', path: '/market-prices', icon: 'TrendingUp' },\n  { label: 'Weather', path: '/weather', icon: 'CloudSun' },"
    count = content.count(old_nav_item)
    assert count in (2, 3), f"MANUAL PATCH NEEDED: expected 2-3 'Market Prices' nav entries, found {count}"
    content = content.replace(old_nav_item, new_nav_item)

    with open(path, "w") as f:
        f.write(content)
    print(f"Patched AppShell.jsx — added Weather to {count} nav menu(s) (farmer/supporter/admin).")
PYEOF8

echo ""
echo "================================================================"
echo "Done. Next steps:"
echo "1. Backend deps:      cd backend && pip install -r requirements.txt --break-system-packages"
echo "2. Set in backend/.env:"
echo "   ADMIN_EMAIL=your-admin-email"
echo "   ADMIN_BOOTSTRAP_PASSWORD=your-chosen-password"
echo "   OPENAI_API_KEY=<your groq key>"
echo "   OPENAI_BASE_URL=https://api.groq.com/openai/v1"
echo "   OPENAI_TEXT_MODEL=llama-3.3-70b-versatile"
echo "3. Create the admin:  python seed_admin.py"
echo "4. Deploy contracts/AgriSaathiRegistry.sol to Polygon Amoy (or your chain of"
echo "   choice) via Remix/Hardhat, then set BLOCKCHAIN_RPC_URL,"
echo "   BLOCKCHAIN_PRIVATE_KEY, BLOCKCHAIN_CONTRACT_ADDRESS in backend/.env."
echo "   Until those are set, Lot/QualityReport creation still works normally —"
echo "   blockchain_status just stays 'not_configured'."
echo "5. Frontend: npm install (react-leaflet is already a dependency) && npm run dev"
echo "   The Weather page needs no API key (Open-Meteo + RainViewer are both free/public)."
echo "================================================================"
