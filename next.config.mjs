import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

// `npm run build:demo` sets DEMO_EXPORT=1: a static site where the API routes
// and PostgreSQL run in the browser (see src/demo). Regular builds are unchanged.
const isDemo = process.env.DEMO_EXPORT === "1";

/** @type {import('next').NextConfig} */
const nextConfig = isDemo
  ? {
      output: "export",
      // Route handlers are .ts files: leaving them out of the page extensions
      // keeps them from being built as server routes. The demo calls them in
      // the browser instead.
      pageExtensions: ["page.tsx", "tsx"],
      images: { unoptimized: true },
      webpack(config, { webpack, isServer }) {
        // In the browser bundle, swap the database client, "next/server" and
        // the demo switch for their in-browser versions (matched on the
        // resolved file, after the "@/" path alias).
        const swap = (pattern, file) =>
          new webpack.NormalModuleReplacementPlugin(pattern, path.join(root, file));
        if (!isServer) {
          config.plugins.push(
            swap(/[\\/]src[\\/]db[\\/]index\.ts$/, "src/demo/db.ts"),
            swap(/[\\/]node_modules[\\/]next[\\/]server\.js$/, "src/demo/next-server.ts"),
            swap(/[\\/]src[\\/]demo[\\/]runtime\.ts$/, "src/demo/runtime.demo.ts")
          );
        }
        config.module.rules.push({ test: /\.sql$/, type: "asset/source" });
        return config;
      },
    }
  : {};

export default nextConfig;
