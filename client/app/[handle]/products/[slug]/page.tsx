import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "./product-detail-view";

const API_BASE_URL =
  process.env.API_URL || "http://localhost:5000";

interface ProductData {
  seller: {
    id: string;
    name: string;
    handle: string;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  product: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    priceMinor: string;
    productType: string;
    images?: string[];
    stockQuantity: number;
    hasVariants: boolean;
    variants: Array<any>;
    activePromotion?: {
      discountedPriceMinor: string;
      endAt: string;
    } | null;
  };
}

async function getProductData(handle: string, slug: string): Promise<ProductData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/catalogue/${handle}/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata(
  props: { params: Promise<{ handle: string; slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { handle, slug } = await props.params;
  const data = await getProductData(handle, slug);

  if (!data) {
    return {
      title: "Product Not Found",
      description: "This item is no longer available on Littlelyst.",
    };
  }

  const { product, seller } = data;
  const priceFormatted = `₦${(Number(product.priceMinor) / 100).toLocaleString()}`;
  const promoFormatted = product.activePromotion
    ? `₦${(Number(product.activePromotion.discountedPriceMinor) / 100).toLocaleString()}`
    : null;

  const title = `${product.title} — ${promoFormatted || priceFormatted} | by @${handle}`;
  const description =
    product.description ||
    `Buy ${product.title} directly from ${seller.name} (@${handle}) on Littlelyst. Instant guest checkout via card or bank transfer.`;

  const primaryImage =
    product.images?.[0] ||
    seller.avatarUrl ||
    "https://images.unsplash.com/photo-1556742049-0a67e55722c0?auto=format&fit=crop&w=1200&h=630&q=85";

  return {
    title,
    description,
    keywords: [
      product.title,
      `${seller.name} ${product.title}`,
      "buy online nigeria",
      "instant checkout",
      product.productType.toLowerCase(),
    ],
    openGraph: {
      title,
      description,
      url: `https://littlelyst.com/${handle}/products/${slug}`,
      siteName: "Littlelyst",
      locale: "en_NG",
      type: "article",
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [primaryImage],
    },
  };
}

export default async function ProductDetailPage(props: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await props.params;
  const data = await getProductData(handle, slug);

  if (!data) {
    notFound();
  }

  return <ProductDetailView data={data} />;
}
