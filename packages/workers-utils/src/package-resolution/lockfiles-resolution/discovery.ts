import * as find from "empathic/find";

/**
 * Lockfile file names in priority order.
 * Used for walking up from the project directory to find the nearest lockfile.
 *
 * `bun.lockb` is binary and cannot be parsed in JS — omitted intentionally.
 */
export const LOCKFILE_NAMES = [
	"pnpm-lock.yaml",
	"package-lock.json",
	"yarn.lock",
	"bun.lock",
] as const;

/**
 * The name of a lockfile that can be parsed.
 */
export type LockfileName = (typeof LOCKFILE_NAMES)[number];

/**
 * Walks up the directory tree from `startDir` to find the nearest lockfile.
 *
 * Iterates through {@link LOCKFILE_NAMES} in priority order, searching the
 * full parent chain for each name before moving to the next. Uses
 * `empathic/find` for the filesystem walk (file-only matching).
 *
 * @param startDir - The directory to start searching from
 * @returns The lockfile path and its filename, or `undefined` if none is found
 */
export function findLockfile(
	startDir: string
): { lockfilePath: string; name: LockfileName } | undefined {
	for (const name of LOCKFILE_NAMES) {
		const lockfilePath = find.file(name, { cwd: startDir });
		if (lockfilePath) {
			return { lockfilePath, name };
		}
	}
	return undefined;
}
