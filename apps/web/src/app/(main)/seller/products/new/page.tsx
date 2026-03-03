'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import styles from './new-product.module.css';

interface Category {
  id: number;
  categoryName: string;
}

interface AgeRange {
  id: number;
  label: string;
}

interface CreateProductPayload {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  categoryId: number;
  ageRangeId: number;
  stockQuantity?: number;
}

export default function SellerNewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateProductPayload>({
    name: '',
    description: '',
    imageUrl: '',
    price: 0,
    categoryId: 0,
    ageRangeId: 0,
    stockQuantity: 1,
  });
  const [error, setError] = useState('');

  const { data: categories, isLoading: loadingCategories, isError: categoriesError } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<Category[]>('/categories');
      return data;
    },
  });

  const { data: ageRanges, isLoading: loadingAgeRanges, isError: ageRangesError } = useQuery<AgeRange[]>({
    queryKey: ['age-ranges'],
    queryFn: async () => {
      const { data } = await apiClient.get<AgeRange[]>('/categories/age-ranges');
      return data;
    },
  });

  const mutation = useMutation<
    unknown,
    AxiosError<{ message?: string }>,
    CreateProductPayload
  >({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/products', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      router.push('/seller/dashboard');
    },
    onError: (err) => {
      setError(err.response?.data?.message ?? 'Failed to create product. Please try again.');
    },
  });

  function updateField<K extends keyof CreateProductPayload>(
    field: K,
    value: CreateProductPayload[K],
  ): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

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
    mutation.mutate(form);
  }

  if (loadingCategories || loadingAgeRanges) {
    return (
      <div className={styles.page}>
        <Skeleton height="2.5rem" width="14rem" />
        <div style={{ marginTop: 'var(--space-8)' }}>
          <Skeleton height="16rem" />
        </div>
      </div>
    );
  }

  if (categoriesError || ageRangesError) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Add New Product</h1>
          <p className={styles.subtitle}>We couldn&apos;t load categories right now. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Add New Product</h1>
        <p className={styles.subtitle}>Create a new item for your shop</p>
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
          Image URL
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => updateField('imageUrl', e.target.value)}
            className={styles.input}
          />
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

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save Product'}
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => router.push('/seller/dashboard')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

