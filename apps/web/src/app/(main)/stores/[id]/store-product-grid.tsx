'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AddToCartInline } from '@/components/add-to-cart-inline';
import productStyles from '@/app/(main)/products/products.module.css';

export interface StoreProductItem {
  readonly id: number;
  readonly name: string;
  readonly price: string;
  readonly imageUrl: string | null;
  readonly ageRange: {
    readonly label: string | null;
    readonly minAge: number;
    readonly maxAge: number | null;
  } | null;
}

function ageDisplay(
  age: StoreProductItem['ageRange'],
): string | undefined {
  if (!age) return undefined;
  if (age.label) return age.label;
  if (age.maxAge === null) return `${age.minAge}+`;
  return `${age.minAge}–${age.maxAge}`;
}

function ShopIcon({
  shop,
}: {
  readonly shop: { readonly id: number; readonly shopName: string; readonly shopLogoUrl: string | null };
}) {
  const inner = shop.shopLogoUrl ? (
    <Image
      src={shop.shopLogoUrl}
      alt=""
      width={40}
      height={40}
      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
    />
  ) : (
    <span className={productStyles.shopIconFallback} aria-hidden>
      {shop.shopName.charAt(0).toUpperCase()}
    </span>
  );

  return (
    <span className={productStyles.shopIconLink} title={shop.shopName}>
      {inner}
    </span>
  );
}

export function StoreProductGrid({
  products,
  shop,
}: {
  readonly products: StoreProductItem[];
  readonly shop: { readonly id: number; readonly shopName: string; readonly shopLogoUrl: string | null };
}) {
  return (
    <ul className={productStyles.productGrid}>
      {products.map((product) => {
        const ageLabel = ageDisplay(product.ageRange);
        return (
          <li key={product.id} className={productStyles.productCard}>
            <div className={productStyles.productImageArea}>
              <Link href={`/products/${product.id}`} className={productStyles.productImageWrap}>
                <Image
                  src={product.imageUrl || '/product1.png'}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className={productStyles.productImage}
                />
              </Link>
              <div
                className={`${productStyles.productMetaTop} ${!ageLabel ? productStyles.productMetaTopEnd : ''}`}
              >
                {ageLabel ? <span className={productStyles.ageBadge}>{ageLabel}</span> : null}
                <ShopIcon shop={shop} />
              </div>
            </div>
            <div className={productStyles.productBody}>
              <span className={productStyles.productName}>{product.name}</span>
              <span className={productStyles.productPrice}>
                Php {Number(product.price).toFixed(2)}
              </span>
              <AddToCartInline
                productId={product.id}
                productName={product.name}
                className={productStyles.addToCartBtn}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
