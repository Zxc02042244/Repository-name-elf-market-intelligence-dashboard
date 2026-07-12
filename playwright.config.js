import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  outputDir: "test-results",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    headless: true,
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off"
  },
  webServer: {
    command: `"${process.execPath}" scripts/serve-static.mjs .`,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 15_000,
    stdout: "ignore",
    stderr: "pipe"
  }
});
