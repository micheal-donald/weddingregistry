import { Link } from 'react-router-dom';
import { Heart, Globe, Users, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Gifted</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-800 font-medium">Log In</Link>
            <Link to="/register" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2 rounded-full font-semibold hover:shadow-lg transition-all">
              Create Registry
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Your love story<br />
            <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              deserves better
            </span>
            <br />than a spreadsheet.
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            The gift registry built for couples anywhere in the world.
            Any currency. Crowdfund expensive gifts. Privacy-first for your guests.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all">
              Create Your Free Registry
            </Link>
            <Link to="/laerke-and-micheal"
              className="border-2 border-pink-300 text-pink-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-pink-50 transition-all">
              See a Demo Registry
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why couples love Gifted</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-7 h-7 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Any currency, any country</h3>
              <p className="text-gray-600">
                Your guests in Tokyo, Nairobi, and Copenhagen all see prices in their currency. Toggle between any pair.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Crowdfund expensive gifts</h3>
              <p className="text-gray-600">
                That dream espresso machine? Multiple guests chip in. Progress bars show funding in real time.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Privacy-first for guests</h3>
              <p className="text-gray-600">
                Guest names shown as initials + emoji. Everyone sees a gift is claimed, but not by whom. No pressure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Ready to get started?</h2>
          <p className="text-lg text-gray-600 mb-8">Free forever for up to 30 items. No credit card required.</p>
          <Link to="/register"
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all inline-block">
            Create Your Free Registry
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-pink-100 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>&copy; 2026 Gifted. Made with love across borders.</p>
        </div>
      </footer>
    </div>
  );
}
