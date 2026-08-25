import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogSrc = fs.readFileSync(path.join(root, "catalog.js"), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`${catalogSrc}\nthis.ContentCoverCatalog = ContentCoverCatalog;`, context);
const catalog = context.ContentCoverCatalog;
const patterns = catalog.matchPatterns();
const lists = catalog.toReadmeMarkdown();

const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.content_scripts[0].matches = patterns;
manifest.content_scripts[0].js = ["filter.js", "catalog.js", "sites.js", "content.js"];
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const readmePath = path.join(root, "README.md");
const readme = fs.readFileSync(readmePath, "utf8");
const block = ["<!-- supported-sites:start -->", lists.summary, "", lists.body, "<!-- supported-sites:end -->"].join("\n");

if (!readme.includes("<!-- supported-sites:start -->")) {
  throw new Error("README.md is missing supported-sites markers");
}

fs.writeFileSync(
  readmePath,
  readme.replace(/<!-- supported-sites:start -->[\s\S]*<!-- supported-sites:end -->/, block)
);

console.log(`Synced ${patterns.length} match patterns and ${lists.totalCount} README sites.`);
