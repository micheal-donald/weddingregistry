import { useState, useEffect, useCallback } from 'react';
import { getGifts } from '../utils/api';

export function useGifts(slug) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGifts = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const data = await getGifts(slug);

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
        allowPartialReservations: item.allow_partial_reservations === 1 || item.allow_partial_reservations === true,
        quantity: item.quantity || 1,
        reservedCount: item.reserved_count || 0,
      }));

      setItems(transformedItems);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  return { items, loading, error, refetch: fetchGifts };
}
