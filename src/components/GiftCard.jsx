import { useState } from 'react';
import { Check, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useRegistry } from '../contexts/RegistryContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/currency';
import { formatGuestName } from '../utils/privacy';
import { getCurrencySymbol } from '../utils/currency';

export default function GiftCard({ item, onReserve, onUnreserve, onEdit, onDelete }) {
  const { registry, activeCurrency } = useRegistry();
  const { isAuthenticated } = useAuth();

  const [selectedForReserve, setSelectedForReserve] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [reserving, setReserving] = useState(false);
  const [reservationPercentage, setReservationPercentage] = useState(100);
  const [reservationAmount, setReservationAmount] = useState(0);

  const isFullyReserved =
    (item.quantity === 1 && item.reserved) ||
    (item.quantity > 1 && item.reservedCount >= item.quantity) ||
    (item.allowPartialReservations && item.reservedPercentage >= 100);

  const canReserve =
    (!item.allowPartialReservations && item.quantity === 1 && !item.reserved) ||
    (!item.allowPartialReservations && item.quantity > 1 && item.reservedCount < item.quantity) ||
    (item.allowPartialReservations && item.reservedPercentage < 100);

  const displayPrice = (price) => {
    if (item.name === 'Money') return 'Any Amount';
    if (!registry) return price;
    const isPrimary = activeCurrency === registry.primaryCurrency;
    return formatPrice(
      price,
      registry.primaryCurrency,
      !isPrimary ? registry.exchangeRate : null,
      !isPrimary ? registry.secondaryCurrency : null
    );
  };

  const handleSelectReserve = () => {
    setSelectedForReserve(true);
    if (item.allowPartialReservations) {
      const remaining = 100 - (item.reservedPercentage || 0);
      setReservationPercentage(remaining);
      setReservationAmount((remaining * item.price) / 100);
    } else {
      setReservationPercentage(100);
      setReservationAmount(item.price);
    }
  };

  const handleCancel = () => {
    setSelectedForReserve(false);
    setGuestName('');
    setGuestEmail('');
    setReservationPercentage(100);
    setReservationAmount(0);
  };

  const handleReserve = async () => {
    if (!guestName) return;
    setReserving(true);
    try {
      await onReserve(item.id, {
        guestName,
        guestEmail: guestEmail || null,
        ...(item.allowPartialReservations && {
          percentage: reservationPercentage,
          amount: reservationAmount,
        }),
      });
      handleCancel();
    } finally {
      setReserving(false);
    }
  };

  const handlePercentageChange = (pct) => {
    setReservationPercentage(pct);
    setReservationAmount((pct * item.price) / 100);
  };

  const handleAmountChange = (amt) => {
    setReservationAmount(amt);
    setReservationPercentage((amt * 100) / item.price);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Image */}
      <div className="relative">
        <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
        {isFullyReserved && (
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Check className="w-4 h-4" />
            <span>{item.quantity > 1 ? 'All loved up!' : 'Claimed with love'}</span>
          </div>
        )}
        {isAuthenticated && (
          <div className="absolute top-4 right-4 flex space-x-2">
            {onEdit && (
              <button onClick={() => onEdit(item)} className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors">
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(item.id)} className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Category + Price */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--color-primary)] font-semibold bg-[var(--color-primary)]/5 px-3 py-1 rounded-full">
            {item.category}
          </span>
          <span className="text-lg font-medium text-gray-700">{displayPrice(item.price)}</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-3">{item.name}</h3>

        {/* Quantity-based reservation status */}
        {!item.allowPartialReservations && item.quantity > 1 && item.reservedCount > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                {item.reservedCount >= item.quantity ? 'All claimed!' : 'Still available!'}
              </span>
              <span className="text-sm font-semibold text-[var(--color-primary)]">
                {item.reservedCount} of {item.quantity} reserved
              </span>
            </div>
            {item.reservations.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Reserved by:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.reservations.map((res, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 text-green-700">
                      {formatGuestName(res.guest_name)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {isAuthenticated && onUnreserve && (
              <button onClick={() => onUnreserve(item.id)} className="mt-2 text-[var(--color-primary)] hover:text-[var(--color-secondary)] text-sm font-medium">
                Clear All Reservations
              </button>
            )}
          </div>
        )}

        {/* Simple single-item reserved status */}
        {!item.allowPartialReservations && item.quantity === 1 && item.reserved && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-600">Reserved by:</span>
              <span className="font-semibold text-gray-800">
                {formatGuestName(item.reservations[0]?.guest_name)}
              </span>
            </div>
            {isAuthenticated && onUnreserve && (
              <button onClick={() => onUnreserve(item.id)} className="text-[var(--color-primary)] hover:text-[var(--color-secondary)] text-sm font-medium">
                Unreserve
              </button>
            )}
          </div>
        )}

        {/* Partial reservation progress */}
        {item.allowPartialReservations && item.reservedPercentage > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                {item.reservedPercentage >= 100 ? 'Fully Gifted!' : 'Partially Gifted'}
              </span>
              <span className="text-sm font-semibold text-[var(--color-primary)]">
                {item.reservedPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(item.reservedPercentage, 100)}%` }}
              />
            </div>
            {item.reservations.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Contributions from:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.reservations.map((res, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[var(--color-primary)]/5 text-[var(--color-primary)]">
                      {formatGuestName(res.guest_name)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {isAuthenticated && onUnreserve && item.reservedPercentage < 100 && (
              <button onClick={() => onUnreserve(item.id)} className="mt-2 text-[var(--color-primary)] hover:text-[var(--color-secondary)] text-sm font-medium">
                Clear All Reservations
              </button>
            )}
          </div>
        )}

        {/* Reservation form */}
        {canReserve && (
          <div className="mb-4">
            {selectedForReserve ? (
              <div className="space-y-4 bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 p-4 rounded-xl border border-[var(--color-primary)]/10">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-800 mb-1">Share Your Love</h4>
                  <p className="text-sm text-gray-600">Every bit helps build our dream home!</p>
                </div>

                <input
                  type="text"
                  placeholder="Your name *"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-primary)]/20 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white"
                  required
                />
                <input
                  type="email"
                  placeholder="Your email (optional)"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-primary)]/20 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white"
                />

                {/* Partial reservation slider */}
                {item.allowPartialReservations && (
                  <div className="bg-white rounded-lg p-4 border border-[var(--color-primary)]/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Your contribution</span>
                      <span className="text-sm font-normal text-gray-600">
                        {reservationPercentage.toFixed(0)}% = {displayPrice(reservationAmount)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={100 - (item.reservedPercentage || 0)}
                      value={reservationPercentage}
                      onChange={(e) => handlePercentageChange(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${(reservationPercentage / (100 - (item.reservedPercentage || 0))) * 100}%, #fce7f3 ${(reservationPercentage / (100 - (item.reservedPercentage || 0))) * 100}%, #fce7f3 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1%</span>
                      <span className="text-[var(--color-primary)] font-medium">
                        {reservationPercentage < 100 ? "Sharing is caring!" : "Full gift!"}
                      </span>
                      <span>{100 - (item.reservedPercentage || 0)}%</span>
                    </div>

                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-[var(--color-primary)]/10">
                      <span className="text-xs text-gray-500">Or enter amount:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                          {getCurrencySymbol(activeCurrency || registry?.primaryCurrency)}
                        </span>
                        <input
                          type="number"
                          min="1"
                          max={item.price - (item.reservedAmount || 0)}
                          value={reservationAmount.toFixed(0)}
                          onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-2 py-1 border border-[var(--color-primary)]/10 rounded-md focus:ring-1 focus:ring-[var(--color-primary)] focus:border-transparent text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 text-gray-600 py-3 rounded-lg font-semibold hover:bg-white transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReserve}
                    disabled={!guestName || reserving || (item.allowPartialReservations && reservationPercentage <= 0)}
                    className="flex-[2] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {reserving ? 'Reserving...' : item.allowPartialReservations ? `Gift ${reservationPercentage.toFixed(0)}%` : 'Gift This to Us'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSelectReserve}
                className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                {item.allowPartialReservations
                  ? (item.reservedPercentage > 0 ? 'Add Your Love' : 'Contribute Any Amount')
                  : item.quantity > 1
                    ? `Grab One for Us (${item.quantity - item.reservedCount} left!)`
                    : 'Claim This for Us'}
              </button>
            )}
          </div>
        )}

        {/* Affiliate link */}
        {item.affiliateLink ? (
          <a
            href={item.affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 text-[var(--color-primary)] hover:text-[var(--color-secondary)] font-medium transition-colors"
          >
            <span>View Product</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <div className="flex items-center justify-center space-x-2 text-gray-400 font-medium">
            <span>{item.name === 'Money' ? 'Cash Gift' : 'Contact for Details'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
