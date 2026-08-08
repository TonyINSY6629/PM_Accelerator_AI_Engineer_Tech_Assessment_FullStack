// The Cloudflare build regenerates .output/server/wrangler.json on every run and names the worker
// after the repository directory. That name is 70 characters, and Cloudflare refuses any name over
// 63 as a workers.dev subdomain, so a deploy straight after a build fails. This rewrites the name
// to the short, stable one the public URL depends on.
import { readFileSync, writeFileSync } from "node:fs";

const CONFIG_PATH = ".output/server/wrangler.json";
const WORKER_NAME = "tony-weather-forecast";

const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
config.name = WORKER_NAME;
writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

console.log(`worker name set to "${WORKER_NAME}"`);
