export default function Footer() {
  return (
    <footer className="bg-dark text-background rounded-t-[4rem] pt-24 pb-12 px-6 md:px-16 mt-[-4rem] relative z-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-20">
          <div className="md:col-span-1">
            <h3 className="font-serif italic text-4xl font-bold mb-4 text-accent">Gifted</h3>
            <p className="text-background/70 font-sans text-sm leading-relaxed max-w-xs">
              The gift registry built for couples anywhere in the world.
            </p>
          </div>

          <div className="md:col-span-1">
            <h4 className="font-mono text-xs uppercase tracking-widest text-background/50 mb-6 font-semibold">Product</h4>
            <ul className="flex flex-col gap-4 text-sm">
              <li><a href="#features" className="hover:text-accent transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-accent transition-colors">How it Works</a></li>
              <li><a href="#pricing" className="hover:text-accent transition-colors">Pricing</a></li>
              <li><a href="#demo" className="hover:text-accent transition-colors">Demo Registry</a></li>
              <li><a href="#api" className="hover:text-accent opacity-50 cursor-not-allowed">API (Coming Soon)</a></li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h4 className="font-mono text-xs uppercase tracking-widest text-background/50 mb-6 font-semibold">Company</h4>
            <ul className="flex flex-col gap-4 text-sm">
              <li><a href="#about" className="hover:text-accent transition-colors">About</a></li>
              <li><a href="#blog" className="hover:text-accent transition-colors">Blog</a></li>
              <li><a href="#contact" className="hover:text-accent transition-colors">Contact</a></li>
              <li><a href="#privacy" className="hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-accent transition-colors">Terms</a></li>
            </ul>
          </div>

          <div className="md:col-span-1 flex flex-col items-start md:items-end">
            <button className="px-8 py-4 bg-accent text-background rounded-full font-semibold magnetic-transform hover:scale-105 transition-all mb-8 shadow-lg shadow-accent/20">
              Create Your Free Registry
            </button>
            <div className="flex gap-4 mb-8">
              <a href="#instagram" aria-label="Instagram" className="w-10 h-10 rounded-full border border-background/20 flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
              </a>
              <a href="#twitter" aria-label="Twitter/X" className="w-10 h-10 rounded-full border border-background/20 flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between border-t border-background/10 pt-8 gap-4">
          <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-2 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-background/80 tracking-widest uppercase">All systems operational</span>
          </div>

          <div className="text-background/40 text-sm font-sans text-center">
            &copy; 2026 Gifted. Made with love across borders.
          </div>
        </div>
      </div>
    </footer>
  );
}
