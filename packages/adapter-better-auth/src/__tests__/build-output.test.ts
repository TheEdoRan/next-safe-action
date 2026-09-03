import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, expect, test } from "vitest";

const packageRoot = path.resolve(fileURLToPath(import.meta.url), "../../..");
const outDir = mkdtempSync(path.join(tmpdir(), "adapter-better-auth-build-"));

afterAll(() => {
	rmSync(outDir, { recursive: true, force: true });
});

// Next.js resolves `next/navigation` and `next/headers` through bundler aliases keyed on the exact
// specifier, so it can serve a different implementation per layer (server, client, route handler).
// A `.js` extension bypasses those aliases and pins the client build, which makes `next build` fail
// for Route Handlers that call an action using this adapter. tsdown appends that extension to
// subpath imports of dependencies without an `exports` map (`deps.resolveDepSubpath`), and `next`
// has no `exports` map. See https://github.com/next-safe-action/next-safe-action/issues/476.
test("keeps `next/*` imports extensionless in the bundle", { timeout: 120_000 }, () => {
	execFileSync(path.join(packageRoot, "node_modules/.bin/tsdown"), ["--out-dir", outDir, "--no-dts"], {
		cwd: packageRoot,
		stdio: "ignore",
	});

	const bundle = readFileSync(path.join(outDir, "index.mjs"), "utf8");

	expect(bundle).toContain('from "next/headers"');
	expect(bundle).toContain('from "next/navigation"');
	expect(bundle).not.toMatch(/from "next\/[^"]+\.js"/);
});
