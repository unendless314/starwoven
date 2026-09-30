import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const BLOG_CATEGORIES = [
  '光與阿卡西',
  '靈氣與脈輪',
  '命理與占卜',
  '心靈隨筆',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('星靈織語'),
    authorRole: z.string().optional(),
    category: z.enum(BLOG_CATEGORIES).default('心靈隨筆'),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    readTime: z.string().default('5 分鐘'),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };
