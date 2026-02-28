"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardTitle, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, MessageSquare, Loader2, Send, Sparkles, CheckCircle2, Folder, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LearnPage() {
    const { getToken, isLoaded } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [pdfText, setPdfText] = useState<string>("");

    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);

    const [evaluationResult, setEvaluationResult] = useState<any>(null);

    const [pastSessions, setPastSessions] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchSessions() {
            if (!isLoaded) return;
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/learn/sessions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setPastSessions(data.data);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
        fetchSessions();
    }, [isLoaded, getToken]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !isLoaded) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/learn/upload`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSessionId(data.data.sessionId);
                setPdfText(data.data.pdfText);
                setMessages([
                    { role: "system", content: `You are an expert AI Learning Coach. The student has uploaded a document. Here is the extracted text: """${data.data.pdfText}""". Guide them through understanding it, ask Socratic questions, and test their comprehension.` },
                    { role: "assistant", content: "I've reviewed your document! What specific concepts would you like to focus on, or should I start by quizzing you on the core ideas?" }
                ]);
            } else {
                alert("Failed to upload: " + data.message);
            }
        } catch (e) {
            console.error(e);
            alert("Upload error.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !isLoaded) return;
        const userMsg = input;
        setInput("");

        const newMessages = [...messages, { role: "user", content: userMsg }];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/learn/chat`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: newMessages })
            });

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";

            // Add an empty assistant message to append to
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.text) {
                                assistantContent += data.text;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[updated.length - 1].content = assistantContent;
                                    return updated;
                                });
                            }
                        } catch (e) {
                            // parse error on chunk
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsTyping(false);
        }
    };

    const handleFinishSession = async () => {
        if (!sessionId || !isLoaded) return;
        setIsEvaluating(true);
        try {
            const token = await getToken();
            const transcript = messages.filter(m => m.role !== 'system').map(m => `${m.role}: ${m.content}`).join('\n\n');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/learn/${sessionId}/evaluate`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ transcript })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setEvaluationResult(data.data);
            } else {
                alert("Failed to evaluate session.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsEvaluating(false);
        }
    };

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
                            <h2 className="text-3xl font-semibold text-charcoal tracking-tight">Session Evaluated</h2>
                            <p className="text-muted-dark mt-2">Your global learning vector has been updated.</p>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-black/5 rounded-2xl">
                                    <div className="text-3xl font-bold text-charcoal">{evaluationResult.comprehensionScore}%</div>
                                    <div className="text-xs font-semibold text-muted-gray uppercase mt-1">Comprehension</div>
                                </div>
                                <div className="p-4 bg-black/5 rounded-2xl">
                                    <div className="text-3xl font-bold text-charcoal">{evaluationResult.implementationScore}%</div>
                                    <div className="text-xs font-semibold text-muted-gray uppercase mt-1">Implementation</div>
                                </div>
                                <div className="p-4 bg-black/5 rounded-2xl">
                                    <div className="text-3xl font-bold text-charcoal">{evaluationResult.integrationScore}%</div>
                                    <div className="text-xs font-semibold text-muted-gray uppercase mt-1">Integration</div>
                                </div>
                            </div>

                            {evaluationResult.conceptGaps && evaluationResult.conceptGaps.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-muted-gray uppercase tracking-wider mb-3">Identified Knowledge Gaps</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {evaluationResult.conceptGaps.map((gap: any, i: number) => (
                                            <span key={i} className="px-3 py-1.5 bg-brand-amber/10 text-brand-amber-dark border border-brand-amber/20 rounded-xl text-sm font-medium">
                                                {gap}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-black/5 p-6 flex justify-center">
                            <Button onClick={() => window.location.reload()} className="bg-charcoal text-white rounded-xl hover:-translate-y-0.5 transition-transform px-8">
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

                {/* Sidebar History */}
                <div className="w-full md:w-64 flex flex-col gap-4">
                    <Button
                        onClick={() => {
                            setSessionId(null);
                            setEvaluationResult(null);
                            setSelectedSession(null);
                            setMessages([]);
                            setFile(null);
                        }}
                        className="bg-brand-teal hover:bg-brand-teal/90 text-white shadow-sm w-full font-medium h-12 rounded-xl border-none">
                        + New Study Session
                    </Button>
                    <div className="flex-1 overflow-y-auto bg-white border border-black/5 rounded-2xl shadow-sm p-3">
                        <div className="flex items-center gap-2 mb-3 px-2">
                            <Folder className="w-4 h-4 text-brand-lavender" />
                            <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider">CS101 Workspace</h3>
                        </div>
                        {pastSessions.length === 0 ? (
                            <p className="text-sm text-muted-dark px-2">No history found.</p>
                        ) : (
                            <div className="space-y-1 ml-2 border-l-2 border-black/5 pl-2 pb-2">
                                {pastSessions.map((s, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setSelectedSession(s);
                                            setSessionId(null);
                                        }}
                                        className={`p-2 rounded-xl cursor-pointer transition-colors text-sm flex items-start gap-2 ${selectedSession?.id === s.id ? 'bg-brand-lavender/10 border-brand-lavender/20 border font-medium text-brand-lavender-dark' : 'hover:bg-black/5 text-charcoal border border-transparent'}`}
                                    >
                                        <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${selectedSession?.id === s.id ? 'text-brand-lavender' : 'text-muted-gray'}`} />
                                        <div>
                                            <div className="line-clamp-1">{s.pdfName || 'Untitled Session'}</div>
                                            <div className="text-[10px] text-muted-gray mt-0.5">{new Date(s.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col h-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-semibold text-charcoal tracking-tight flex items-center gap-3">
                            AI Learning Coach
                        </h1>
                        <p className="text-muted-dark mt-2 font-normal">Upload PDF material to initiate an algorithmic coaching session.</p>
                    </div>

                    {selectedSession ? (
                        <Card className="flex-1 overflow-hidden border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl flex flex-col">
                            <CardHeader className="bg-black/5 border-b border-black/5 py-4">
                                <CardTitle className="text-lg text-charcoal">{selectedSession.pdfName || 'Reviewed Session'}</CardTitle>
                                <p className="text-sm text-muted-dark">Historical Transcript & Scores</p>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                                {selectedSession.scores && selectedSession.scores[0] && (
                                    <div className="grid grid-cols-3 gap-4 text-center mb-6">
                                        <div className="p-3 bg-brand-teal/10 rounded-xl">
                                            <div className="text-xl font-bold text-brand-teal">{selectedSession.scores[0].comprehensionScore}%</div>
                                            <div className="text-[10px] font-semibold text-brand-teal uppercase mt-1">Comprehension</div>
                                        </div>
                                        <div className="p-3 bg-brand-lavender/10 rounded-xl">
                                            <div className="text-xl font-bold text-brand-lavender-dark">{selectedSession.scores[0].implementationScore}%</div>
                                            <div className="text-[10px] font-semibold text-brand-lavender-dark uppercase mt-1">Implementation</div>
                                        </div>
                                        <div className="p-3 bg-brand-amber/10 rounded-xl">
                                            <div className="text-xl font-bold text-brand-amber-dark">{selectedSession.scores[0].integrationScore}%</div>
                                            <div className="text-[10px] font-semibold text-brand-amber-dark uppercase mt-1">Integration</div>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    {(selectedSession.transcript || '').split('\n\n').filter((m: string) => m.trim().length > 0).map((m: string, i: number) => {
                                        const isSystem = m.startsWith('system:');
                                        if (isSystem) return null;
                                        const isUser = m.startsWith('user:');
                                        const content = m.replace(/^(user|assistant): /, '');
                                        return (
                                            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-4 rounded-2xl text-[15px] leading-relaxed ${isUser
                                                    ? 'bg-charcoal text-white rounded-br-sm shadow-sm'
                                                    : 'bg-black/5 text-charcoal border border-black/5 rounded-bl-sm shadow-sm'
                                                    }`}>
                                                    {content}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ) : !sessionId ? (
                        <Card className="flex-1 border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 bg-brand-teal/5 rounded-full flex items-center justify-center mb-6 border border-brand-teal/10">
                                <UploadCloud className="w-10 h-10 text-brand-teal opacity-80" />
                            </div>
                            <h2 className="text-2xl font-semibold text-charcoal mb-2">Upload Course Material</h2>
                            <p className="text-muted-dark max-w-md mb-8">Drop your PDF slides, textbook chapters, or assignments here to begin.</p>

                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id="pdf-upload"
                            />
                            <label htmlFor="pdf-upload" className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-charcoal text-white px-8 py-3 font-medium shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 border-0">
                                Choose PDF File
                            </label>
                            {file && (
                                <div className="mt-6 flex flex-col items-center">
                                    <span className="text-sm font-medium text-brand-teal bg-brand-teal/10 px-4 py-2 rounded-xl border border-brand-teal/20 mb-4">
                                        {file.name}
                                    </span>
                                    <Button
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="bg-brand-teal text-white rounded-xl font-medium w-full"
                                    >
                                        {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parsing...</> : "Start Coaching Session"}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ) : (
                        <Card className="flex-1 flex flex-col overflow-hidden border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl">
                            <CardHeader className="bg-black/5 border-b border-black/5 py-4 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5">
                                        <Sparkles className="w-5 h-5 text-brand-lavender" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base text-charcoal">Synapse Coach</CardTitle>
                                        <p className="text-xs text-brand-teal font-medium">Session Active</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleFinishSession}
                                    disabled={isEvaluating}
                                    className="border-brand-amber/30 text-brand-amber-dark hover:bg-brand-amber/10 rounded-xl"
                                >
                                    {isEvaluating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Finish & Score Session"}
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                                {messages.filter(m => m.role !== 'system').map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-[15px] leading-relaxed ${m.role === 'user'
                                            ? 'bg-charcoal text-white rounded-br-sm shadow-sm'
                                            : 'bg-white text-charcoal border border-black/5 rounded-bl-sm shadow-sm'
                                            }`}>
                                            {m.content}
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
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                    className="flex w-full gap-3"
                                >
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type your answer or ask a question..."
                                        className="flex-1 px-4 py-3 bg-black/5 border border-transparent focus:border-brand-teal/30 focus:bg-white focus:ring-2 focus:ring-brand-teal/20 rounded-xl outline-none transition-all"
                                        disabled={isTyping}
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!input.trim() || isTyping}
                                        className="bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl px-6"
                                    >
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
