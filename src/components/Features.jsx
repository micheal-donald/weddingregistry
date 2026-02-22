import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const currencies = [
    { flag: '🇰🇪', text: 'KES 24,995' },
    { flag: '🇩🇰', text: 'kr 1,250' },
    { flag: '🇺🇸', text: '$192' },
];

export default function Features() {
    const [activeCurrency, setActiveCurrency] = useState(0);
    const [feedIndex, setFeedIndex] = useState(0);
    const [typedMessage, setTypedMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [privacyName, setPrivacyName] = useState('Sarah Johnson');

    const messages = [
        { text: "A. 🦋 contributed 25% to Robot Vacuum", p: 25 },
        { text: "M. 🌸 contributed 40% to Robot Vacuum", p: 65 },
        { text: "J. ✨ contributed 35% — Fully funded! 🎉", p: 100 },
    ];

    // Currency logic
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveCurrency((prev) => (prev + 1) % currencies.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Live feed logic
    useEffect(() => {
        let currentMessage = messages[feedIndex].text;
        let charIndex = 0;

        // reset variables
        setTypedMessage('');
        setProgress(feedIndex === 0 ? 0 : messages[feedIndex - 1].p);

        const typeInterval = setInterval(() => {
            if (charIndex <= currentMessage.length) {
                setTypedMessage(currentMessage.slice(0, charIndex));
                charIndex++;
            } else {
                clearInterval(typeInterval);
                setProgress(messages[feedIndex].p);
                setTimeout(() => setFeedIndex((p) => (p + 1) % messages.length), 3000);
            }
        }, 50);

        return () => clearInterval(typeInterval);
    }, [feedIndex]);

    // Privacy morph logic
    useEffect(() => {
        const tl = gsap.timeline({ repeat: -1 });

        tl.to({}, { duration: 2 })
            .to('.privacy-card-name', {
                opacity: 0,
                filter: 'blur(8px)',
                duration: 0.4,
                onComplete: () => setPrivacyName('S. 🌟')
            })
            .to('.privacy-card-name', { opacity: 1, filter: 'blur(0px)', duration: 0.4 })
            .to({}, { duration: 2 })
            .to('.privacy-card-name', {
                opacity: 0,
                filter: 'blur(8px)',
                duration: 0.4,
                onComplete: () => setPrivacyName('David Kim')
            })
            .to('.privacy-card-name', { opacity: 1, filter: 'blur(0px)', duration: 0.4 })
            .to({}, { duration: 2 })
            .to('.privacy-card-name', {
                opacity: 0,
                filter: 'blur(8px)',
                duration: 0.4,
                onComplete: () => setPrivacyName('D. 🦊')
            })
            .to('.privacy-card-name', { opacity: 1, filter: 'blur(0px)', duration: 0.4 })
            .to({}, { duration: 2 })
            .to('.privacy-card-name', {
                opacity: 0,
                filter: 'blur(8px)',
                duration: 0.4,
                onComplete: () => setPrivacyName('Sarah Johnson')
            })
            .to('.privacy-card-name', { opacity: 1, filter: 'blur(0px)', duration: 0.4 });

        return () => tl.kill();
    }, []);

    return (
        <section id="features" className="py-24 px-6 md:px-16 bg-background max-w-7xl mx-auto">
            <div className="mb-16">
                <h2 className="font-serif text-4xl md:text-5xl italic text-dark max-w-2xl leading-tight">
                    Tools designed for a global celebration.
                </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Card 1: Currency Carousel */}
                <div className="bg-sage/10 border border-sage/30 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center h-[420px] justify-between relative overflow-hidden">
                    <div className="w-full flex-1 flex items-center justify-center relative mt-6">
                        {currencies.map((curr, idx) => {
                            const offset = (idx - activeCurrency + currencies.length) % currencies.length;
                            const y = offset === 0 ? 0 : offset === 1 ? 20 : offset === 2 ? -20 : -100;
                            const scale = offset === 0 ? 1 : 0.9;
                            const opacity = offset === 0 ? 1 : 0.4;
                            const zIndex = 10 - offset;

                            return (
                                <div
                                    key={idx}
                                    className="absolute bg-background border border-secondary/30 px-6 py-4 rounded-xl font-mono text-xl shadow-sm transition-all duration-700 w-48"
                                    style={{
                                        transform: `translateY(${y}px) scale(${scale})`,
                                        opacity,
                                        zIndex,
                                        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    }}
                                >
                                    <span className="mr-3">{curr.flag}</span>
                                    {curr.text}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-8 z-10 w-full text-left">
                        <h3 className="font-sans font-bold text-xl mb-2 text-dark">Any currency, any country.</h3>
                        <p className="text-dark/70 text-sm leading-relaxed">Your guests see prices in their own currency. Set any pair — we handle the math.</p>
                    </div>
                </div>

                {/* Card 2: Crowdfund Live Feed */}
                <div className="bg-sage/10 border border-sage/30 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col h-[420px] justify-between">
                    <div className="w-full bg-dark/5 rounded-2xl p-5 mt-6 font-mono text-xs overflow-hidden h-32 relative border border-dark/10 shadow-inner">
                        <div className="flex items-center gap-2 mb-3 font-semibold text-primary">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Live
                        </div>
                        <div className="text-dark">
                            &gt; {typedMessage}
                            <span className="animate-pulse w-2 h-[1em] bg-accent inline-block ml-1 align-middle"></span>
                        </div>
                    </div>

                    <div className="w-full mt-4 bg-sage/20 h-3 rounded-full overflow-hidden relative">
                        <div
                            className="absolute left-0 top-0 h-full bg-accent transition-all duration-700 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="mt-8 w-full text-left">
                        <h3 className="font-sans font-bold text-xl mb-2 text-dark">Crowdfund the big-ticket gifts.</h3>
                        <p className="text-dark/70 text-sm leading-relaxed">Multiple guests chip in. Progress bars update in real time. No awkward conversations.</p>
                    </div>
                </div>

                {/* Card 3: Privacy Preview */}
                <div className="bg-sage/10 border border-sage/30 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col h-[420px] justify-between items-center text-center">
                    <div className="w-full flex-1 flex flex-col items-center justify-center mt-6">
                        <div className="text-sm font-semibold uppercase tracking-widest text-dark/40 mb-3">Guest Input</div>
                        <div className="border border-dark/20 bg-background rounded-full px-6 py-2 w-48 flex justify-center text-lg font-mono">
                            <span className="privacy-card-name text-dark">{privacyName}</span>
                        </div>
                        <div className="mt-6 flex flex-col items-center">
                            <div className="text-xs text-dark/50 mb-1">Public Registry View</div>
                            <div className="bg-secondary/20 text-primary px-4 py-2 rounded-full text-sm font-mono flex items-center shadow-sm">
                                Reserved by: <span className="ml-2 font-bold privacy-card-name">{privacyName.includes('.') ? privacyName : '...'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 w-full text-left">
                        <h3 className="font-sans font-bold text-xl mb-2 text-dark">No names, no pressure.</h3>
                        <p className="text-dark/70 text-sm leading-relaxed">Guests stay anonymous. Initials + emoji keep it warm without the social anxiety.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
