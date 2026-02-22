import { useState, useEffect } from 'react';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > window.innerHeight * 0.8);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 w-[95%] max-w-5xl ${scrolled
                    ? 'bg-background/80 backdrop-blur-2xl border border-dark/10 shadow-lg text-dark'
                    : 'bg-transparent text-background'
                }`}
        >
            <div className="font-serif italic text-2xl font-bold">Gifted</div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                <a href="#features" className="hover-lift transition-transform">Features</a>
                <a href="#how-it-works" className="hover-lift transition-transform">How It Works</a>
                <a href="#pricing" className="hover-lift transition-transform">Pricing</a>
                <a href="#demo" className="hover-lift transition-transform">Demo</a>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
                <a href="#login" className="hover-lift transition-transform hidden sm:block">Log In</a>
                <a
                    href="#create"
                    className={`px-5 py-2.5 rounded-full magnetic-transform hover:scale-105 transition-all ${scrolled ? 'bg-accent text-background' : 'bg-background text-dark'
                        }`}
                >
                    Create Registry
                </a>
            </div>
        </nav>
    );
}
