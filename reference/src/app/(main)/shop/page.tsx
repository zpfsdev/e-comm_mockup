import Image from "next/image";
import Link from "next/link";
import {
  AGE_RANGES,
  CATEGORIES,
  getShopProducts,
  STORES,
  type ShopProduct,
} from "@/lib/shop-data";
import styles from "./shop.module.css";

export const metadata = {
  title: "Shop | Artistryx",
  description: "Browse products by category, age, or store",
};

type SearchParams = { category?: string; age?: string; store?: string };

function ProductCard({ product }: { product: ShopProduct }) {
  return (
    <li className={styles.productCard}>
      <Link href={`/product/${product.id}`} className={styles.productImageWrap}>
        <Image
          src="/product1.png"
          alt=""
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className={styles.productImage}
        />
      </Link>
      <div className={styles.productBody}>
        <span className={styles.productName}>{product.name}</span>
        <span className={styles.productPrice}>{product.price}</span>
        <Link
          href={`/product/${product.id}`}
          className={styles.addToCartBtn}
          aria-label={`Add ${product.name} to cart`}
        >
          Add to Cart
        </Link>
      </div>
    </li>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const age = typeof params.age === "string" ? params.age : undefined;
  const store = typeof params.store === "string" ? params.store : undefined;

  const products = getShopProducts({ category, age, store });

  const pageTitle =
    category ?? (age ? `Age ${age}` : undefined) ?? (store ?? "All Products");

  return (
    <div className={styles.shopPage}>
      <div className="container">
        <div className={styles.shopLayout}>
          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>All Categories</h2>
            <ul className={styles.sidebarList}>
              <li>
                <Link
                  href="/shop"
                  className={!category ? styles.sidebarLinkActive : styles.sidebarLink}
                >
                  All Categories
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(c)}`}
                    className={category === c ? styles.sidebarLinkActive : styles.sidebarLink}
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>

            <div className={styles.sidebarSection}>
              <h2 className={styles.sidebarTitle}>Age Range</h2>
              <ul className={styles.sidebarList}>
                {AGE_RANGES.map((a) => (
                  <li key={a}>
                    <Link
                      href={`/shop?age=${encodeURIComponent(a)}`}
                      className={age === a ? styles.sidebarLinkActive : styles.sidebarLink}
                    >
                      {a}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.sidebarSection}>
              <h2 className={styles.sidebarTitle}>All Shops</h2>
              <div className={styles.storeCircles}>
                {STORES.map((s) => (
                  <Link
                    key={s}
                    href={`/shop?store=${encodeURIComponent(s)}`}
                    className={styles.storeCircleLink}
                  >
                    <span className={styles.storeCircle} />
                    <span>{s}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <div>
            <h1 className={styles.mainTitle}>{pageTitle}</h1>
            {products.length > 0 ? (
              <ul className={styles.productGrid}>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </ul>
            ) : (
              <p className={styles.emptyState}>
                No products match your filters.{" "}
                <Link href="/shop">View all products</Link>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
