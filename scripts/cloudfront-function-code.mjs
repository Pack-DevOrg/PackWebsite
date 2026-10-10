import fs from "node:fs";
import { transformSync } from "esbuild";

// CloudFront Functions are limited to 10 KB of code. The shipped code is the minified source
// (top-level names such as `handler` are kept); the readable source stays in the repo.
export const FUNCTION_CODE_LIMIT_BYTES = 10_000;
export function shippedCodeBecauseSource(sourcePath) {
  const code = transformSync(fs.readFileSync(sourcePath, "utf8"), { minify: true, target: "es2020" }).code;
  if (Buffer.byteLength(code) > FUNCTION_CODE_LIMIT_BYTES) {
    throw new Error(`${sourcePath} minifies to ${Buffer.byteLength(code)} bytes, over the ${FUNCTION_CODE_LIMIT_BYTES} byte function limit`);
  }
  return code;
}
