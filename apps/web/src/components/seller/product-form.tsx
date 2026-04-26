'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { Button } from '@/components/ui/button/button';

interface Category {
  id: number;
  categoryName: string;
}

interface AgeRange {
  id: number;
  label: string;
}

export interface ProductData {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number | string;
  stockQuantity?: number;
  categoryId?: number;
  ageRangeId?: number;
}

interface ProductFormProps {
  initialData?: ProductData | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ProductForm({ initialData, onCancel, onSuccess }: ProductFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    imageUrl: initialData?.imageUrl ?? '',
    price: initialData?.price ? String(initialData.price) : '',
    categoryId: initialData?.categoryId ?? 0,
    ageRangeId: initialData?.ageRangeId ?? 0,
    stockQuantity: initialData?.stockQuantity ? String(initialData.stockQuantity) : '1',
  });
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (data.success && data.url) {
        setForm(f => ({ ...f, imageUrl: data.url }));
      } else {
        setError(data.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const { data: categories, isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<Category[]>('/categories');
      return data;
    },
  });

  const { data: ageRanges, isLoading: loadingAgeRanges } = useQuery<AgeRange[]>({
    queryKey: ['age-ranges'],
    queryFn: async () => {
      const { data } = await apiClient.get<AgeRange[]>('/categories/age-ranges');
      return data;
    },
  });

  const mutation = useMutation<unknown, AxiosError<{ message?: string }>, any>({
    mutationFn: async (payload) => {
      if (initialData?.id) {
        const { data } = await apiClient.patch(`/products/${initialData.id}`, payload);
        return data;
      } else {
        const { data } = await apiClient.post('/products', payload);
        return data;
      }
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err) => {
      setError(err.response?.data?.message ?? `Failed to ${initialData?.id ? 'update' : 'create'} product.`);
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.description.trim() || !form.imageUrl.trim()) {
      setError('Name, description, and image URL are required.');
      return;
    }
    if (!form.categoryId || !form.ageRangeId) {
      setError('Please select a category and age range.');
      return;
    }
    
    mutation.mutate({
      name: form.name,
      description: form.description,
      imageUrl: form.imageUrl,
      price: Number(form.price),
      categoryId: Number(form.categoryId),
      ageRangeId: Number(form.ageRangeId),
      stockQuantity: Number(form.stockQuantity),
    });
  }

  if (loadingCategories || loadingAgeRanges) {
    return <Skeleton height="20rem" style={{ borderRadius: 'var(--radius-md)', marginTop: 'var(--space-6)' }} />;
  }

  return (
    <div style={{ marginTop: 'var(--space-8)', backgroundColor: 'var(--color-cream)', padding: 'var(--space-8)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)' }}>
          {initialData?.id ? 'Edit Product' : 'Add New Product'}
        </h2>
        <Button variant="secondary" onClick={onCancel} disabled={mutation.isPending}>
          Back to Dashboard
        </Button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {error && (
          <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>Product Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ padding: 'var(--space-3)', border: '1px solid var(--color-input-border, #ccc)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-background, #fff)' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>Price (PHP)</span>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
              style={{ padding: 'var(--space-3)', border: '1px solid var(--color-input-border, #ccc)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-background, #fff)' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>Category</span>
            <select
              value={form.categoryId}
              onChange={(e) => setForm(f => ({ ...f, categoryId: Number(e.target.value) }))}
              style={{ padding: 'var(--space-3)', border: '1px solid var(--color-input-border, #ccc)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-cream)' }}
            >
              <option value={0} disabled>Select Category</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.categoryName}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>Age Range</span>
            <select
              value={form.ageRangeId}
              onChange={(e) => setForm(f => ({ ...f, ageRangeId: Number(e.target.value) }))}
              style={{ padding: 'var(--space-3)', border: '1px solid var(--color-input-border, #ccc)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-cream)' }}
            >
              <option value={0} disabled>Select Age Range</option>
              {ageRanges?.map(a => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>Stock Quantity</span>
            <input
              type="number"
              value={form.stockQuantity}
              onChange={(e) => setForm(f => ({ ...f, stockQuantity: e.target.value }))}
              style={{ padding: 'var(--space-3)', border: '1px solid var(--color-input-border, #ccc)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-background, #fff)' }}
            />
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>Product Image</span>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {form.imageUrl ? (
              <div style={{ flexShrink: 0, width: '100px', height: '100px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-input-border, #ccc)', backgroundColor: '#eee', position: 'relative' }}>
                <img src={form.imageUrl.startsWith('http') || form.imageUrl.startsWith('data:') || form.imageUrl.startsWith('/') ? form.imageUrl : `/${form.imageUrl}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = ''; e.currentTarget.style.display = 'none'; }} />
                <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>×</button>
              </div>
            ) : (
              <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{ padding: 'var(--space-3)', border: '1px dashed var(--color-input-border, #ccc)', borderRadius: 'var(--radius-md)', width: '100%', cursor: 'pointer', backgroundColor: 'var(--color-background, #fff)' }} />
                {isUploading && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Uploading...</p>}
              </div>
            )}
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              placeholder="Or paste an image URL..."
              style={{ flex: '2 1 auto', padding: 'var(--space-3)', border: '1px solid var(--color-input-border, #ccc)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-background, #fff)', minWidth: '200px' }}
            />
          </div>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            rows={4}
            style={{ padding: 'var(--space-3)', border: '1px solid var(--color-input-border, #ccc)', borderRadius: 'var(--radius-md)', resize: 'vertical', backgroundColor: 'var(--color-background, #fff)' }}
          />
        </label>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
