"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MultiImageUploader, ImageUploadItem } from "@/components/multi-image-uploader";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { apiClient } from "@/lib/api-client";
import {
  PRODUCT_TYPES,
  CATEGORIES_CONFIG,
  ProductType,
  CategoryDefinition,
  AttributeDefinition,
} from "@/lib/catalog-engine";
import {
  Package,
  Download,
  Sparkles,
  Tag,
  DollarSign,
  Layers,
  Zap,
  Check,
  Plus,
  Trash2,
  Sliders,
  Calendar,
  Clock,
  ArrowRight,
  AlertCircle,
  FileText,
  Shield,
  CheckCircle2,
  Info,
  Box,
} from "lucide-react";

export interface VariantDimension {
  id: string;
  name: string;
  values: string[];
}

export interface GeneratedVariantRow {
  id: string;
  combinationTitle: string; // e.g. "Black / XL"
  optionValues: Record<string, string>;
  sku: string;
  priceDeltaNaira: number | "";
  effectivePriceNaira: number;
  stockQuantity: number;
  imageIndex?: number;
}

export function NewListingForm() {
  const router = useRouter();

  // 1. PRODUCT TYPE (Progressive Step 1)
  const [productType, setProductType] = useState<ProductType>("PHYSICAL");

  // 2. CATEGORY (Dynamic Driver for Attributes)
  const availableCategories = useMemo(() => {
    return CATEGORIES_CONFIG.filter((cat) =>
      cat.applicableProductTypes.includes(productType)
    );
  }, [productType]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    availableCategories[0]?.id || "clothing"
  );

  const activeCategory = useMemo(() => {
    return (
      availableCategories.find((c) => c.id === selectedCategoryId) ||
      availableCategories[0] ||
      CATEGORIES_CONFIG[0]
    );
  }, [availableCategories, selectedCategoryId]);

  // Dynamic Product Attributes Values
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});

  // 3. PRODUCT INFORMATION
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keyHighlights, setKeyHighlights] = useState("");
  const [uploadedImages, setUploadedImages] = useState<ImageUploadItem[]>([]);

  // 4. BASE PRICING & INVENTORY
  const [basePriceNaira, setBasePriceNaira] = useState<number | "">(50000);
  const [discountPriceNaira, setDiscountPriceNaira] = useState<number | "">("");
  const [baseStockQuantity, setBaseStockQuantity] = useState<number>(10);
  const [baseSku, setBaseSku] = useState("");

  // 5. VARIANT OPTIONS & COMBINATIONS (Multi-dimensional generator)
  const [hasVariants, setHasVariants] = useState(false);
  const [variantDimensions, setVariantDimensions] = useState<VariantDimension[]>([
    { id: "dim-1", name: "Color", values: ["Black", "White"] },
    { id: "dim-2", name: "Size", values: ["M", "L"] },
  ]);
  const [variantRows, setVariantRows] = useState<GeneratedVariantRow[]>([]);
  const [newValInputs, setNewValInputs] = useState<Record<string, string>>({});

  // Bulk Edit helpers for variants
  const [bulkPriceNaira, setBulkPriceNaira] = useState<number | "">("");
  const [bulkStock, setBulkStock] = useState<number | "">("");

  // 6. TYPE-SPECIFIC FULFILLMENT CONFIGURATION (Digital fulfillment)
  const [digitalFulfillmentType, setDigitalFulfillmentType] = useState<
    "DOWNLOAD_FILE" | "EXTERNAL_LINK" | "LICENSE_KEY"
  >("DOWNLOAD_FILE");
  const [digitalFileUrl, setDigitalFileUrl] = useState("");
  const [digitalKeyOrNote, setDigitalKeyOrNote] = useState("");
  const [downloadLimit, setDownloadLimit] = useState<number | "">(5);

  // 7. PROMOTION & FLASH SALE (With datetime picker and quota)
  const [hasPromo, setHasPromo] = useState(false);
  const [promoPriceNaira, setPromoPriceNaira] = useState<number | "">("");
  const [promoExpirationDateTime, setPromoExpirationDateTime] = useState<string>(() => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return nextWeek.toISOString().slice(0, 16); // format: YYYY-MM-DDTHH:mm
  });
  const [promoMaxItems, setPromoMaxItems] = useState<number | "">("");

  // 8. VISIBILITY
  const [visibility, setVisibility] = useState<"PUBLIC" | "DRAFT">("PUBLIC");

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishStatus, setPublishStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Handle switching product type
  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type);
    const validCats = CATEGORIES_CONFIG.filter((c) =>
      c.applicableProductTypes.includes(type)
    );
    if (validCats.length > 0) {
      setSelectedCategoryId(validCats[0].id);
      setAttributeValues({});
    }
  };

  // Handle attribute change
  const handleAttributeChange = (attrId: string, val: string) => {
    setAttributeValues((prev) => ({ ...prev, [attrId]: val }));
  };

  // Re-generate combinations whenever dimensions change
  const generateCartesianCombinations = (dims: VariantDimension[]): GeneratedVariantRow[] => {
    const activeDims = dims.filter((d) => d.name.trim() && d.values.length > 0);
    if (activeDims.length === 0) return [];

    let currentCombinations: Array<{ titleParts: string[]; map: Record<string, string> }> = [
      { titleParts: [], map: {} },
    ];

    for (const dim of activeDims) {
      const nextGen: Array<{ titleParts: string[]; map: Record<string, string> }> = [];
      for (const comb of currentCombinations) {
        for (const val of dim.values) {
          nextGen.push({
            titleParts: [...comb.titleParts, val],
            map: { ...comb.map, [dim.name]: val },
          });
        }
      }
      currentCombinations = nextGen;
    }

    const currentBase = typeof basePriceNaira === "number" ? basePriceNaira : 0;
    const currentBaseStock = typeof baseStockQuantity === "number" ? baseStockQuantity : 10;

    return currentCombinations.map((c, i) => {
      const combinationTitle = c.titleParts.join(" / ");
      // Check if row already exists to preserve custom edits
      const existing = variantRows.find((r) => r.combinationTitle === combinationTitle);

      return {
        id: existing?.id || `var-${i}-${Date.now()}`,
        combinationTitle,
        optionValues: c.map,
        sku: existing?.sku || `${(title.slice(0, 3) || "ITM").toUpperCase()}-${c.titleParts.map((p) => p.slice(0, 3).toUpperCase()).join("-")}`,
        priceDeltaNaira: existing ? existing.priceDeltaNaira : 0,
        effectivePriceNaira: existing ? existing.effectivePriceNaira : currentBase,
        stockQuantity: existing ? existing.stockQuantity : currentBaseStock,
        imageIndex: existing?.imageIndex ?? 0,
      };
    });
  };

  // Helper: Add dimension option
  const handleAddDimension = (name = "Option") => {
    setVariantDimensions((prev) => [
      ...prev,
      { id: `dim-${Date.now()}`, name, values: [] },
    ]);
  };

  // Helper: Remove dimension
  const handleRemoveDimension = (dimId: string) => {
    setVariantDimensions((prev) => {
      const updated = prev.filter((d) => d.id !== dimId);
      setTimeout(() => setVariantRows(generateCartesianCombinations(updated)), 50);
      return updated;
    });
  };

  // Helper: Add Value to dimension
  const handleAddValueToDimension = (dimId: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setVariantDimensions((prev) => {
      const updated = prev.map((d) => {
        if (d.id === dimId && !d.values.includes(trimmed)) {
          return { ...d, values: [...d.values, trimmed] };
        }
        return d;
      });
      setTimeout(() => setVariantRows(generateCartesianCombinations(updated)), 50);
      return updated;
    });
    setNewValInputs((prev) => ({ ...prev, [dimId]: "" }));
  };

  // Helper: Remove Value from dimension
  const handleRemoveValueFromDimension = (dimId: string, valToRemove: string) => {
    setVariantDimensions((prev) => {
      const updated = prev.map((d) => {
        if (d.id === dimId) {
          return { ...d, values: d.values.filter((v) => v !== valToRemove) };
        }
        return d;
      });
      setTimeout(() => setVariantRows(generateCartesianCombinations(updated)), 50);
      return updated;
    });
  };

  // Apply quick-add presets from the active category
  const handleApplyCategoryPresetToDimension = (
    attributeName: string,
    presets: string[]
  ) => {
    setVariantDimensions((prev) => {
      // Check if dimension already exists
      const existingDim = prev.find((d) => d.name.toLowerCase() === attributeName.toLowerCase());
      let updated: VariantDimension[];

      if (existingDim) {
        updated = prev.map((d) =>
          d.id === existingDim.id
            ? { ...d, values: Array.from(new Set([...d.values, ...presets])) }
            : d
        );
      } else {
        updated = [
          ...prev,
          { id: `dim-${Date.now()}`, name: attributeName, values: [...presets] },
        ];
      }

      setTimeout(() => setVariantRows(generateCartesianCombinations(updated)), 50);
      return updated;
    });
  };

  // Bulk Apply to All Variants
  const handleApplyPriceToAllVariants = () => {
    if (bulkPriceNaira === "" || Number(bulkPriceNaira) < 0) return;
    setVariantRows((prev) =>
      prev.map((row) => ({
        ...row,
        effectivePriceNaira: Number(bulkPriceNaira),
        priceDeltaNaira: Number(bulkPriceNaira) - (Number(basePriceNaira) || 0),
      }))
    );
  };

  const handleApplyStockToAllVariants = () => {
    if (bulkStock === "" || Number(bulkStock) < 0) return;
    setVariantRows((prev) =>
      prev.map((row) => ({
        ...row,
        stockQuantity: Number(bulkStock),
      }))
    );
  };

  // Update specific variant row
  const handleUpdateVariantRow = (
    index: number,
    field: keyof GeneratedVariantRow,
    value: any
  ) => {
    setVariantRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "effectivePriceNaira") {
        updated[index].priceDeltaNaira = Number(value) - (Number(basePriceNaira) || 0);
      }
      return updated;
    });
  };

  // FORM SUBMISSION & VALIDATION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage("Please enter a product name.");
      setPublishStatus("error");
      return;
    }

    if (!basePriceNaira || Number(basePriceNaira) <= 0) {
      setErrorMessage("Please specify a valid base price.");
      setPublishStatus("error");
      return;
    }

    if (discountPriceNaira && Number(discountPriceNaira) >= Number(basePriceNaira)) {
      setErrorMessage("Discount price must be less than the original price.");
      setPublishStatus("error");
      return;
    }

    if (hasPromo && promoPriceNaira) {
      const activeBase = discountPriceNaira ? Number(discountPriceNaira) : Number(basePriceNaira);
      if (Number(promoPriceNaira) >= activeBase) {
        setErrorMessage(
          `Promo price (₦${Number(promoPriceNaira).toLocaleString()}) must be less than standard price (₦${activeBase.toLocaleString()}).`
        );
        setPublishStatus("error");
        return;
      }

      if (!promoExpirationDateTime) {
        setErrorMessage("Please select a promo expiration date and time.");
        setPublishStatus("error");
        return;
      }

      if (new Date(promoExpirationDateTime).getTime() <= Date.now()) {
        setErrorMessage("Promo expiration date and time must be set in the future.");
        setPublishStatus("error");
        return;
      }
    }

    // Type specific validations
    if (productType === "PHYSICAL" && !hasVariants && Number(baseStockQuantity) <= 0) {
      setErrorMessage("Please specify physical inventory stock.");
      setPublishStatus("error");
      return;
    }

    setIsPublishing(true);
    setPublishStatus("idle");
    setErrorMessage("");
    setUploadProgress(5);

    try {
      // 1. Upload photos to Cloudinary
      const imageUrls: string[] = [];
      for (let i = 0; i < uploadedImages.length; i++) {
        const img = uploadedImages[i];
        if (img.file) {
          const uploadedUrl = await uploadToCloudinary(img.file, (singleProgress) => {
            const overall = Math.round(
              5 + (i * 80) / uploadedImages.length + (singleProgress * 0.8) / uploadedImages.length
            );
            setUploadProgress(Math.min(overall, 85));
          });
          imageUrls.push(uploadedUrl);
        } else if (img.previewUrl.startsWith("http")) {
          imageUrls.push(img.previewUrl);
        }
      }

      setUploadProgress(90);

      // 2. Build Structured Specifications & Description
      const specsSummary: string[] = [];
      specsSummary.push(`Product Type: ${productType}`);
      specsSummary.push(`Category: ${activeCategory.name}`);

      Object.entries(attributeValues).forEach(([key, val]) => {
        if (val && String(val).trim()) {
          const attrDef = activeCategory.attributes.find((a) => a.id === key);
          specsSummary.push(`${attrDef?.name || key}: ${val}`);
        }
      });

      let formattedDescription = `📋 SPECIFICATIONS:\n• ` + specsSummary.join("\n• ") + `\n\n`;
      if (keyHighlights.trim()) {
        formattedDescription += `✨ KEY HIGHLIGHTS:\n` + keyHighlights.trim() + `\n\n`;
      }
      if (description.trim()) {
        formattedDescription += `📝 OVERVIEW:\n` + description.trim();
      }

      // 3. Format Variants
      let formattedVariants: Array<{
        title: string;
        priceDeltaMinor: number;
        stockQuantity: number;
        sku?: string;
      }> = [];

      if (hasVariants && variantRows.length > 0) {
        formattedVariants = variantRows.map((r) => ({
          title: r.combinationTitle,
          priceDeltaMinor: Math.round(Number(r.priceDeltaNaira || 0) * 100),
          stockQuantity: Number(r.stockQuantity || 0),
          sku: r.sku || undefined,
        }));
      }

      // 4. Calculate minor price units
      const priceMinor = Math.round(Number(basePriceNaira) * 100);
      const discountPriceMinor =
        discountPriceNaira && Number(discountPriceNaira) > 0
          ? Math.round(Number(discountPriceNaira) * 100)
          : undefined;

      // 5. Build Final Payload (100% compatible with backend model)
      const payload: any = {
        title: title.trim(),
        description: formattedDescription.trim() || undefined,
        priceMinor,
        discountPriceMinor,
        productType: productType === "PHYSICAL" ? "PHYSICAL" : "DIGITAL",
        visibility,
        images: imageUrls,
        stockQuantity:
          hasVariants && formattedVariants.length > 0
            ? formattedVariants.reduce((sum, v) => sum + v.stockQuantity, 0)
            : Number(baseStockQuantity || 0),
        digitalFileUrl:
          productType === "DIGITAL" && digitalFulfillmentType === "DOWNLOAD_FILE"
            ? digitalFileUrl.trim() || undefined
            : digitalFulfillmentType === "EXTERNAL_LINK"
            ? digitalFileUrl.trim() || undefined
            : undefined,
        digitalKeyOrNote:
          productType === "DIGITAL"
            ? digitalKeyOrNote.trim() || undefined
            : undefined,
        variants: formattedVariants.length > 0 ? formattedVariants : undefined,
      };

      // Format Flash Sale Promo if enabled
      if (hasPromo && promoPriceNaira && Number(promoPriceNaira) > 0) {
        payload.promotion = {
          discountedPriceMinor: Math.round(Number(promoPriceNaira) * 100),
          startAt: new Date().toISOString(),
          endAt: new Date(promoExpirationDateTime).toISOString(),
          maxItems: promoMaxItems && Number(promoMaxItems) > 0 ? Number(promoMaxItems) : undefined,
        };
      }

      await apiClient("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setUploadProgress(100);
      setPublishStatus("success");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      console.error("Publishing error:", err);
      setPublishStatus("error");
      setErrorMessage(err.message || "Failed to publish product. Please verify fields and try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 space-y-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          Product Studio
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1.5">
          Create Listing
        </h1>
        <p className="text-xs text-white/50">
          Intelligent, category-driven product creation with multi-dimensional variants and instant live sync.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: WHAT ARE YOU SELLING? */}
        <section className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3.5 border border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              1. What are you selling? (Product Type)
            </label>
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
              {productType}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRODUCT_TYPES.map((pt) => {
              const isSelected = productType === pt.id;
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => handleProductTypeChange(pt.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {pt.id === "PHYSICAL" ? (
                        <Package className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      {pt.title}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                        isSelected ? "bg-emerald-500 text-black" : "bg-white/10 text-white/50"
                      }`}
                    >
                      {pt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1 leading-snug">{pt.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* STEP 2: CATEGORY SELECTION (Reveals Category-Specific Attributes) */}
        <section className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3.5 border border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              2. Category (Drives Specifications & Options)
            </label>
            <span className="text-[10px] text-cyan-400 font-bold">{activeCategory.name}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    setAttributeValues({});
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* STEP 3: PRODUCT INFORMATION & IMAGES */}
        <section className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-4 border border-white/10">
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            3. Product Information
          </label>

          {/* Product Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-white/70">
              Product Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nike Air Max 270 React — Limited Edition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          {/* Multi-Image Uploader with Drag-to-Cover */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-white/70">
                Product Images (Drag any image onto cover position)
              </label>
              <span className="text-[10px] text-white/40">Up to 6 images</span>
            </div>
            <MultiImageUploader
              images={uploadedImages}
              onChange={setUploadedImages}
              maxImages={6}
            />
          </div>

          {/* Key Highlights */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-white/70">Key Highlights</label>
              <span className="text-[9px] text-white/40">1 highlight per line</span>
            </div>
            <textarea
              rows={2}
              placeholder="• Lightweight breathable mesh upper&#10;• Dual-density foam sole for all-day comfort&#10;• Responsive Air cushioning"
              value={keyHighlights}
              onChange={(e) => setKeyHighlights(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none font-sans"
            />
          </div>

          {/* Description */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-semibold text-white/70">Full Overview</label>
            <textarea
              rows={3}
              placeholder="Describe condition, specifications, warranty, box contents, or special instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </section>

        {/* STEP 4: CATEGORY-SPECIFIC PRODUCT ATTRIBUTES */}
        {activeCategory.attributes.length > 0 && (
          <section className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3.5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  4. {activeCategory.name} Specifications
                </label>
                <p className="text-[10px] text-white/40">
                  Descriptive attributes specific to {activeCategory.name.toLowerCase()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {activeCategory.attributes.map((attr) => (
                <div key={attr.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-white/70">{attr.name}</label>
                    {attr.canBeVariant && (
                      <span className="text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                        Can be Variant
                      </span>
                    )}
                  </div>

                  {attr.type === "select" && attr.options ? (
                    <select
                      value={attributeValues[attr.id] || ""}
                      onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="">Select {attr.name}...</option>
                      {attr.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder={attr.placeholder || `Enter ${attr.name.toLowerCase()}`}
                      value={attributeValues[attr.id] || ""}
                      onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* STEP 5: PRICING & INVENTORY */}
        <section className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-4 border border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              5. Base Pricing & Inventory
            </label>
            <div className="flex items-center gap-2 font-mono">
              {discountPriceNaira && Number(discountPriceNaira) < Number(basePriceNaira) ? (
                <>
                  <span className="text-xs text-white/40 line-through">
                    ₦{Number(basePriceNaira).toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">
                    ₦{Number(discountPriceNaira).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-xs text-emerald-400 font-bold">
                  ₦{basePriceNaira ? Number(basePriceNaira).toLocaleString() : "0"}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/70">
                Original Price (₦) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="50000"
                value={basePriceNaira}
                onChange={(e) => setBasePriceNaira(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-white/70">Discount Price (₦)</label>
                <span className="text-[9px] text-emerald-400 uppercase">Optional</span>
              </div>
              <input
                type="number"
                min="1"
                placeholder="45000 (Slashed)"
                value={discountPriceNaira}
                onChange={(e) =>
                  setDiscountPriceNaira(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
              />
            </div>

            {/* Inventory Stock: Shown if physical or single product */}
            {productType === "PHYSICAL" && !hasVariants && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/70">
                  Stock Units <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={baseStockQuantity}
                  onChange={(e) => setBaseStockQuantity(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
                />
              </div>
            )}
          </div>
        </section>

        {/* STEP 6: MULTI-DIMENSIONAL VARIANT BUILDER */}
        <section className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                6. Product Variants & Options Matrix
              </label>
              <p className="text-[10px] text-white/40">
                Multi-dimensional combinations (e.g. Color × Size, Storage × RAM)
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextState = !hasVariants;
                setHasVariants(nextState);
                if (nextState && variantRows.length === 0) {
                  setVariantRows(generateCartesianCombinations(variantDimensions));
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                hasVariants
                  ? "bg-purple-500 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/15"
              }`}
            >
              {hasVariants ? "Variants Enabled" : "+ Add Options"}
            </button>
          </div>

          {hasVariants && (
            <div className="space-y-5 pt-2">
              {/* Category Quick Presets Injector */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2">
                <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">
                  Quick Add {activeCategory.name} Option Dimensions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeCategory.attributes
                    .filter((a) => a.canBeVariant && a.defaultVariantPresets)
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          handleApplyCategoryPresetToDimension(a.name, a.defaultVariantPresets!)
                        }
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-500/30 border border-purple-500/30 text-[11px] text-purple-200 transition-all cursor-pointer"
                      >
                        + Add {a.name} ({a.defaultVariantPresets?.slice(0, 3).join(", ")}...)
                      </button>
                    ))}
                </div>
              </div>

              {/* Dimensions Editor List */}
              <div className="space-y-3">
                {variantDimensions.map((dim) => (
                  <div
                    key={dim.id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={dim.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariantDimensions((prev) => {
                            const updated = prev.map((d) => (d.id === dim.id ? { ...d, name: val } : d));
                            setTimeout(() => setVariantRows(generateCartesianCombinations(updated)), 50);
                            return updated;
                          });
                        }}
                        className="bg-transparent font-bold text-xs text-white border-b border-white/20 focus:border-purple-400 focus:outline-none pb-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveDimension(dim.id)}
                        className="text-white/40 hover:text-rose-400 text-xs p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Chips for Dimension Values */}
                    <div className="flex flex-wrap gap-1.5 items-center pt-1">
                      {dim.values.map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold"
                        >
                          {v}
                          <button
                            type="button"
                            onClick={() => handleRemoveValueFromDimension(dim.id, v)}
                            className="hover:text-rose-400 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {/* Add Value Input */}
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Add value..."
                          value={newValInputs[dim.id] || ""}
                          onChange={(e) =>
                            setNewValInputs((prev) => ({ ...prev, [dim.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddValueToDimension(dim.id, newValInputs[dim.id] || "");
                            }
                          }}
                          className="w-24 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleAddValueToDimension(dim.id, newValInputs[dim.id] || "")
                          }
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-purple-500 text-white text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddDimension(`Option ${variantDimensions.length + 1}`)}
                  className="w-full py-2 rounded-xl border border-dashed border-white/20 hover:border-purple-400 text-purple-400 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Option Dimension
                </button>
              </div>

              {/* GENERATED VARIANT MATRIX TABLE */}
              {variantRows.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-emerald-400" />
                      Generated Variations ({variantRows.length} total SKUs)
                    </span>

                    {/* Bulk Tools */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="₦ Price"
                          value={bulkPriceNaira}
                          onChange={(e) =>
                            setBulkPriceNaira(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          className="w-20 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPriceToAllVariants}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] text-white rounded-lg font-semibold"
                        >
                          Apply All
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="Stock"
                          value={bulkStock}
                          onChange={(e) =>
                            setBulkStock(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          className="w-16 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleApplyStockToAllVariants}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] text-white rounded-lg font-semibold"
                        >
                          Apply All
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Responsive Variant List / Table */}
                  <div className="space-y-2">
                    {variantRows.map((row, idx) => (
                      <div
                        key={row.id}
                        className="p-3 rounded-xl bg-black/50 border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                      >
                        {/* Variant Title */}
                        <div className="sm:col-span-4 font-semibold text-xs text-white">
                          <span>{row.combinationTitle}</span>
                        </div>

                        {/* SKU */}
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="SKU"
                            value={row.sku}
                            onChange={(e) => handleUpdateVariantRow(idx, "sku", e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono"
                          />
                        </div>

                        {/* Price */}
                        <div className="sm:col-span-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-white/50">₦</span>
                            <input
                              type="number"
                              placeholder="Price"
                              value={row.effectivePriceNaira}
                              onChange={(e) =>
                                handleUpdateVariantRow(
                                  idx,
                                  "effectivePriceNaira",
                                  e.target.value === "" ? 0 : Number(e.target.value)
                                )
                              }
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono"
                            />
                          </div>
                        </div>

                        {/* Stock */}
                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Stock"
                            value={row.stockQuantity}
                            onChange={(e) =>
                              handleUpdateVariantRow(idx, "stockQuantity", Number(e.target.value))
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* STEP 7: DYNAMIC FULFILLMENT (Based on Product Type) */}
        {productType === "DIGITAL" && (
          <section className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3.5 border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                7. Digital Delivery Options
              </label>
              <span className="text-[10px] text-white/50">Automatic delivery upon payment</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDigitalFulfillmentType("DOWNLOAD_FILE")}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold ${
                  digitalFulfillmentType === "DOWNLOAD_FILE"
                    ? "border-cyan-400 bg-cyan-500/10 text-white"
                    : "border-white/10 text-white/50"
                }`}
              >
                File Download Link
              </button>
              <button
                type="button"
                onClick={() => setDigitalFulfillmentType("LICENSE_KEY")}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold ${
                  digitalFulfillmentType === "LICENSE_KEY"
                    ? "border-cyan-400 bg-cyan-500/10 text-white"
                    : "border-white/10 text-white/50"
                }`}
              >
                License / Secret Key
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <input
                type="url"
                placeholder="Digital File Download Link (Google Drive, Cloudinary, Dropbox)"
                value={digitalFileUrl}
                onChange={(e) => setDigitalFileUrl(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none font-mono"
              />

              <textarea
                rows={2}
                placeholder="Secret key, license code, or instructions revealed on receipt page..."
                value={digitalKeyOrNote}
                onChange={(e) => setDigitalKeyOrNote(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </section>
        )}

        {/* STEP 8: FLASH SALE PROMO (With Promo Expiration Date & Time) */}
        <section className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rose-400" />
                8. Flash Sale Promo Discount
              </label>
              <p className="text-[10px] text-white/40">Limited time promotion with exact expiration</p>
            </div>

            <button
              type="button"
              onClick={() => setHasPromo(!hasPromo)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                hasPromo
                  ? "bg-rose-500 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/15"
              }`}
            >
              {hasPromo ? "Promo Active" : "+ Add Flash Sale"}
            </button>
          </div>

          {hasPromo && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/70">
                    Flash Sale Price (₦) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 42000"
                    value={promoPriceNaira}
                    onChange={(e) =>
                      setPromoPriceNaira(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full bg-black/60 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-400 font-mono font-bold focus:outline-none"
                  />
                </div>

                {/* Promo Expiration with Date & Time Picker */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/70 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-rose-400" /> Promo Expiration
                  </label>
                  <input
                    type="datetime-local"
                    value={promoExpirationDateTime}
                    onChange={(e) => setPromoExpirationDateTime(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-400 focus:outline-none font-mono"
                  />
                </div>

                {/* Item Quota */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-white/70">Item Limit</label>
                    <span className="text-[9px] text-white/40">Quota</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 10 items only"
                    value={promoMaxItems}
                    onChange={(e) =>
                      setPromoMaxItems(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-400 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <p className="text-[10px] text-white/40 italic">
                When the expiration date & time arrives or when the item quota is reached, the product automatically returns to standard price.
              </p>
            </div>
          )}
        </section>

        {/* STEP 9: VISIBILITY STATUS */}
        <section className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-3 border border-white/10">
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wider">
            9. Visibility Status
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisibility("PUBLIC")}
              className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                visibility === "PUBLIC"
                  ? "border-emerald-400 bg-emerald-500/10 text-white font-bold"
                  : "border-white/10 text-white/60 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> PUBLIC (Live)
              </div>
              <p className="text-[10px] text-white/40 mt-1">Available for purchase immediately</p>
            </button>

            <button
              type="button"
              onClick={() => setVisibility("DRAFT")}
              className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                visibility === "DRAFT"
                  ? "border-white/40 bg-white/10 text-white font-bold"
                  : "border-white/10 text-white/60 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-4 h-4 text-white/60" /> DRAFT (Hidden)
              </div>
              <p className="text-[10px] text-white/40 mt-1">Saved privately in your dashboard</p>
            </button>
          </div>
        </section>

        {/* Publish Progress & Error Banner */}
        {isPublishing && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/70">
              <span>Publishing product...</span>
              <span className="font-mono text-emerald-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {publishStatus === "error" && (
          <div className="liquid-glass-subtle p-3 rounded-xl border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isPublishing}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {isPublishing ? (
            <span className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
          ) : (
            <>
              Publish Product <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
