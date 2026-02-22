import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Philosophy() {
    const container = useRef(null);

    useEffect(() => {
        let ctx = gsap.context(() => {
            // Parallax effect
            gsap.to('.parallax-bg', {
                y: -100,
                ease: 'none',
                scrollTrigger: {
                    trigger: container.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });

            // Text reveal
            const words = gsap.utils.toArray('.word-reveal span');
            gsap.from(words, {
                opacity: 0,
                y: 20,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.manifesto-text',
                    start: 'top 80%',
                }
            });

        }, container);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={container} className="relative py-32 px-6 md:px-16 bg-dark overflow-hidden flex items-center justify-center min-h-[70vh]">
            {/* Texture overlay */}
            <div
                className="parallax-bg absolute inset-0 z-0 bg-cover bg-center opacity-30 select-none scale-110"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1595168019013-143f5540bf87?q=80&w=2938&auto=format&fit=crop")' }}
            ></div>

            <div className="relative z-10 w-full max-w-4xl text-center manifesto-text">
                <p className="text-background/60 font-mono text-sm uppercase tracking-widest mb-8 max-w-md mx-auto">
                    Most registries are built for: American couples shopping at American stores.
                </p>
                <h2 className="word-reveal font-serif italic text-5xl md:text-7xl lg:text-8xl text-background leading-tight flex flex-wrap justify-center inline-block">
                    {'We\'re built for: love that'.split(' ').map((word, i) => (
                        <span key={i} className="inline-block mr-[0.2em]">{word}</span>
                    ))}
                    <span className="text-accent inline-block">crosses borders.</span>
                </h2>
            </div>
        </section>
    );
}
