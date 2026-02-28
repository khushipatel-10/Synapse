"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { PageShell } from "@/components/layout/PageShell";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessageThreadPage() {
    const params = useParams();
    const threadId = params?.threadId as string;
    const { getToken, isLoaded } = useAuth();
    const { user } = useUser();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchMessages() {
            if (!isLoaded || !threadId) return;
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/messages/thread/${threadId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setMessages(data.data);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchMessages();
    }, [isLoaded, getToken, threadId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !threadId) return;

        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/messages/thread/${threadId}/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newMessage })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setMessages(prev => [...prev, data.data]);
                    setNewMessage("");
                }
            }
        } catch (error) {
            console.error(error);
        }
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
            <div className="flex flex-col h-[75vh] bg-white border border-black/5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-black/5 bg-warm-cream/30 flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-teal/20 rounded-full flex items-center justify-center font-bold text-charcoal shadow-sm border border-brand-teal/30">
                        {messages[0]?.senderName?.charAt(0) || 'P'}
                    </div>
                    <div>
                        <h2 className="font-semibold text-charcoal text-lg">Study Thread</h2>
                        <p className="text-xs text-muted-gray">End-to-End Chat</p>
                    </div>
                </div>

                {/* Messages Area */}
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
                                        : 'bg-white border border-black/5 text-charcoal rounded-bl-none'
                                    }`}>
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

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-black/5 flex gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 bg-warm-cream/50 border border-black/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all text-charcoal"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button type="submit" disabled={!newMessage.trim()} className="bg-brand-teal hover:bg-brand-teal/90 text-charcoal rounded-full w-12 h-12 p-0 flex items-center justify-center font-semibold shadow-sm shrink-0 border-0">
                        <Send className="w-5 h-5 ml-1" />
                    </Button>
                </form>
            </div>
        </PageShell>
    );
}
