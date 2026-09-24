export type ProductType = "PHYSICAL" | "DIGITAL";

export interface AttributeOption {
  label: string;
  value: string;
}

export interface AttributeDefinition {
  id: string;
  name: string;
  type: "text" | "select" | "multiselect" | "number" | "boolean";
  placeholder?: string;
  options?: AttributeOption[];
  canBeVariant?: boolean;
  required?: boolean;
  helpText?: string;
  defaultVariantPresets?: string[];
}

export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  applicableProductTypes: ProductType[];
  attributes: AttributeDefinition[];
}

export const PRODUCT_TYPES: Array<{
  id: ProductType;
  title: string;
  badge: string;
  description: string;
  iconName: string;
}> = [
  {
    id: "PHYSICAL",
    title: "Physical Product",
    badge: "Fulfillment & Stock",
    description: "Physical goods requiring inventory tracking, packaging, and shipping.",
    iconName: "Package",
  },
  {
    id: "DIGITAL",
    title: "Digital Product",
    badge: "Instant Delivery",
    description: "Files, license keys, courses, ebooks, software, access links, or memberships.",
    iconName: "Download",
  },
];

export const CATEGORIES_CONFIG: CategoryDefinition[] = [
  {
    id: "clothing",
    name: "Clothing & Apparel",
    icon: "Shirt",
    applicableProductTypes: ["PHYSICAL"],
    attributes: [
      {
        id: "brand",
        name: "Brand / Label",
        type: "text",
        placeholder: "e.g. Nike, Zara, Adidas, Native Couture",
        canBeVariant: false,
      },
      {
        id: "gender",
        name: "Gender",
        type: "select",
        options: [
          { label: "Men", value: "Men" },
          { label: "Women", value: "Women" },
          { label: "Unisex", value: "Unisex" },
          { label: "Kids / Boys", value: "Kids Boys" },
          { label: "Kids / Girls", value: "Kids Girls" },
        ],
        canBeVariant: false,
      },
      {
        id: "material",
        name: "Material",
        type: "text",
        placeholder: "e.g. 100% Cotton, Linen, Polyester, Silk",
        canBeVariant: false,
      },
      {
        id: "size",
        name: "Size",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
        helpText: "Can define size variant dimensions",
      },
      {
        id: "color",
        name: "Color",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: [
          "Black",
          "White",
          "Navy Blue",
          "Heather Grey",
          "Beige",
          "Olive Green",
          "Red",
          "Burgundy",
        ],
        helpText: "Can define color variant dimensions",
      },
      {
        id: "fit",
        name: "Fit Style",
        type: "select",
        options: [
          { label: "Regular Fit", value: "Regular" },
          { label: "Slim Fit", value: "Slim" },
          { label: "Oversized / Relaxed", value: "Oversized" },
          { label: "Athletic Fit", value: "Athletic" },
        ],
        canBeVariant: false,
      },
      {
        id: "condition",
        name: "Item Condition",
        type: "select",
        options: [
          { label: "Brand New (With Tags)", value: "Brand New" },
          { label: "New without Tags", value: "New without tags" },
          { label: "Gently Used", value: "Used" },
        ],
        canBeVariant: false,
      },
    ],
  },
  {
    id: "shoes",
    name: "Shoes & Footwear",
    icon: "Footprints",
    applicableProductTypes: ["PHYSICAL"],
    attributes: [
      {
        id: "brand",
        name: "Brand",
        type: "text",
        placeholder: "e.g. Jordan, Nike, New Balance, Clarks",
        canBeVariant: false,
      },
      {
        id: "shoeSize",
        name: "Shoe Size (EU)",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: [
          "38",
          "39",
          "40",
          "41",
          "42",
          "43",
          "44",
          "45",
          "46",
        ],
        helpText: "Shoe size variants",
      },
      {
        id: "color",
        name: "Colorway",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["Black/White", "Triple Black", "All White", "Panda", "Grey/Navy"],
        helpText: "Color variant options",
      },
      {
        id: "upperMaterial",
        name: "Upper Material",
        type: "text",
        placeholder: "e.g. Genuine Leather, Suede, Mesh, Canvas",
        canBeVariant: false,
      },
      {
        id: "closure",
        name: "Closure Type",
        type: "select",
        options: [
          { label: "Lace-up", value: "Lace-up" },
          { label: "Slip-on", value: "Slip-on" },
          { label: "Velcro / Strap", value: "Velcro" },
          { label: "Zipper", value: "Zipper" },
        ],
        canBeVariant: false,
      },
      {
        id: "condition",
        name: "Condition",
        type: "select",
        options: [
          { label: "Brand New in Box (Deadstock)", value: "Brand New" },
          { label: "Open Box / Tried on", value: "Open Box" },
          { label: "Pre-owned (Good Condition)", value: "Used" },
        ],
        canBeVariant: false,
      },
    ],
  },
  {
    id: "phones_tablets",
    name: "Phones & Tablets",
    icon: "Smartphone",
    applicableProductTypes: ["PHYSICAL"],
    attributes: [
      {
        id: "brand",
        name: "Brand",
        type: "text",
        placeholder: "e.g. Apple, Samsung, Google, Xiaomi, Tecno",
        canBeVariant: false,
      },
      {
        id: "model",
        name: "Model / Series",
        type: "text",
        placeholder: "e.g. iPhone 16 Pro Max, Galaxy S25 Ultra",
        canBeVariant: false,
      },
      {
        id: "storage",
        name: "Storage Capacity",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["128GB", "256GB", "512GB", "1TB"],
        helpText: "Internal storage variants",
      },
      {
        id: "ram",
        name: "RAM Memory",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["4GB", "6GB", "8GB", "12GB", "16GB"],
        helpText: "System RAM variants",
      },
      {
        id: "color",
        name: "Color Finish",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: [
          "Natural Titanium",
          "Black Titanium",
          "White Titanium",
          "Desert Titanium",
          "Midnight",
          "Starlight",
        ],
        helpText: "Device color finishes",
      },
      {
        id: "simSetup",
        name: "SIM Configuration",
        type: "select",
        options: [
          { label: "Dual Physical Nano-SIM", value: "Dual SIM" },
          { label: "Single Nano-SIM + eSIM", value: "Physical + eSIM" },
          { label: "Dual eSIM Only", value: "Dual eSIM" },
        ],
        canBeVariant: true,
      },
      {
        id: "condition",
        name: "Device Condition",
        type: "select",
        options: [
          { label: "Brand New (Factory Sealed)", value: "Brand New" },
          { label: "Certified Refurbished (Grade A+)", value: "Refurbished Grade A" },
          { label: "UK / US Used (Clean)", value: "Used Grade A" },
        ],
        canBeVariant: false,
      },
      {
        id: "warranty",
        name: "Warranty Coverage",
        type: "select",
        options: [
          { label: "1 Year Official Apple/Samsung Warranty", value: "1 Year Official" },
          { label: "6 Months Seller Warranty", value: "6 Months Seller" },
          { label: "30 Days Testing Warranty", value: "30 Days Testing" },
          { label: "No Warranty", value: "No Warranty" },
        ],
        canBeVariant: false,
      },
    ],
  },
  {
    id: "laptops_computers",
    name: "Laptops & Computers",
    icon: "Laptop",
    applicableProductTypes: ["PHYSICAL"],
    attributes: [
      {
        id: "brand",
        name: "Brand",
        type: "text",
        placeholder: "e.g. Apple, Dell, HP, Lenovo, ASUS",
        canBeVariant: false,
      },
      {
        id: "processor",
        name: "Processor (CPU)",
        type: "text",
        placeholder: "e.g. Apple M4 Pro, Intel Core i7-14700H, AMD Ryzen 7",
        canBeVariant: true,
        defaultVariantPresets: ["Core i5 / 16GB", "Core i7 / 16GB", "Core i7 / 32GB", "Core i9 / 64GB"],
      },
      {
        id: "ram",
        name: "RAM",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["8GB", "16GB", "32GB", "64GB"],
      },
      {
        id: "storage",
        name: "SSD Storage",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["512GB SSD", "1TB SSD", "2TB SSD"],
      },
      {
        id: "screenSize",
        name: "Screen Size",
        type: "text",
        placeholder: "e.g. 14.2-inch Liquid Retina, 15.6-inch OLED, 16-inch",
        canBeVariant: false,
      },
      {
        id: "condition",
        name: "Condition",
        type: "select",
        options: [
          { label: "Brand New Sealed", value: "Brand New" },
          { label: "Certified Refurbished", value: "Refurbished" },
          { label: "Foreign Used (Grade A)", value: "Used Grade A" },
        ],
        canBeVariant: false,
      },
    ],
  },
  {
    id: "digital_courses",
    name: "Online Course / Masterclass",
    icon: "GraduationCap",
    applicableProductTypes: ["DIGITAL"],
    attributes: [
      {
        id: "instructor",
        name: "Instructor / Academy Name",
        type: "text",
        placeholder: "e.g. Dr. Babatunde Ogunlesi, Ledgerbaz Academy",
        canBeVariant: false,
      },
      {
        id: "durationHours",
        name: "Course Duration",
        type: "text",
        placeholder: "e.g. 12 Hours on-demand video + 4 practical projects",
        canBeVariant: false,
      },
      {
        id: "skillLevel",
        name: "Skill Level",
        type: "select",
        options: [
          { label: "All Levels Welcome", value: "All Levels" },
          { label: "Beginner Friendly", value: "Beginner" },
          { label: "Intermediate", value: "Intermediate" },
          { label: "Advanced Masterclass", value: "Advanced" },
        ],
        canBeVariant: false,
      },
      {
        id: "tier",
        name: "Course Tier / Package",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: [
          "Self-Paced Course Only",
          "Course + 1-on-1 Mentorship Call",
          "VIP All-Access Lifetime Bundle",
        ],
        helpText: "Tier variant options",
      },
      {
        id: "language",
        name: "Language",
        type: "text",
        placeholder: "e.g. English, French, Yoruba",
        canBeVariant: false,
      },
      {
        id: "certificate",
        name: "Certificate of Completion",
        type: "select",
        options: [
          { label: "Yes, Accredited Certificate Included", value: "Yes" },
          { label: "No Certificate", value: "No" },
        ],
        canBeVariant: false,
      },
    ],
  },
  {
    id: "ebooks_templates",
    name: "E-Books & Templates",
    icon: "BookOpen",
    applicableProductTypes: ["DIGITAL"],
    attributes: [
      {
        id: "author",
        name: "Author / Creator",
        type: "text",
        placeholder: "e.g. Chimamanda Ngozi Adichie",
        canBeVariant: false,
      },
      {
        id: "format",
        name: "File Format",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["PDF", "EPUB", "Figma File", "Notion Template", "Canva Pack"],
      },
      {
        id: "pages",
        name: "Page Count / Asset Count",
        type: "text",
        placeholder: "e.g. 248 Pages, 50+ Ready Templates",
        canBeVariant: false,
      },
      {
        id: "licenseType",
        name: "Usage License",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["Personal Use Only", "Commercial Resale License"],
      },
    ],
  },
  {
    id: "software_license",
    name: "Software & Digital Licenses",
    icon: "Key",
    applicableProductTypes: ["DIGITAL"],
    attributes: [
      {
        id: "platform",
        name: "Supported Platform / OS",
        type: "select",
        options: [
          { label: "Windows, macOS & Mobile", value: "Cross-platform" },
          { label: "Windows 11 / 10 Only", value: "Windows" },
          { label: "macOS Only", value: "macOS" },
          { label: "Cloud / Web SaaS", value: "Cloud" },
        ],
        canBeVariant: false,
      },
      {
        id: "licenseTier",
        name: "License Tier / Devices",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["1 PC / Lifetime", "3 PCs / 1 Year", "Unlimited Team License"],
      },
      {
        id: "deliverySpeed",
        name: "Key Delivery Speed",
        type: "select",
        options: [
          { label: "Instant Key Revelation after Payment", value: "Instant" },
          { label: "Sent to Buyer Email within 15 Minutes", value: "Email 15min" },
        ],
        canBeVariant: false,
      },
    ],
  },
  {
    id: "services_consulting",
    name: "Services & Consultations",
    icon: "Briefcase",
    applicableProductTypes: ["DIGITAL"],
    attributes: [
      {
        id: "serviceFormat",
        name: "Delivery Mode",
        type: "select",
        options: [
          { label: "Online via Google Meet / Zoom", value: "Online Video" },
          { label: "In-Person (Client Location)", value: "In-person" },
          { label: "Async Written Delivery & Review", value: "Async Review" },
        ],
        canBeVariant: false,
      },
      {
        id: "duration",
        name: "Session Duration",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["30 Minutes Call", "60 Minutes Strategy Session", "Full Day Intensive"],
      },
      {
        id: "turnaround",
        name: "Turnaround Time",
        type: "text",
        placeholder: "e.g. Booking within 48 hours, Deliverables in 5 business days",
        canBeVariant: false,
      },
    ],
  },
  {
    id: "subscriptions_membership",
    name: "Memberships & Retainers",
    icon: "Repeat",
    applicableProductTypes: ["DIGITAL"],
    attributes: [
      {
        id: "interval",
        name: "Billing Cadence",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["Monthly Billing", "Quarterly (Save 10%)", "Annual Access (Save 25%)"],
      },
      {
        id: "communityPlatform",
        name: "Access Platform",
        type: "select",
        options: [
          { label: "Private Telegram VIP Channel", value: "Telegram" },
          { label: "Discord Community Server", value: "Discord" },
          { label: "WhatsApp Private Mastermind", value: "WhatsApp" },
          { label: "Dedicated Web Portal", value: "Web Portal" },
        ],
        canBeVariant: false,
      },
      {
        id: "cancellation",
        name: "Cancellation Policy",
        type: "select",
        options: [
          { label: "Cancel Anytime with 1 Click", value: "Cancel Anytime" },
          { label: "Minimum 3 Months Commitment", value: "3 Months Minimum" },
        ],
        canBeVariant: false,
      },
    ],
  },
  {
    id: "general_physical",
    name: "General Goods & Home",
    icon: "Box",
    applicableProductTypes: ["PHYSICAL"],
    attributes: [
      {
        id: "brand",
        name: "Brand / Maker",
        type: "text",
        placeholder: "e.g. Generic, Master Chef, Philips",
        canBeVariant: false,
      },
      {
        id: "variantOption",
        name: "Option / Bundle Size",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["Standard Unit", "Pack of 2", "Pack of 5 (Bulk Save)"],
      },
      {
        id: "color",
        name: "Color",
        type: "select",
        canBeVariant: true,
        defaultVariantPresets: ["Default Color", "Silver", "Black", "Gold"],
      },
      {
        id: "warranty",
        name: "Warranty",
        type: "select",
        options: [
          { label: "No Warranty", value: "No Warranty" },
          { label: "6 Months Warranty", value: "6 Months" },
          { label: "1 Year Official Warranty", value: "1 Year" },
        ],
        canBeVariant: false,
      },
    ],
  },
];
