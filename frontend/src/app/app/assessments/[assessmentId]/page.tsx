"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export default function AssessmentQuizPage() {
    const { assessmentId } = useParams();
    const { getToken } = useAuth();
    const router = useRouter();

    const [assessment, setAssessment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    useEffect(() => {
        async function loadTest() {
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/assessments/${assessmentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setAssessment(data.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadTest();
    }, [assessmentId, getToken]);

    const handleSelect = (questionId: string, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async () => {
        if (!assessment) return;

        if (Object.keys(answers).length < assessment.questions.length) {
            alert("Please answer all questions before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const token = await getToken();
            // NOTE: Passing default course UUID from the DB seed.
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/assessments/${assessmentId}/submit`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    answers
                })
            });

            const data = await res.json();
            if (data.success) {
                sessionStorage.setItem('lastAssessmentResult', JSON.stringify(data.data));
                router.push(`/app/assessments/${assessmentId}/results`);
            } else {
                alert("Failed to save assessment: " + data.error);
                setSubmitting(false);
            }
        } catch (e) {
            console.error(e);
            setSubmitting(false);
        }
    };

    if (loading) {
        return <PageShell><div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div></PageShell>;
    }

    if (!assessment) {
        return <PageShell><div className="p-12 text-center text-slate-500">Assessment not found.</div></PageShell>;
    }

    return (
        <PageShell>
            <div className="max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-500 bg-white p-6 md:p-8 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-black/5 relative z-10">
                <div className="border-b border-black/5 pb-6 text-center">
                    <h1 className="text-3xl font-semibold text-charcoal tracking-tight">
                        {assessment.title}
                    </h1>
                    <p className="text-muted-dark mt-2 text-lg font-normal">{assessment.description}</p>
                </div>

                <div className="space-y-6">
                    {assessment.questions.map((q: any, idx: number) => {
                        let options = [];
                        try {
                            options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                        } catch (e) {
                            options = [];
                        }

                        const isAnswered = !!answers[q.id];

                        return (
                            <Card key={q.id} className={`transition-all duration-300 shadow-none border rounded-2xl ${isAnswered ? 'border-brand-lavender bg-brand-lavender/5' : 'border-black/5'}`}>
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <CardTitle className="text-lg font-semibold text-charcoal">{idx + 1}. {q.questionText}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {options.map((opt: string, optIdx: number) => {
                                        const isSelected = answers[q.id] === opt;
                                        return (
                                            <div
                                                key={optIdx}
                                                onClick={() => handleSelect(q.id, opt)}
                                                className={`
                                p-4 border rounded-xl cursor-pointer transition-all duration-200 flex justify-between items-center
                                ${isSelected ? 'bg-brand-lavender/10 border-brand-lavender text-brand-deep-purple shadow-sm font-medium' : 'bg-white border-black/10 hover:border-black/20 hover:bg-black/5 text-muted-dark'}
                            `}
                                            >
                                                <span>{opt}</span>
                                                {isSelected && <CheckCircle2 className="w-5 h-5 text-brand-lavender" />}
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-6 border-t border-black/5">
                    <Button
                        size="lg"
                        className="w-full md:w-auto text-lg px-10 py-6 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-0.5 bg-charcoal hover:bg-charcoal/90 text-white font-medium border-0"
                        onClick={handleSubmit}
                        disabled={submitting || Object.keys(answers).length < assessment.questions.length}
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                        {submitting ? "Analyzing Profile..." : "Submit & Generate Knowledge Profile"}
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}
