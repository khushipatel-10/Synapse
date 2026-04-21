"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { BookOpen, Zap, Users, Loader2, Save } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

const inputBase: React.CSSProperties = {
    width: '100%', padding: '12px', borderRadius: '12px', outline: 'none',
    background: 'white', color: '#112D4E', border: '1px solid #DBE2EF',
    fontSize: '14px',
};

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest block" style={{ color: '#6b84a0' }}>{label}</label>
            {children}
        </div>
    );
}

function ChipGroup({ options, value, onChange, color, border }: {
    options: string[]; value: string; onChange: (v: string) => void;
    color: string; border: string;
}) {
    return (
        <div className="flex flex-wrap gap-3">
            {options.map(opt => {
                const selected = value === opt;
                return (
                    <div key={opt} onClick={() => onChange(opt)}
                        className="px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm capitalize font-semibold"
                        style={selected ? {
                            background: color + '18', borderColor: border, color,
                            boxShadow: `0 0 0 2px ${color}22`,
                        } : {
                            background: 'white', borderColor: '#DBE2EF', color: '#6b84a0',
                        }}>
                        {opt}
                    </div>
                );
            })}
        </div>
    );
}

export default function ProfilePage() {
    const { getToken, isLoaded } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [formData, setFormData] = useState({
        fullName: '', username: '', contactEmail: '', avatarUrl: '', major: '',
        learningPace: '', studyMode: '', groupSize: '',
        offlineOrOnline: 'online', timezone: 'UTC', materialPreferred: 'mixed'
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
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        fetchProfile();
    }, [isLoaded, getToken]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/me/preferences`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const set = (key: string) => (v: string) => setFormData(prev => ({ ...prev, [key]: v }));

    if (loading) {
        return (
            <PageShell>
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="h-8 w-64 rounded-xl skeleton" />
                    <div className="h-96 rounded-2xl skeleton" />
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div className="max-w-3xl mx-auto w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight" style={{ color: '#112D4E' }}>Profile & Preferences</h1>
                    <p className="mt-1.5" style={{ color: '#2b4a70' }}>Update your academic metadata to refine your peer pairing calculations.</p>
                </div>

                <div className="bg-white rounded-2xl border overflow-hidden"
                    style={{ borderColor: '#DBE2EF', boxShadow: '0 4px 16px rgba(17,45,78,0.06)' }}>
                    <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #3F72AF, #112D4E, #4a8c42)' }} />
                    <div className="p-6 border-b" style={{ borderColor: '#DBE2EF' }}>
                        <h2 className="font-black text-lg" style={{ color: '#112D4E' }}>Settings</h2>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Identity */}
                        <div className="space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-widest pb-2 border-b"
                                style={{ color: '#3F72AF', borderColor: '#DBE2EF' }}>Identity & Contact</h3>

                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer"
                                    style={{ background: '#DBE2EF' }}>
                                    {formData.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <Users className="w-8 h-8" style={{ color: '#6b84a0' }} />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: 'rgba(17,45,78,0.5)' }}>
                                        <span className="text-white text-xs font-bold">Edit</span>
                                    </div>
                                </div>
                                <div className="space-y-3 flex-1 w-full">
                                    <Field label="Full Name">
                                        <input type="text" style={inputBase} value={formData.fullName}
                                            onChange={e => set('fullName')(e.target.value)}
                                            placeholder="Your full name"
                                            onFocus={e => { e.currentTarget.style.borderColor = '#3F72AF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.1)'; }}
                                            onBlur={e => { e.currentTarget.style.borderColor = '#DBE2EF'; e.currentTarget.style.boxShadow = 'none'; }} />
                                    </Field>
                                    <Field label="Username">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold" style={{ color: '#6b84a0' }}>@</span>
                                            <input type="text" style={{ ...inputBase, paddingLeft: '28px' }} value={formData.username}
                                                onChange={e => set('username')(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                                placeholder="yourhandle"
                                                onFocus={e => { e.currentTarget.style.borderColor = '#3F72AF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.1)'; }}
                                                onBlur={e => { e.currentTarget.style.borderColor = '#DBE2EF'; e.currentTarget.style.boxShadow = 'none'; }} />
                                        </div>
                                    </Field>
                                    <Field label="Contact Email">
                                        <input type="email" style={inputBase} value={formData.contactEmail}
                                            onChange={e => set('contactEmail')(e.target.value)}
                                            placeholder="you@university.edu"
                                            onFocus={e => { e.currentTarget.style.borderColor = '#3F72AF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.1)'; }}
                                            onBlur={e => { e.currentTarget.style.borderColor = '#DBE2EF'; e.currentTarget.style.boxShadow = 'none'; }} />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* Academic */}
                        <div className="space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-widest pb-2 border-b"
                                style={{ color: '#3F72AF', borderColor: '#DBE2EF' }}>Academic Parameters</h3>

                            <Field label={<><BookOpen className="w-3.5 h-3.5 inline mr-1.5" style={{ color: '#3F72AF' }} />Academic Major</>}>
                                <select style={inputBase} value={formData.major} onChange={e => set('major')(e.target.value)}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#3F72AF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.1)'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = '#DBE2EF'; e.currentTarget.style.boxShadow = 'none'; }}>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Data Science">Data Science</option>
                                    <option value="Software Engineering">Software Engineering</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="Electrical Engineering">Electrical Engineering</option>
                                </select>
                            </Field>

                            <Field label={<><Zap className="w-3.5 h-3.5 inline mr-1.5" style={{ color: '#D4974A' }} />Learning Velocity</>}>
                                <ChipGroup options={['crash course', 'accelerated', 'steady', 'deep dive']}
                                    value={formData.learningPace} onChange={set('learningPace')}
                                    color="#D4974A" border="#ECC880" />
                            </Field>

                            <Field label={<><Users className="w-3.5 h-3.5 inline mr-1.5" style={{ color: '#6d4fc7' }} />Optimal Hub Size</>}>
                                <ChipGroup options={['duo (2)', 'squad (3-4)', 'seminar (5+)']}
                                    value={formData.groupSize} onChange={set('groupSize')}
                                    color="#6d4fc7" border="#c4b5fd" />
                            </Field>

                            <Field label={<><Users className="w-3.5 h-3.5 inline mr-1.5" style={{ color: '#3F72AF' }} />Processing Modality</>}>
                                <ChipGroup options={['visual architectures', 'textual documentation', 'auditory discourse', 'kinesthetic typing']}
                                    value={formData.studyMode} onChange={set('studyMode')}
                                    color="#3F72AF" border="#b8c8df" />
                            </Field>
                        </div>

                        {/* Logistics */}
                        <div className="space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-widest pb-2 border-b"
                                style={{ color: '#3F72AF', borderColor: '#DBE2EF' }}>Logistics & Environment</h3>

                            <Field label="Location Preference">
                                <ChipGroup options={['online', 'in-person campus', 'hybrid']}
                                    value={formData.offlineOrOnline} onChange={set('offlineOrOnline')}
                                    color="#3F72AF" border="#b8c8df" />
                            </Field>

                            <Field label="Timezone">
                                <select style={inputBase} value={formData.timezone} onChange={e => set('timezone')(e.target.value)}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#3F72AF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.1)'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = '#DBE2EF'; e.currentTarget.style.boxShadow = 'none'; }}>
                                    <option value="UTC">UTC (Universal)</option>
                                    <option value="EST">EST (Eastern)</option>
                                    <option value="CST">CST (Central)</option>
                                    <option value="MST">MST (Mountain)</option>
                                    <option value="PST">PST (Pacific)</option>
                                    <option value="GMT">GMT (Europe)</option>
                                </select>
                            </Field>

                            <Field label="Material Preference">
                                <ChipGroup options={['video lectures', 'textbooks', 'practice problems', 'mixed']}
                                    value={formData.materialPreferred} onChange={set('materialPreferred')}
                                    color="#D4974A" border="#ECC880" />
                            </Field>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-4">
                    {saveMsg && (
                        <span className="text-sm font-semibold"
                            style={{ color: saveMsg.includes('success') || saveMsg.includes('Saved') ? '#4a8c42' : '#be123c' }}>
                            {saveMsg}
                        </span>
                    )}
                    <Button onClick={handleSave} disabled={saving}
                        className="px-6 h-12 rounded-xl font-black text-white border-0 hover:-translate-y-0.5 transition-all"
                        style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)', boxShadow: '0 4px 14px rgba(63,114,175,0.35)' }}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}
