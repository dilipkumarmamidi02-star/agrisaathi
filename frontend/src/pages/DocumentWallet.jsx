import { files } from '../api/appClient';
import { useState, useEffect } from 'react'
import { FolderArchive, Plus, Trash2, FileText, Upload, Loader2 } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Image } from '../components/ui/image';
import PageHeader from '../components/PageHeader';

const DOC_TYPES = [
  { value: 'land_deed', label: 'Land Deed', color: 'bg-amber-100 text-amber-400' },
  { value: 'soil_card', label: 'Soil Health Card', color: 'bg-mint/20 text-mint' },
  { value: 'identity', label: 'Identity (Aadhaar/PAN)', color: 'bg-blue-100 text-cyan-400' },
  { value: 'insurance', label: 'Insurance', color: 'bg-purple-100 text-purple-700' },
  { value: 'loan', label: 'Loan Document', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'other', label: 'Other', color: 'bg-surface-hover text-text-primary' },
];

const meta = (v) => DOC_TYPES.find((d) => d.value === v) || DOC_TYPES[5];

export default function DocumentWallet() {
  const { t } = useLang();
  const [docs, setDocs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', doc_type: 'land_deed', file_url: '', issued_date: '', expiry_date: '', notes: '' });

  const load = () => appClient.entities.DocumentWallet.list('-created_date').then(setDocs).catch(() => []);
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await files.upload({ file });
      setForm((f) => ({ ...f, file_url }));
    } catch { alert('Upload failed. Try again.'); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title || !form.doc_type) { alert('Title and type are required'); return; }
    await appClient.entities.DocumentWallet.create({
      title: form.title, doc_type: form.doc_type, file_url: form.file_url || undefined,
      issued_date: form.issued_date || undefined, expiry_date: form.expiry_date || undefined, notes: form.notes || undefined,
    });
    setForm({ title: '', doc_type: 'land_deed', file_url: '', issued_date: '', expiry_date: '', notes: '' });
    setShowAdd(false);
    load();
  };

  const remove = async (id) => { await appClient.entities.DocumentWallet.delete(id); load(); };

  return (
    <div>
      <PageHeader titleKey="documentWallet" icon={FolderArchive} />
      <p className="text-xs text-text-secondary mb-3">{t('documentWalletIntro')}</p>

      <div className="space-y-2 mb-4">
        {docs.length === 0 ? (
          <p className="text-sm text-text-muted">{t('noDocuments')}</p>
        ) : docs.map((d) => {
          const m = meta(d.doc_type);
          return (
            <Card key={d.id}><CardContent className="pt-3">
              <div className="flex items-start gap-3">
                {d.file_url ? <Image src={d.file_url} className="h-16 w-16 rounded-lg shrink-0" fittingType="fill" /> : <div className="h-16 w-16 rounded-lg bg-surface-hover flex items-center justify-center shrink-0"><FileText className="h-6 w-6 text-text-muted" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <button onClick={() => remove(d.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <Badge className={`${m.color} mb-1`}>{m.label}</Badge>
                  <p className="text-xs text-text-muted">{d.issued_date ? `Issued: ${d.issued_date}` : ''}{d.expiry_date ? ` · Expires: ${d.expiry_date}` : ''}</p>
                  {d.notes && <p className="text-xs text-text-secondary mt-1">{d.notes}</p>}
                </div>
              </div>
            </CardContent>
            </Card>
          );
        })}
      </div>

      {showAdd ? (
        <Card className="border-green-200"><CardContent className="pt-4 space-y-3">
          <Label>{t('addDocument')}</Label>
          <div><Label className="mb-1 block text-xs">{t('title')}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div>
            <Label className="mb-1 block text-xs">{t('docType')}</Label>
            <Select value={form.doc_type} onValueChange={(v) => setForm({ ...form, doc_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-1 text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1.5 rounded-lg">{uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}{t('uploadFile')}</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={upload} />
          </label>
          {form.file_url && <Image src={form.file_url} className="w-full h-32 rounded-lg" fittingType="fit" />}
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block text-xs">{t('issuedDate')}</Label><Input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} /></div>
            <div><Label className="mb-1 block text-xs">{t('expiryDate')}</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
          </div>
          <Textarea placeholder={t('notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button onClick={save} className="flex-1 bg-green-600 hover:bg-green-700">{t('save')}</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1">{t('cancel')}</Button>
          </div>
        </CardContent></Card>
      ) : (
        <Button onClick={() => setShowAdd(true)} variant="outline" className="w-full border-mint/40 text-mint"><Plus className="h-4 w-4 mr-1" />{t('addDocument')}</Button>
      )}
    </div>
  );
}
