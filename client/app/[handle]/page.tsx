import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueClientView } from "./catalogue-client-view";
import type { CatalogueData } from "./catalogue-client-view";

const API_BASE_URL =
  process.env.API_URL || "http://localhost:5000";

async function getCatalogueData(handle: string): Promise<CatalogueData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/catalogue/${handle}`, {
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
  props: { params: Promise<{ handle: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { handle } = await props.params;
  const catalogue = await getCatalogueData(handle);

  if (!catalogue) {
    return {
      title: `@${handle} — Littlelyst Catalogue`,
      description: `Browse products and buy directly from @${handle} on Littlelyst.`,
    };
  }

  const sellerName = catalogue.seller.name;
  const storeHandle = catalogue.seller.handle;
  const bio =
    catalogue.seller.bio ||
    `Browse products and buy directly from ${sellerName} (@${storeHandle}) on Littlelyst. Fast delivery & instant checkout.`;
  const productCount = catalogue.products.length;
  const title = `${sellerName} (@${storeHandle}) • Storefront (${productCount} item${productCount === 1 ? "" : "s"})`;
  
  // Best representative preview image: seller's avatar or first product image, fallback to placeholder
  const storeImage =
    catalogue.seller.avatarUrl ||
    catalogue.products[0]?.images?.[0] ||
    "https://images.unsplash.com/photo-1556742049-0a67e55722c0?auto=format&fit=crop&w=1200&h=630&q=85";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://littlelyst.com";

  return {
    title,
    description: bio,
    keywords: [
      `${sellerName}`,
      `${storeHandle}`,
      `${sellerName} catalogue`,
      `${sellerName} store`,
      `${storeHandle} shop`,
      "buy on whatsapp",
      "instant online payment",
      "nigeria boutique seller",
      "littlelyst seller",
    ],
    openGraph: {
      title,
      description: bio,
      url: `${appUrl}/${storeHandle}`,
      siteName: "Littlelyst",
      locale: "en_NG",
      type: "profile",
      images: [
        {
          url: storeImage,
          width: 1200,
          height: 630,
          alt: `${sellerName}'s Littlelyst Storefront`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: bio,
      images: [storeImage],
    },
  };
}

export default async function PublicCatalogueServerPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await props.params;
  const initialData = await getCatalogueData(handle);

  if (!initialData) {
    notFound();
  }

  return <CatalogueClientView initialData={initialData} handle={handle} />;
}

