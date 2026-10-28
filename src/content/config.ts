import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const postsCollection = defineCollection({
	loader: glob({
		pattern: "**/*.md",
		base: "./src/content/posts",
		generateId: ({ entry }) =>
			entry
				.replace(/\/index\.md$/, "") // 2020-06-22-my-post/index.md -> 2020-06-22-my-post
				.replace(/\.md$/, "")
				.replace(/^\d{4}-\d{2}-\d{2}-/, ""), // -> my-post
	}),
	schema: z
		.object({
			title: z.string(),
			published: z.date(),
			updated: z.date().optional(),
			draft: z.boolean().optional().default(false),
			description: z.string().optional().default(""),
			image: z.string().optional().default(""),
			tags: z.array(z.string()).optional().default([]),
			categories: z.array(z.string()).optional().default([]),
			category: z.string().optional().nullable(),
			lang: z.string().optional().default(""),

			/* For internal use */
			prevTitle: z.string().default(""),
			prevSlug: z.string().default(""),
			nextTitle: z.string().default(""),
			nextSlug: z.string().default(""),
		})
		.transform((data) => ({
			...data,
			category: data.category ?? data.categories[0] ?? "",
		})),
});
export const collections = {
	posts: postsCollection,
};
