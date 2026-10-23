/* This is a script to create a new post markdown file with front-matter */

import fs from "fs"
import path from "path"

function getDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const args = process.argv.slice(2)

if (args.length === 0 || !args.join(" ").trim()) {
  console.error(`Error: No post name provided
Usage: npm run new-post -- "<post name>"`)
  process.exit(1)
}

const title = args.join(" ").trim()
const slug = slugify(title)

if (!slug) {
  console.error("Error: Post name does not produce a valid slug")
  process.exit(1)
}

const date = getDate()
const targetDir = "./src/content/posts/"
const postDir = path.join(targetDir, `${date}-${slug}`)
const fullPath = path.join(postDir, "index.md")

if (fs.existsSync(postDir)) {
  console.error(`Error: Directory ${postDir} already exists`)
  process.exit(1)
}

fs.mkdirSync(postDir, { recursive: true })

const content = `---
title: ${title}
published: ${date}
description: ''
image: ''
tags: []
categories: []
draft: false 
lang: ''
---
`

fs.writeFileSync(fullPath, content)

console.log(`Post ${fullPath} created`)
