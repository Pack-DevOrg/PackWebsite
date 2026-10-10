import fs from "node:fs";
import { transformSync } from "esbuild";

// CloudFront Functions are limited to 10 KB of code. The shipped code is the source with comments
// and whitespace removed and nothing else rewritten: full minification emitted syntax the runtime
// rejects (optional catch binding), which served 503 site-wide on 2026-10-10.
export const FUNCTION_CODE_LIMIT_BYTES = 10_000;
export function shippedCodeBecauseSource(sourcePath) {
  const code = transformSync(fs.readFileSync(sourcePath, "utf8"), { minifyWhitespace: true, target: "es2020" }).code;
  if (Buffer.byteLength(code) > FUNCTION_CODE_LIMIT_BYTES) {
    throw new Error(`${sourcePath} minifies to ${Buffer.byteLength(code)} bytes, over the ${FUNCTION_CODE_LIMIT_BYTES} byte function limit`);
  }
  return code;
}
