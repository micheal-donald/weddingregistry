import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

export default function Hero() {
    const container = useRef(null);

    const [activeIndex, setActiveIndex] = useState(0);

    const images = [
        "https://images.unsplash.com/photo-1542458428-569bda29cbea?q=80&w=2938&auto=format&fit=crop", // Diverse elegant
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2940&auto=format&fit=crop", // Warm minimal
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2938&auto=format&fit=crop", // Hands/rings
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2940&auto=format&fit=crop"  // Outdoor modern
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [images.length]);

    useEffect(() => {
        let ctx = gsap.context(() => {
            gsap.fromTo(
                '.hero-reveal',
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
            );
        }, container);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={container} className="relative h-[100dvh] w-full flex items-end pb-24 px-6 md:px-16 pt-32 overflow-hidden">
            {/* Background Carousel with overlay */}
            {images.map((img, idx) => (
                <div
                    key={idx}
                    className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${idx === activeIndex ? 'opacity-100' : 'opacity-0'}`}
                    style={{ backgroundImage: `url("${img}")` }}
                />
            ))}

            <div className="absolute inset-0 z-0 bg-gradient-to-t from-dark via-dark/70 to-transparent"></div>

            <div className="relative z-10 w-full max-w-4xl text-background">
                <h1 className="flex flex-col gap-2">
                    <span className="hero-reveal block font-sans font-bold text-3xl md:text-5xl tracking-tight">
                        Your love story
                    </span>
                    <span className="hero-reveal block font-serif italic text-5xl md:text-7xl lg:text-8xl leading-[1.1]">
                        deserves <span className="text-secondary">better</span> than a spreadsheet.
                    </span>
                </h1>

                <div className="hero-reveal mt-10 flex flex-col sm:flex-row items-center gap-4">
                    <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-primary text-background rounded-full font-semibold magnetic-transform hover:scale-105 hover-lift transition-all text-center">
                        Create Your Free Registry
                    </Link>
                    <Link to="/laerke-and-micheal" className="w-full sm:w-auto px-8 py-4 border border-sage/60 text-sage hover:bg-sage/10 rounded-full font-semibold magnetic-transform hover:scale-105 transition-all text-center">
                        See a Demo Registry →
                    </Link>
                </div>

                <div className="hero-reveal mt-8 font-mono text-sm opacity-80 flex items-center gap-3">
                    <span>Trusted by 2,400+ couples across 45 countries</span>
                    <span className="hidden sm:inline-block tracking-widest text-base">🇰🇪 🇩🇰 🇺🇸 🇯🇵 🇧🇷 🇳🇬 🇩🇪</span>
                </div>
            </div>
        </section>
    );
}
