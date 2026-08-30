import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Trash2, MapPin, Loader2 } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';

export default function VoiceNotes() {
  const { t } = useLang();
  const [farms, setFarms] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [saving, setSaving] = useState(false);
  const recRef = useRef(null);

  const load = async () => {
    const [f, n] = await Promise.all([
      appClient.entities.Farm.list().catch(() => []),
      appClient.entities.VoiceNote.list('-created_date', 100).catch(() => []),
    ]);
    setFarms(f); setNotes(n);
  };
  useEffect(() => { load(); }, []);

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert(t('voiceUnsupported')); return; }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let final = '';
      let tmp = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else tmp += e.results[i][0].transcript;
      }
      if (final) setTranscript((p) => (p ? p + ' ' : '') + final);
      setInterim(tmp);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start();
    recRef.current = rec;
    setRecording(true);
    setTranscript('');
    setInterim('');
  };
  const stopRec = () => { recRef.current?.stop(); setRecording(false); };

  const save = async () => {
    if (!transcript.trim()) return;
    setSaving(true);
    try {
      const plot = farms.find((f) => f.plot_name === selectedPlot);
      await appClient.entities.VoiceNote.create({
        transcript: transcript.trim(),
        plot_name: selectedPlot || undefined,
        farm_id: plot?.id || undefined,
        title: transcript.trim().slice(0, 50),
      });
      setTranscript('');
      setInterim('');
      load();
    } catch { alert(t('saveFailed')); } finally { setSaving(false); }
  };
  const remove = async (id) => { await appClient.entities.VoiceNote.delete(id); load(); };

  return (
    <div>
      <PageHeader titleKey="voiceNotes" icon={Mic} />
      <p className="text-xs text-text-secondary mb-3">{t('voiceNotesIntro')}</p>

      <div className="mb-3">
        <Select value={selectedPlot} onValueChange={setSelectedPlot}>
          <SelectTrigger><SelectValue placeholder={t('tagToPlot')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>{t('general')}</SelectItem>
            {farms.map((f) => <SelectItem key={f.id} value={f.plot_name}>{f.plot_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col items-center gap-3 mb-4">
        <button
          onClick={recording ? stopRec : startRec}
          className={`flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition-all ${recording ? 'bg-red-500/100 animate-pulse scale-105' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {recording ? <Square className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
        </button>
        <span className="text-sm font-medium text-text-secondary">{recording ? t('listening') : t('tapToSpeak')}</span>
      </div>

      {(transcript || interim) && (
        <Card className="mb-4 bg-mint/10 border-green-200"><CardContent className="pt-4">
          <p className="text-sm text-text-primary">{transcript} <span className="text-text-muted">{interim}</span></p>
          <Button onClick={save} disabled={saving || !transcript.trim()} className="mt-3 w-full bg-green-600 hover:bg-green-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {t('saveNote')}
          </Button>
        </CardContent></Card>
      )}

      <h3 className="text-sm font-semibold text-text-secondary mb-2">{t('savedNotes')}</h3>
      {notes.length === 0 ? (
        <p className="text-xs text-text-muted">{t('noNotes')}</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <Card key={n.id}><CardContent className="pt-3 pb-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-text-primary flex-1">{n.transcript}</p>
                <Button size="icon" variant="ghost" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                {n.plot_name && <Badge className="bg-cyan-500/10 text-blue-600"><MapPin className="h-3 w-3 mr-0.5" />{n.plot_name}</Badge>}
                <span className="text-[10px] text-text-muted">{new Date(n.created_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
