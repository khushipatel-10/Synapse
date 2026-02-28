"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Zap, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export default function OnboardingPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        major: '',
        learningPace: '',
        studyMode: ''
    });

    const handleSubmit = async () => {
        if (!formData.major || !formData.learningPace || !formData.studyMode) {
            alert("Please fill out all preferences.");
            return;
        }

        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/me/onboarding`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    major: formData.major,
                    clerkUserName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
                    preferences: {
                        pace: formData.learningPace,
                        mode: formData.studyMode
                    }
                })
            });

            if (res.ok) {
                router.push('/app/recommendations');
            } else {
                alert("Failed to save preferences.");
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <PageShell>
            <div className="max-w-3xl mx-auto w-full">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-semibold text-charcoal tracking-tight">Configure Your Brain</h1>
                    <p className="text-muted-dark mt-2 text-lg font-normal">Define your academic constraints to calibrate our matching engine.</p>
                </div>

                <Card className="border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] bg-white rounded-2xl">
                    <div className="h-1 w-full bg-black/5 rounded-t-2xl" />
                    <CardHeader className="pb-4 border-b border-black/5">
                        <CardTitle className="text-2xl font-semibold text-charcoal">Learning Parameters</CardTitle>
                        <CardDescription className="text-base text-muted-gray font-normal">
                            These settings form the baseline of your profile before diagnostic vectors are calculated.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">

                        {/* Major */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-muted-gray uppercase tracking-wider flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-brand-mint" /> Academic Major
                            </label>
                            <select
                                className="w-full p-4 border border-black/10 rounded-xl focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all bg-white text-muted-dark"
                                value={formData.major}
                                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                            >
                                <option value="">Select your discipline...</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Data Science">Data Science</option>
                                <option value="Software Engineering">Software Engineering</option>
                            </select>
                        </div>

                        {/* Pace */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-muted-gray uppercase tracking-wider flex items-center gap-2">
                                <Zap className="w-4 h-4 text-brand-amber" /> Velocity
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'fast', title: 'Accelerated', desc: 'I prefer to consume material rapidly.' },
                                    { id: 'slow', title: 'Deep Dive', desc: 'I prefer methodical, detailed breakdowns.' }
                                ].map(opt => (
                                    <div
                                        key={opt.id}
                                        onClick={() => setFormData({ ...formData, learningPace: opt.id })}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.learningPace === opt.id ? 'border-brand-amber bg-brand-amber/10 text-charcoal shadow-sm' : 'border-black/5 hover:bg-black/5 bg-white'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-charcoal">{opt.title}</span>
                                            {formData.learningPace === opt.id && <CheckCircle2 className="w-5 h-5 text-brand-amber" />}
                                        </div>
                                        <p className="text-sm text-muted-gray font-normal mt-1">{opt.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mode */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-muted-gray uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-4 h-4 text-brand-teal" /> Modality
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'visual', title: 'Visual', desc: 'Whiteboards, diagrams, and video.' },
                                    { id: 'textual', title: 'Textual', desc: 'Documentation, notes, and reading.' }
                                ].map(opt => (
                                    <div
                                        key={opt.id}
                                        onClick={() => setFormData({ ...formData, studyMode: opt.id })}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.studyMode === opt.id ? 'border-brand-amber bg-brand-amber/10 text-charcoal shadow-sm' : 'border-black/5 hover:bg-black/5 bg-white'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-charcoal">{opt.title}</span>
                                            {formData.studyMode === opt.id && <CheckCircle2 className="w-5 h-5 text-brand-amber" />}
                                        </div>
                                        <p className="text-sm text-muted-gray font-normal mt-1">{opt.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <div className="mt-8 flex justify-end">
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full sm:w-auto px-8 py-6 text-lg rounded-xl bg-charcoal text-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 border-0 font-medium"
                    >
                        {loading ? "Calibrating..." : "Initialize Profile"}
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}
