import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/appClient';
import { useUserRole } from '../hooks/useUserRole';

// Dynamically import QRCode to avoid build issues
let QRCode;

export default function MyLots() {
  const location = useLocation();
  const { uid, displayName, loading: userLoading } = useUserRole();
  const [lots, setLots] = useState([]);
  const [farms, setFarms] = useState([]);
  const [form, setForm] = useState({
    farmId: '',
    crop: '',
    variety: '',
    quantityQuintal: '',
    pricePerQuintal: '',
    minPricePerQuintal: '',
    harvestDate: '',
    qualityReportId: ''
  });
  const [loading, setLoading] = useState(true);
  const [qualityReport, setQualityReport] = useState(null);
  const [showQR, setShowQR] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Load QRCode dynamically
    import('qrcode').then(module => {
      QRCode = module.default;
    }).catch(() => {
      console.warn('QRCode library not loaded');
    });
  }, []);

  useEffect(() => {
    if (location.state) {
      const report = {
        reportId: location.state.qualityReportId,
        grade: location.state.qualityGrade,
        score: location.state.qualityScore,
        commodity: location.state.commodity,
        variety: location.state.variety
      };
      setQualityReport(report);
      if (location.state.commodity) {
        setForm(prev => ({
          ...prev,
          crop: location.state.commodity,
          variety: location.state.variety || prev.variety,
          qualityReportId: location.state.qualityReportId || ''
        }));
        setShowForm(true);
      }
    }
  }, [location.state]);

  const load = async () => {
    if (!uid) { setLoading(false); return; }
    try {
      const result = await api.get('/api/lots/', {
        params: {
          farmer_id: uid,
        },
      });

      const lotsData = Array.isArray(result)
        ? result
        : result?.lots || result?.items || [];
      setLots(Array.isArray(lotsData) ? lotsData : []);
    } catch (e) {
      console.error('Error loading lots:', e);
      setLots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading) load();
  }, [uid, userLoading]);

  const addLot = async (event) => {
    event.preventDefault();
    if (!form.crop.trim() || !form.quantityQuintal || !form.pricePerQuintal) {
      alert('Please fill in Commodity, Quantity and Expected Price.');
      return;
    }
    const quantity = Number(form.quantityQuintal);
    const price = Number(form.pricePerQuintal);
    if (quantity <= 0) { alert('Quantity must be greater than 0.'); return; }
    if (price <= 0) { alert('Expected price must be greater than 0.'); return; }

    const lotData = {
      farmerId: uid,
      farmerName: displayName,
      farmId: form.farmId || null,
      crop: form.crop.trim(),
      variety: form.variety.trim(),
      quantityQuintal: quantity,
      pricePerQuintal: price,
      minPricePerQuintal: form.minPricePerQuintal ? Number(form.minPricePerQuintal) : null,
      harvestDate: form.harvestDate || null,
      status: 'active',
      qualityReportId: qualityReport?.reportId || null,
      qualityGrade: qualityReport?.grade || null,
      qualityScore: qualityReport?.score || null
    };

    try {
      await api.post('/api/lots/', lotData);
      setForm({ farmId: '', crop: '', variety: '', quantityQuintal: '', pricePerQuintal: '', minPricePerQuintal: '', harvestDate: '', qualityReportId: '' });
      setQualityReport(null);
      setShowForm(false);
      await load();
      alert('Lot created successfully.');
    } catch (error) {
      alert(error?.message || 'Unable to create lot.');
    }
  };

  const generateQR = async (lot) => {
    if (!QRCode) {
      try {
        const module = await import('qrcode');
        QRCode = module.default;
      } catch (e) {
        alert('QR Code library not available. Please install qrcode package.');
        return;
      }
    }
    
    const token = lot.qr_token || lot.id;
    const verifyUrl = window.location.origin + '/lot-verification/' + encodeURIComponent(token);
    try {
      const dataUrl = await QRCode.toDataURL(verifyUrl, { width: 256, margin: 2, color: { dark: '#1b4332', light: '#ffffff' } });
      setQrDataUrl(dataUrl);
    } catch (e) {
      setQrDataUrl('');
    }
    setShowQR(lot);
  };

  const requestPickup = async (lot) => {
    if (!uid) { alert('Please sign in.'); return; }
    try {
      await entities.LogisticsTrips.create({
        requestedBy: uid,
        requestedByName: displayName,
        cropType: lot.crop,
        quantityQuintal: lot.quantityQuintal || lot.quantity_quintal || 0,
        status: 'open'
      });
      alert('Pickup requested.');
    } catch (error) {
      alert(error?.message || 'Unable to request pickup.');
    }
  };

  if (showQR) {
    const token = showQR.qr_token || showQR.id;
    const verifyUrl = window.location.origin + '/lot-verification/' + encodeURIComponent(token);
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
          <h3 className="font-bold text-[#1b4332] text-center mb-4">Lot QR Code</h3>
          <div className="flex justify-center mb-4">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-lg border border-green-100" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center rounded-lg border border-green-100">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-[#2d6a4f]" />
              </div>
            )}
          </div>
          <p className="text-xs text-center text-muted-foreground break-all mb-3">{verifyUrl}</p>
          <p className="text-xs text-center text-muted-foreground mb-4">Buyers can scan this to verify the lot.</p>
          <div className="flex gap-2">
            {qrDataUrl && (
              <a href={qrDataUrl} download={'qr-' + showQR.id + '.png'} className="flex-1">
                <span className="block w-full py-2 px-4 text-center bg-[#2d6a4f] text-white rounded-lg font-medium hover:bg-[#1b4332] transition-colors">Download</span>
              </a>
            )}
            <button onClick={() => { setShowQR(null); setQrDataUrl(''); }} className="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1b4332]">My Lots</h1>
          <p className="text-sm text-gray-500">Manage your produce listings</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-[#2d6a4f] text-white rounded-lg font-medium hover:bg-[#1b4332] transition-colors">
          {showForm ? 'Cancel' : 'Create New Lot'}
        </button>
      </div>

      {qualityReport && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          <strong>Quality Report:</strong> {qualityReport.reportId || 'Verified report'} — Grade {qualityReport.grade || 'N/A'} — Score {qualityReport.score ?? 'N/A'}/100
        </div>
      )}

      {showForm && (
        <form onSubmit={addLot} className="bg-white rounded-2xl p-6 shadow border border-gray-100 space-y-4">
          <h3 className="font-bold text-[#1b4332] text-lg">Create New Lot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
              <select value={form.farmId} onChange={(e) => setForm({ ...form, farmId: e.target.value })} className="w-full h-10 rounded-lg border border-gray-300 px-3">
                <option value="">Select farm</option>
                {farms.map((farm) => (<option key={farm.id} value={farm.id}>{farm.plot_name || farm.name || 'Farm'}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quality Report</label>
              <select value={form.qualityReportId} onChange={(e) => setForm({ ...form, qualityReportId: e.target.value })} className="w-full h-10 rounded-lg border border-gray-300 px-3">
                <option value="">None</option>
                {qualityReport && (<option value={qualityReport.reportId}>{qualityReport.reportId || 'Verified Report'} — Grade {qualityReport.grade || 'N/A'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commodity *</label>
              <input type="text" placeholder="e.g., Onion" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} className="w-full h-10 rounded-lg border border-gray-300 px-3" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
              <input type="text" placeholder="e.g., Red" value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} className="w-full h-10 rounded-lg border border-gray-300 px-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (quintal) *</label>
              <input type="number" min="0.01" step="0.01" placeholder="50" value={form.quantityQuintal} onChange={(e) => setForm({ ...form, quantityQuintal: e.target.value })} className="w-full h-10 rounded-lg border border-gray-300 px-3" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
              <input type="date" value={form.harvestDate} onChange={(e) => setForm({ ...form, harvestDate: e.target.value })} className="w-full h-10 rounded-lg border border-gray-300 px-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Price (₹/quintal) *</label>
              <input type="number" min="0.01" step="0.01" placeholder="2000" value={form.pricePerQuintal} onChange={(e) => setForm({ ...form, pricePerQuintal: e.target.value })} className="w-full h-10 rounded-lg border border-gray-300 px-3" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Acceptable Price (₹/quintal)</label>
              <input type="number" min="0" step="0.01" placeholder="1800" value={form.minPricePerQuintal} onChange={(e) => setForm({ ...form, minPricePerQuintal: e.target.value })} className="w-full h-10 rounded-lg border border-gray-300 px-3" />
            </div>
          </div>
          <button type="submit" className="w-full h-12 bg-[#2d6a4f] text-white rounded-lg font-medium hover:bg-[#1b4332] transition-colors">
            {qualityReport ? 'Create Lot with Quality Report' : 'Create Lot'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
        ) : lots.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-green-100">
            <p className="text-muted-foreground">No lots yet.</p>
            <p className="text-xs mt-1">Create your first lot to start selling in the marketplace.</p>
          </div>
        ) : (
          lots.map((lot) => {
            const quantity = lot.quantityQuintal || lot.quantity_quintal || 0;
            const price = lot.pricePerQuintal || lot.price_per_quintal || 0;
            const lotId = lot.id || lot.lot_id || 'N/A';
            return (
              <div key={lot.id || lot.lot_id} className="bg-white rounded-xl p-5 border border-green-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-[#1b4332] text-lg">{lot.crop}</h3>
                    {lot.variety && <p className="text-xs text-muted-foreground">{lot.variety}</p>}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-50 text-[#2d6a4f]">{lot.status || 'active'}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Lot ID</span>
                    <span className="font-mono text-xs break-all text-right">{lotId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span>{quantity} quintal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected</span>
                    <span className="font-medium">₹{price}/quintal</span>
                  </div>
                  {lot.qualityGrade && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quality</span>
                      <span className="font-medium text-[#2d6a4f]">Grade {lot.qualityGrade}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <button onClick={() => generateQR(lot)} className="flex-1 py-2 px-3 border border-[#2d6a4f] text-[#2d6a4f] rounded-lg font-medium hover:bg-green-50 transition-colors text-sm">View QR Code</button>
                  {lot.status === 'active' && (
                    <button onClick={() => requestPickup(lot)} className="flex-1 py-2 px-3 bg-[#2d6a4f] text-white rounded-lg font-medium hover:bg-[#1b4332] transition-colors text-sm">Request Pickup</button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
