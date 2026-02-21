import { useState, useEffect } from 'react';
import { useRegistry } from '../contexts/RegistryContext';

export default function AddEditGiftModal({ editingItem, onSubmit, onClose }) {
  const { registry } = useRegistry();
  const categories = registry?.categories || ['Kitchen', 'Electronics', 'Home', 'Bedroom', 'Bathroom', 'Other'];

  const [form, setForm] = useState({
    name: '', price: '', image_url: '', affiliate_link: '',
    category: categories[0] || 'Kitchen', description: '',
    allow_partial_reservations: false, quantity: 1,
  });

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name,
        price: editingItem.price.toString(),
        image_url: editingItem.image || '',
        affiliate_link: editingItem.affiliateLink || '',
        category: editingItem.category,
        description: editingItem.description || '',
        allow_partial_reservations: editingItem.allowPartialReservations || false,
        quantity: editingItem.quantity || 1,
      });
    }
  }, [editingItem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return;
    onSubmit({
      name: form.name,
      price: parseFloat(form.price),
      image_url: form.image_url,
      affiliate_link: form.affiliate_link,
      category: form.category,
      description: form.description,
      allow_partial_reservations: form.allow_partial_reservations,
      quantity: parseInt(form.quantity) || 1,
    });
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          {editingItem ? 'Edit Gift' : 'Add New Gift'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gift Name</label>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price ({registry?.primaryCurrency || 'USD'})</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
            <input type="url" value={form.image_url} onChange={(e) => update('image_url', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Affiliate Link</label>
            <input type="url" value={form.affiliate_link} onChange={(e) => update('affiliate_link', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select value={form.category} onChange={(e) => update('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              rows="3" placeholder="Optional description" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Available</label>
            <input type="number" min="1" value={form.quantity} onChange={(e) => update('quantity', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" required />
            <p className="text-xs text-gray-500 mt-1">How many of this item can be reserved independently</p>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={form.allow_partial_reservations}
                onChange={(e) => update('allow_partial_reservations', e.target.checked)}
                className="w-4 h-4 text-[var(--color-primary)] bg-gray-100 border-gray-300 rounded focus:ring-[var(--color-primary)] focus:ring-2" />
              <span className="text-sm font-medium text-gray-700">Allow partial reservations</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">Multiple guests can contribute to this gift</p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
              {editingItem ? 'Update Gift' : 'Add Gift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
