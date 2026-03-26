'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { Button } from '@/components/ui/button/button';
import styles from '../../new/new-product.module.css';

interface Category {
  id: number;
  categoryName: string;
}

interface AgeRange {
  id: number;
  label: string;
}

interface ProductDetails {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  price: string | number;
  stockQuantity: number;
  categoryId: number | null;
  ageRangeId: number | null;
}

interface UpdateProductPayload {
  name?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  categoryId?: number;
  ageRangeId?: number;
  stockQuantity?: number;
}

export default function SellerEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params?.id);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<UpdateProductPayload>({
    name: '',
    description: '',
    imageUrl: '',
    price: 0,
    categoryId: 0,
    ageRangeId: 0,
    stockQuantity: 1,
  });
  const [error, setError] = useState('');

  const { data: product, isLoading: loadingProduct, isError: productError } = useQuery<ProductDetails>({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data } = await apiClient.get<ProductDetails>(`/products/${productId}`);
      return data;
    },
    enabled: !!productId,
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl || '',
        price: Number(product.price),
        categoryId: product.categoryId || 0,
        ageRangeId: product.ageRangeId || 0,
        stockQuantity: product.stockQuantity,
      });
    }
  }, [product]);

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

  const mutation = useMutation<
    unknown,
    AxiosError<{ message?: string }>,
    UpdateProductPayload
  >({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch(`/products/${productId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      router.push('/seller/dashboard');
    },
    onError: (err) => {
      setError(err.response?.data?.message ?? 'Failed to update product. Please try again.');
    },
  });

  function updateField<K extends keyof UpdateProductPayload>(
    field: K,
    value: UpdateProductPayload[K],
  ): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    
    // Convert to the correct types before sending
    const payload: UpdateProductPayload = {
      name: form.name,
      description: form.description,
      imageUrl: form.imageUrl,
      price: Number(form.price),
      categoryId: Number(form.categoryId),
      ageRangeId: Number(form.ageRangeId),
      stockQuantity: Number(form.stockQuantity),
    };

    if (!payload.name?.trim() || !payload.description?.trim() || !payload.imageUrl?.trim()) {
      setError('Name, description, and image URL are required.');
      return;
    }
    if (!payload.categoryId || !payload.ageRangeId) {
      setError('Please select a category and age range.');
      return;
    }
    mutation.mutate(payload);
  }

  if (!productId || isNaN(productId)) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>Invalid Product ID.</p>
      </div>
    );
  }

  if (loadingProduct || loadingCategories || loadingAgeRanges) {
    return (
      <div className={styles.page}>
        <Skeleton height="2.5rem" width="14rem" />
        <div style={{ marginTop: 'var(--space-8)' }}>
          <Skeleton height="16rem" />
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Edit Product</h1>
          <p className={styles.subtitle}>We couldn&apos;t load this product right now. Please try again later.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/seller/dashboard')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Product</h1>
        <p className={styles.subtitle}>Update details for P-{product.id.toString().padStart(4, '0')}</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <p className={styles.error}>{error}</p>
        )}

        <label className={styles.fieldLabel}>
          Product Name
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={styles.input}
          />
        </label>

        <label className={styles.fieldLabel}>
          Description
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className={styles.textarea}
            rows={4}
          />
        </label>

        <label className={styles.fieldLabel}>
          Product Image
          <div className={styles.fileUploadRow}>
            <span className={styles.fileUploadName}>
              {form.imageUrl ? form.imageUrl.split('/').pop() : 'No file chosen'}
            </span>
            <label htmlFor="productImageUpload" className={styles.fileUploadLabel}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Choose File
            </label>
            <input
              id="productImageUpload"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                  });
                  const data = await res.json();
                  if (data.success) {
                    updateField('imageUrl', data.url);
                  } else {
                    setError('Upload failed: ' + data.message);
                  }
                } catch (err) {
                  setError('Upload error: ' + String(err));
                }
              }}
              className={styles.fileUploadHidden}
            />
            {form.imageUrl && (
              <span className={styles.fileUploadStatus}>✓ Uploaded</span>
            )}
            {form.imageUrl && (
              <button type="button" onClick={async () => {
                const oldUrl = form.imageUrl;
                updateField('imageUrl', '');
                if (oldUrl && oldUrl.startsWith('/uploads/')) {
                  fetch(`/api/upload?url=${encodeURIComponent(oldUrl)}`, { method: 'DELETE' }).catch(console.error);
                }
              }} style={{ background: 'none', border: 'none', color: 'var(--color-error, #ef4444)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', marginLeft: '8px' }}>
                Remove Image
              </button>
            )}
          </div>
          {form.imageUrl && (
            <div className={styles.fileUploadPreview}>
              <img src={form.imageUrl.startsWith('/') || form.imageUrl.startsWith('http') ? form.imageUrl : `/${form.imageUrl}`} alt="Preview" />
            </div>
          )}
        </label>

        <div className={styles.gridRow}>
          <label className={styles.fieldLabel}>
            Price (₱)
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => updateField('price', Number(e.target.value))}
              className={styles.input}
            />
          </label>

          <label className={styles.fieldLabel}>
            Stock Quantity
            <input
              type="number"
              min={0}
              step="1"
              value={form.stockQuantity ?? 0}
              onChange={(e) => updateField('stockQuantity', Number(e.target.value))}
              className={styles.input}
            />
          </label>
        </div>

        <div className={styles.gridRowTwo}>
          <label className={styles.fieldLabel}>
            Category
            <select
              value={form.categoryId || ''}
              onChange={(e) => updateField('categoryId', Number(e.target.value))}
              className={styles.select}
            >
              <option value="">Select category</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.fieldLabel}>
            Age Range
            <select
              value={form.ageRangeId || ''}
              onChange={(e) => updateField('ageRangeId', Number(e.target.value))}
              className={styles.select}
            >
              <option value="">Select age range</option>
              {ageRanges?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.submitRow}>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => router.push('/seller/dashboard')}
            disabled={mutation.isPending}
            style={{ marginRight: 'var(--space-4)' }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
