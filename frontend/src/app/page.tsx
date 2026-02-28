"use client";

import Link from 'next/link';
import { Users, Sparkles, LayoutGrid } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from "@clerk/nextjs";

export default function LandingPage() {
  const { isLoaded, userId } = useAuth();

  return (
    <div className="flex flex-col items-center w-full">
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-deep-purple/5 backdrop-blur-md text-brand-deep-purple text-sm font-semibold mb-6 border border-brand-deep-purple/10 shadow-sm transform hover:scale-105 transition-transform duration-300">
          <Sparkles className="w-4 h-4" /> Algorithmic Peer Matching Validated
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-charcoal max-w-4xl leading-[1.15]">
          Stop studying in a vacuum. <br className="hidden md:block" />
          <span className="text-brand-teal mt-2 block">Compute your perfect peer.</span>
        </h1>

        <p className="mt-8 text-lg md:text-xl text-muted-dark max-w-2xl leading-relaxed font-normal">
          Synapse isn&apos;t another generic forum. It&apos;s a diagnostic engine that formally maps your cognitive gaps and mathematically pairs you with a study partner who has the exact knowledge you lack.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link href={isLoaded && userId ? "/app/recommendations" : "/sign-up"} className="bg-brand-teal text-white rounded-xl px-8 py-4 font-medium text-lg hover:bg-brand-teal/90 transition-colors shadow-sm w-full sm:w-auto">
            Begin Diagnostic
          </Link>
          <Link href={isLoaded && userId ? "/app/recommendations" : "/sign-in"} className="bg-white text-charcoal border border-black/10 rounded-xl px-8 py-4 font-medium text-lg hover:bg-black/5 transition-colors shadow-sm w-full sm:w-auto">
            {isLoaded && userId ? "Go to Dashboard" : "Student Login"}
          </Link>
        </div>
      </section>

      {/* Feature Section mapped directly to Phase 9 features */}
      <section className="w-full bg-transparent pb-24 border-t border-black/5 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="border border-black/5 shadow-sm bg-white text-center h-full rounded-2xl overflow-hidden p-8 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-brand-teal/10 flex items-center justify-center mb-6">
                <LayoutGrid className="w-6 h-6 text-brand-teal" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Diagnostic Calibration</h3>
              <p className="text-muted-gray text-base leading-relaxed font-normal flex-1">
                Take a rigorous quiz on data structures. We&apos;ll pinpoint exactly where your tree traversals fall apart.
              </p>
            </Card>

            <Card className="border border-black/5 shadow-sm bg-white text-center h-full rounded-2xl overflow-hidden p-8 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-brand-deep-purple/10 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-brand-deep-purple" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Vector Embeddings</h3>
              <p className="text-muted-gray text-base leading-relaxed font-normal flex-1">
                Your brain becomes an array of floats. We use pgvector to calculate cosine similarities and find your exact opposite.
              </p>
            </Card>

            <Card className="border border-black/5 shadow-sm bg-white text-center h-full rounded-2xl overflow-hidden p-8 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-brand-amber/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-brand-amber" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Synergy Hubs</h3>
              <p className="text-muted-gray text-base leading-relaxed font-normal flex-1">
                Join hyper-optimized study groups. Everyone brings a mathematically proven missing piece of the puzzle.
              </p>
            </Card>

          </div>
        </div>
      </section>

    </div>
  )
}
