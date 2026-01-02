const { useState, useEffect } = React;

const App = () => {
  const [items, setItems] = useState([
    {
      id: 1,
      name: "Money",
      price: 0,
      image: "https://placehold.co/300x300/f8f9fa/6c757d?text=💰",
      affiliateLink: "",
      reserved: false,
      reservedBy: null,
      category: "Other"
    },
    {
      id: 2,
      name: "Harman Kardon Onyx Studio 9 Bluetooth Speaker",
      price: 49995,
      image: "https://hotpoint.co.ke/media/cache/ca/9d/ca9d7df71e85f21a091f5a1919bc64f7.webp",
      affiliateLink: "https://hotpoint.co.ke/catalogue/harman-kordon-onyx-studio-9-port-stereo-bluetooth-speaker-50w-black_5725/",
      reserved: false,
      reservedBy: null,
      category: "Audio"
    },
    {
      id: 3,
      name: "Grill",
      price: 25000,
      image: "https://placehold.co/300x300/f8f9fa/6c757d?text=🔥+Grill",
      affiliateLink: "",
      reserved: false,
      reservedBy: null,
      category: "Appliances"
    },
    {
      id: 4,
      name: "DeLonghi Coffee Grinder KG200",
      price: 18000,
      image: "https://placehold.co/300x300/f8f9fa/6c757d?text=Coffee+Grinder",
      affiliateLink: "https://hotpoint.co.ke/catalogue/delonghi-kg200-coffee-grinder_4819/",
      reserved: false,
      reservedBy: null,
      category: "Kitchen"
    },
    {
      id: 5,
      name: "DeLonghi Coffee Maker EC230BK",
      price: 24995,
      image: "https://hotpoint.co.ke/media/products/2023/11/cxvbvcbv.jpg",
      affiliateLink: "https://hotpoint.co.ke/catalogue/delonghi-ec230bk-coffee-maker_4775/",
      reserved: false,
      reservedBy: null,
      category: "Kitchen"
    },
    {
      id: 6,
      name: "VR Headset",
      price: 35000,
      image: "https://placehold.co/300x300/f8f9fa/6c757d?text=VR+Headset",
      affiliateLink: "",
      reserved: false,
      reservedBy: null,
      category: "Electronics"
    },
    {
      id: 7,
      name: "Vinyl Player",
      price: 15000,
      image: "https://placehold.co/300x300/f8f9fa/6c757d?text=🎵+Vinyl+Player",
      affiliateLink: "",
      reserved: false,
      reservedBy: null,
      category: "Audio"
    },
    {
      id: 8,
      name: "Vinyl Records Collection",
      price: 5000,
      image: "https://placehold.co/300x300/f8f9fa/6c757d?text=🎶+Vinyls",
      affiliateLink: "",
      reserved: false,
      reservedBy: null,
      category: "Audio"
    },
    {
      id: 9,
      name: "Prestige Cast Iron Pots & Pans Set",
      price: 12000,
      image: "https://placehold.co/300x300/f8f9fa/6c757d?text=Cast+Iron+Set",
      affiliateLink: "https://myredrhino.com/product-category/prestige-kitchen-products-online-store-kenya/cast-iron/",
      reserved: false,
      reservedBy: null,
      category: "Kitchen"
    },
    {
      id: 10,
      name: "Indoor Plants Collection",
      price: 3000,
      image: "https://placehold.co/300x300/f8f9fa/6c757d?text=🌿+Plants",
      affiliateLink: "",
      reserved: false,
      reservedBy: null,
      category: "Home"
    },
    {
      id: 11,
      name: "Black+Decker Robot Vacuum & Mop",
      price: 54995,
      image: "https://hotpoint.co.ke/media/cache/18/b3/18b399aaf6508b767536d0c285f79642.webp",
      affiliateLink: "https://hotpoint.co.ke/catalogue/blackdecker-brva425b10-b5-robotic-vacuum-cleaner-and-mop-2-in-1-white_5562/",
      reserved: false,
      reservedBy: null,
      category: "Appliances"
    },
    {
      id: 12,
      name: "Wood Chopping Boards Set",
      price: 4000,
      image: "https://placehold.co/300x300/f8f9fa/6c757d?text=🪵+Cutting+Board",
      affiliateLink: "",
      reserved: false,
      reservedBy: null,
      category: "Kitchen"
    },
    {
      id: 13,
      name: "MT900 Ultralight 3-Person Trekking Tent",
      price: 25000,
      image: "https://placehold.co/300x300/f8f9fa/6c757d?text=⛺+Tent",
      affiliateLink: "https://www.decathlon.co.ke/trekking-tents/323513-43041-tunnel-trekking-tent-3-person-mt900-ultralight.html",
      reserved: false,
      reservedBy: null,
      category: "Outdoor"
    },
    {
      id: 14,
      name: "Trekking & Camping Gear Set",
      price: 20000,
      image: "https://placehold.co/300x300/f8f9fa/6c757d?text=🎒+Camping+Gear",
      affiliateLink: "",
      reserved: false,
      reservedBy: null,
      category: "Outdoor"
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    image: '',
    affiliateLink: '',
    category: 'Kitchen'
  });

  const [guestName, setGuestName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const categories = ['Kitchen', 'Electronics', 'Audio', 'Outdoor', 'Home', 'Appliances', 'Other'];

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.name && newItem.price && newItem.image && newItem.affiliateLink) {
      const item = {
        id: Date.now(),
        ...newItem,
        price: parseFloat(newItem.price),
        reserved: false,
        reservedBy: null
      };
      setItems([...items, item]);
      setNewItem({ name: '', price: '', image: '', affiliateLink: '', category: 'Kitchen' });
      setShowAddForm(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      price: item.price.toString(),
      image: item.image,
      affiliateLink: item.affiliateLink,
      category: item.category
    });
  };

  const handleUpdateItem = (e) => {
    e.preventDefault();
    if (editingItem && newItem.name && newItem.price && newItem.image && newItem.affiliateLink) {
      setItems(items.map(item =>
        item.id === editingItem.id
          ? { ...item, ...newItem, price: parseFloat(newItem.price) }
          : item
      ));
      setEditingItem(null);
      setNewItem({ name: '', price: '', image: '', affiliateLink: '', category: 'Kitchen' });
    }
  };

  const handleDeleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleReserveItem = (id) => {
    if (guestName && selectedItem === id) {
      setItems(items.map(item =>
        item.id === id
          ? { ...item, reserved: true, reservedBy: guestName }
          : item
      ));
      setSelectedItem(null);
      setGuestName('');
    }
  };

  const handleUnreserveItem = (id) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, reserved: false, reservedBy: null }
        : item
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Great Vibes', fontSize: '2.5rem' }}>Lærke & Micheal</h1>
                <p className="text-pink-600 font-medium">Wedding Registry</p>
              </div>
            </motion.div>
            <motion.button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Gift</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Our Wedding Registry
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Help us start our new life together with gifts that will make our house a home.
            </br> We are not deadset on the brands of the gifts - they do not have to be from the exact link, but whichever types you can find in Denmark/Kenya/wherever you are!</motion.div>
        </p>

        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-700 mb-12">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-pink-500" />
            <span>February 14, 2026</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-pink-500" />
            <span>Limuru, Kenya</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-pink-500" />
            <span>{items.filter(item => item.reserved).length} of {items.length} gifts reserved</span>
          </div>
        </div>
      </motion.div>
    </div>
      </section >

  {/* Registry Items */ }
  < section className = "py-12 px-4" >
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="relative">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              {item.reserved && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>Reserved</span>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => handleEditItem(item)}
                  className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors mr-2"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-pink-600 font-semibold bg-pink-50 px-3 py-1 rounded-full">
                  {item.category}
                </span>
                <span className="text-2xl font-bold text-gray-800">
                  {item.name === "Money" ? "Any Amount" : `KES ${item.price.toLocaleString()}`}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">{item.name}</h3>

              {item.reserved ? (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Reserved by:</p>
                  <p className="font-semibold text-gray-800">{item.reservedBy}</p>
                  <button
                    onClick={() => handleUnreserveItem(item.id)}
                    className="mt-2 text-pink-600 hover:text-pink-700 text-sm font-medium"
                  >
                    Unreserve
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  {selectedItem === item.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleReserveItem(item.id)}
                        disabled={!guestName}
                        className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Confirm Reservation
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(null);
                          setGuestName('');
                        }}
                        className="w-full text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedItem(item.id)}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Reserve This Gift
                    </button>
                  )}
                </div>
              )}

              {item.affiliateLink ? (
                <a
                  href={item.affiliateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 text-pink-600 hover:text-pink-700 font-medium transition-colors"
                >
                  <span>View Product</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="flex items-center justify-center space-x-2 text-gray-400 font-medium">
                  <span>{item.name === "Money" ? "Cash Gift" : "Contact for Details"}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
      </section >

  {/* Add/Edit Item Modal */ }
{
  (showAddForm || editingItem) && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          {editingItem ? 'Edit Gift' : 'Add New Gift'}
        </h3>

        <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gift Name</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
            <input
              type="number"
              step="0.01"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
            <input
              type="url"
              value={newItem.image}
              onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Affiliate Link</label>
            <input
              type="url"
              value={newItem.affiliateLink}
              onChange={(e) => setNewItem({ ...newItem, affiliateLink: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingItem(null);
                setNewItem({ name: '', price: '', image: '', affiliateLink: '', category: 'Kitchen' });
              }}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              {editingItem ? 'Update Gift' : 'Add Gift'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

{/* Footer */ }
<footer className="bg-white/80 backdrop-blur-sm border-t border-pink-100 py-12 px-4 mt-16">
  <div className="max-w-4xl mx-auto text-center">
    <div className="flex items-center justify-center space-x-3 mb-6">
      <Heart className="w-8 h-8 text-pink-500" />
      <h3 className="text-2xl font-bold text-gray-800">Thank You</h3>
      <Heart className="w-8 h-8 text-pink-500" />
    </div>
    <p className="text-gray-600 mb-6">
      Your love and support mean the world to us. We can't wait to celebrate with you!
    </p>
    <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
      <span style={{ fontFamily: 'Great Vibes', fontSize: '1.2rem' }}>Lærke & Micheal</span>
      <span>•</span>
      <span>February 14, 2026</span>
      <span>•</span>
      <span>Limuru, Kenya</span>
    </div>
  </div>
</footer>
    </div >
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);