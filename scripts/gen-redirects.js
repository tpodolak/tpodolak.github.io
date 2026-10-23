import { readFileSync, writeFileSync } from "node:fs";

const xml = readFileSync(process.argv[2] ?? "export.xml", "utf8");
const redirects = {};

for (const item of xml.split("<item>").slice(1)) {
	if (!/<wp:post_type><!\[CDATA\[post\]\]><\/wp:post_type>/.test(item)) continue;
	if (!/<wp:status><!\[CDATA\[publish\]\]><\/wp:status>/.test(item)) continue;

	const link = item.match(/<link>(.*?)<\/link>/)?.[1];
	if (!link) continue;

	const { pathname } = new URL(link);
	const m = pathname.match(/^\/blog\/\d{4}\/\d{2}\/\d{2}\/([^/]+)\/?$/);
	if (!m) {
		console.warn("skipped:", pathname);
		continue;
	}
	redirects[pathname.replace(/\/$/, "")] = `/blog/${m[1]}/`;
}

writeFileSync("../src/redirects.json", JSON.stringify(redirects, null, "\t"));
console.log(`${Object.keys(redirects).length} redirects written`);
