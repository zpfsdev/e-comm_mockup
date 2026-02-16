import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { getProductById } from "@/lib/shop-data";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "./product-detail-client";
import styles from "./product.module.css";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = getProductById(id);
  const title = product ? `${product.name} | Artistryx` : `Product | Artistryx`;
  return { title, description: product?.name ?? "Product details" };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  const specs = {
    category: product.category,
    stock: "In Stock",
    age: product.age,
    dimensions: "6 x 1 x 9 inches",
    material: "Wood",
  };

  const description =
    "Premium early childhood learning product designed to support hands-on play, creativity, and exploration. Safe materials and age-appropriate design.";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link
          href="/shop"
          className={styles.backLink}
          aria-label="Back to shop"
        >
          <ArrowLeftIcon />
          <span className={styles.backLinkText}>Back to Shop</span>
        </Link>

        <div className={styles.topSection}>
          <div className={styles.imageSection}>
            <Image
              src="/product1.png"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          <div className={styles.infoSection}>
            <p className={styles.shopName}>{product.store}</p>
            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.metaGrid}>
              <span className={styles.metaLabel}>Price:</span>
              <span>{product.price}</span>
              <span className={styles.metaLabel}>Stock:</span>
              <span>{specs.stock}</span>
            </div>

            <div className={styles.quantityRow}>
              <span className={styles.quantityLabel}>Quantity:</span>
              <ProductDetailClient />
            </div>

            <div className={styles.actionRow}>
              <Link href="/cart" className={styles.btnAddToCart}>
                Add to Cart
              </Link>
              <Link href="/cart" className={styles.btnBuyNow}>
                Buy Now
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.shopCard}>
          <span className={styles.shopAvatar} aria-hidden />
          <h2 className={styles.shopCardName}>{product.store}</h2>
          <Link href="/shop" className={styles.btnViewShop}>
            View Shop
          </Link>
        </div>

        <div className={styles.specsBlock}>
          <h2 className={styles.specsTitle}>Product Specifications</h2>
          <dl className={styles.specsGrid}>
            <dt className={styles.specsLabel}>Category</dt>
            <dd>{specs.category}</dd>
            <dt className={styles.specsLabel}>Stock</dt>
            <dd>{specs.stock}</dd>
            <dt className={styles.specsLabel}>Age</dt>
            <dd>{specs.age}</dd>
            <dt className={styles.specsLabel}>Dimensions</dt>
            <dd>{specs.dimensions}</dd>
            <dt className={styles.specsLabel}>Material</dt>
            <dd>{specs.material}</dd>
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
