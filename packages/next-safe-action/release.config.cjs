/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
	branches: [
		{
			name: "main",
		},
		{
			name: "next",
			channel: "next",
			prerelease: true,
		},
		{
			name: "experimental",
			channel: "experimental",
			prerelease: true,
		},
		{
			name: "beta",
			channel: "beta",
			prerelease: true,
		},
		{
			name: "4.x",
			range: "4.x",
			channel: "4.x",
		},
		{
			name: "7.x",
			range: "7.x",
			channel: "7.x",
		},
	],
	plugins: [
		[
			"@semantic-release/commit-analyzer",
			{
				preset: "conventionalcommits",
				releaseRules: [
					{
						breaking: true,
						release: "major",
					},
					{
						revert: true,
						release: "patch",
					},
					{
						type: "feat",
						release: "minor",
					},
					{
						type: "fix",
						release: "patch",
					},
					{
						type: "perf",
						release: "patch",
					},
					{
						type: "refactor",
						release: "patch",
					},
					{
						type: "build",
						release: "patch",
					},
					{
						type: "docs",
						release: "patch",
					},
					{
						type: "chore",
						release: false,
					},
					{
						type: "test",
						release: false,
					},
					{
						type: "ci",
						release: false,
					},
					{
						type: "style",
						release: false,
					},
				],
				parserOpts: {
					noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
				},
			},
		],
		[
			"@semantic-release/release-notes-generator",
			{
				preset: "conventionalcommits",
				presetConfig: {
					types: [
						{
							type: "revert",
							section: "Reverts",
							hidden: false,
						},
						{
							type: "feat",
							section: "Features",
							hidden: false,
						},
						{
							type: "fix",
							section: "Bug Fixes",
							hidden: false,
						},
						{
							type: "perf",
							section: "Performance improvements",
							hidden: false,
						},
						{
							type: "refactor",
							section: "Refactors",
							hidden: false,
						},
						{
							type: "build",
							section: "Build System",
							hidden: false,
						},
						{
							type: "docs",
							section: "Documentation",
							hidden: false,
						},
						{
							type: "chore",
							hidden: true,
						},
						{
							type: "test",
							hidden: true,
						},
						{
							type: "ci",
							hidden: true,
						},
						{
							type: "style",
							hidden: true,
						},
					],
				},
				parserOpts: {
					noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
				},
			},
		],
		"@semantic-release/npm",
		"@semantic-release/github",
	],
};
