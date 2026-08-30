import { useState, useEffect } from 'react'
import { FileDown, Loader2, Download } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import PageHeader from '../components/PageHeader';
import jsPDF from 'jspdf';

export default function ExportReports() {
  const { t } = useLang();
  const [sections, setSections] = useState({ ledger: true, yield: true, soil: true });
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState({ ledger: [], harvest: [], soil: [] });

  useEffect(() => {
    Promise.all([
      appClient.entities.FarmLedgerEntry.list('-entry_date', 200).catch(() => []),
      appClient.entities.HarvestRecord.list('-harvest_date', 100).catch(() => []),
      appClient.entities.SoilRecord.list('-test_date', 100).catch(() => []),
    ]).then(([l, h, s]) => setData({ ledger: l, harvest: h, soil: s }));
  }, []);

  const toggle = (k) => setSections((s) => ({ ...s, [k]: !s[k] }));

  const generate = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let y = 20;
      doc.setFontSize(18); doc.setTextColor(22, 101, 52);
      doc.text('AgriSaathi - Farm Report', 105, y, { align: 'center' });
      y += 8;
      doc.setFontSize(10); doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 105, y, { align: 'center' });
      y += 10;

      if (sections.ledger) {
        doc.setFontSize(14); doc.setTextColor(0);
        doc.text('Farm Ledger', 14, y); y += 7;
        doc.setFontSize(9);
        const exp = data.ledger.filter((e) => e.kind === 'expense');
        const rev = data.ledger.filter((e) => e.kind === 'revenue');
        const totExp = exp.reduce((s, e) => s + (e.amount || 0), 0);
        const totRev = rev.reduce((s, e) => s + (e.amount || 0), 0);
        doc.text(`Total Expense: Rs ${totExp.toLocaleString('en-IN')}`, 14, y); y += 5;
        doc.text(`Total Revenue: Rs ${totRev.toLocaleString('en-IN')}`, 14, y); y += 5;
        doc.text(`Net: Rs ${(totRev - totExp).toLocaleString('en-IN')}`, 14, y); y += 7;
        doc.text('Date        Type      Category       Amount', 14, y); y += 5;
        data.ledger.slice(0, 30).forEach((e) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(`${(e.entry_date || '').slice(0, 10).padEnd(11)}${(e.kind || '').padEnd(9)}${(e.category || '').padEnd(14)}Rs ${(e.amount || 0).toLocaleString('en-IN')}`, 14, y);
          y += 5;
        });
        y += 8;
      }

      if (sections.yield) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(14); doc.setTextColor(0);
        doc.text('Harvest Records', 14, y); y += 7;
        doc.setFontSize(9);
        data.harvest.forEach((h) => {
          if (y > 270) { doc.addPage(); y = 20; }
          const val = (h.quantity || 0) * (h.sale_price_per_unit || 0);
          doc.text(`${(h.harvest_date || '').slice(0, 10)}  ${h.crop_name || ''} - ${h.plot_name || ''}  ${(h.quantity || 0)} ${h.quantity_unit || ''}  Rs ${val.toLocaleString('en-IN')}`, 14, y);
          y += 5;
        });
        y += 8;
      }

      if (sections.soil) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(14); doc.setTextColor(0);
        doc.text('Soil Records', 14, y); y += 7;
        doc.setFontSize(9);
        data.soil.forEach((r) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(`${(r.test_date || '').slice(0, 10)}  ${r.plot_name || ''}  pH:${r.ph ?? '-'} N:${r.nitrogen ?? '-'} P:${r.phosphorus ?? '-'} K:${r.potassium ?? '-'}`, 14, y);
          y += 5;
        });
      }

      doc.save(`AgriSaathi-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch { alert('Could not generate report.'); }
    finally { setGenerating(false); }
  };

  return (
    <div>
      <PageHeader titleKey="exportReports" icon={FileDown} />
      <p className="text-xs text-text-secondary mb-3">{t('exportReportsIntro')}</p>

      <Card className="mb-4"><CardContent className="pt-4 space-y-3">
        <Label>{t('selectSections')}</Label>
        {[
          { k: 'ledger', label: `${t('farmLedger')} (${data.ledger.length})` },
          { k: 'yield', label: `${t('harvestRecords')} (${data.harvest.length})` },
          { k: 'soil', label: `${t('soilPassport')} (${data.soil.length})` },
        ].map((s) => (
          <div key={s.k} className="flex items-center gap-2">
            <Checkbox checked={sections[s.k]} onCheckedChange={() => toggle(s.k)} id={s.k} />
            <Label htmlFor={s.k} className="text-sm cursor-pointer">{s.label}</Label>
          </div>
        ))}
      </CardContent></Card>

      <Button onClick={generate} disabled={generating} className="w-full bg-green-600 hover:bg-green-700">
        {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
        {generating ? t('generating') : t('downloadPdf')}
      </Button>
    </div>
  );
}
