import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { RegistryProvider, useRegistry } from '../contexts/RegistryContext';
import { useGifts } from '../hooks/useGifts';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import GiftCard from '../components/GiftCard';
import AddEditGiftModal from '../components/AddEditGiftModal';
import * as api from '../utils/api';

function RegistryContent() {
  const { slug, registry, loading: configLoading, error: configError } = useRegistry();
  const { items, loading: giftsLoading, error: giftsError, refetch } = useGifts(slug);
  const { isAuthenticated } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const loading = configLoading || giftsLoading;
  const error = configError || giftsError;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💍</div>
          <div className="text-dark/50 font-sans">Gathering our wishes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-xl text-red-600 mb-4">Error loading registry</div>
          <div className="text-dark/50 mb-4">{error}</div>
          <button onClick={refetch} className="bg-primary text-background px-6 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const handleReserve = async (giftId, data) => {
    const result = await api.reserveGift(slug, giftId, data);
    await refetch();
    return result;
  };

  const handleUnreserve = async (giftId) => {
    if (!confirm('Are you sure you want to unreserve this gift?')) return;
    await api.unreserveGift(slug, giftId);
    await refetch();
  };

  const handleAddGift = async (data) => {
    await api.addGift(slug, data);
    await refetch();
    setShowAddForm(false);
  };

  const handleUpdateGift = async (data) => {
    if (!editingItem) return;
    await api.updateGift(slug, editingItem.id, data);
    await refetch();
    setEditingItem(null);
  };

  const handleDeleteGift = async (giftId) => {
    if (!confirm('Are you sure you want to delete this gift?')) return;
    await api.deleteGift(slug, giftId);
    await refetch();
  };

  const reservedCount = items.filter(item => item.reserved).length;

  return (
    <div className="min-h-screen bg-background">
      <Header onAddGift={isAuthenticated ? () => setShowAddForm(true) : null} />
      <HeroSection totalItems={items.length} reservedItems={reservedCount} />

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-dark mb-2">No gifts yet</h3>
              <p className="text-dark/50">This registry is still being set up. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item) => (
                <GiftCard
                  key={item.id}
                  item={item}
                  onReserve={handleReserve}
                  onUnreserve={isAuthenticated ? handleUnreserve : null}
                  onEdit={isAuthenticated ? setEditingItem : null}
                  onDelete={isAuthenticated ? handleDeleteGift : null}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {(showAddForm || editingItem) && (
        <AddEditGiftModal
          editingItem={editingItem}
          onSubmit={editingItem ? handleUpdateGift : handleAddGift}
          onClose={() => { setShowAddForm(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}

export default function RegistryPage() {
  const { slug } = useParams();

  return (
    <RegistryProvider slug={slug}>
      <RegistryContent />
    </RegistryProvider>
  );
}
