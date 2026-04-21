"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Users, Loader2, CheckCircle2, Clock, Search, UserPlus, TrendingUp, TrendingDown, X, Trash2, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { useNotifications } from "@/context/NotificationsContext";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface PeerProfile {
    id: string; name: string; username?: string; major?: string;
    strongConcepts: string[]; weakConcepts: string[];
    preferences: { pace: string; mode: string; learningStyle: string } | null;
}

function ProfileCardModal({ peerId, onClose, onAccept, onDecline }: {
    peerId: string; onClose: () => void; onAccept?: () => void; onDecline?: () => void;
}) {
    const { getToken } = useAuth();
    const [profile, setProfile] = useState<PeerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${API}/users/${peerId}/profile`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (data.success) setProfile(data.data);
            } catch {} finally { setLoading(false); }
        })();
    }, [peerId, getToken]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(17,45,78,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden"
                style={{ boxShadow: '0 24px 60px rgba(17,45,78,0.2)', border: '1px solid #DBE2EF' }}
                onClick={e => e.stopPropagation()}>
                <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #3F72AF, #112D4E)' }} />
                <div className="p-6">
                    <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl text-white"
                                style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                {profile?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <h2 className="text-lg font-black" style={{ color: '#112D4E' }}>{profile?.name || '...'}</h2>
                                {profile?.username && <p className="text-xs" style={{ color: '#6b84a0' }}>@{profile.username}</p>}
                                {profile?.major && <p className="text-sm" style={{ color: '#2b4a70' }}>{profile.major}</p>}
                            </div>
                        </div>
                        <button onClick={onClose} className="transition-opacity hover:opacity-60" style={{ color: '#6b84a0' }}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#3F72AF' }} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {( profile?.strongConcepts?.length ?? 0) > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
                                        style={{ color: '#4a8c42' }}>
                                        <TrendingUp className="w-3.5 h-3.5" /> Strong in
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.strongConcepts.map((c, i) => (
                                            <span key={i} className="text-xs px-2 py-1 rounded-md font-semibold"
                                                style={{ background: '#ECFAE5', color: '#2d5a27', border: '1px solid #CAE8BD' }}>{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {profile?.weakConcepts?.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
                                        style={{ color: '#D4974A' }}>
                                        <TrendingDown className="w-3.5 h-3.5" /> Developing
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.weakConcepts.map((c, i) => (
                                            <span key={i} className="text-xs px-2 py-1 rounded-md font-semibold"
                                                style={{ background: '#FDF3C4', color: '#9B6B30', border: '1px solid #ECC880' }}>{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {profile?.preferences && (
                                <div className="pt-3 border-t" style={{ borderColor: '#DBE2EF' }}>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#6b84a0' }}>Study Style</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {[profile.preferences.mode, profile.preferences.pace, profile.preferences.learningStyle]
                                            .filter(Boolean).map((v, i) => (
                                            <span key={i} className="text-xs px-2 py-1 rounded-md font-semibold capitalize"
                                                style={{ background: '#F9F7F7', color: '#2b4a70', border: '1px solid #DBE2EF' }}>{v}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {!profile?.strongConcepts?.length && !profile?.weakConcepts?.length && !profile?.preferences && (
                                <p className="text-sm text-center py-4" style={{ color: '#6b84a0' }}>
                                    This user hasn&apos;t completed an assessment yet.
                                </p>
                            )}
                        </div>
                    )}

                    {(onAccept || onDecline) && (
                        <div className="flex gap-3 mt-6 pt-4 border-t" style={{ borderColor: '#DBE2EF' }}>
                            {onAccept && (
                                <Button onClick={onAccept} className="flex-1 font-black text-white border-0 rounded-xl"
                                    style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                    Accept
                                </Button>
                            )}
                            {onDecline && (
                                <Button onClick={onDecline} variant="outline" className="flex-1 rounded-xl"
                                    style={{ borderColor: '#DBE2EF', color: '#112D4E' }}>
                                    Decline
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PeerCard({ name, initial, sub, children, footer }: { name: string; initial: string; sub?: string; children?: React.ReactNode; footer: React.ReactNode }) {
    return (
        <div className="card-hover bg-white rounded-2xl border overflow-hidden flex flex-col"
            style={{ borderColor: '#DBE2EF', boxShadow: '0 2px 12px rgba(17,45,78,0.06)' }}>
            <div className="p-5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                    {initial}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black truncate" style={{ color: '#112D4E' }}>{name}</p>
                    {sub && <p className="text-xs mt-0.5" style={{ color: '#6b84a0' }}>{sub}</p>}
                </div>
                {children}
            </div>
            <div className="px-5 pb-5 mt-auto border-t pt-4" style={{ borderColor: '#DBE2EF' }}>
                {footer}
            </div>
        </div>
    );
}

export default function ConnectionsPage() {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    const { refresh: refreshNotifications } = useNotifications();
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [profileModal, setProfileModal] = useState<{ peerId: string; connectionId: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isLoaded) return;
        (async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${API}/connections`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) { const d = await res.json(); if (d.success) setConnections(d.data); }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [isLoaded, getToken]);

    const handleAction = async (connectionId: string, action: 'accept' | 'reject') => {
        try {
            const token = await getToken();
            const res = await fetch(`${API}/connections/${connectionId}/${action}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) { setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: action === 'accept' ? 'accepted' : 'rejected' } : c)); refreshNotifications(); }
        } catch (e) { console.error(e); }
        setProfileModal(null);
    };

    const handleRemove = async (connectionId: string) => {
        setRemovingId(connectionId);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/connections/${connectionId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setConnections(prev => prev.filter(c => c.id !== connectionId));
        } catch (e) { console.error(e); }
        finally { setRemovingId(null); }
    };

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (q.trim().length < 2) { setSearchResults([]); return; }
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const token = await getToken();
                const res = await fetch(`${API}/users/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
                const d = await res.json();
                if (d.success) setSearchResults(d.data);
            } catch (e) { console.error(e); }
            finally { setSearching(false); }
        }, 400);
    };

    const handleSearchConnect = async (userId: string) => {
        setConnectingId(userId);
        try {
            const token = await getToken();
            await fetch(`${API}/connections/request`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: userId }) });
            setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, connection: { status: 'pending', isRequester: true } } : u));
        } catch (e) { console.error(e); }
        finally { setConnectingId(null); }
    };

    const handleMessage = async (peerId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API}/messages/thread`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: peerId }) });
            if (res.ok) { const d = await res.json(); if (d.success) router.push(`/app/messages/${d.thread.id}`); }
        } catch (e) { console.error(e); }
    };

    if (loading) return (
        <PageShell>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
                {[0,1,2].map(i => <div key={i} className="h-40 rounded-2xl skeleton" />)}
            </div>
        </PageShell>
    );

    const pendingIncoming  = connections.filter(c => c.status === 'pending' && !c.isRequester);
    const pendingOutgoing  = connections.filter(c => c.status === 'pending' &&  c.isRequester);
    const activeConnections = connections.filter(c => c.status === 'accepted');
    const modalConn = profileModal ? connections.find(c => c.id === profileModal.connectionId) : null;

    return (
        <PageShell>
            {profileModal && (
                <ProfileCardModal
                    peerId={profileModal.peerId}
                    connectionId={profileModal.connectionId}
                    onClose={() => setProfileModal(null)}
                    onAccept={modalConn?.status === 'pending' && !modalConn?.isRequester ? () => handleAction(profileModal.connectionId, 'accept') : undefined}
                    onDecline={modalConn?.status === 'pending' && !modalConn?.isRequester ? () => handleAction(profileModal.connectionId, 'reject') : undefined}
                />
            )}

            {/* Header */}
            <div className="pb-6 border-b" style={{ borderColor: '#DBE2EF' }}>
                <h1 className="text-4xl font-black tracking-tight" style={{ color: '#112D4E' }}>Peer Connections</h1>
                <p className="text-lg mt-1.5" style={{ color: '#2b4a70' }}>Manage your study partners and requests.</p>
            </div>

            {/* Search */}
            <section>
                <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: '#112D4E' }}>
                    <Search className="w-5 h-5" style={{ color: '#3F72AF' }} /> Find by Username
                </h2>
                <div className="relative max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#6b84a0' }}>@</span>
                    <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)}
                        placeholder="Search username or name..."
                        className="w-full pl-8 pr-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all"
                        style={{ background: 'white', border: '1px solid #DBE2EF', color: '#112D4E' }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#3F72AF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.12)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#DBE2EF'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: '#6b84a0' }} />}
                </div>
                {searchResults.length > 0 && (
                    <div className="mt-3 space-y-2 max-w-md">
                        {searchResults.map(u => (
                            <div key={u.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border"
                                style={{ borderColor: '#DBE2EF' }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                    {u.name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm truncate" style={{ color: '#112D4E' }}>{u.name}</p>
                                    {u.username && <p className="text-xs" style={{ color: '#6b84a0' }}>@{u.username}</p>}
                                </div>
                                {!u.connection ? (
                                    <Button size="sm" onClick={() => handleSearchConnect(u.id)} disabled={connectingId === u.id}
                                        className="rounded-xl text-xs px-3 font-black text-white border-0"
                                        style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                        {connectingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserPlus className="w-3 h-3 mr-1" />Connect</>}
                                    </Button>
                                ) : u.connection.status === 'pending' ? (
                                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: '#FDF3C4', color: '#9B6B30' }}>
                                        {u.connection.isRequester ? 'Sent' : 'Incoming'}
                                    </span>
                                ) : (
                                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: '#ECFAE5', color: '#2d5a27' }}>
                                        <CheckCircle2 className="w-3 h-3" /> Connected
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <p className="mt-3 text-sm max-w-md" style={{ color: '#6b84a0' }}>No users found for &quot;{searchQuery}&quot;.</p>
                )}
            </section>

            {/* Active */}
            <section>
                <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: '#112D4E' }}>
                    <Users className="w-5 h-5" style={{ color: '#3F72AF' }} /> Active Peers
                    {activeConnections.length > 0 && (
                        <span className="text-sm font-semibold px-2 py-0.5 rounded-lg" style={{ background: '#DBE2EF', color: '#3F72AF' }}>
                            {activeConnections.length}
                        </span>
                    )}
                </h2>
                {activeConnections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {activeConnections.map(conn => (
                            <PeerCard key={conn.id} name={conn.peer.name} initial={conn.peer.name?.charAt(0) || 'U'} sub={conn.peer.major || 'Student'}
                                footer={
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleMessage(conn.peer.id)}
                                            className="flex-1 rounded-xl h-9 font-semibold text-sm border"
                                            style={{ borderColor: '#DBE2EF', background: 'white', color: '#112D4E' }}>
                                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Message
                                        </Button>
                                        <Button onClick={() => handleRemove(conn.id)} disabled={removingId === conn.id}
                                            variant="outline" className="px-3 rounded-xl h-9"
                                            style={{ borderColor: '#fecdd3', color: '#be123c' }}>
                                            {removingId === conn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                }>
                                <span className="text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                                    style={{ background: '#ECFAE5', color: '#2d5a27' }}>
                                    <CheckCircle2 className="w-3 h-3" /> Connected
                                </span>
                            </PeerCard>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10 bg-white rounded-2xl border" style={{ borderColor: '#DBE2EF' }}>
                        <p style={{ color: '#6b84a0' }}>No active connections yet.</p>
                    </div>
                )}
            </section>

            {/* Incoming */}
            <section>
                <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: '#112D4E' }}>
                    <Clock className="w-5 h-5" style={{ color: '#D4974A' }} /> Incoming Requests
                    {pendingIncoming.length > 0 && (
                        <span className="text-sm font-black px-2 py-0.5 rounded-full text-white" style={{ background: '#be123c' }}>
                            {pendingIncoming.length}
                        </span>
                    )}
                </h2>
                {pendingIncoming.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {pendingIncoming.map(conn => (
                            <div key={conn.id} className="card-hover bg-white rounded-2xl border overflow-hidden"
                                style={{ borderColor: '#ECC880', boxShadow: '0 2px 12px rgba(197,137,64,0.08)' }}>
                                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #D4974A, #ECC880)' }} />
                                <div className="p-5 flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg text-white"
                                        style={{ background: 'linear-gradient(135deg, #D4974A, #9B6B30)' }}>
                                        {conn.peer.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-black" style={{ color: '#112D4E' }}>{conn.peer.name}</p>
                                        <p className="text-xs" style={{ color: '#6b84a0' }}>Wants to study with you</p>
                                    </div>
                                </div>
                                <div className="px-5 pb-5 flex gap-2 border-t pt-4" style={{ borderColor: '#FDF3C4' }}>
                                    <Button onClick={() => setProfileModal({ peerId: conn.peer.id, connectionId: conn.id })}
                                        variant="outline" className="flex-1 rounded-xl h-9 text-sm font-semibold"
                                        style={{ borderColor: '#DBE2EF', color: '#112D4E' }}>
                                        View Profile
                                    </Button>
                                    <Button onClick={() => handleAction(conn.id, 'accept')}
                                        className="flex-1 rounded-xl h-9 text-sm font-black text-white border-0"
                                        style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                        Accept
                                    </Button>
                                    <Button onClick={() => handleAction(conn.id, 'reject')} variant="outline"
                                        className="px-3 rounded-xl h-9" style={{ borderColor: '#fecdd3', color: '#be123c' }}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10 bg-white rounded-2xl border" style={{ borderColor: '#DBE2EF' }}>
                        <p style={{ color: '#6b84a0' }}>No pending incoming requests.</p>
                    </div>
                )}
            </section>

            {/* Outgoing */}
            {pendingOutgoing.length > 0 && (
                <section>
                    <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: '#6b84a0' }}>
                        <Clock className="w-5 h-5" /> Sent Requests
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {pendingOutgoing.map(conn => (
                            <div key={conn.id} className="bg-white rounded-2xl border p-5 opacity-70"
                                style={{ borderColor: '#DBE2EF' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                                        style={{ background: '#DBE2EF', color: '#6b84a0' }}>
                                        {conn.peer.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm" style={{ color: '#112D4E' }}>{conn.peer.name}</p>
                                        <p className="text-xs" style={{ color: '#6b84a0' }}>Awaiting response</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </PageShell>
    );
}

