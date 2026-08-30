import { useState, useEffect } from 'react'
import { MessageSquare, Plus, ArrowLeft, ThumbsUp, Send } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import PageHeader from '../components/PageHeader';

const CATEGORIES = ['Crops', 'Livestock', 'Soil', 'Weather', 'Market', 'Schemes', 'Equipment', 'Other'];

export default function CommunityForum() {
  const { t } = useLang();
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('list');
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', category: 'Crops' });
  const [reply, setReply] = useState('');
  const [user, setUser] = useState(null);

  const load = async () => {
    const p = await appClient.entities.ForumPost.list('-created_date', 100).catch(() => []);
    setPosts(p);
  };
  useEffect(() => {
    load();
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  const create = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    await appClient.entities.ForumPost.create({
      title: form.title.trim(),
      body: form.body.trim(),
      category: form.category,
      author_name: user?.full_name || user?.email || 'Anonymous',
      replies: [],
      upvotes: 0,
    });
    setForm({ title: '', body: '', category: 'Crops' });
    setView('list');
    load();
  };

  const addReply = async () => {
    if (!reply.trim() || !active) return;
    const newReplies = [...(active.replies || []), { author_name: user?.full_name || user?.email || 'Anonymous', body: reply.trim(), ts: new Date().toISOString() }];
    await appClient.entities.ForumPost.update(active.id, { replies: newReplies });
    setReply('');
    const updated = await appClient.entities.ForumPost.get(active.id);
    setActive(updated);
    load();
  };

  const upvote = async (post) => {
    await appClient.entities.ForumPost.update(post.id, { upvotes: (post.upvotes || 0) + 1 });
    load();
    if (active?.id === post.id) setActive({ ...post, upvotes: (post.upvotes || 0) + 1 });
  };

  if (view === 'detail' && active) {
    return (
      <div>
        <button onClick={() => { setView('list'); setActive(null); }} className="flex items-center gap-2 text-sm text-mint mb-3">
          <ArrowLeft className="h-4 w-4" /> {t('backToForum')}
        </button>
        <Card className="mb-4"><CardContent className="pt-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-bold text-base">{active.title}</h2>
            <Badge variant="secondary">{active.category}</Badge>
          </div>
          <p className="text-xs text-text-muted">{active.author_name} · {new Date(active.created_date).toLocaleDateString('en-IN')}</p>
          <p className="text-sm text-text-primary">{active.body}</p>
          <Button size="sm" variant="ghost" onClick={() => upvote(active)}><ThumbsUp className="h-3 w-3 mr-1" />{active.upvotes || 0}</Button>
        </CardContent></Card>

        <h3 className="text-sm font-semibold text-text-secondary mb-2">{t('replies')} ({(active.replies || []).length})</h3>
        <div className="space-y-2 mb-3">
          {(active.replies || []).map((r, i) => (
            <Card key={i}><CardContent className="pt-3">
              <p className="text-xs text-text-muted mb-0.5">{r.author_name} · {new Date(r.ts).toLocaleDateString('en-IN')}</p>
              <p className="text-sm text-text-primary">{r.body}</p>
            </CardContent></Card>
          ))}
          {(active.replies || []).length === 0 && <p className="text-xs text-text-muted">{t('noReplies')}</p>}
        </div>

        <div className="flex gap-2">
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('writeReply')} className="flex-1" rows={2} />
          <Button onClick={addReply} className="bg-green-600 hover:bg-green-700 self-end"><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  if (view === 'new') {
    return (
      <div>
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm text-mint mb-3">
          <ArrowLeft className="h-4 w-4" /> {t('backToForum')}
        </button>
        <Card><CardContent className="pt-4 space-y-3">
          <div><Label className="mb-1 block">{t('title')}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label className="mb-1 block">{t('category')}</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, category: c })} className={`px-2.5 py-1 rounded-full text-xs ${form.category === c ? 'bg-green-600 text-white' : 'bg-surface-hover text-text-secondary'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div><Label className="mb-1 block">{t('postBody')}</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} /></div>
          <Button onClick={create} className="w-full bg-green-600 hover:bg-green-700">{t('post')}</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader titleKey="communityForum" icon={MessageSquare} />
      <p className="text-xs text-text-secondary mb-3">{t('forumIntro')}</p>

      <Button onClick={() => setView('new')} className="w-full mb-3 bg-green-600 hover:bg-green-700">
        <Plus className="h-4 w-4" /> {t('newPost')}
      </Button>

      {posts.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-text-muted">{t('noPosts')}</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <Card key={p.id} className="cursor-pointer hover:border-mint/40" onClick={() => { setActive(p); setView('detail'); }}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight">{p.title}</h3>
                  <Badge variant="secondary">{p.category}</Badge>
                </div>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{p.body}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  <span>{p.author_name}</span>
                  <span className="flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" />{p.upvotes || 0}</span>
                  <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{(p.replies || []).length}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
