import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { LATEST_RELEASE_FILENAME, storeLatestReleaseZip } from "../server/releaseZip";

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error(`用法：pnpm tsx scripts/publish-release-zip.mjs /path/to/${LATEST_RELEASE_FILENAME}`);
}
if (basename(inputPath) !== LATEST_RELEASE_FILENAME) {
  throw new Error(`發布檔案名稱必須為 ${LATEST_RELEASE_FILENAME}。`);
}

const bytes = new Uint8Array(await readFile(inputPath));
const release = await storeLatestReleaseZip(bytes);
console.log(JSON.stringify(release, null, 2));
