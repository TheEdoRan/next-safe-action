"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const JSON_INDENT = "\t";
const VERSION_PLACEHOLDER_PATTERN = /^0\.0\.0(?:[-.].+)?$/;
const REWRITE_DEP_FIELDS = ["dependencies", "optionalDependencies", "devDependencies"];
const ORDER_DEP_FIELDS = ["dependencies", "optionalDependencies"];

function npmBin() {
	return process.platform === "win32" ? "npm.cmd" : "npm";
}

function fileExists(filePath) {
	try {
		fs.accessSync(filePath, fs.constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
	fs.writeFileSync(filePath, `${JSON.stringify(data, null, JSON_INDENT)}\n`);
}

function runNpm(args, options) {
	const result = spawnSync(npmBin(), args, {
		cwd: options.cwd,
		env: options.env,
		stdio: "inherit",
		shell: false,
	});

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0) {
		throw new Error(`Command failed (${result.status}): npm ${args.join(" ")}`);
	}
}

function getChannelFromContext(context) {
	return context.nextRelease?.channel ?? context.branch?.channel ?? null;
}

function getNpmDistTag(context) {
	const channel = getChannelFromContext(context);

	if (!channel) {
		return "latest";
	}

	// npm rejects semver-looking dist-tags (for example 4.x), so normalize maintenance channels.
	if (/^\d+\.x$/.test(channel) || /^\d+\.\d+\.x$/.test(channel)) {
		return `release-${channel}`;
	}

	return channel;
}

function convertWorkspaceRange(range, version) {
	if (typeof range !== "string" || !range.startsWith("workspace:")) {
		return range;
	}

	const workspaceRange = range.slice("workspace:".length);

	if (workspaceRange === "*" || workspaceRange === "") {
		return version;
	}

	if (workspaceRange === "^") {
		return `^${version}`;
	}

	if (workspaceRange === "~") {
		return `~${version}`;
	}

	return workspaceRange;
}

function collectPackageInternalDeps(pkg, packageNames) {
	const deps = new Set();

	for (const field of ORDER_DEP_FIELDS) {
		const fieldDeps = pkg.manifest[field];
		if (!fieldDeps || typeof fieldDeps !== "object") {
			continue;
		}

		for (const depName of Object.keys(fieldDeps)) {
			if (packageNames.has(depName)) {
				deps.add(depName);
			}
		}
	}

	return deps;
}

function topologicalSortPackages(packages, logger) {
	const packageByName = new Map(packages.map((pkg) => [pkg.name, pkg]));
	const packageNames = new Set(packageByName.keys());
	const inDegree = new Map();
	const outgoing = new Map();

	for (const pkg of packages) {
		inDegree.set(pkg.name, 0);
		outgoing.set(pkg.name, new Set());
	}

	for (const pkg of packages) {
		const internalDeps = collectPackageInternalDeps(pkg, packageNames);

		for (const depName of internalDeps) {
			outgoing.get(depName).add(pkg.name);
			inDegree.set(pkg.name, inDegree.get(pkg.name) + 1);
		}
	}

	const queue = [...packages]
		.map((pkg) => pkg.name)
		.filter((name) => inDegree.get(name) === 0)
		.sort((a, b) => a.localeCompare(b));

	const ordered = [];

	while (queue.length > 0) {
		const current = queue.shift();
		ordered.push(packageByName.get(current));

		for (const dependent of [...outgoing.get(current)].sort((a, b) => a.localeCompare(b))) {
			inDegree.set(dependent, inDegree.get(dependent) - 1);
			if (inDegree.get(dependent) === 0) {
				queue.push(dependent);
				queue.sort((a, b) => a.localeCompare(b));
			}
		}
	}

	if (ordered.length !== packages.length) {
		logger.log(
			"Detected a dependency cycle between publishable workspace packages. Falling back to lexical publish order."
		);
		return [...packages].sort((a, b) => a.name.localeCompare(b.name));
	}

	return ordered;
}

function discoverWorkspacePackages(pluginConfig, context) {
	const cwd = context.cwd || process.cwd();
	const packagesDir = pluginConfig.packagesDir || "packages";
	const packagesRoot = path.join(cwd, packagesDir);

	if (!fileExists(packagesRoot)) {
		throw new Error(`Workspace packages directory not found: ${packagesRoot}`);
	}

	const entries = fs.readdirSync(packagesRoot, { withFileTypes: true });
	const packages = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}

		const pkgDir = path.join(packagesRoot, entry.name);
		const packageJsonPath = path.join(pkgDir, "package.json");

		if (!fileExists(packageJsonPath)) {
			continue;
		}

		const data = readJson(packageJsonPath);

		if (!data.name || typeof data.name !== "string") {
			throw new Error(`Missing package name in ${path.relative(cwd, packageJsonPath)}`);
		}

		packages.push({
			dir: pkgDir,
			packageJsonPath,
			relativeDir: path.relative(cwd, pkgDir),
			manifest: data,
			name: data.name,
			private: data.private === true,
		});
	}

	const publishablePackages = packages.filter((pkg) => !pkg.private);
	const duplicates = findDuplicates(publishablePackages.map((pkg) => pkg.name));

	if (duplicates.length > 0) {
		throw new Error(`Duplicate publishable package names found: ${duplicates.join(", ")}`);
	}

	if (publishablePackages.length === 0) {
		throw new Error(`No publishable packages found in ${path.relative(cwd, packagesRoot)}`);
	}

	return publishablePackages.sort((a, b) => a.name.localeCompare(b.name));
}

function findDuplicates(values) {
	const seen = new Set();
	const duplicates = new Set();

	for (const value of values) {
		if (seen.has(value)) {
			duplicates.add(value);
		}
		seen.add(value);
	}

	return [...duplicates];
}

function rewriteManifestForRelease(pkg, releaseVersion, internalPackageNames) {
	const manifest = structuredClone(pkg.manifest);
	manifest.version = releaseVersion;

	for (const field of REWRITE_DEP_FIELDS) {
		const deps = manifest[field];
		if (!deps || typeof deps !== "object") {
			continue;
		}

		for (const [depName, depRange] of Object.entries(deps)) {
			if (!internalPackageNames.has(depName)) {
				continue;
			}

			deps[depName] = convertWorkspaceRange(depRange, releaseVersion);
		}
	}

	return manifest;
}

function ensureScopedPublicAccess(pkg, publishArgs) {
	const isScoped = pkg.name.startsWith("@");
	const access = pkg.manifest.publishConfig?.access;

	if (!isScoped) {
		return;
	}

	if (access === "public") {
		return;
	}

	if (access === "restricted") {
		return;
	}

	publishArgs.push("--access", "public");
}

function formatPackageList(packages) {
	return packages.map((pkg) => `${pkg.name} (${pkg.relativeDir})`).join(", ");
}

module.exports = {
	verifyConditions(pluginConfig, context) {
		const logger = context.logger;
		const packages = discoverWorkspacePackages(pluginConfig, context);

		logger.log(`Discovered ${packages.length} publishable workspace package(s): ${formatPackageList(packages)}`);

		const placeholderPackages = packages
			.filter((pkg) => typeof pkg.manifest.version === "string" && VERSION_PLACEHOLDER_PATTERN.test(pkg.manifest.version))
			.map((pkg) => pkg.name);

		if (placeholderPackages.length > 0) {
			logger.log(
				`Placeholder versions detected (expected in this workflow): ${placeholderPackages.join(", ")}`
			);
		}

		if (process.env.GITHUB_ACTIONS && !process.env.ACTIONS_ID_TOKEN_REQUEST_URL) {
			logger.log(
				"GitHub Actions OIDC token endpoint is not available. npm trusted publishing may fail without id-token: write."
			);
		}
	},

	prepare(pluginConfig, context) {
		const logger = context.logger;
		const cwd = context.cwd || process.cwd();
		const releaseVersion = context.nextRelease?.version;

		if (!releaseVersion) {
			throw new Error("semantic-release did not provide nextRelease.version to workspace publisher");
		}

		if (context.options?.dryRun) {
			logger.log(`Dry run: would rewrite workspace package versions to ${releaseVersion}`);
			return;
		}

		const packages = discoverWorkspacePackages(pluginConfig, context);
		const internalPackageNames = new Set(packages.map((pkg) => pkg.name));

		for (const pkg of packages) {
			const nextManifest = rewriteManifestForRelease(pkg, releaseVersion, internalPackageNames);
			writeJson(pkg.packageJsonPath, nextManifest);
			logger.log(`Prepared ${pkg.name} (${path.relative(cwd, pkg.packageJsonPath)}) -> ${releaseVersion}`);
		}
	},

	publish(pluginConfig, context) {
		const logger = context.logger;
		const env = context.env || process.env;
		const releaseVersion = context.nextRelease?.version;
		const distTag = getNpmDistTag(context);

		if (!releaseVersion) {
			throw new Error("semantic-release did not provide nextRelease.version to workspace publisher");
		}

		if (context.options?.dryRun) {
			logger.log(`Dry run: would publish workspace packages at ${releaseVersion} with dist-tag ${distTag}`);
			return { name: "npm", url: "https://www.npmjs.com" };
		}

		const packages = discoverWorkspacePackages(pluginConfig, context);
		const orderedPackages = topologicalSortPackages(packages, logger);

		logger.log(
			`Publishing ${orderedPackages.length} workspace package(s) at version ${releaseVersion} with npm dist-tag "${distTag}"`
		);

		for (const pkg of orderedPackages) {
			const args = ["publish", "--provenance", "--tag", distTag];
			ensureScopedPublicAccess(pkg, args);

			logger.log(`Running npm ${args.join(" ")} in ${pkg.relativeDir}`);
				runNpm(args, { cwd: pkg.dir, env });
			}

		return {
			name: "npm",
			url: "https://www.npmjs.com",
		};
	},

	addChannel(pluginConfig, context) {
		const logger = context.logger;
		const env = context.env || process.env;
		const releaseVersion = context.nextRelease?.version;
		const distTag = getNpmDistTag(context);

		if (!releaseVersion) {
			throw new Error("semantic-release did not provide nextRelease.version to workspace publisher");
		}

		if (distTag === "latest") {
			logger.log("No npm addChannel action required for latest");
			return;
		}

		if (context.options?.dryRun) {
			logger.log(`Dry run: would add npm dist-tag "${distTag}" to workspace packages at ${releaseVersion}`);
			return;
		}

		const packages = discoverWorkspacePackages(pluginConfig, context);

		for (const pkg of packages) {
			const target = `${pkg.name}@${releaseVersion}`;
			const args = ["dist-tag", "add", target, distTag];
			logger.log(`Running npm ${args.join(" ")}`);
			runNpm(args, { cwd: pkg.dir, env });
		}
	},
};
