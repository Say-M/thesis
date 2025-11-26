export type Product = {
  id: string;
  title: string;
  price: string;
  salePrice?: string;
  category: string;
  subcategory?: string;
  description: string;
  image?: string;
  rating?: number;
  reviews?: number;
};

export type ProductReview = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  highlighted?: boolean;
  createdAt: string;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  subcategories?: Subcategory[];
};

export type Subcategory = {
  slug: string;
  name: string;
};

export type ComparisonRow = {
  name: string;
  price: string;
  rating: string;
  storage: string;
  battery: string;
};

export type TrackingStep = {
  label: string;
  description: string;
  status: "done" | "pending";
};

export type Order = {
  id: string;
  date: string;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  total: string;
  items: Array<{
    title: string;
    quantity: number;
    price: string;
  }>;
};

export type User = {
  name: string;
  email: string;
  address: string;
  phone: string;
};

// Expanded product catalog
export const catalog: Product[] = [
  // Electronics - Phones
  {
    id: "phone-1",
    title: "iPhone 15 Pro",
    price: "$999",
    category: "electronics",
    subcategory: "phones",
    description:
      "Latest iPhone with A17 Pro chip, titanium design, and advanced camera system.",
    rating: 4.8,
    reviews: 1240,
  },
  {
    id: "phone-2",
    title: "Samsung Galaxy S23 Ultra",
    price: "$899",
    category: "electronics",
    subcategory: "phones",
    description:
      "Premium Android flagship with S Pen, 200MP camera, and Snapdragon 8 Gen 2.",
    rating: 4.6,
    reviews: 890,
  },
  {
    id: "phone-3",
    title: "Google Pixel 9",
    price: "$799",
    category: "electronics",
    subcategory: "phones",
    description:
      "Pure Android experience with exceptional camera and AI features.",
    rating: 4.5,
    reviews: 650,
  },
  // Electronics - Laptops
  {
    id: "laptop-1",
    title: 'MacBook Pro 16"',
    price: "$2499",
    category: "electronics",
    subcategory: "laptops",
    description:
      "M3 Pro chip, Liquid Retina XDR display, and all-day battery life.",
    rating: 4.9,
    reviews: 450,
  },
  {
    id: "laptop-2",
    title: "Dell XPS 15",
    price: "$1899",
    category: "electronics",
    subcategory: "laptops",
    description: "OLED display, Intel Core i9, and premium build quality.",
    rating: 4.7,
    reviews: 320,
  },
  {
    id: "laptop-3",
    title: "Lenovo ThinkPad X1",
    price: "$1599",
    category: "electronics",
    subcategory: "laptops",
    description:
      "Business-class laptop with exceptional keyboard and durability.",
    rating: 4.6,
    reviews: 280,
  },
  // Fashion - Men's
  {
    id: "fashion-m-1",
    title: "Classic Denim Jacket",
    price: "$89",
    category: "fashion",
    subcategory: "mens",
    description:
      "Timeless denim jacket with modern fit and premium construction.",
    rating: 4.4,
    reviews: 156,
  },
  {
    id: "fashion-m-2",
    title: "Slim Fit Chinos",
    price: "$59",
    category: "fashion",
    subcategory: "mens",
    description:
      "Comfortable chinos in multiple colors, perfect for casual and smart casual.",
    rating: 4.5,
    reviews: 234,
  },
  {
    id: "fashion-m-3",
    title: "Leather Dress Shoes",
    price: "$149",
    category: "fashion",
    subcategory: "mens",
    description:
      "Handcrafted leather shoes with cushioned insole for all-day comfort.",
    rating: 4.7,
    reviews: 189,
  },
  // Fashion - Women's
  {
    id: "fashion-w-1",
    title: "Floral Summer Dress",
    price: "$79",
    category: "fashion",
    subcategory: "womens",
    description:
      "Lightweight dress perfect for summer, with elegant floral pattern.",
    rating: 4.6,
    reviews: 312,
  },
  {
    id: "fashion-w-2",
    title: "Designer Handbag",
    price: "$199",
    category: "fashion",
    subcategory: "womens",
    description:
      "Premium leather handbag with spacious interior and elegant design.",
    rating: 4.8,
    reviews: 445,
  },
  {
    id: "fashion-w-3",
    title: "Ankle Boots",
    price: "$129",
    category: "fashion",
    subcategory: "womens",
    description:
      "Stylish ankle boots with comfortable heel and quality materials.",
    rating: 4.5,
    reviews: 278,
  },
  // Sports - Running
  {
    id: "sport-1",
    title: "Velocity Run Pro",
    price: "$129",
    category: "sports",
    subcategory: "running",
    description: "Responsive foam midsole with breathable knit upper.",
    rating: 4.6,
    reviews: 567,
  },
  {
    id: "sport-2",
    title: "Aero Glide 2",
    price: "$149",
    category: "sports",
    subcategory: "running",
    description: "Stability shoe tuned for daily road training sessions.",
    rating: 4.7,
    reviews: 423,
  },
  {
    id: "sport-3",
    title: "Pulse Sprint Knit",
    price: "$99",
    category: "sports",
    subcategory: "running",
    description: "Featherweight trainer built for tempo workouts.",
    rating: 4.5,
    reviews: 389,
  },
  // Sports - Gym
  {
    id: "sport-4",
    title: "Atlas Smart Watch",
    price: "$249",
    category: "sports",
    subcategory: "gym",
    description: "Tracks advanced metrics with 7-day battery life.",
    rating: 4.8,
    reviews: 890,
  },
  {
    id: "sport-5",
    title: "Flex Studio Mat",
    price: "$59",
    category: "sports",
    subcategory: "gym",
    description: "Grippy mat with antimicrobial coating for clubs.",
    rating: 4.4,
    reviews: 234,
  },
  {
    id: "sport-6",
    title: "Resistance Band Set",
    price: "$39",
    category: "sports",
    subcategory: "gym",
    description: "Set of 5 resistance bands for full-body workouts.",
    rating: 4.6,
    reviews: 456,
  },
  // Home - Furniture
  {
    id: "home-1",
    title: "Modern Sofa",
    price: "$899",
    category: "home",
    subcategory: "furniture",
    description:
      "Comfortable 3-seater sofa with premium fabric and solid wood frame.",
    rating: 4.7,
    reviews: 189,
  },
  {
    id: "home-2",
    title: "Coffee Table",
    price: "$299",
    category: "home",
    subcategory: "furniture",
    description: "Minimalist coffee table with glass top and metal legs.",
    rating: 4.5,
    reviews: 123,
  },
  {
    id: "home-3",
    title: "Dining Set",
    price: "$599",
    category: "home",
    subcategory: "furniture",
    description: "6-person dining table with matching chairs.",
    rating: 4.6,
    reviews: 98,
  },
  // Home - Decor
  {
    id: "home-4",
    title: "Wall Art Set",
    price: "$79",
    category: "home",
    subcategory: "decor",
    description: "Set of 3 framed prints, ready to hang.",
    rating: 4.4,
    reviews: 234,
  },
  {
    id: "home-5",
    title: "Table Lamp",
    price: "$49",
    category: "home",
    subcategory: "decor",
    description: "Modern LED table lamp with adjustable brightness.",
    rating: 4.5,
    reviews: 167,
  },
  // Books
  {
    id: "book-1",
    title: "The Future of AI",
    price: "$24",
    category: "books",
    subcategory: "technology",
    description:
      "Comprehensive guide to artificial intelligence and its impact.",
    rating: 4.7,
    reviews: 890,
  },
  {
    id: "book-2",
    title: "Web Development Mastery",
    price: "$29",
    category: "books",
    subcategory: "technology",
    description: "Complete guide to modern web development practices.",
    rating: 4.6,
    reviews: 567,
  },
];

// Categories with subcategories
export const categories: Category[] = [
  {
    slug: "electronics",
    name: "Electronics",
    description: "Latest gadgets and tech devices",
    subcategories: [
      { slug: "phones", name: "Phones" },
      { slug: "laptops", name: "Laptops" },
      { slug: "tablets", name: "Tablets" },
      { slug: "accessories", name: "Accessories" },
    ],
  },
  {
    slug: "fashion",
    name: "Fashion",
    description: "Trendy clothing and accessories",
    subcategories: [
      { slug: "mens", name: "Men's" },
      { slug: "womens", name: "Women's" },
      { slug: "kids", name: "Kids" },
      { slug: "accessories", name: "Accessories" },
    ],
  },
  {
    slug: "sports",
    name: "Sports & Outdoors",
    description: "Gear for active lifestyle",
    subcategories: [
      { slug: "running", name: "Running" },
      { slug: "gym", name: "Gym & Fitness" },
      { slug: "outdoor", name: "Outdoor" },
      { slug: "water-sports", name: "Water Sports" },
    ],
  },
  {
    slug: "home",
    name: "Home & Living",
    description: "Furniture and home decor",
    subcategories: [
      { slug: "furniture", name: "Furniture" },
      { slug: "decor", name: "Decor" },
      { slug: "kitchen", name: "Kitchen" },
      { slug: "bedding", name: "Bedding" },
    ],
  },
  {
    slug: "books",
    name: "Books",
    description: "Books for every interest",
    subcategories: [
      { slug: "technology", name: "Technology" },
      { slug: "fiction", name: "Fiction" },
      { slug: "non-fiction", name: "Non-Fiction" },
      { slug: "business", name: "Business" },
    ],
  },
];

// Mock user data
export const mockUser: User = {
  name: "John Doe",
  email: "john.doe@example.com",
  address: "123 Main Street, City, State 12345",
  phone: "+1 (555) 123-4567",
};

// Mock orders
export const mockOrders: Order[] = [
  {
    id: "ORD-1234",
    date: "2024-01-15",
    status: "delivered",
    total: "$249.00",
    items: [{ title: "iPhone 15 Pro", quantity: 1, price: "$999" }],
  },
  {
    id: "ORD-1235",
    date: "2024-02-20",
    status: "shipped",
    total: "$179.00",
    items: [{ title: "Nimbus ANC Buds", quantity: 1, price: "$179" }],
  },
  {
    id: "ORD-1236",
    date: "2024-03-10",
    status: "pending",
    total: "$89.00",
    items: [{ title: "Classic Denim Jacket", quantity: 1, price: "$89" }],
  },
];

type KeywordMatch = {
  keywords: string[];
  category?: string;
  subcategory?: string;
};

const keywordMap: KeywordMatch[] = [
  {
    keywords: ["running shoe", "running shoes", "run", "sprint", "jog"],
    category: "sports",
    subcategory: "running",
  },
  {
    keywords: ["gym", "fitness", "workout"],
    category: "sports",
    subcategory: "gym",
  },
  {
    keywords: ["watch", "tracker", "wearable", "smartwatch"],
    category: "sports",
    subcategory: "gym",
  },
  {
    keywords: ["earbuds", "headphones", "audio", "buds"],
    category: "electronics",
    subcategory: "accessories",
  },
  {
    keywords: ["phone", "iphone", "samsung", "pixel", "smartphone"],
    category: "electronics",
    subcategory: "phones",
  },
  {
    keywords: ["laptop", "macbook", "computer", "notebook"],
    category: "electronics",
    subcategory: "laptops",
  },
  {
    keywords: ["dress", "fashion", "clothes", "clothing", "jacket", "shoes"],
    category: "fashion",
  },
  {
    keywords: ["sofa", "furniture", "home", "decor"],
    category: "home",
  },
  {
    keywords: ["book", "reading", "novel", "technology book"],
    category: "books",
  },
];

export const comparisonMatrix: Record<string, Omit<ComparisonRow, "name">> = {
  "iphone 15": {
    price: "$999",
    rating: "4.8 / 5",
    storage: "256 GB",
    battery: "26 hrs video",
  },
  "samsung s23": {
    price: "$899",
    rating: "4.6 / 5",
    storage: "256 GB",
    battery: "24 hrs video",
  },
  "pixel 9": {
    price: "$799",
    rating: "4.5 / 5",
    storage: "128 GB",
    battery: "25 hrs video",
  },
};

export const trackingTemplate: TrackingStep[] = [
  {
    label: "Order Placed",
    description: "We received your order and started processing it.",
    status: "done",
  },
  {
    label: "Packed",
    description: "Items verified and securely packed at the warehouse.",
    status: "done",
  },
  {
    label: "Shipped",
    description: "Carrier picked up the parcel and scanned it in transit.",
    status: "done",
  },
  {
    label: "Out for Delivery",
    description: "Courier is on the way to your address.",
    status: "pending",
  },
];

export function getProductsForQuery(query: string): Product[] {
  const normalized = query.toLowerCase();
  const match = keywordMap.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword))
  );

  let results = catalog;

  if (match?.category) {
    results = results.filter((item) => item.category === match.category);
  }

  if (match?.subcategory) {
    results = results.filter((item) => item.subcategory === match.subcategory);
  }

  if (results.length === 0) {
    return catalog.slice(0, 3);
  }

  return results.slice(0, 3);
}

export function findProductByName(query: string): Product | null {
  const normalized = query.toLowerCase();
  return (
    catalog.find(
      (p) =>
        normalized.includes(p.title.toLowerCase()) ||
        p.title.toLowerCase().includes(normalized)
    ) || null
  );
}

export function getComparisonRows(query: string): ComparisonRow[] {
  const normalized = query.toLowerCase();
  const candidates = Object.keys(comparisonMatrix).filter((name) =>
    normalized.includes(name)
  );

  const selected =
    candidates.length >= 2 ? candidates : ["iphone 15", "samsung s23"];

  return selected.slice(0, 3).map((name) => ({
    name,
    ...comparisonMatrix[name],
  }));
}

export function getReviewSummary(query: string): string {
  const subject = query.replace(/summarize reviews for/i, "").trim() || "this";
  return `Most customers liked the build quality and battery life of ${subject}, while a few mentioned the fit could be improved for smaller hands. Overall sentiment is positive with quick delivery shout-outs.`;
}

export function getProductsByCategory(
  categorySlug: string,
  subcategorySlug?: string
): Product[] {
  if (subcategorySlug) {
    return catalog.filter(
      (p) => p.category === categorySlug && p.subcategory === subcategorySlug
    );
  }
  return catalog.filter((p) => p.category === categorySlug);
}

export function getProductById(id: string): Product | undefined {
  return catalog.find((p) => p.id === id);
}

export function getFeaturedProducts(): Product[] {
  return catalog.slice(0, 6);
}

export function getBestSellingProducts(): Product[] {
  return catalog
    .filter((p) => (p.rating || 0) >= 4.5)
    .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
    .slice(0, 8);
}

const productReviews: ProductReview[] = [
  {
    id: "rev-1",
    productId: "phone-1",
    author: "Maya Rahman",
    rating: 5,
    title: "Battery is incredible",
    comment:
      "Coming from the 13 Pro, the battery jump is real. Easily lasts me a day and a half with heavy photo use.",
    highlighted: true,
    createdAt: "2024-03-02",
  },
  {
    id: "rev-2",
    productId: "phone-1",
    author: "Arif Chowdhury",
    rating: 4,
    title: "Lighter than expected",
    comment:
      "Love the titanium build and new action button. Wish the price included a charger, though.",
    createdAt: "2024-02-14",
  },
  {
    id: "rev-3",
    productId: "phone-2",
    author: "Tania Sultana",
    rating: 4,
    title: "Perfect for note taking",
    comment:
      "The S Pen is still unmatched. Camera holds up great, though night mode can over-sharpen sometimes.",
    createdAt: "2024-01-29",
  },
  {
    id: "rev-4",
    productId: "phone-3",
    author: "Rafiul Islam",
    rating: 5,
    title: "AI features are fun",
    comment:
      "Pixel's assistant features are handy. Photos are crisp and low-light performance is fantastic.",
    createdAt: "2024-02-08",
  },
  {
    id: "rev-5",
    productId: "laptop-1",
    author: "Sadia Karim",
    rating: 5,
    title: "All-day performance",
    comment:
      "Rendering videos in Final Cut without thermal throttling. Battery easily covers my remote work days.",
    highlighted: true,
    createdAt: "2024-03-10",
  },
  {
    id: "rev-6",
    productId: "sport-1",
    author: "Naeem Khan",
    rating: 3,
    title: "Runs slightly narrow",
    comment:
      "Great bounce and grip, but go half a size up if you have wider feet.",
    createdAt: "2024-02-22",
  },
];

export function getProductReviews(productId: string): ProductReview[] {
  return productReviews
    .filter((review) => review.productId === productId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}
