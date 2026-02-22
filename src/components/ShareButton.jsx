import { useState } from 'react';
import { Share2, Copy, Check, Mail } from 'lucide-react';

export default function ShareButton({ slug }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out our wedding registry! ${url}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent('Our Wedding Registry')}&body=${encodeURIComponent(`We'd love for you to check out our gift registry:\n\n${url}`)}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="bg-white/90 backdrop-blur-sm border border-dark/10 px-4 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2 text-sm text-dark/70 hover:text-dark"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-dark/5 p-3 z-50 w-72">
            <p className="text-xs font-mono text-dark/40 uppercase tracking-wider mb-3 px-2">Share registry</p>

            <button onClick={handleCopy}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background transition-colors text-left">
              {copied ? <Check className="w-4 h-4 text-sage" /> : <Copy className="w-4 h-4 text-dark/40" />}
              <div>
                <div className="text-sm font-medium text-dark">{copied ? 'Copied!' : 'Copy link'}</div>
                <div className="text-xs text-dark/40 truncate">{url}</div>
              </div>
            </button>

            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background transition-colors">
              <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.7-1.418A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.326-.672-6.065-1.822l-.424-.282-3.116.94.883-3.244-.305-.466A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
              </svg>
              <div className="text-sm font-medium text-dark">WhatsApp</div>
            </a>

            <a href={emailUrl}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background transition-colors">
              <Mail className="w-4 h-4 text-dark/40" />
              <div className="text-sm font-medium text-dark">Email</div>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
