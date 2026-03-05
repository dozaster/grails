#!/usr/bin/env node
/**
 * Run ONCE to extract the base64 logo from your old index.html → public/logo.png
 * Usage: node scripts/extract-logo.js ../path/to/grails-index.html
 */
const fs = require("fs");
const path = require("path");
const htmlPath = process.argv[2];
if (!htmlPath) { console.error("Usage: node scripts/extract-logo.js <path-to-index.html>"); process.exit(1); }
const html = fs.readFileSync(path.resolve(htmlPath), "utf8");
const match = html.match(/src="data:image\/png;base64,([^"]+)"/);
if (!match) { console.error("No base64 PNG found in the HTML."); process.exit(1); }
const outPath = path.resolve(__dirname, "../public/logo.png");
fs.writeFileSync(outPath, Buffer.from(match[1], "base64"));
console.log("logo.png written to", outPath);
