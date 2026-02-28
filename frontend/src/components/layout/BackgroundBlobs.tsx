"use client";

export function BackgroundBlobs() {
    return (
        <div className="fixed top-0 inset-x-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {/* Top Left Peach Blob - Animated */}
            <div
                className="absolute w-[900px] h-[900px] blur-[100px] opacity-[0.4] animate-[pulse_8s_ease-in-out_infinite_alternate]"
                style={{ top: '-10%', left: '-15%', background: 'radial-gradient(circle at center, #FFD6C2 0%, transparent 65%)' }}
            ></div>

            {/* Top Right Mint Blob - Animated */}
            <div
                className="absolute w-[800px] h-[800px] blur-[120px] opacity-[0.35] animate-[pulse_10s_ease-in-out_infinite_alternate]"
                style={{ top: '-5%', right: '-10%', background: 'radial-gradient(circle at center, #B4EBE6 0%, transparent 60%)' }}
            ></div>

            {/* Bottom Left Pale Yellow Blob - Animated */}
            <div
                className="absolute w-[800px] h-[800px] blur-[100px] opacity-[0.3] animate-[pulse_12s_ease-in-out_infinite_alternate]"
                style={{ bottom: '-10%', left: '5%', background: 'radial-gradient(circle at center, #FFF2B3 0%, transparent 65%)' }}
            ></div>

            {/* Center Right Blush Pink Blob - Animated */}
            <div
                className="absolute w-[1000px] h-[1000px] blur-[120px] opacity-[0.4] animate-[pulse_15s_ease-in-out_infinite_alternate]"
                style={{ top: '25%', right: '-20%', background: 'radial-gradient(circle at center, #FFD1E8 0%, transparent 60%)' }}
            ></div>
        </div>
    );
}
