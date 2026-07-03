import { Types } from "mongoose";
import { Product } from "../models/product";
import { Category } from "../models/category";
import { Review } from "../models/review";
import { ReviewStatus } from "../enums/review";

export type ProductSearchInput = {
  query?: string;
  keywords?: string[];
  categoryName?: string;
  subcategoryName?: string;
  minPrice?: number;
  maxPrice?: number;
  latest?: boolean;
  limit?: number;
};

export async function productSearch(input: ProductSearchInput) {
  const limit = Math.max(1, Math.min(50, input.limit ?? 10));

  const filter: Record<string, unknown> = { status: true };

  // Accept both a single `query` and an array of `keywords`. Every term is
  // OR-matched (case-insensitive) against name and description, so a broad set
  // of synonyms (e.g. "oily", "oil control", "sebum", "matte") widens recall.
  const terms = Array.from(
    new Set(
      [input.query, ...(input.keywords ?? [])]
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean),
    ),
  );

  if (terms.length) {
    filter.$or = terms.flatMap((t) => {
      const rx = { $regex: escapeRegex(t), $options: "i" };
      return [{ name: rx }, { description: rx }];
    });
  }

  if (typeof input.minPrice === "number" || typeof input.maxPrice === "number") {
    const priceFilter: Record<string, number> = {};
    if (typeof input.minPrice === "number") priceFilter.$gte = input.minPrice;
    if (typeof input.maxPrice === "number") priceFilter.$lte = input.maxPrice;
    filter.sellingPrice = priceFilter;
  }

  async function resolveCategoryIdByName(name?: string) {
    if (!name?.trim()) return undefined;
    const doc = await Category.findOne({ name: new RegExp(`^${escapeRegex(name.trim())}$`, "i") })
      .select({ _id: 1 })
      .lean();
    return doc?._id;
  }

  const [categoryId, subcategoryId] = await Promise.all([
    resolveCategoryIdByName(input.categoryName),
    resolveCategoryIdByName(input.subcategoryName),
  ]);
  if (categoryId) filter.category = categoryId;
  if (subcategoryId) filter.subcategory = subcategoryId;

  const sort: Record<string, 1 | -1> = input.latest ? { createdAt: -1 } : { updatedAt: -1 };

  const products = await Product.find(filter)
    .sort(sort)
    .limit(limit)
    .select({
      _id: 1,
      name: 1,
      slug: 1,
      description: 1,
      sellingPrice: 1,
      discountType: 1,
      discountValue: 1,
      stock: 1,
      category: 1,
      subcategory: 1,
      createdAt: 1,
      updatedAt: 1,
    })
    .lean();

  return { products };
}

export type ProductCompareInput = {
  slugsOrIds: string[];
};

export async function productCompare(input: ProductCompareInput) {
  const items = (input.slugsOrIds || []).map((s) => s.trim()).filter(Boolean).slice(0, 5);
  if (items.length < 2) {
    return { products: [], error: "need_at_least_two_products" as const };
  }

  const ids: Types.ObjectId[] = [];
  const slugs: string[] = [];
  for (const item of items) {
    if (Types.ObjectId.isValid(item)) ids.push(new Types.ObjectId(item));
    else slugs.push(item);
  }

  const products = await Product.find({
    status: true,
    $or: [{ _id: { $in: ids } }, { slug: { $in: slugs } }],
  })
    .select({
      _id: 1,
      name: 1,
      slug: 1,
      description: 1,
      sellingPrice: 1,
      buyingPrice: 1,
      discountType: 1,
      discountValue: 1,
      stock: 1,
      category: 1,
      subcategory: 1,
      faqs: 1,
      createdAt: 1,
    })
    .lean();

  return { products };
}

export type ReviewSummaryInput = {
  productSlugOrId: string;
  limit?: number;
};

export async function reviewSummary(input: ReviewSummaryInput) {
  const productKey = input.productSlugOrId?.trim();
  if (!productKey) return { error: "missing_product" as const };

  const productFilter = Types.ObjectId.isValid(productKey)
    ? { _id: new Types.ObjectId(productKey) }
    : { slug: productKey };

  const product = await Product.findOne({ status: true, ...productFilter })
    .select({ _id: 1, name: 1, slug: 1 })
    .lean();

  if (!product) return { error: "product_not_found" as const };

  const limit = Math.max(1, Math.min(50, input.limit ?? 20));
  const reviews = await Review.find({
    product: product._id,
    status: ReviewStatus.APPROVED,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select({ _id: 1, rating: 1, comment: 1, createdAt: 1 })
    .lean();

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  let sum = 0;
  for (const r of reviews) {
    const rating = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[rating] += 1;
    sum += rating;
  }
  const avgRating = reviews.length ? sum / reviews.length : 0;

  return {
    product,
    avgRating,
    count: reviews.length,
    distribution,
    recentReviews: reviews.map((r) => ({
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  };
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

