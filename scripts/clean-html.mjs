import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const write = args.includes("--write");
const root = args.find((a) => !a.startsWith("--")) ?? "../src/content/posts";

const NAMED = {
	amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0",
	ndash: "–", mdash: "—", hellip: "…", lsquo: "‘", rsquo: "’",
	ldquo: "“", rdquo: "”", laquo: "«", raquo: "»",
	copy: "©", reg: "®", trade: "™",
};

// Single pass, so "&amp;lt;" becomes "&lt;" and is not decoded twice
function decode(s) {
	return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (all, e) => {
		if (e[0] === "#") {
			const code =
				e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
			try {
				return String.fromCodePoint(code);
			} catch {
				return all;
			}
		}
		return NAMED[e.toLowerCase()] ?? all;
	});
}

// Only real inline HTML tags are removed, so text like <T> survives
const INLINE_TAG =
	/<\/?(?:i|b|em|strong|u|s|span|code|a|br|sup|sub|small|mark)(?:\s[^>]*)?\/?>/gi;

function cleanText(s) {
	return decode(s.replace(INLINE_TAG, "")).replace(/\s+/g, " ").trim();
}

function readValue(raw) {
	const v = raw.trim();
	if (v.startsWith('"')) return JSON.parse(v);
	if (v.startsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
	return v;
}

function fixFrontMatter(fm, name, report) {
	return fm.replace(/^(title|description):[ \t]*(.*)$/gm, (line, key, raw) => {
		let value;
		try {
			value = readValue(raw);
		} catch {
			console.warn(`  cannot parse ${key} in ${name}, left as is`);
			return line;
		}
		const cleaned = cleanText(value);
		if (cleaned === value) return line;
		report.push(`${key}: ${value}\n        -> ${cleaned}`);
		return `${key}: ${JSON.stringify(cleaned)}`;
	});
}

// Entities are decoded only inside fenced code blocks and `inline code`,
// where Markdown would otherwise show them literally.
function fixBody(body) {
	let changed = 0;
	let inFence = false;
	let fenceChar = "";
	const lines = body.split("\n").map((line) => {
		const m = line.match(/^\s*(```+|~~~+)/);
		if (m) {
			if (!inFence) {
				inFence = true;
				fenceChar = m[1][0];
			} else if (m[1][0] === fenceChar) {
				inFence = false;
			}
			return line;
		}
		const next = inFence
			? decode(line)
			: line.replace(/`([^`\n]+)`/g, (all, code) => "`" + decode(code) + "`");
		if (next !== line) changed++;
		return next;
	});
	return { text: lines.join("\n"), changed };
}

let touched = 0;
for (const entry of readdirSync(root, { withFileTypes: true })) {
	if (!entry.isDirectory()) continue;
	const file = path.join(root, entry.name, "index.md");
	if (!existsSync(file)) continue;

	const text = readFileSync(file, "utf8");
	const m = text.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)([\s\S]*)$/);
	if (!m) continue;
	const [, open, fm, close, body] = m;

	const report = [];
	const newFm = fixFrontMatter(fm, entry.name, report);
	const { text: newBody, changed } = fixBody(body);
	if (!report.length && !changed) continue;

	touched++;
	console.log(entry.name);
	for (const r of report) console.log(`    ${r}`);
	if (changed) console.log(`    ${changed} code line(s) with entities decoded`);

	if (write) writeFileSync(file, open + newFm + close + newBody);
}

console.log(
	`\n${touched} post(s) ${write ? "updated" : "would change (dry run, add --write to apply)"}`,
);
