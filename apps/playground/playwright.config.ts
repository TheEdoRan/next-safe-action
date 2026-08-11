import { defineConfig, devices } from "@playwright/test";

const port = 3101;

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	workers: 1,
	reporter: "list",
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		trace: "retain-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: `pnpm start --hostname 127.0.0.1 --port ${port}`,
		url: `http://127.0.0.1:${port}/offline-support`,
		reuseExistingServer: false,
		timeout: 120_000,
	},
});
