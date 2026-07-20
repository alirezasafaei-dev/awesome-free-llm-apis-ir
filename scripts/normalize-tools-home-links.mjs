import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const homepagePath = path.join(process.cwd(), ".site-dist", "index.html");
const canonicalToolsUrl = "https://llm.persiantoolbox.ir/tools/";
let homepage = await readFile(homepagePath, "utf8");
homepage = homepage.replaceAll('href="./tools/"', `href="${canonicalToolsUrl}"`);
await writeFile(homepagePath, homepage);
console.log("Normalized Homepage tools links to the canonical route.");
