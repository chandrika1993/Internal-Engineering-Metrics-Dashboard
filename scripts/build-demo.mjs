// Builds the static live demo into out/ (see src/demo).
import { execSync } from "node:child_process";
import { cpSync, mkdirSync } from "node:fs";

execSync("next build", {
  stdio: "inherit",
  env: { ...process.env, DEMO_EXPORT: "1", NEXT_PUBLIC_DEMO: "1" },
});

// PGlite's WebAssembly build, loaded by src/demo/db.ts.
mkdirSync("out/pglite", { recursive: true });
for (const f of ["pglite.wasm", "pglite.data"]) {
  cpSync(`node_modules/@electric-sql/pglite/dist/${f}`, `out/pglite/${f}`);
}
console.log("Demo build ready in out/");
