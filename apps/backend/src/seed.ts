import mongoose from "mongoose";
import connectDB from "./db/mongo";
import { Category } from "./models/category";
import { Product } from "./models/product";
import { Review } from "./models/review";
import { ReviewStatus } from "./enums/review";
import { DiscountType } from "./enums/discount";

type SeedOptions = {
  products: number;
  minReviewsPerProduct: number;
  maxReviewsPerProduct: number;
  clearExisting: boolean;
};

const DEFAULTS: SeedOptions = {
  products: 100,
  minReviewsPerProduct: 10,
  maxReviewsPerProduct: 20,
  clearExisting: false,
};

async function main() {
  await loadDotEnvFromBackendIfPresent();

  const opts = parseArgs(Bun.argv.slice(2));

  console.log("[seed] options", opts);

  await connectDB();

  if (opts.clearExisting) {
    console.log("[seed] clearing existing Category/Product/Review docs…");
    await Promise.all([Review.deleteMany({}), Product.deleteMany({}), Category.deleteMany({})]);
  }

  console.log("[seed] creating skincare categories…");
  const { root, subcategories } = await seedSkincareCategories();

  console.log("[seed] creating products…");
  const products = await seedProducts({
    rootCategoryId: root._id,
    subcategoryIds: subcategories.map((c) => c._id),
    count: opts.products,
  });

  console.log("[seed] creating reviews…");
  const totalReviews = await seedReviews({
    products,
    minPerProduct: opts.minReviewsPerProduct,
    maxPerProduct: opts.maxReviewsPerProduct,
  });

  console.log(
    `[seed] done: categories=${subcategories.length + 1}, products=${products.length}, reviews=${totalReviews}`,
  );
}

main()
  .catch((err) => {
    console.error("[seed] failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });

function parseArgs(args: string[]): SeedOptions {
  const opts: SeedOptions = { ...DEFAULTS };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--products") opts.products = clampInt(Number(args[++i]), 1, 10_000, DEFAULTS.products);
    if (a === "--min-reviews") opts.minReviewsPerProduct = clampInt(Number(args[++i]), 0, 200, DEFAULTS.minReviewsPerProduct);
    if (a === "--max-reviews") opts.maxReviewsPerProduct = clampInt(Number(args[++i]), 0, 200, DEFAULTS.maxReviewsPerProduct);
    if (a === "--clear") opts.clearExisting = true;
  }
  if (opts.maxReviewsPerProduct < opts.minReviewsPerProduct) {
    [opts.minReviewsPerProduct, opts.maxReviewsPerProduct] = [opts.maxReviewsPerProduct, opts.minReviewsPerProduct];
  }
  return opts;
}

function clampInt(n: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

async function seedSkincareCategories() {
  const root = await Category.findOneAndUpdate(
    { name: "Skincare", parentCategory: { $exists: false } },
    { $setOnInsert: { name: "Skincare", description: "Skincare products and routines", status: true } },
    { upsert: true, new: true },
  );

  const subcategoryNames = [
    "Cleansers",
    "Moisturizers",
    "Serums",
    "Sunscreens",
    "Treatments",
    "Toners",
    "Exfoliators",
    "Masks",
    "Eye Creams",
    "Lip Care",
  ];

  const subcategories = await Promise.all(
    subcategoryNames.map((name) =>
      Category.findOneAndUpdate(
        { name, parentCategory: root._id },
        {
          $setOnInsert: {
            parentCategory: root._id,
            name,
            description: `Skincare subcategory: ${name}`,
            status: true,
          },
        },
        { upsert: true, new: true },
      ),
    ),
  );

  return { root, subcategories };
}

async function seedProducts(input: { rootCategoryId: any; subcategoryIds: any[]; count: number }) {
  const concerns = ["Acne", "Dark spots", "Wrinkles", "Dryness", "Oil control", "Sensitive skin", "Uneven tone"];
  const ingredients = [
    "Niacinamide",
    "Salicylic Acid (BHA)",
    "Hyaluronic Acid",
    "Vitamin C",
    "Retinol",
    "Ceramides",
    "Azelaic Acid",
    "Glycolic Acid (AHA)",
    "Zinc PCA",
    "Panthenol",
    "Centella",
    "Green tea",
  ];
  const adjectives = ["Gentle", "Daily", "Brightening", "Hydrating", "Balancing", "Clarifying", "Soothing", "Barrier Repair"];
  const productTypes = ["Cleanser", "Moisturizer", "Serum", "Sunscreen", "Treatment", "Toner", "Exfoliant", "Mask", "Eye Cream", "Lip Balm"];
  const faqQuestions = [
    "How do I use it?",
    "Is it suitable for sensitive skin?",
    "When will I see results?",
    "Can I use it with other actives?",
    "Is it fragrance-free?",
  ];

  const created: any[] = [];
  for (let i = 0; i < input.count; i++) {
    const subcategory = pick(input.subcategoryIds);
    const concern = pick(concerns);
    const ingredient = pick(ingredients);
    const adjective = pick(adjectives);
    const type = pick(productTypes);

    const baseName = `${adjective} ${ingredient} ${type} for ${concern}`;
    const slug = uniqueSlug(`${slugify(baseName)}-${i + 1}`);

    const sellingPrice = randInt(8, 45);
    const buyingPrice = Math.max(1, Math.floor(sellingPrice * randFloat(0.35, 0.65)));
    const stock = randInt(20, 500);

    const discountType = Math.random() < 0.7 ? DiscountType.PERCENTAGE : DiscountType.FIXED;
    const discountValue =
      discountType === DiscountType.PERCENTAGE ? randInt(0, 25) : randInt(0, Math.min(10, sellingPrice));

    const faqs = randInt(2, 5);
    const faqList = Array.from({ length: faqs }).map((_, idx) => ({
      question: faqQuestions[idx] || `FAQ ${idx + 1}`,
      answer: buildFaqAnswer(type, ingredient),
    }));

    const description = buildDescription({ type, ingredient, concern });

    const doc = await Product.create({
      hasVariants: false,
      category: input.rootCategoryId,
      subcategory,
      name: baseName,
      slug,
      description,
      buyingPrice,
      sellingPrice,
      discountType,
      discountValue,
      stock,
      status: true,
      faqs: faqList,
    });

    created.push(doc);
  }

  return created;
}

async function seedReviews(input: { products: any[]; minPerProduct: number; maxPerProduct: number }) {
  const positives = [
    "Feels gentle and non-irritating.",
    "Helped reduce breakouts after a couple of weeks.",
    "Absorbs quickly and layers well under sunscreen.",
    "Noticeably improved hydration and texture.",
    "No strong fragrance and didn’t sting.",
    "Works well for my routine—would repurchase.",
  ];
  const negatives = [
    "A bit drying for me—needed extra moisturizer.",
    "Took time to see results.",
    "Slightly sticky finish on my skin.",
    "Not enough hydration for very dry skin.",
    "Pilled under makeup when I used too much.",
    "Caused mild irritation at first (used less often and it improved).",
  ];

  let total = 0;
  for (const p of input.products) {
    const count = randInt(input.minPerProduct, input.maxPerProduct);
    const docs = Array.from({ length: count }).map(() => {
      const rating = weightedRating();
      const comment =
        rating >= 4
          ? `${pick(positives)} ${Math.random() < 0.4 ? pick(positives) : ""}`.trim()
          : `${pick(negatives)} ${Math.random() < 0.35 ? pick(positives) : ""}`.trim();
      return {
        product: p._id,
        rating,
        comment,
        status: ReviewStatus.APPROVED,
      };
    });
    await Review.insertMany(docs);
    total += docs.length;
  }
  return total;
}

function weightedRating(): number {
  const r = Math.random();
  if (r < 0.08) return 1;
  if (r < 0.18) return 2;
  if (r < 0.38) return 3;
  if (r < 0.72) return 4;
  return 5;
}

function buildDescription(input: { type: string; ingredient: string; concern: string }) {
  return [
    `${input.type} formulated with ${input.ingredient} to support ${input.concern.toLowerCase()}.`,
    "Designed for everyday use with a comfortable finish.",
    "Patch test before first use and introduce actives gradually.",
  ].join(" ");
}

function buildFaqAnswer(type: string, ingredient: string) {
  return `Apply the ${type.toLowerCase()} as directed. Start slowly if you're new to ${ingredient}, and use sunscreen during the day.`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function uniqueSlug(base: string) {
  // Good enough for seeding; uniqueness enforced by `-<i>` suffix in caller.
  return base;
}

async function loadDotEnvFromBackendIfPresent() {
  // Bun doesn't automatically load arbitrary .env files for scripts in all setups.
  // This keeps local seeding easy without adding a dependency.
  const path = new URL("../.env", import.meta.url);
  const file = Bun.file(path);
  if (!(await file.exists())) return;

  const text = await file.text();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

