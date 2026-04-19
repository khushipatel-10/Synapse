"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { PageShell } from "@/components/layout/PageShell";
import { Loader2, Send, CalendarPlus, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function MessageThreadPage() {
    const params = useParams();
    const threadId = params?.threadId as string;
    const { getToken, isLoaded } = useAuth();

    const [messages, setMessages] = useState<any[]>([]);
    const [peer, setPeer] = useState<{ id: string; name: string; username?: string } | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [showScheduler, setShowScheduler] = useState(false);
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionDate, setSessionDate] = useState('');
    const [sessionTime, setSessionTime] = useState('');
    const [scheduling, setScheduling] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoaded || !threadId) return;
        const load = async () => {
            try {
                const token = await getToken();
                const headers = { Authorization: `Bearer ${token}` };

                const [msgRes, infoRes, sessRes] = await Promise.all([
                    fetch(`${API}/messages/thread/${threadId}`, { headers }),
                    fetch(`${API}/messages/thread/${threadId}/info`, { headers }),
                    fetch(`${API}/messages/thread/${threadId}/sessions`, { headers })
                ]);

                const [msgData, infoData, sessData] = await Promise.all([
                    msgRes.json(), infoRes.json(), sessRes.json()
                ]);

                if (msgData.success) setMessages(msgData.data);
                if (infoData.success) setPeer(infoData.data.peer);
                if (sessData.success) setSessions(sessData.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isLoaded, getToken, threadId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !threadId) return;
        try {
            const token = await getToken();
            const res = await fetch(`${API}/messages/thread/${threadId}/send`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setMessages(prev => [...prev, data.data]);
                    setNewMessage("");
                }
            }
        } catch (e) { console.error(e); }
    };

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionTitle || !sessionDate || !sessionTime) return;
        setScheduling(true);
        try {
            const token = await getToken();
            const scheduledAt = new Date(`${sessionDate}T${sessionTime}`).toISOString();
            const res = await fetch(`${API}/messages/thread/${threadId}/sessions`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: sessionTitle, scheduledAt })
            });
            const data = await res.json();
            if (data.success) {
                setSessions(prev => [...prev, data.data]);
                setShowScheduler(false);
                setSessionTitle('');
                setSessionDate('');
                setSessionTime('');
            }
        } catch (e) { console.error(e); }
        finally { setScheduling(false); }
    };

    if (loading) {
        return (
            <PageShell showBlobs={false}>
                <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-charcoal" /></div>
            </PageShell>
        );
    }

    return (
        <PageShell showBlobs={false}>
            <div className="flex flex-col lg:flex-row gap-6 h-[80vh]">

                {/* Chat column */}
                <div className="flex-1 flex flex-col bg-white border border-black/5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-black/5 bg-warm-cream/30 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-teal/20 rounded-full flex items-center justify-center font-bold text-brand-teal border border-brand-teal/20">
                                {peer?.name?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <h2 className="font-semibold text-charcoal text-base leading-tight">
                                    {peer?.name || 'Study Peer'}
                                </h2>
                                {peer?.username && (
                                    <p className="text-xs text-muted-gray">@{peer.username}</p>
                                )}
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowScheduler(s => !s)}
                            className="border-brand-teal/30 text-brand-teal hover:bg-brand-teal/10 rounded-xl text-xs gap-1.5">
                            <CalendarPlus className="w-3.5 h-3.5" /> Schedule Session
                        </Button>
                    </div>

                    {/* Schedule session form */}
                    {showScheduler && (
                        <form onSubmit={handleSchedule} className="p-4 border-b border-black/5 bg-brand-teal/5 space-y-3">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-charcoal">New Study Session</p>
                                <button type="button" onClick={() => setShowScheduler(false)} className="text-muted-gray hover:text-charcoal">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <input
                                type="text" value={sessionTitle} onChange={e => setSessionTitle(e.target.value)}
                                placeholder="Session title (e.g. DP Review)"
                                className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl outline-none focus:border-brand-teal bg-white"
                                required
                            />
                            <div className="flex gap-2">
                                <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm border border-black/10 rounded-xl outline-none focus:border-brand-teal bg-white" required />
                                <input type="time" value={sessionTime} onChange={e => setSessionTime(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm border border-black/10 rounded-xl outline-none focus:border-brand-teal bg-white" required />
                            </div>
                            <Button type="submit" disabled={scheduling} size="sm"
                                className="bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl border-0 w-full text-sm">
                                {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Session'}
                            </Button>
                        </form>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-warm-cream/10">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-gray text-sm">
                                No messages yet. Say hello!
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${msg.isMine
                                        ? 'bg-charcoal text-white rounded-br-none'
                                        : 'bg-white border border-black/5 text-charcoal rounded-bl-none'}`}>
                                        <p className="text-[15px] leading-relaxed">{msg.content}</p>
                                        <span className={`text-[10px] block mt-1 ${msg.isMine ? 'text-white/60' : 'text-muted-gray'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-black/5 flex gap-3 items-center">
                        <input
                            type="text" placeholder="Type your message..."
                            className="flex-1 bg-warm-cream/50 border border-black/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all text-charcoal"
                            value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <Button type="submit" disabled={!newMessage.trim()}
                            className="bg-brand-teal hover:bg-brand-teal/90 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center border-0 shrink-0">
                            <Send className="w-5 h-5 ml-0.5" />
                        </Button>
                    </form>
                </div>

                {/* Sessions sidebar */}
                <div className="lg:w-72 bg-white border border-black/5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-4 overflow-y-auto">
                    <h3 className="font-semibold text-charcoal flex items-center gap-2 text-base">
                        <Calendar className="w-4 h-4 text-brand-teal" /> Study Sessions
                    </h3>
                    {sessions.length === 0 ? (
                        <p className="text-sm text-muted-gray">No sessions scheduled yet. Use the button above to schedule one with {peer?.name || 'your peer'}.</p>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((s: any) => (
                                <div key={s.id} className="p-3 bg-brand-teal/5 border border-brand-teal/20 rounded-xl">
                                    <p className="font-semibold text-charcoal text-sm">{s.title}</p>
                                    <p className="text-xs text-brand-teal mt-1">
                                        {new Date(s.scheduledAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                        {' · '}
                                        {new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {s.createdBy && (
                                        <p className="text-xs text-muted-gray mt-0.5">by {s.createdBy.name}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageShell>
    );
}
