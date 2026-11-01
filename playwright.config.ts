import {
	defineConfig,
	devices,
	type PlaywrightTestConfig,
} from "@playwright/test";

const config: PlaywrightTestConfig = defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: "http://localhost:4321",
		trace: "on",
		video: "retain-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: "pnpm run preview",
		url: "http://localhost:4321",
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});

export default config;
