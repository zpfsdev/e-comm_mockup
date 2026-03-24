import { HeroSection } from './sections/hero-section';
import { CategorySection } from './sections/category-section';
import { AgeSection } from './sections/age-section';
import { ProductSection } from './sections/product-section';
import { StoreSection } from './sections/store-section';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <AgeSection />
      <ProductSection title="Top Picks" sort="popular" viewAllHref="/products?sort=popular" showViewAll={false} />
      <ProductSection title="What&apos;s New" sort="newest" viewAllHref="/products?sort=newest" style={{ paddingTop: 0 }} showViewAll={false} />
      <StoreSection />
    </>
  );
}
