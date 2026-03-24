'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { ProfileSidebar } from '@/components/profile/profile-sidebar';
import styles from '../profile.module.css';
import { Input } from '@/components/ui/input/input';

interface Address {
  id: number;
  fullName: string;
  phoneNumber: string;
  region: string;
  province: string;
  city: string;
  barangay: string;
  provinceId: number;
  cityId: number;
  barangayId: number;
  detailedAddress: string;
  isDefault: boolean;
  addressType: 'Home' | 'Work';
}

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnUrl = searchParams.get('returnUrl');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    detailedAddress: '',
    barangay: '',
    city: '',
    province: 'Albay',
    region: 'Albay',
    addressType: 'Home' as 'Home' | 'Work',
    isDefault: false
  });

  const [locationIds, setLocationIds] = useState({
    provinceId: '',
    cityId: '',
    barangayId: ''
  });

  // Location data
  const { data: provinces } = useQuery<any[]>({
    queryKey: ['provinces'],
    queryFn: async () => (await apiClient.get('/locations/provinces')).data,
    enabled: isModalOpen
  });

  // Autopick Albay if it's the only one
  useEffect(() => {
    if (isModalOpen && provinces?.length === 1 && !locationIds.provinceId) {
      const p = provinces[0];
      setLocationIds(prev => ({ ...prev, provinceId: p.id.toString() }));
      setFormData(prev => ({ ...prev, province: p.province }));
    }
  }, [isModalOpen, provinces, locationIds.provinceId]);

  const { data: cities } = useQuery<any[]>({
    queryKey: ['cities', locationIds.provinceId],
    queryFn: async () => (await apiClient.get(`/locations/cities?provinceId=${locationIds.provinceId}`)).data,
    enabled: !!locationIds.provinceId
  });

  const { data: barangays } = useQuery<any[]>({
    queryKey: ['barangays', locationIds.cityId],
    queryFn: async () => (await apiClient.get(`/locations/barangays?cityId=${locationIds.cityId}`)).data,
    enabled: !!locationIds.cityId
  });

  const { data: addresses, isLoading, isError, refetch } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await apiClient.get<Address[]>('/users/addresses');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/users/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refetch();
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/users/addresses/${id}/default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refetch();
    }
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingAddress) {
        return apiClient.patch(`/users/addresses/${editingAddress.id}`, data);
      }
      return apiClient.post('/users/addresses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refetch();
      setIsModalOpen(false);
      setEditingAddress(null);
    }
  });

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setFormData({
      fullName: addr.fullName,
      phoneNumber: addr.phoneNumber,
      detailedAddress: addr.detailedAddress,
      barangay: addr.barangay,
      city: addr.city,
      province: addr.province,
      region: addr.region,
      addressType: addr.addressType,
      isDefault: addr.isDefault
    });
    setLocationIds({
      provinceId: addr.provinceId.toString(),
      cityId: addr.cityId.toString(),
      barangayId: addr.barangayId.toString()
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setFormData({
      fullName: '',
      phoneNumber: '',
      detailedAddress: '',
      barangay: '',
      city: '',
      province: provinces?.length === 1 ? provinces[0].province : 'Albay',
      region: 'Albay',
      addressType: 'Home',
      isDefault: false
    });
    setLocationIds({
      provinceId: provinces?.length === 1 ? provinces[0].id.toString() : '',
      cityId: '',
      barangayId: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.profileLayout}>
          <ProfileSidebar />
          <div style={{ flex: 1 }}>
            <Skeleton height="20rem" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.profileLayout}>
        <ProfileSidebar />

        <main className={styles.mainContent} style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
            <div>
              <h1 className={styles.heading}>My Addresses</h1>
              <p className={styles.subheading}>Manage your shipping addresses</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              {returnUrl && (
                <Button variant="outline" onClick={() => router.push(returnUrl)} style={{ borderRadius: '8px' }}>
                  ← Back
                </Button>
              )}
              <Button variant="primary" onClick={handleAddNew} style={{ paddingInline: 'var(--space-6)', backgroundColor: '#7b715a', color: 'white', borderRadius: '8px' }}>
                + Add New Address
              </Button>
            </div>
          </div>

          {isError || !addresses?.length ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-20)', backgroundColor: 'var(--surface-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-subtle)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No addresses found. Add one to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {addresses.map((addr) => (
                <div key={addr.id} style={{ padding: 'var(--space-6)', backgroundColor: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                       <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{addr.fullName}</span>
                       {addr.isDefault && (
                        <span style={{ fontSize: '0.7rem', color: '#7b715a', border: '1px solid #7b715a', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Default
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: '#7b715a', fontWeight: 500, backgroundColor: 'rgba(123, 113, 90, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {addr.addressType}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{addr.phoneNumber}</p>
                  <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--text-secondary)' }}>
                    {addr.detailedAddress}, {addr.barangay}, {addr.city}, {addr.province}
                  </p>
                  
                  <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleEdit(addr)}
                      style={{ background: 'none', border: 'none', color: '#7b715a', cursor: 'pointer', fontWeight: 500, padding: 0, fontSize: '0.9rem' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteMutation.mutate(addr.id)}
                      disabled={deleteMutation.isPending}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 500, padding: 0, fontSize: '0.9rem' }}
                    >
                      Delete
                    </button>
                    {!addr.isDefault && (
                      <button 
                        onClick={() => setDefaultMutation.mutate(addr.id)}
                        disabled={setDefaultMutation.isPending}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, padding: 0, fontSize: '0.9rem', textDecoration: 'underline' }}
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: 'var(--space-8)', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: 'var(--space-6)', color: '#7b715a' }}>{editingAddress ? 'Edit Address' : 'New Address'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <Input placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
              <Input placeholder="Phone Number" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required />
              <Input placeholder="Detailed Address (Street, House No.)" value={formData.detailedAddress} onChange={e => setFormData({...formData, detailedAddress: e.target.value})} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <select 
                  value={locationIds.cityId} 
                  onChange={e => {
                    const id = e.target.value;
                    const name = cities?.find(c => c.id === +id)?.city || '';
                    setLocationIds({...locationIds, cityId: id, barangayId: ''});
                    setFormData({...formData, city: name, barangay: ''});
                  }}
                  required
                  disabled={!locationIds.provinceId}
                  style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-input-border)', backgroundColor: '#fff', opacity: !locationIds.provinceId ? 0.5 : 1 }}
                >
                  <option value="">Select City/Municipality</option>
                  {cities?.map(c => <option key={c.id} value={c.id}>{c.city}</option>)}
                </select>
                <select 
                  value={locationIds.barangayId} 
                  onChange={e => {
                    const id = e.target.value;
                    const name = barangays?.find(b => b.id === +id)?.barangay || '';
                    setLocationIds({...locationIds, barangayId: id});
                    setFormData({...formData, barangay: name});
                  }}
                  required
                  disabled={!locationIds.cityId}
                  style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-input-border)', backgroundColor: '#fff', opacity: !locationIds.cityId ? 0.5 : 1 }}
                >
                  <option value="">Select Barangay</option>
                  {barangays?.map(b => <option key={b.id} value={b.id}>{b.barangay}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                  <input type="radio" name="type" checked={formData.addressType === 'Home'} onChange={() => setFormData({...formData, addressType: 'Home'})} />
                  Home
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                  <input type="radio" name="type" checked={formData.addressType === 'Work'} onChange={() => setFormData({...formData, addressType: 'Work'})} />
                  Work
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={upsertMutation.isPending} style={{ backgroundColor: '#7b715a', color: 'white' }}>
                  {upsertMutation.isPending ? 'Saving...' : 'Save Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
