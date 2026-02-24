import { useState, useEffect, useRef } from 'react';
import { Check, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useRegistry } from '../contexts/RegistryContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/currency';
import { formatGuestName } from '../utils/privacy';
import { getCurrencySymbol } from '../utils/currency';
import * as api from '../utils/api';

// Payment state machine:
// idle → form → paying → polling → success
//                      ↘ failed | cancelled | timeout

export default function GiftCard({ item, onReserve, onUnreserve, onEdit, onDelete, onPaymentSuccess }) {
  const { slug, registry, activeCurrency } = useRegistry();
  const { isAuthenticated } = useAuth();

  // Form state
  const [selectedForReserve, setSelectedForReserve] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [reserving, setReserving] = useState(false);
  const [reservationPercentage, setReservationPercentage] = useState(100);
  const [reservationAmount, setReservationAmount] = useState(0);

  // M-Pesa payment state
  const [paymentState, setPaymentState] = useState('idle'); // idle | paying | polling | success | failed | cancelled | timeout
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const pollIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);

  // M-Pesa is available when primary currency is KES and server has it configured
  // We detect this from the registry currency — the server will return 503 if not configured
  const mpesaAvailable = registry?.primaryCurrency === 'KES';

  const isFullyReserved =
    (item.quantity === 1 && item.reserved) ||
    (item.quantity > 1 && item.reservedCount >= item.quantity) ||
    (item.allowPartialReservations && item.reservedPercentage >= 100);

  const canReserve =
    (!item.allowPartialReservations && item.quantity === 1 && !item.reserved) ||
    (!item.allowPartialReservations && item.quantity > 1 && item.reservedCount < item.quantity) ||
    (item.allowPartialReservations && item.reservedPercentage < 100);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  // Start polling when we have a checkoutRequestId
  useEffect(() => {
    if (paymentState !== 'polling' || !checkoutRequestId) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const result = await api.getPaymentStatus(checkoutRequestId);
        if (result.status === 'completed') {
          stopPolling();
          setPaymentState('success');
          setPaymentMessage('Payment confirmed! Thank you for your gift.');
          if (onPaymentSuccess) onPaymentSuccess();
        } else if (['failed', 'cancelled', 'timeout'].includes(result.status)) {
          stopPolling();
          setPaymentState(result.status);
          const messages = {
            cancelled: 'Payment was cancelled.',
            timeout: 'M-Pesa prompt timed out — PIN not entered in time.',
            failed: 'Payment failed. Please try again.'
          };
          setPaymentMessage(result.message || messages[result.status] || 'Payment unsuccessful.');
        }
        // 'pending' → keep polling
      } catch {
        // Network error — keep polling silently
      }
    }, 3000);

    // Auto-stop after 5 minutes (M-Pesa STK expires at ~5 min)
    pollTimeoutRef.current = setTimeout(() => {
      if (pollIntervalRef.current) {
        stopPolling();
        setPaymentState('timeout');
        setPaymentMessage('M-Pesa prompt expired — the PIN window closed. Please try again.');
      }
    }, 5 * 60 * 1000);

    return () => stopPolling();
  }, [paymentState, checkoutRequestId]);

  function stopPolling() {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (pollTimeoutRef.current) { clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null; }
  }

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
    setGuestPhone('');
    setReservationPercentage(100);
    setReservationAmount(0);
    setPaymentState('idle');
    setCheckoutRequestId(null);
    setPaymentMessage('');
    stopPolling();
  };

  const handleReserve = async () => {
    if (!guestName) return;
    setReserving(true);
    try {
      await onReserve(item.id, {
        guestName,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
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

  const handleMpesaPay = async () => {
    if (!guestName || !guestPhone) return;
    setPaymentState('paying');
    try {
      const result = await api.initiatePayment(slug, item.id, {
        guestName,
        guestEmail: guestEmail || null,
        guestPhone,
        ...(item.allowPartialReservations && {
          percentage: reservationPercentage,
          amount: reservationAmount,
        }),
      });
      setCheckoutRequestId(result.checkoutRequestId);
      setPaymentState('polling');
    } catch (err) {
      setPaymentState('failed');
      setPaymentMessage(err.message || 'Failed to initiate M-Pesa payment.');
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

  const isPaymentTerminal = ['success', 'failed', 'cancelled', 'timeout'].includes(paymentState);

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

        {/* Reservation / Payment form */}
        {canReserve && (
          <div className="mb-4">
            {!selectedForReserve ? (
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
            ) : (
              <div className="space-y-4 bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 p-4 rounded-xl border border-[var(--color-primary)]/10">

                {/* ── M-Pesa: Waiting for PIN ── */}
                {(paymentState === 'paying' || paymentState === 'polling') && (
                  <div className="text-center py-2 space-y-3">
                    <div className="text-3xl animate-bounce">📱</div>
                    <p className="font-semibold text-gray-800">Check your phone!</p>
                    <p className="text-sm text-gray-600">
                      An M-Pesa prompt has been sent to <span className="font-medium">{guestPhone}</span>
                    </p>
                    <p className="text-xs text-gray-500">Enter your M-Pesa PIN to complete the payment</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full animate-pulse w-full" />
                    </div>
                    <p className="text-xs text-gray-400">This prompt expires in 5 minutes</p>
                    <button
                      onClick={handleCancel}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* ── M-Pesa: Success ── */}
                {paymentState === 'success' && (
                  <div className="text-center py-2 space-y-2">
                    <div className="text-4xl">🎉</div>
                    <p className="font-semibold text-green-800">Payment confirmed!</p>
                    <p className="text-sm text-green-700">{paymentMessage}</p>
                    <button
                      onClick={handleCancel}
                      className="mt-2 text-sm text-[var(--color-primary)] font-medium hover:underline"
                    >
                      Done
                    </button>
                  </div>
                )}

                {/* ── M-Pesa: Failed / Cancelled / Timeout ── */}
                {isPaymentTerminal && paymentState !== 'success' && (
                  <div className="text-center py-2 space-y-2">
                    <div className="text-3xl">
                      {paymentState === 'cancelled' ? '✋' : paymentState === 'timeout' ? '⏱️' : '😔'}
                    </div>
                    <p className="font-semibold text-red-800 capitalize">
                      {paymentState === 'cancelled' ? 'Payment Cancelled' :
                       paymentState === 'timeout' ? 'Prompt Expired' : 'Payment Failed'}
                    </p>
                    <p className="text-sm text-red-600">{paymentMessage}</p>
                    <div className="flex justify-center gap-3 pt-1">
                      <button
                        onClick={() => {
                          setPaymentState('idle');
                          setCheckoutRequestId(null);
                          setPaymentMessage('');
                        }}
                        className="text-sm bg-[var(--color-primary)] text-white px-4 py-1.5 rounded-lg font-medium hover:opacity-90"
                      >
                        Try Again
                      </button>
                      <button onClick={handleCancel} className="text-sm text-gray-500 hover:text-gray-700 underline">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Form (shown when not in a payment state) ── */}
                {paymentState === 'idle' && (
                  <>
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

                    {/* M-Pesa phone field */}
                    {mpesaAvailable && (
                      <input
                        type="tel"
                        placeholder="M-Pesa phone e.g. 0712 345 678"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white"
                      />
                    )}

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

                    {/* Action buttons */}
                    <div className="space-y-2">
                      {/* M-Pesa pay button — shown when phone is entered */}
                      {mpesaAvailable && guestPhone && (
                        <button
                          onClick={handleMpesaPay}
                          disabled={!guestName || (item.allowPartialReservations && reservationPercentage <= 0)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <span>🇰🇪</span>
                          <span>
                            Pay {item.allowPartialReservations
                              ? `KES ${Math.round(reservationAmount).toLocaleString()}`
                              : displayPrice(item.price)} via M-Pesa
                          </span>
                        </button>
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
                          className={`flex-[2] py-3 px-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                            mpesaAvailable && guestPhone
                              ? 'text-gray-600 bg-white border border-gray-200 hover:border-[var(--color-primary)]/30 text-sm'
                              : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:shadow-lg'
                          }`}
                        >
                          {reserving
                            ? 'Reserving...'
                            : mpesaAvailable && guestPhone
                              ? 'Reserve without payment'
                              : item.allowPartialReservations
                                ? `Gift ${reservationPercentage.toFixed(0)}%`
                                : 'Gift This to Us'}
                        </button>
                      </div>

                      {mpesaAvailable && !guestPhone && (
                        <p className="text-center text-xs text-gray-400 pt-1">
                          Add your M-Pesa number above to pay now
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
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
