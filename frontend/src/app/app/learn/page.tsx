"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardTitle, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2, Send, Sparkles, CheckCircle2, Folder, FileText, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

type Message = { role: 'user' | 'assistant'; content: string };
type Session = { id: string; pdfName: string | null; status: string; messages: Message[] | null; scores: any[]; createdAt: string; transcript: string | null };

export default function LearnPage() {
    const { getToken, isLoaded } = useAuth();

    const [file, setFile] = useState<File | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<any>(null);
    const [pastSessions, setPastSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [sessionStatus, setSessionStatus] = useState<'active' | 'completed'>('active');
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoaded) return;
        fetchSessions();
    }, [isLoaded]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    async function fetchSessions() {
        try {
            const token = await getToken();
            const res = await fetch(`${API}/learn/sessions`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setPastSessions(data.data);
        } catch (e) { console.error(e); }
    }

    async function handleSelectSession(session: Session) {
        setSessionId(null);
        setEvaluationResult(null);
        setError(null);

        if (session.status === 'active') {
            // Resume active session — load its messages and re-enter chat
            try {
                const token = await getToken();
                const res = await fetch(`${API}/learn/${session.id}`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (data.success) {
                    const loaded: Session = data.data;
                    const msgs = Array.isArray(loaded.messages) ? loaded.messages : [];
                    if (msgs.length === 0) {
                        // Fresh session with no messages yet — show welcome
                        setMessages([{ role: 'assistant', content: "I've reviewed your document! What concepts would you like to focus on, or shall I quiz you on the core ideas?" }]);
                    } else {
                        setMessages(msgs);
                    }
                    setSessionId(loaded.id);
                    setSessionStatus('active');
                    setSelectedSession(null);
                }
            } catch (e) { console.error(e); }
        } else {
            // Completed session — show read-only transcript
            setSelectedSession(session);
        }
    }

    async function handleUpload() {
        if (!file || !isLoaded) return;
        setIsUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const token = await getToken();
            const res = await fetch(`${API}/learn/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSessionId(data.data.sessionId);
                setSessionStatus('active');
                setMessages([{
                    role: 'assistant',
                    content: "I've reviewed your document! What concepts would you like to focus on, or shall I start by quizzing you on the core ideas?"
                }]);
                await fetchSessions();
            } else {
                setError("Failed to upload: " + data.message);
            }
        } catch (e) {
            setError("Upload error. Please try again.");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleSendMessage() {
        if (!input.trim() || !sessionId || !isLoaded) return;
        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            const token = await getToken();
            const res = await fetch(`${API}/learn/chat`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message: userMsg })
            });

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";

            setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                for (const line of chunk.split('\n')) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const parsed = JSON.parse(line.slice(6));
                            if (parsed.text) {
                                assistantContent += parsed.text;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                                    return updated;
                                });
                            }
                            if (parsed.error) setError(parsed.error);
                        } catch (_) { }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            setError("Failed to get response. Please try again.");
        } finally {
            setIsTyping(false);
        }
    }

    async function handleFinishSession() {
        if (!sessionId || !isLoaded) return;
        setIsEvaluating(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/learn/${sessionId}/evaluate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setEvaluationResult(data.data);
                setSessionStatus('completed');
                await fetchSessions();
            } else {
                setError(data.message || "Failed to evaluate session.");
            }
        } catch (e) {
            setError("Evaluation error. Please try again.");
        } finally {
            setIsEvaluating(false);
        }
    }

    function startNewSession() {
        setSessionId(null);
        setEvaluationResult(null);
        setSelectedSession(null);
        setMessages([]);
        setFile(null);
        setError(null);
        setSessionStatus('active');
    }

    // --- Evaluation Result Screen ---
    if (evaluationResult) {
        return (
            <PageShell showBlobs={true}>
                <div className="max-w-3xl mx-auto py-12">
                    <Card className="border-0 shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
                        <div className="h-2 w-full bg-gradient-to-r from-brand-teal to-brand-lavender" />
                        <CardHeader className="text-center pt-10 pb-4">
                            <div className="mx-auto w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-8 h-8 text-brand-teal" />
                            </div>
                            <h2 className="text-3xl font-semibold text-charcoal tracking-tight">Session Complete</h2>
                            <p className="text-muted-dark mt-2">Your learning profile has been updated.</p>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                {[
                                    { label: 'Comprehension', value: evaluationResult.comprehensionScore },
                                    { label: 'Implementation', value: evaluationResult.implementationScore },
                                    { label: 'Integration', value: evaluationResult.integrationScore }
                                ].map(({ label, value }) => (
                                    <div key={label} className="p-4 bg-black/5 rounded-2xl">
                                        <div className="text-3xl font-bold text-charcoal">{value}%</div>
                                        <div className="text-xs font-semibold text-muted-gray uppercase mt-1">{label}</div>
                                    </div>
                                ))}
                            </div>

                            {evaluationResult.hintDependencyScore !== undefined && (
                                <div className="p-4 bg-brand-amber/5 border border-brand-amber/20 rounded-2xl text-center">
                                    <div className="text-sm font-semibold text-brand-amber-dark">Hint Dependency: {evaluationResult.hintDependencyScore}%</div>
                                    <div className="text-xs text-muted-gray mt-1">Lower is better — shows independent problem-solving</div>
                                </div>
                            )}

                            {evaluationResult.conceptGaps?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-muted-gray uppercase tracking-wider mb-3">Knowledge Gaps to Work On</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {evaluationResult.conceptGaps.map((gap: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 bg-brand-amber/10 text-brand-amber-dark border border-brand-amber/20 rounded-xl text-sm font-medium">{gap}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {evaluationResult.coachFeedback && (
                                <div className="p-4 bg-brand-teal/5 border border-brand-teal/20 rounded-2xl">
                                    <p className="text-sm text-brand-teal font-medium italic">"{evaluationResult.coachFeedback}"</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-black/5 p-6 flex justify-center">
                            <Button onClick={startNewSession} className="bg-charcoal text-white rounded-xl hover:-translate-y-0.5 transition-transform px-8">
                                Start Another Session
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell showBlobs={!sessionId && !selectedSession}>
            <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] max-w-6xl mx-auto gap-6">

                {/* Sidebar */}
                <div className="w-full md:w-64 flex flex-col gap-4">
                    <Button onClick={startNewSession} className="bg-brand-teal hover:bg-brand-teal/90 text-white shadow-sm w-full font-medium h-12 rounded-xl border-none">
                        + New Study Session
                    </Button>
                    <div className="flex-1 overflow-y-auto bg-white border border-black/5 rounded-2xl shadow-sm p-3">
                        <div className="flex items-center gap-2 mb-3 px-2">
                            <Folder className="w-4 h-4 text-brand-lavender" />
                            <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider">My Sessions</h3>
                        </div>
                        {pastSessions.length === 0 ? (
                            <p className="text-sm text-muted-dark px-2">No sessions yet.</p>
                        ) : (
                            <div className="space-y-1 ml-2 border-l-2 border-black/5 pl-2 pb-2">
                                {pastSessions.map((s) => {
                                    const isActive = s.id === sessionId || selectedSession?.id === s.id;
                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => handleSelectSession(s)}
                                            className={`p-2 rounded-xl cursor-pointer transition-colors text-sm flex items-start gap-2 ${isActive ? 'bg-brand-lavender/10 border-brand-lavender/20 border font-medium text-brand-lavender-dark' : 'hover:bg-black/5 text-charcoal border border-transparent'}`}
                                        >
                                            <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-brand-lavender' : 'text-muted-gray'}`} />
                                            <div className="min-w-0">
                                                <div className="line-clamp-1">{s.pdfName || 'Untitled Session'}</div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-brand-teal' : 'bg-muted-gray'}`} />
                                                    <span className="text-[10px] text-muted-gray">{s.status === 'active' ? 'In Progress' : 'Completed'} · {new Date(s.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Area */}
                <div className="flex-1 flex flex-col h-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-semibold text-charcoal tracking-tight">AI Learning Coach</h1>
                        <p className="text-muted-dark mt-2">Upload PDF material to begin a Socratic coaching session.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Completed session view */}
                    {selectedSession ? (
                        <Card className="flex-1 overflow-hidden border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl flex flex-col">
                            <CardHeader className="bg-black/5 border-b border-black/5 py-4">
                                <CardTitle className="text-lg text-charcoal">{selectedSession.pdfName || 'Session'}</CardTitle>
                                <p className="text-sm text-muted-dark">Completed · {new Date(selectedSession.createdAt).toLocaleDateString()}</p>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                                {selectedSession.scores?.[0] && (
                                    <div className="grid grid-cols-3 gap-4 text-center mb-6">
                                        {[
                                            { label: 'Comprehension', value: selectedSession.scores[0].comprehensionScore, cls: 'brand-teal' },
                                            { label: 'Implementation', value: selectedSession.scores[0].implementationScore, cls: 'brand-lavender-dark' },
                                            { label: 'Integration', value: selectedSession.scores[0].integrationScore, cls: 'brand-amber-dark' }
                                        ].map(({ label, value, cls }) => (
                                            <div key={label} className={`p-3 bg-${cls}/10 rounded-xl`}>
                                                <div className={`text-xl font-bold text-${cls}`}>{value}%</div>
                                                <div className={`text-[10px] font-semibold text-${cls} uppercase mt-1`}>{label}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="space-y-4">
                                    {(Array.isArray(selectedSession.messages) ? selectedSession.messages : []).map((m: Message, i: number) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-2xl text-[15px] leading-relaxed ${m.role === 'user' ? 'bg-charcoal text-white rounded-br-sm' : 'bg-black/5 text-charcoal border border-black/5 rounded-bl-sm'}`}>
                                                {m.role === 'assistant' ? (
                                                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-strong:text-charcoal prose-code:text-brand-teal prose-code:bg-brand-teal/10 prose-code:px-1 prose-code:rounded prose-ol:my-1 prose-ul:my-1">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                                    </div>
                                                ) : m.content}
                                            </div>
                                        </div>
                                    ))}
                                    {!Array.isArray(selectedSession.messages) && selectedSession.transcript && (
                                        (selectedSession.transcript).split('\n\n').filter(l => l.trim()).map((l: string, i: number) => {
                                            const isUser = l.startsWith('user:');
                                            const content = l.replace(/^(user|assistant): /, '');
                                            return (
                                                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] p-4 rounded-2xl text-[15px] leading-relaxed ${isUser ? 'bg-charcoal text-white rounded-br-sm' : 'bg-black/5 text-charcoal border border-black/5 rounded-bl-sm'}`}>
                                                        {isUser ? content : (
                                                            <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-strong:text-charcoal prose-code:text-brand-teal prose-code:bg-brand-teal/10 prose-code:px-1 prose-code:rounded prose-ol:my-1 prose-ul:my-1">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                    ) : !sessionId ? (
                        // Upload screen
                        <Card className="flex-1 border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 bg-brand-teal/5 rounded-full flex items-center justify-center mb-6 border border-brand-teal/10">
                                <UploadCloud className="w-10 h-10 text-brand-teal opacity-80" />
                            </div>
                            <h2 className="text-2xl font-semibold text-charcoal mb-2">Upload Course Material</h2>
                            <p className="text-muted-dark max-w-md mb-8">Drop your PDF slides, textbook chapters, or assignments. The coach uses Socratic method — guiding you to answers through questions.</p>
                            <input type="file" accept="application/pdf" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} className="hidden" id="pdf-upload" />
                            <label htmlFor="pdf-upload" className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-charcoal text-white px-8 py-3 font-medium shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 border-0">
                                Choose PDF File
                            </label>
                            {file && (
                                <div className="mt-6 flex flex-col items-center">
                                    <span className="text-sm font-medium text-brand-teal bg-brand-teal/10 px-4 py-2 rounded-xl border border-brand-teal/20 mb-4">{file.name}</span>
                                    <Button onClick={handleUpload} disabled={isUploading} className="bg-brand-teal text-white rounded-xl font-medium w-full">
                                        {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parsing...</> : "Start Coaching Session"}
                                    </Button>
                                </div>
                            )}
                        </Card>

                    ) : (
                        // Active chat
                        <Card className="flex-1 flex flex-col overflow-hidden border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl">
                            <CardHeader className="bg-black/5 border-b border-black/5 py-4 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5">
                                        <Sparkles className="w-5 h-5 text-brand-lavender" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base text-charcoal">Synapse Coach</CardTitle>
                                        <p className="text-xs text-brand-teal font-medium">Session Active — Socratic Mode</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={handleFinishSession} disabled={isEvaluating || messages.length < 2}
                                    className="border-brand-amber/30 text-brand-amber-dark hover:bg-brand-amber/10 rounded-xl">
                                    {isEvaluating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Finish & Score"}
                                </Button>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-[15px] leading-relaxed ${m.role === 'user' ? 'bg-charcoal text-white rounded-br-sm shadow-sm' : 'bg-white text-charcoal border border-black/5 rounded-bl-sm shadow-sm'}`}>
                                            {m.role === 'assistant' ? (
                                                <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:text-charcoal prose-strong:text-charcoal prose-code:text-brand-teal prose-code:bg-brand-teal/10 prose-code:px-1 prose-code:rounded prose-ol:my-1 prose-ul:my-1">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                                </div>
                                            ) : m.content}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && messages[messages.length - 1]?.role === 'user' && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-black/5 p-4 rounded-2xl rounded-bl-sm shadow-sm">
                                            <Loader2 className="w-5 h-5 text-brand-teal animate-spin" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>

                            <CardFooter className="p-4 bg-white border-t border-black/5">
                                <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="flex w-full gap-3">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Answer or ask a question..."
                                        className="flex-1 px-4 py-3 bg-black/5 border border-transparent focus:border-brand-teal/30 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 rounded-xl outline-none transition-all"
                                        disabled={isTyping}
                                    />
                                    <Button type="submit" disabled={!input.trim() || isTyping} className="bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl px-6">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>
        </PageShell>
    );
}
