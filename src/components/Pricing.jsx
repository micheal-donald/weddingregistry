export default function Pricing() {
    const tiers = [
        {
            name: "Free",
            price: "$0",
            period: "forever",
            desc: "Perfect for simple, elegant registries.",
            features: [
                "1 registry",
                "30 items maximum",
                "1 currency",
                "Basic theme options",
                "'Powered by Gifted' badge"
            ],
            cta: "Start Free",
            highlight: false
        },
        {
            name: "Premium",
            price: "$29",
            period: "one-time",
            desc: "Everything you need for a global celebration.",
            features: [
                "Unlimited items",
                "Multi-currency support",
                "Custom theme colors",
                "Email notifications",
                "Remove branding"
            ],
            cta: "Get Premium",
            highlight: true
        },
        {
            name: "Pro",
            price: "$19.99",
            period: "per month",
            desc: "Advanced tools for the modern couple.",
            features: [
                "Everything in Premium",
                "Custom domain name",
                "Analytics dashboard",
                "CSV export",
                "Priority support"
            ],
            cta: "Go Pro",
            highlight: false
        }
    ];

    return (
        <section id="pricing" className="py-32 px-6 md:px-16 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="font-sans font-bold text-4xl md:text-5xl text-dark mb-4">
                        Simple, honest pricing.
                    </h2>
                    <p className="font-serif italic text-2xl text-dark/70">
                        No transaction fees. Ever. We don't take a cut of your gifts.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto relative">
                    {tiers.map((tier, idx) => (
                        <div
                            key={idx}
                            className={`rounded-[3rem] p-10 flex flex-col h-full bg-white border ${tier.highlight
                                    ? 'bg-primary text-background border-none shadow-xl transform md:scale-105 z-10'
                                    : 'text-dark hover:shadow-lg transition-shadow bg-white'
                                }`}
                        >
                            <div className="mb-8">
                                {tier.highlight && (
                                    <span className="bg-dark text-background text-xs font-mono px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">Most Popular</span>
                                )}
                                <h3 className={`font-serif italic text-3xl font-bold mb-2 ${tier.highlight ? 'text-background' : 'text-dark'}`}>{tier.name}</h3>
                                <p className={`text-sm ${tier.highlight ? 'text-background/80' : 'text-dark/60'}`}>{tier.desc}</p>
                            </div>

                            <div className="mb-10 flex items-baseline gap-2">
                                <span className="font-sans font-bold text-5xl">{tier.price}</span>
                                <span className={`text-sm font-mono ${tier.highlight ? 'text-background/70' : 'text-dark/50'}`}>/{tier.period}</span>
                            </div>

                            <ul className="mb-10 flex-1 flex flex-col gap-4">
                                {tier.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-center gap-3">
                                        <svg viewBox="0 0 20 20" fill="none" className={`w-5 h-5 flex-shrink-0 ${tier.highlight ? 'stroke-background' : 'stroke-accent'}`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full py-4 rounded-full font-semibold magnetic-transform transition-colors ${tier.highlight
                                        ? 'bg-accent text-background hover:bg-dark hover:text-background'
                                        : 'bg-background border border-dark/20 text-dark hover:bg-dark hover:text-background'
                                    }`}
                            >
                                {tier.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
