const { useState, useEffect } = React;

const App = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    image_url: '',
    affiliate_link: '',
    category: 'Kitchen',
    description: '',
    allow_partial_reservations: false,
    quantity: 1
  });

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [reserving, setReserving] = useState(false);

  // Partial reservation states
  const [reservationPercentage, setReservationPercentage] = useState(100);
  const [reservationAmount, setReservationAmount] = useState(0);

  // Currency state
  const [currency, setCurrency] = useState(() => {
    // Load currency preference from localStorage
    return localStorage.getItem('preferredCurrency') || 'KES';
  });

  // Exchange rate constant (1 KES = 0.05 DKK)
  const KES_TO_DKK_RATE = 0.05;

  const categories = ['Kitchen', 'Electronics', 'Audio', 'Outdoor', 'Home', 'Appliances', 'Other'];

  // Currency utility functions
  const formatPrice = (price, curr = currency) => {
    if (curr === 'DKK') {
      const dkkPrice = price * KES_TO_DKK_RATE;
      return `${Math.round(dkkPrice).toLocaleString('da-DK')} kr`;
    }
    return `KES ${price.toLocaleString()}`;
  };

  const getCurrencySymbol = (curr = currency) => {
    return curr === 'DKK' ? 'kr' : 'KES';
  };

  const convertToKES = (amount, fromCurrency) => {
    if (fromCurrency === 'DKK') {
      return amount / KES_TO_DKK_RATE;
    }
    return amount;
  };

  // API base URL
  const API_BASE = window.location.origin + '/api';

  // Fetch gifts from API
  const fetchGifts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/gifts`);
      if (!response.ok) {
        throw new Error('Failed to fetch gifts');
      }
      const data = await response.json();

      // Transform API data to match frontend format
      const transformedItems = data.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image_url,
        affiliateLink: item.affiliate_link,
        category: item.category,
        reserved: item.is_fully_reserved === 1,
        reservedPercentage: item.total_reserved_percentage,
        reservedAmount: item.total_reserved_amount,
        reservations: item.reservations || [],
        description: item.description,
        allowPartialReservations: item.allow_partial_reservations === 1,
        quantity: item.quantity || 1,
        reservedCount: item.reserved_count || 0
      }));

      setItems(transformedItems);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching gifts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load gifts on component mount and check admin status
  useEffect(() => {
    fetchGifts();
    // Check if user is logged in as admin
    const token = localStorage.getItem('adminToken');
    setIsAdmin(!!token);
  }, []);

  // Save currency preference to localStorage
  useEffect(() => {
    localStorage.setItem('preferredCurrency', currency);
  }, [currency]);

  // Toggle currency
  const toggleCurrency = () => {
    setCurrency(prev => prev === 'KES' ? 'DKK' : 'KES');
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (newItem.name && newItem.price && newItem.category) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE}/admin/gifts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newItem.name,
            price: parseFloat(newItem.price),
            image_url: newItem.image_url,
            affiliate_link: newItem.affiliate_link,
            category: newItem.category,
            description: newItem.description,
            allow_partial_reservations: newItem.allow_partial_reservations,
            quantity: parseInt(newItem.quantity) || 1
          })
        });

        if (response.ok) {
          await fetchGifts(); // Refresh the list
          setNewItem({ name: '', price: '', image_url: '', affiliate_link: '', category: 'Kitchen', description: '', allow_partial_reservations: false, quantity: 1 });
          setShowAddForm(false);
        } else {
          const errorData = await response.json();
          alert('Error adding gift: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error adding gift:', error);
        alert('Error adding gift: ' + error.message);
      }
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      price: item.price.toString(),
      image_url: item.image || '',
      affiliate_link: item.affiliateLink || '',
      category: item.category,
      description: item.description || '',
      allow_partial_reservations: item.allowPartialReservations || false,
      quantity: item.quantity || 1
    });
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (editingItem && newItem.name && newItem.price && newItem.category) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE}/admin/gifts/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newItem.name,
            price: parseFloat(newItem.price),
            image_url: newItem.image_url,
            affiliate_link: newItem.affiliate_link,
            category: newItem.category,
            description: newItem.description,
            allow_partial_reservations: newItem.allow_partial_reservations,
            quantity: parseInt(newItem.quantity) || 1
          })
        });

        if (response.ok) {
          await fetchGifts(); // Refresh the list
          setEditingItem(null);
          setNewItem({ name: '', price: '', image_url: '', affiliate_link: '', category: 'Kitchen', description: '', allow_partial_reservations: false, quantity: 1 });
        } else {
          const errorData = await response.json();
          alert('Error updating gift: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error updating gift:', error);
        alert('Error updating gift: ' + error.message);
      }
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Are you sure you want to delete this gift?')) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE}/admin/gifts/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          await fetchGifts(); // Refresh the list
        } else {
          const errorData = await response.json();
          alert('Error deleting gift: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting gift:', error);
        alert('Error deleting gift: ' + error.message);
      }
    }
  };

  const handleReserveItem = async (id) => {
    if (guestName && selectedItem === id) {
      setReserving(true);
      try {
        const response = await fetch(`${API_BASE}/gifts/${id}/reserve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            guestName: guestName,
            guestEmail: guestEmail || null,
            ...(items.find(i => i.id === id)?.allowPartialReservations && {
              percentage: reservationPercentage,
              amount: reservationAmount
            })
          })
        });

        if (response.ok) {
          const result = await response.json();
          await fetchGifts(); // Refresh the list
          setSelectedItem(null);
          setGuestName('');
          setGuestEmail('');
          setReservationPercentage(100);
          setReservationAmount(0);

          const isPartial = reservationPercentage < 100;
          const message = isPartial
            ? `You're a star! Your ${reservationPercentage.toFixed(0)}% (${formatPrice(result.amountReserved)}) means the world to us 💕`
            : 'You\'re amazing! Thank you from our hearts 💕✨';
          alert(message);
        } else {
          const errorData = await response.json();
          alert('Error reserving gift: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error reserving gift:', error);
        alert('Error reserving gift: ' + error.message);
      } finally {
        setReserving(false);
      }
    }
  };

  // Update amount when percentage changes
  const handlePercentageChange = (percentage, itemPrice) => {
    setReservationPercentage(percentage);
    setReservationAmount((percentage * itemPrice) / 100);
  };

  // Update percentage when amount changes
  const handleAmountChange = (amount, itemPrice) => {
    setReservationAmount(amount);
    setReservationPercentage((amount * 100) / itemPrice);
  };

  const handleUnreserveItem = async (id) => {
    if (confirm('Are you sure you want to unreserve this gift?')) {
      try {
        const response = await fetch(`${API_BASE}/gifts/${id}/reserve`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchGifts(); // Refresh the list
        } else {
          const errorData = await response.json();
          alert('Error unreserving gift: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error unreserving gift:', error);
        alert('Error unreserving gift: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💍</div>
          <div className="text-xl text-gray-600">Gathering our wishes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-xl text-red-600 mb-4">Error loading registry</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={fetchGifts}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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

            {/* Currency Toggle */}
            <motion.button
              onClick={toggleCurrency}
              className="bg-white/90 backdrop-blur-sm border-2 border-pink-200 px-4 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2 hover:border-pink-300 group"
              title={`Switch to ${currency === 'KES' ? 'Danish Krone' : 'Kenyan Shilling'}`}
            >
              <div className="flex items-center space-x-2">
                <img
                  src={currency === 'KES' ? "https://flagcdn.com/w40/ke.png" : "https://flagcdn.com/w40/dk.png"}
                  alt={currency}
                  className="w-6 h-4 object-cover rounded-sm shadow-sm"
                />
                <span className="text-sm font-bold text-gray-700">{currency}</span>
              </div>
              <span className="text-xs text-gray-400 group-hover:text-pink-400 transition-colors">→</span>
              <img
                src={currency === 'KES' ? "https://flagcdn.com/w40/dk.png" : "https://flagcdn.com/w40/ke.png"}
                alt="Switch"
                className="w-5 h-3.5 object-cover rounded-sm opacity-40 group-hover:opacity-60 transition-opacity"
              />
            </motion.button>

            {isAdmin && (
              <motion.button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Gift</span>
              </motion.button>
            )}
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
              Help us fill our first home with love, laughter, and all the lovely things ✨
              <br /> We are not deadset on the brands of the gifts - they do not have to be from the exact link, but whichever types you can find in Denmark/Kenya/wherever you are!
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
      </section>

      {/* Registry Items */}
      <section className="py-12 px-4">
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
                  {((item.quantity === 1 && item.reserved) || (item.quantity > 1 && item.reservedCount >= item.quantity) || (item.allowPartialReservations && item.reservedPercentage >= 100)) && (
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                      <Check className="w-4 h-4" />
                      <span>{item.quantity > 1 ? 'All loved up! 💕' : 'Claimed with love ✨'}</span>
                    </div>
                  )}
                  {isAdmin && (
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
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-pink-600 font-semibold bg-pink-50 px-3 py-1 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-lg font-medium text-gray-700">
                      {item.name === "Money" ? "Any Amount" : formatPrice(item.price)}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{item.name}</h3>

                  {/* Show reservation status */}
                  {/* For simple reservations with quantity > 1 - show "X of Y reserved" with list */}
                  {!item.allowPartialReservations && item.quantity > 1 && item.reservedCount > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                          {item.reservedCount >= item.quantity ? '🎉 All claimed!' : '💝 Still available!'}
                        </span>
                        <span className="text-sm font-semibold text-pink-600">
                          {item.reservedCount} of {item.quantity} reserved
                        </span>
                      </div>
                      {item.reservations.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Reserved by:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.reservations.map((res, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 text-green-700"
                              >
                                ✅ {res.guest_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleUnreserveItem(item.id)}
                          className="mt-2 text-pink-600 hover:text-pink-700 text-sm font-medium"
                        >
                          Clear All Reservations
                        </button>
                      )}
                    </div>
                  )}

                  {/* For simple reservations with quantity = 1 - show traditional "Reserved by" */}
                  {!item.allowPartialReservations && item.quantity === 1 && item.reserved && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-600">✅</span>
                        <span className="text-sm text-gray-600">Reserved by:</span>
                        <span className="font-semibold text-gray-800">
                          {item.reservations[0]?.guest_name || 'Someone special'}
                        </span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleUnreserveItem(item.id)}
                          className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                        >
                          Unreserve
                        </button>
                      )}
                    </div>
                  )}

                  {/* Progress bar for partial reservations - only for items that allow it */}
                  {item.allowPartialReservations && item.reservedPercentage > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                          💝 {item.reservedPercentage >= 100 ? 'Fully Gifted!' : 'Partially Gifted'}
                        </span>
                        <span className="text-sm font-semibold text-pink-600">
                          {item.reservedPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-300 relative"
                          style={{ width: `${Math.min(item.reservedPercentage, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
                        </div>
                      </div>
                      {item.reservations.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Lovely contributions from:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.reservations.map((res, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-50 text-pink-700"
                              >
                                ❤️ {res.guest_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {isAdmin && item.reservedPercentage < 100 && (
                        <button
                          onClick={() => handleUnreserveItem(item.id)}
                          className="mt-2 text-pink-600 hover:text-pink-700 text-sm font-medium"
                        >
                          Clear All Reservations
                        </button>
                      )}
                    </div>
                  )}

                  {/* Show reservation UI for: 1) Simple items (qty=1) not reserved, 2) Quantity items (qty>1) not all reserved, 3) Partial items not 100% reserved */}
                  {((!item.allowPartialReservations && item.quantity === 1 && !item.reserved) ||
                    (!item.allowPartialReservations && item.quantity > 1 && item.reservedCount < item.quantity) ||
                    (item.allowPartialReservations && item.reservedPercentage < 100)) && (
                      <div className="mb-4">
                        {selectedItem === item.id ? (
                          <div className="space-y-4 bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-100">
                            <div className="text-center">
                              <h4 className="text-lg font-semibold text-gray-800 mb-1">✨ Share Your Love</h4>
                              <p className="text-sm text-gray-600">Every bit helps build our dream home!</p>
                            </div>

                            <input
                              type="text"
                              placeholder="Your name *"
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white"
                              required
                            />
                            <input
                              type="email"
                              placeholder="Your email (optional)"
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                              className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white"
                            />

                            {/* Cute amount selector - only for partial reservation items */}
                            {item.allowPartialReservations && (
                              <div className="bg-white rounded-lg p-4 border border-pink-200">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-gray-700">💰 Your contribution</span>
                                  <span className="text-sm font-normal text-gray-600">
                                    {reservationPercentage.toFixed(0)}% = {formatPrice(reservationAmount)}
                                  </span>
                                </div>

                                {/* Cute slider */}
                                <div className="relative mb-4">
                                  <input
                                    type="range"
                                    min="1"
                                    max={100 - (item.reservedPercentage || 0)}
                                    value={reservationPercentage}
                                    onChange={(e) => {
                                      const newPercentage = parseFloat(e.target.value);
                                      handlePercentageChange(newPercentage, item.price);
                                    }}
                                    className="w-full h-2 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg appearance-none cursor-pointer slider-pink"
                                    style={{
                                      background: `linear-gradient(to right, #f472b6 0%, #f472b6 ${(reservationPercentage / (100 - (item.reservedPercentage || 0))) * 100}%, #fce7f3 ${(reservationPercentage / (100 - (item.reservedPercentage || 0))) * 100}%, #fce7f3 100%)`
                                    }}
                                  />
                                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>1%</span>
                                    <span className="text-pink-600 font-medium">
                                      {reservationPercentage < 100 ? "💕 Sharing is caring!" : "🎉 Full gift!"}
                                    </span>
                                    <span>{100 - (item.reservedPercentage || 0)}%</span>
                                  </div>
                                </div>

                                {/* Amount input - smaller and less prominent */}
                                <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-pink-100">
                                  <span className="text-xs text-gray-500">Or enter amount:</span>
                                  <div className="relative flex-1">
                                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">{getCurrencySymbol()}</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max={item.price - (item.reservedAmount || 0)}
                                      value={reservationAmount.toFixed(0)}
                                      onChange={(e) => {
                                        const amount = parseFloat(e.target.value) || 0;
                                        handleAmountChange(amount, item.price);
                                      }}
                                      className="w-full pl-8 pr-2 py-1 border border-pink-100 rounded-md focus:ring-1 focus:ring-pink-300 focus:border-transparent text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedItem(null);
                                  setGuestName('');
                                  setGuestEmail('');
                                  setReservationPercentage(100);
                                  setReservationAmount(0);
                                }}
                                className="flex-1 text-gray-600 py-3 rounded-lg font-semibold hover:bg-white transition-colors border border-gray-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReserveItem(item.id)}
                                disabled={!guestName || reserving || (item.allowPartialReservations && reservationPercentage <= 0)}
                                className="flex-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                              >
                                {reserving
                                  ? '💕 Reserving...'
                                  : item.allowPartialReservations
                                    ? `🎁 Gift ${reservationPercentage.toFixed(0)}%`
                                    : '🎁 Gift This to Us'
                                }
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedItem(item.id);
                              if (item.allowPartialReservations) {
                                const remainingPercentage = 100 - (item.reservedPercentage || 0);
                                setReservationPercentage(remainingPercentage);
                                setReservationAmount((remainingPercentage * item.price) / 100);
                              } else {
                                setReservationPercentage(100);
                                setReservationAmount(item.price);
                              }
                            }}
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                          >
                            {item.allowPartialReservations
                              ? (item.reservedPercentage > 0 ? '💕 Add Your Love' : '💕 Contribute Any Amount')
                              : item.quantity > 1
                                ? `Grab One for Us (${item.quantity - item.reservedCount} left!)`
                                : 'Claim This for Us 💝'
                            }
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
      </section>

      {/* Add/Edit Item Modal */}
      {(showAddForm || editingItem) && (
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (KES)</label>
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
                  value={newItem.image_url}
                  onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Affiliate Link</label>
                <input
                  type="url"
                  value={newItem.affiliate_link}
                  onChange={(e) => setNewItem({ ...newItem, affiliate_link: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows="3"
                  placeholder="Optional description for the gift"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Available</label>
                <input
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many of this item can be reserved independently (e.g., 10 plates)
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newItem.allow_partial_reservations}
                    onChange={(e) => setNewItem({ ...newItem, allow_partial_reservations: e.target.checked })}
                    className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    💕 Allow partial reservations
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Perfect for expensive gifts that multiple guests can contribute to together
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    setNewItem({ name: '', price: '', image_url: '', affiliate_link: '', category: 'Kitchen', description: '', allow_partial_reservations: false, quantity: 1 });
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
      )}

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-pink-100 py-12 px-4 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Heart className="w-8 h-8 text-pink-500" />
            <h3 className="text-2xl font-bold text-gray-800">Thank You</h3>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <p className="text-gray-600 mb-6">
            Your love and support mean the world to us. We can't wait to celebrate with you - and maybe even use that fancy kitchen gear! 🥂
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <span style={{ fontFamily: 'Great Vibes', fontSize: '1.2rem' }}>Lærke & Micheal</span>
            <span>•</span>
            <span>February 14, 2026</span>
            <span>•</span>
            <span>Limuru, Kenya</span>
            <span>•</span>
            <a
              href="/admin.html"
              className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              style={{ fontFamily: 'Great Vibes', fontSize: '1.1rem' }}
            >
              💕 For the Lovebirds
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);