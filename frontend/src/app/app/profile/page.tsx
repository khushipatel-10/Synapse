"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Zap, Users, Loader2, Save } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export default function ProfilePage() {
    const { getToken, isLoaded } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        contactEmail: '',
        avatarUrl: '',
        major: '',
        learningPace: '',
        studyMode: '',
        groupSize: '',
        offlineOrOnline: 'online',
        timezone: 'UTC',
        materialPreferred: 'mixed'
    });

    useEffect(() => {
        async function fetchProfile() {
            if (!isLoaded) return;
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setFormData({
                            fullName: data.data.name || '',
                            username: data.data.username || '',
                            contactEmail: data.data.email || '',
                            avatarUrl: data.data.avatar || '',
                            major: data.data.major || '',
                            learningPace: data.data.preferences?.pace || '',
                            studyMode: data.data.preferences?.mode || '',
                            groupSize: data.data.preferences?.groupSize || '',
                            offlineOrOnline: data.data.preferences?.offlineOrOnline || 'online',
                            timezone: data.data.preferences?.timezone || 'UTC',
                            materialPreferred: data.data.preferences?.materialPreferred || 'mixed'
                        });
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [isLoaded, getToken]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/me/preferences`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clerkUserName: formData.fullName,
                    email: formData.contactEmail,
                    username: formData.username || null,
                    major: formData.major,
                    preferences: {
                        pace: formData.learningPace,
                        mode: formData.studyMode,
                        groupSize: formData.groupSize,
                        offlineOrOnline: formData.offlineOrOnline,
                        timezone: formData.timezone,
                        materialPreferred: formData.materialPreferred
                    }
                })
            });

            const json = await res.json();
            if (res.ok && json.success) {
                setSaveMsg('Saved successfully.');
                setTimeout(() => setSaveMsg(''), 3000);
            } else {
                setSaveMsg(json.error || json.message || 'Failed to save.');
                setTimeout(() => setSaveMsg(''), 4000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <PageShell><div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div></PageShell>;
    }

    return (
        <PageShell>
            <div className="max-w-3xl mx-auto w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-charcoal tracking-tight">Profile & Preferences</h1>
                    <p className="text-muted-dark mt-2 font-normal">Update your academic metadata to refine your peer pairing calculations.</p>
                </div>

                <Card className="border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] bg-white rounded-2xl">
                    <div className="h-1 w-full bg-black/5 rounded-t-2xl" />
                    <CardHeader className="pb-4 border-b border-black/5">
                        <CardTitle className="text-xl font-semibold text-charcoal">Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">

                        {/* Personal Information Options */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-charcoal border-b border-black/5 pb-2">Identity & Contact</h3>

                            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                <div className="w-20 h-20 rounded-full bg-black/5 border border-black/10 flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer">
                                    {formData.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <Users className="w-8 h-8 text-muted-gray" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-medium">Edit Photo</span>
                                    </div>
                                </div>
                                <div className="space-y-3 flex-1 w-full">
                                    <div>
                                        <label className="text-xs font-semibold text-muted-gray uppercase tracking-wider block mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-black/10 rounded-xl focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none bg-white text-muted-dark"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-gray uppercase tracking-wider block mb-1">Username <span className="text-brand-teal normal-case font-normal">(unique — friends can find you by this)</span></label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray font-medium">@</span>
                                            <input
                                                type="text"
                                                className="w-full pl-7 pr-3 py-3 border border-black/10 rounded-xl focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none bg-white text-muted-dark"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                                placeholder="yourhandle"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-gray uppercase tracking-wider block mb-1">Contact Email</label>
                                        <input
                                            type="email"
                                            className="w-full p-3 border border-black/10 rounded-xl focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none bg-white text-muted-dark"
                                            value={formData.contactEmail}
                                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                            placeholder="you@university.edu"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-semibold text-charcoal border-b border-black/5 pb-2">Academic Parameters</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-gray uppercase tracking-wider flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-brand-mint" /> Academic Major
                                </label>
                                <select
                                    className="w-full p-3 border border-black/10 rounded-xl focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none bg-white text-muted-dark"
                                    value={formData.major}
                                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                                >
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Data Science">Data Science</option>
                                    <option value="Software Engineering">Software Engineering</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="Electrical Engineering">Electrical Engineering</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-gray uppercase tracking-wider flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-brand-amber" /> Velocity
                                </label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {['crash course', 'accelerated', 'steady', 'deep dive'].map(opt => (
                                        <div
                                            key={opt}
                                            onClick={() => setFormData({ ...formData, learningPace: opt })}
                                            className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all text-center capitalize ${formData.learningPace === opt ? 'border-brand-amber bg-brand-amber/10 text-charcoal font-medium shadow-sm' : 'border-black/5 hover:bg-black/5 bg-white text-muted-gray'}`}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-gray uppercase tracking-wider flex items-center gap-2">
                                    <Users className="w-4 h-4 text-brand-lavender" /> Optimal Hub Size
                                </label>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {['duo (2)', 'squad (3-4)', 'seminar (5+)'].map((opt) => (
                                        <div
                                            key={opt}
                                            onClick={() => setFormData({ ...formData, groupSize: opt })}
                                            className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all text-center capitalize ${formData.groupSize === opt ? 'border-brand-lavender bg-brand-lavender/5 text-brand-deep-purple font-medium shadow-sm' : 'border-black/5 hover:bg-black/5 bg-white text-muted-gray'}`}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-gray uppercase tracking-wider flex items-center gap-2">
                                    <Users className="w-4 h-4 text-brand-teal" /> Processing Modality
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['visual architectures', 'textual documentation', 'auditory discourse', 'kinesthetic typing'].map(opt => (
                                        <div
                                            key={opt}
                                            onClick={() => setFormData({ ...formData, studyMode: opt })}
                                            className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all text-center capitalize ${formData.studyMode === opt ? 'border-brand-teal bg-brand-teal/10 text-brand-teal font-medium shadow-sm' : 'border-black/5 hover:bg-black/5 bg-white text-muted-gray'}`}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-black/5 mt-6">
                                <h3 className="text-sm font-semibold text-charcoal pb-2">Logistics & Environment</h3>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-gray uppercase tracking-wider block">
                                        Location Preference
                                    </label>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {['online', 'in-person campus', 'hybrid'].map(opt => (
                                            <div
                                                key={opt}
                                                onClick={() => setFormData({ ...formData, offlineOrOnline: opt })}
                                                className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all text-center capitalize ${formData.offlineOrOnline === opt ? 'border-brand-teal bg-brand-teal/10 text-brand-teal font-medium shadow-sm' : 'border-black/5 hover:bg-black/5 bg-white text-muted-gray'}`}
                                            >
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-gray uppercase tracking-wider block">
                                        Timezone Override
                                    </label>
                                    <select
                                        className="w-full p-3 border border-black/10 rounded-xl focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none bg-white text-muted-dark"
                                        value={formData.timezone}
                                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                    >
                                        <option value="UTC">UTC (Universal)</option>
                                        <option value="EST">EST (Eastern)</option>
                                        <option value="CST">CST (Central)</option>
                                        <option value="MST">MST (Mountain)</option>
                                        <option value="PST">PST (Pacific)</option>
                                        <option value="GMT">GMT (Europe)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-gray uppercase tracking-wider block">
                                        Material Preference
                                    </label>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {['video lectures', 'textbooks', 'practice problems', 'mixed'].map(opt => (
                                            <div
                                                key={opt}
                                                onClick={() => setFormData({ ...formData, materialPreferred: opt })}
                                                className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all text-center capitalize ${formData.materialPreferred === opt ? 'border-brand-amber bg-brand-amber/10 text-charcoal font-medium shadow-sm' : 'border-black/5 hover:bg-black/5 bg-white text-muted-gray'}`}
                                            >
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <div className="mt-6 flex items-center justify-end gap-4">
                    {saveMsg && (
                        <span className={`text-sm font-medium ${saveMsg.includes('success') || saveMsg.includes('Saved') ? 'text-brand-teal' : 'text-red-500'}`}>
                            {saveMsg}
                        </span>
                    )}
                    <Button onClick={handleSave} disabled={saving} className="px-6 py-5 rounded-xl bg-charcoal hover:bg-charcoal/90 text-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-0.5 border-0 font-medium">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}
