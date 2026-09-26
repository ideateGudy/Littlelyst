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
  const bio = catalogue.seller.bio || `Browse products and buy directly from ${sellerName} on Littlelyst. No account needed.`;
  const productCount = catalogue.products.length;
  const title = `${sellerName} (@${handle}) • Personal Catalogue (${productCount} items)`;
  const primaryImage =
    catalogue.products[0]?.images?.[0] ||
    catalogue.seller.avatarUrl ||
    "https://images.unsplash.com/photo-1556742049-0a67e55722c0?auto=format&fit=crop&w=1200&h=630&q=85";

  return {
    title,
    description: bio,
    keywords: [
      `${sellerName} catalogue`,
      `${sellerName} store`,
      `${handle} shop`,
      "buy on whatsapp",
      "instant online payment",
      "nigeria boutique seller",
    ],
    openGraph: {
      title,
      description: bio,
      url: `https://littlelyst.com/${handle}`,
      siteName: "Littlelyst",
      locale: "en_NG",
      type: "profile",
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: `${sellerName}'s Littlelyst Catalogue`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: bio,
      images: [primaryImage],
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

