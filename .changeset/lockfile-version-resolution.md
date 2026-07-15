---
"@cloudflare/workers-utils": minor
"wrangler": minor
---

Resolve installed dependency versions from lockfiles instead of node_modules

`getInstalledPackageVersion` now consults the nearest lockfile (pnpm-lock.yaml, package-lock.json, yarn.lock, or bun.lock) before falling back to resolving from node_modules. The lockfile is parsed once and memoized, making repeated version lookups significantly faster. This also improves the accuracy of the dependency metadata collected during deploys. All four major package managers (npm, pnpm, yarn, and bun) are supported across their lockfile format versions.
