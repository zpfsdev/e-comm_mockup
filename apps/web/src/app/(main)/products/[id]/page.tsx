import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon } from '@/components/icons';
import { API_BASE_URL } from '@/lib/constants';
import { AddToCartButton } from './add-to-cart-button';
import styles from './product-detail.module.css';

interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly ageRange?: string;
  readonly stock?: number;
  readonly category?: string;
  readonly store?: string;
}

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props) {
  const { id } = params;
  const product = await fetchProduct(id);
  return {
    title: product ? `${product.name} | Artistryx` : 'Product | Artistryx',
    description: product?.description ?? 'Product details',
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = params;
  const product = await fetchProduct(id);
  if (!product) notFound();

  const stockLabel =
    product.stock !== undefined
      ? product.stock > 0
        ? 'In Stock'
        : 'Out of Stock'
      : 'In Stock';

  const specs = {
    category: product.category ?? '—',
    stock: stockLabel,
    age: product.ageRange ?? '—',
  };

  const description =
    product.description ??
    'Premium early childhood learning product designed to support hands-on play, creativity, and exploration. Safe materials and age-appropriate design.';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/products" className={styles.backLink} aria-label="Back to products">
          <ArrowLeftIcon />
          <span className={styles.backLinkText}>Back to Products</span>
        </Link>

        <div className={styles.topSection}>
          <div className={styles.imageSection}>
            <Image
              src={product.imageUrl ?? '/product1.png'}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          <div className={styles.infoSection}>
            {product.store && <p className={styles.shopName}>{product.store}</p>}
            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.metaGrid}>
              <span className={styles.metaLabel}>Price:</span>
              <span>₱{Number(product.price).toFixed(2)}</span>
              <span className={styles.metaLabel}>Stock:</span>
              <span>{specs.stock}</span>
            </div>

            <AddToCartButton productId={product.id} stock={product.stock} />
          </div>
        </div>

        {product.store && (
          <div className={styles.shopCard}>
            <span className={styles.shopAvatar} aria-hidden />
            <h2 className={styles.shopCardName}>{product.store}</h2>
          </div>
        )}

        <div className={styles.specsBlock}>
          <h2 className={styles.specsTitle}>Product Specifications</h2>
          <dl className={styles.specsGrid}>
            <dt className={styles.specsLabel}>Category</dt>
            <dd>{specs.category}</dd>
            <dt className={styles.specsLabel}>Stock</dt>
            <dd>{specs.stock}</dd>
            <dt className={styles.specsLabel}>Age Range</dt>
            <dd>{specs.age}</dd>
          </dl>
        </div>

        <div className={styles.descBlock}>
          <h2 className={styles.descTitle}>Product Description</h2>
          <p className={styles.descBody}>{description}</p>
        </div>
      </div>
    </div>
  );
}
