'use client';

import { useEffect, useRef, useState } from 'react';
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

/** Delete a previously-uploaded local file (only /uploads/ paths — never external URLs). */
async function deleteUploadedFile(url: string): Promise<void> {
  if (!url || !url.startsWith('/uploads/')) return;
  try {
    await fetch(`/api/upload?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
  } catch {
    // Non-critical — file might already be gone
  }
}

export function ProductForm({ initialData, onCancel, onSuccess }: ProductFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    imageUrl: initialData?.imageUrl ?? '', // persisted URL (already saved or pasted)
    price: initialData?.price ? String(initialData.price) : '',
    categoryId: initialData?.categoryId ?? 0,
    ageRangeId: initialData?.ageRangeId ?? 0,
    stockQuantity: initialData?.stockQuantity ? String(initialData.stockQuantity) : '1',
  });

  // Pending file — selected but NOT yet uploaded
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(''); // local object URL for preview only
  const objectUrlRef = useRef<string>(''); // track for cleanup

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  /** Called when user picks a file — only creates a local preview, no upload yet. */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke any previous object URL to avoid memory leaks
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const local = URL.createObjectURL(file);
    objectUrlRef.current = local;
    setPendingFile(file);
    setPreviewUrl(local);
    // Clear any manually-pasted URL since a file takes precedence
    setForm(f => ({ ...f, imageUrl: '' }));
  };

  /** Clear the pending file selection without uploading anything. */
  const clearPendingFile = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = '';
    setPendingFile(null);
    setPreviewUrl('');
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
      setIsSaving(false);
    },
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    // Determine the final image URL: pending file > pasted URL > existing URL
    const effectiveImageUrl = previewUrl ? null : form.imageUrl; // null means we need to upload

    if (!form.name.trim() || !form.description.trim()) {
      setError('Name and description are required.');
      return;
    }
    if (!pendingFile && !form.imageUrl.trim()) {
      setError('Please choose an image file or paste an image URL.');
      return;
    }
    if (!form.categoryId || !form.ageRangeId) {
      setError('Please select a category and age range.');
      return;
    }

    setIsSaving(true);

    let finalImageUrl = form.imageUrl;

    // Upload pending file only now, at save time
    if (pendingFile) {
      try {
        const formData = new FormData();
        formData.append('file', pendingFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await res.json();
        if (!uploadData.success || !uploadData.url) {
          setError(uploadData.message || 'Image upload failed. Please try again.');
          setIsSaving(false);
          return;
        }
        finalImageUrl = uploadData.url;

        // If editing and the old image was a local upload, delete it
        if (initialData?.imageUrl && initialData.imageUrl.startsWith('/uploads/')) {
          void deleteUploadedFile(initialData.imageUrl);
        }
      } catch {
        setError('Image upload failed. Please check your connection.');
        setIsSaving(false);
        return;
      }
    }

    mutation.mutate({
      name: form.name,
      description: form.description,
      imageUrl: finalImageUrl,
      price: Number(form.price),
      categoryId: Number(form.categoryId),
      ageRangeId: Number(form.ageRangeId),
      stockQuantity: Number(form.stockQuantity),
    });
  }

  if (loadingCategories || loadingAgeRanges) {
    return <Skeleton height="20rem" style={{ borderRadius: 'var(--radius-md)', marginTop: 'var(--space-6)' }} />;
  }

  const fieldStyle: React.CSSProperties = {
    padding: '0.625rem 0.875rem',
    border: '1.5px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontSize: '0.9rem',
    width: '100%',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const labelTextStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#374151',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  };

  return (
    <div style={{ marginTop: 'var(--space-8)', backgroundColor: '#ffffff', padding: 'var(--space-8)', borderRadius: 'var(--radius-lg)', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>
          {initialData?.id ? 'Edit Product' : 'Add New Product'}
        </h2>
        <Button variant="secondary" onClick={onCancel} disabled={mutation.isPending}>
          Back to Dashboard
        </Button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {error && (
          <div style={{ padding: 'var(--space-4)', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Row 1: Name + Price + Stock */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)' }}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Product Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Wooden Puzzle Set"
              style={fieldStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Price (PHP)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="0.00"
              style={fieldStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Stock Quantity</span>
            <input
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={(e) => setForm(f => ({ ...f, stockQuantity: e.target.value }))}
              placeholder="1"
              style={fieldStyle}
            />
          </label>
        </div>

        {/* Row 2: Category + Age Range */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)' }}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Category</span>
            <select
              value={form.categoryId}
              onChange={(e) => setForm(f => ({ ...f, categoryId: Number(e.target.value) }))}
              style={fieldStyle}
            >
              <option value={0} disabled>Select Category</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.categoryName}</option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Age Range</span>
            <select
              value={form.ageRangeId}
              onChange={(e) => setForm(f => ({ ...f, ageRangeId: Number(e.target.value) }))}
              style={fieldStyle}
            >
              <option value={0} disabled>Select Age Range</option>
              {ageRanges?.map(a => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Product Image */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>
            Product Image
            {pendingFile && (
              <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#6b7280', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                — {pendingFile.name} (will upload on save)
              </span>
            )}
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Preview: local pending file OR already-saved URL */}
            {(previewUrl || form.imageUrl) ? (
              <div style={{ flexShrink: 0, width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #d1d5db', backgroundColor: '#f3f4f6', position: 'relative' }}>
                <img
                  src={previewUrl || (form.imageUrl.startsWith('/') || form.imageUrl.startsWith('http') ? form.imageUrl : `/${form.imageUrl}`)}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (previewUrl) {
                      clearPendingFile();
                    } else {
                      setForm(f => ({ ...f, imageUrl: '' }));
                    }
                  }}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', lineHeight: 1 }}
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            ) : (
              <div style={{ flexShrink: 0 }}>
                <label
                  htmlFor="product-image-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.6rem 1rem',
                    border: '1.5px dashed #9ca3af',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    userSelect: 'none',
                    transition: 'background 0.15s, border-color 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Choose image</span>
                </label>
                <input
                  id="product-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
                />
              </div>
            )}

            {/* Paste URL — hidden while a pending file is selected */}
            {!pendingFile && (
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                placeholder="Or paste an image URL..."
                style={{ ...fieldStyle, flex: '1 1 200px' }}
              />
            )}
          </div>
        </label>

        {/* Description */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            rows={4}
            placeholder="Describe the product..."
            style={{ ...fieldStyle, resize: 'vertical' }}
          />
        </label>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end', marginTop: 'var(--space-2)', paddingTop: 'var(--space-4)', borderTop: '1px solid #e5e7eb' }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving || mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving || mutation.isPending}>
            {isSaving ? 'Uploading image…' : mutation.isPending ? 'Saving…' : initialData?.id ? 'Save Changes' : 'Add Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
