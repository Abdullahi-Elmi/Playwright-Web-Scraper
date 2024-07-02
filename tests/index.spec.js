const { test, expect } = require("playwright/test");
const { saveHackerNewsArticles, fetchNewestTimestamps, validateChronology } = require("../index");

// Used to introduce a random delay between tests to avoid rate limiting
async function randomDelay(min, max) {
  const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delayTime));
}

test.describe("validateChronology Function Tests", () => {
  const correctTimestamps = [
    new Date("2024-06-19T14:00:09Z"),
    new Date("2024-06-19T14:00:08Z"),
    new Date("2024-06-19T14:00:07Z"),
    new Date("2024-06-19T14:00:06Z"),
    new Date("2024-06-19T14:00:05Z"),
    new Date("2024-06-19T14:00:04Z"),
    new Date("2024-06-19T14:00:03Z"),
    new Date("2024-06-19T13:59:00Z"),
    new Date("2024-06-19T13:58:00Z"),
    new Date("2024-05-19T14:00:09Z"),
  ];

  const incorrectTimestamps = [
    new Date("2024-06-19T14:00:09Z"),
    new Date("2024-06-19T14:00:09Z"),
    new Date("2024-06-19T14:00:09Z"),
    new Date("2024-06-19T14:00:07Z"), // Article #4 is older than Article #5
    new Date("2024-06-19T14:00:08Z"),
    new Date("2024-06-18T14:00:00Z"),
    new Date("2024-06-18T14:00:00Z"),
    new Date("2024-06-18T14:00:00Z"),
    new Date("2024-06-18T14:00:00Z"),
    new Date("2024-06-18T14:00:00Z"),
  ];

  test("should validate properly sorted timestamps", async () => {
    const isSorted = validateChronology(correctTimestamps);
    expect(isSorted).toBe(true);
  });

  test("should correctly identify unsorted articles", async () => {
    const isSorted = validateChronology(incorrectTimestamps);
    expect(isSorted).toBe(false);
  });

  test("should log the correct article numbers for the first out-of-order timestamp", async ({ page }) => {
    await randomDelay(1000, 3000);
    
    // mock the console.log function to capture logs
    const consoleLogs = [];
    const originalConsoleLog = console.log;
    console.log = (msg) => consoleLogs.push(msg);
    
    validateChronology(incorrectTimestamps)

    // Test that it identified the correct first out-of-order article
    expect(consoleLogs).toContain("Article #4 is older than Article #5");

    // restore the original console.log function
    console.log = originalConsoleLog;
  });
});

// Serial tests to run first
test.describe.serial("fetchNewestTimestamps Serial Tests", () => {
  // Every test in this suite (aside from one, which we can override) visits the "Hacker News/newest" page
  test.beforeEach(async ({ page }) => {
    await randomDelay(1000, 3000);
    await page.goto("https://news.ycombinator.com/newest");
  });
  
  test("should locate exactly 30 articles on the newest page", async ({ page }) => {
    // Locate & assert that the number articles on the page is 30
    const articleRows = page.locator("tr.athing");
    await expect(articleRows).toHaveCount(30);
  });

  test("should fetch exactly 100 timestamps when asked", async ({ page }) => {
    // Fetch timestamps using the function
    const { timestamps, numberOfArticles } = await fetchNewestTimestamps(page, 100);
    
    // Assert the number of timestamps fetched is 100
    expect(numberOfArticles).toBe(100);
    expect(timestamps).toHaveLength(100);
  });

  test("should fetch the correct timestamps in the correct order for the static test URL", async ({ page }) => {
    // Setting timeout to 60 seconds since this test clicks through pages and may run into rate limiting
    test.setTimeout(60000);
    
    // Visiting a known front page past date to have a static test URL, with known timestamps
    const staticURL = "https://news.ycombinator.com/front?day=2023-06-20";
    const expectedTimestamps = [
      new Date("2023-06-20T17:30:50.000Z"), new Date("2023-06-20T15:46:23.000Z"),
      new Date("2023-06-20T18:45:02.000Z"), new Date("2023-06-20T10:04:29.000Z"),
      new Date("2023-06-20T16:07:32.000Z"), new Date("2023-06-20T17:08:48.000Z"),
      new Date("2023-06-20T16:18:29.000Z"), new Date("2023-06-20T10:48:39.000Z"),
      new Date("2023-06-20T12:53:15.000Z"), new Date("2023-06-20T13:16:17.000Z"),
      new Date("2023-06-20T19:17:32.000Z"), new Date("2023-06-20T09:48:26.000Z"),
      new Date("2023-06-20T00:10:55.000Z"), new Date("2023-06-20T03:53:09.000Z"),
      new Date("2023-06-20T17:16:36.000Z"), new Date("2023-06-19T21:48:00.000Z"),
      new Date("2023-06-20T10:26:37.000Z"), new Date("2023-06-20T19:48:12.000Z"),
      new Date("2023-06-19T08:58:03.000Z"), new Date("2023-06-20T01:21:23.000Z"),
      new Date("2023-06-20T12:59:57.000Z"), new Date("2023-06-20T19:26:02.000Z"),
      new Date("2023-06-20T17:53:56.000Z"), new Date("2023-06-20T02:29:07.000Z"),
      new Date("2023-06-20T18:27:40.000Z"), new Date("2023-06-20T00:41:12.000Z"),
      new Date("2023-06-20T14:34:13.000Z"), new Date("2023-06-20T19:30:35.000Z"),
      new Date("2023-06-19T21:12:06.000Z"), new Date("2023-06-20T08:53:07.000Z")
    ];

    await randomDelay(1000, 3000); 
    await page.goto(staticURL);

    const { timestamps } = await fetchNewestTimestamps(page, expectedTimestamps.length);

    expect(timestamps).toEqual(expectedTimestamps);
  });
});