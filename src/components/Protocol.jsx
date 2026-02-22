import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const steps = [
    {
        num: '01',
        title: 'Build your dream list in minutes.',
        desc: 'Sign up free. Add gifts from any store in the world — paste a URL or add manually. Set your currencies, pick your colors.',
        Animation: () => (
            <svg viewBox="0 0 100 100" className="w-full h-full stroke-sage max-w-[200px]" fill="none" strokeWidth="2">
                <rect x="25" y="40" width="50" height="40" rx="4" className="gift-box-path stroke-dashoffset-anim" />
                <path d="M 20 40 L 80 40" className="gift-box-path stroke-dashoffset-anim" />
                <path d="M 50 40 L 50 80" className="gift-box-path stroke-dashoffset-anim" />
                <path d="M 50 40 C 35 25 25 35 40 40 C 55 45 40 40 50 40 C 60 40 45 45 60 40 C 75 35 65 25 50 40" className="gift-box-path stroke-dashoffset-anim" />
            </svg>
        )
    },
    {
        num: '02',
        title: 'One link, every guest.',
        desc: 'Send your unique registry URL. Guests browse, pick a gift, and claim it in seconds. No app downloads, no accounts required.',
        Animation: () => (
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent flex items-center justify-center z-10 pulse-anim">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-dark" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                </div>
                {[1, 2, 3].map(i => (
                    <div key={i} className={`absolute w-32 h-32 border border-sage/60 rounded-full animate-ping`} style={{ animationDuration: '3s', animationDelay: `${i * 1}s` }}></div>
                ))}
                {/* Flags floating */}
                <span className="absolute top-10 left-10 text-xl animate-bounce" style={{ animationDelay: '0.2s' }}>🇰🇪</span>
                <span className="absolute bottom-10 right-10 text-xl animate-bounce" style={{ animationDelay: '0.5s' }}>🇩🇰</span>
                <span className="absolute top-1/2 -right-8 text-xl animate-bounce" style={{ animationDelay: '0.8s' }}>🇺🇸</span>
            </div>
        )
    },
    {
        num: '03',
        title: 'Watch the love roll in.',
        desc: 'Track reservations in real-time. See your progress. Export guest lists. Focus on your big day — we handle the rest.',
        Animation: () => (
            <div className="relative w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 200 100" className="w-full h-auto stroke-sage max-w-[250px]" fill="none" strokeWidth="2">
                    <path d="M 10 50 L 40 50 L 50 20 L 70 80 L 80 50 L 190 50" className="ekg-path stroke-dashoffset-anim" />
                </svg>
                <div className="absolute top-4 right-16 text-xl animate-pulse">🎁</div>
                <div className="absolute top-10 right-28 text-sm animate-pulse" style={{ animationDelay: '0.3s' }}>🎁</div>
            </div>
        )
    }
];

export default function Protocol() {
    const containerRef = useRef(null);

    useEffect(() => {
        let ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.protocol-card');

            cards.forEach((card, i) => {
                ScrollTrigger.create({
                    trigger: card,
                    start: 'top top',
                    end: 'bottom top',
                    pin: true,
                    pinSpacing: false,
                });

                if (i < cards.length - 1) {
                    gsap.to(card, {
                        scale: 0.9,
                        opacity: 0.5,
                        filter: 'blur(20px)',
                        scrollTrigger: {
                            trigger: cards[i + 1],
                            start: 'top bottom',
                            end: 'top top',
                            scrub: true,
                        }
                    });
                }
            });

            // SVG path animations
            gsap.fromTo('.stroke-dashoffset-anim',
                { strokeDasharray: 400, strokeDashoffset: 400 },
                { strokeDashoffset: 0, duration: 4, ease: 'power2.inOut', repeat: -1, yoyo: true }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} id="how-it-works" className="relative pb-32">
            {steps.map((step, idx) => (
                <div
                    key={idx}
                    className="protocol-card min-h-screen sticky top-0 flex items-center justify-center bg-background px-6"
                >
                    <div className="max-w-6xl w-full grid md:grid-cols-2 gap-16 md:gap-24 items-center bg-white border shadow-lg rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
                        {/* Background huge number */}
                        <div className="absolute top-4 -right-10 text-[20rem] font-serif italic text-dark/5 font-bold leading-none select-none z-0">
                            {step.num}
                        </div>

                        <div className="relative z-10 flex flex-col justify-center max-w-lg">
                            <span className="font-mono text-primary font-bold tracking-widest text-sm mb-6 block uppercase border border-primary/20 px-4 py-2 rounded-full w-max">Step {step.num}</span>
                            <h2 className="font-sans font-bold text-4xl md:text-5xl text-dark leading-tight mb-6">
                                {step.title}
                            </h2>
                            <p className="text-dark/70 text-lg leading-relaxed">
                                {step.desc}
                            </p>
                        </div>

                        <div className="relative z-10 flex items-center justify-center h-64 md:h-96">
                            <step.Animation />
                        </div>
                    </div>
                </div>
            ))}
        </section>
    );
}
