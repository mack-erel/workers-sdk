import assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it } from "vitest";
import { getInstalledVersionsFromLockfile } from "../../../src/package-resolution/lockfiles-resolution";
import { runInTempDir } from "../../../src/test-helpers";
import { resolveFromLockFile } from "./share";

describe("lockfile resolution — generic", () => {
	runInTempDir();

	it("returns undefined when no lockfile exists", ({ expect }) => {
		const result = resolveFromLockFile(process.cwd());
		expect(result).toBeUndefined();
	});

	// -----------------------------------------------------------------------
	// Lockfile discovery (walking up directories)
	// -----------------------------------------------------------------------

	describe("lockfile discovery", () => {
		it("walks up to find a lockfile in a parent directory", ({ expect }) => {
			fs.writeFileSync(
				"package-lock.json",
				JSON.stringify({
					lockfileVersion: 3,
					packages: {
						"": { name: "root", version: "1.0.0" },
						"node_modules/lodash": { version: "4.17.21" },
					},
				})
			);

			const subDir = path.join(process.cwd(), "packages", "my-app");
			fs.mkdirSync(subDir, { recursive: true });

			const versions = resolveFromLockFile(subDir);
			assert(versions);
			expect(versions.get("lodash")).toBe("4.17.21");
		});
	});

	// -----------------------------------------------------------------------
	// Lockfile priority
	// -----------------------------------------------------------------------

	describe("lockfile priority", () => {
		it("prefers pnpm-lock.yaml over package-lock.json in the same directory", ({
			expect,
		}) => {
			fs.writeFileSync(
				"pnpm-lock.yaml",
				[
					"lockfileVersion: '9.0'",
					"",
					"importers:",
					"  .:",
					"    dependencies:",
					"      lodash:",
					"        specifier: ^4.17.21",
					"        version: 4.17.21",
				].join("\n")
			);
			fs.writeFileSync(
				"package-lock.json",
				JSON.stringify({
					lockfileVersion: 3,
					packages: {
						"": { name: "test", version: "1.0.0" },
						"node_modules/lodash": { version: "4.17.20" },
					},
				})
			);

			const versions = resolveFromLockFile(process.cwd());
			assert(versions);
			// pnpm-lock.yaml comes first in LOCKFILE_NAMES
			expect(versions.get("lodash")).toBe("4.17.21");
		});
	});

	// -----------------------------------------------------------------------
	// Error handling
	// -----------------------------------------------------------------------

	describe("error handling", () => {
		it("returns undefined when only bun.lockb (binary) is present", ({
			expect,
		}) => {
			// bun.lockb is a binary lockfile and cannot be parsed — it is
			// intentionally excluded from LOCKFILE_NAMES
			fs.writeFileSync("bun.lockb", Buffer.from([0x00, 0x01, 0x02]));

			const versions = resolveFromLockFile(process.cwd());
			expect(versions).toBeUndefined();
		});

		it("returns undefined for a malformed pnpm-lock.yaml", ({ expect }) => {
			fs.writeFileSync(
				"pnpm-lock.yaml",
				"this: is: not: [valid yaml: because: {{"
			);

			const versions = resolveFromLockFile(process.cwd());
			expect(versions).toBeUndefined();
		});
	});

	// -----------------------------------------------------------------------
	// Memoization
	// -----------------------------------------------------------------------

	describe("memoization", () => {
		it("returns the same map instance for repeated calls (cache hit)", ({
			expect,
		}) => {
			fs.writeFileSync(
				"package-lock.json",
				JSON.stringify({
					lockfileVersion: 3,
					packages: {
						"": { name: "test", version: "1.0.0" },
						"node_modules/lodash": { version: "4.17.21" },
					},
				})
			);

			const first = getInstalledVersionsFromLockfile(process.cwd());
			const second = getInstalledVersionsFromLockfile(process.cwd());
			expect(first).toBe(second);
		});
	});
});
