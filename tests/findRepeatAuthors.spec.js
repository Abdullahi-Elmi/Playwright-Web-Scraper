const { test, expect } = require("playwright/test");
const { findRepeatAuthors, fetchArticleAuthors, logRepeatAuthors } = require("../findRepeatAuthors");

// Since /newest changes frequently, we'll use a specific date for the front page to have a static test URL
const testURL = "https://news.ycombinator.com/front?day=2022-05-21";

// Used to introduce a random delay between tests to avoid rate limiting
async function randomDelay(min, max) {
  const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delayTime));
}

test.describe("logRepeatAuthors Function Tests", () => {
  test("logs the authors who have posted more articles than the threshold", async () => {
    // mock the console.log function to capture logs
    const consoleLogs = [];
    const originalConsoleLog = console.log;
    console.log = (msg) => consoleLogs.push(msg);

    const authors = {
      "abdullahi": 3,
      "bob": 1,
      "charlie": 2
    };
    logRepeatAuthors(authors, 1);
    expect(consoleLogs).toContain("abdullahi has posted 3 articles.");
    expect(consoleLogs).toContain("charlie has posted 2 articles.");

    // restore the original console.log function
    console.log = originalConsoleLog;
  });

  test("does not log any author names when no authors have posted more than the threshold", async () => {
    // mock the console.log function to capture logs
    const consoleLogs = [];
    const originalConsoleLog = console.log;
    console.log = (msg) => consoleLogs.push(msg);

    const authors = {
      "abdullahi": 1,
      "bob": 1,
      "charlie": 1
    };
    logRepeatAuthors(authors, 1);
    expect(consoleLogs).toContain("No repeat authors were found. Every article has a unique author.");

    // restore the original console.log function
    console.log = originalConsoleLog;
  });
});

test.describe.serial("fetchArticleAuthors and findRepeatAuthors Function Tests", () => {
  test("fetchArticleAuthors fetches authors from the test URL and returns expected values for the repeat authors", async ({ page }) => {
    test.setTimeout(60000);
    await randomDelay(1000, 3000);
    await page.goto(testURL);

    const { authors } = await fetchArticleAuthors(page, 60);
    expect(authors["spekcular"]).toBe(2);
    expect(authors["Tomte"]).toBe(3);
  });
  
  test("findRepeatAuthors finds and logs repeat authors from the test URL with expected output", async ({ page }) => {
    test.setTimeout(60000);
    // mock the console.log function to capture logs
    const consoleLogs = [];
    const originalConsoleLog = console.log;
    console.log = (msg) => consoleLogs.push(msg);

    await findRepeatAuthors(testURL, 60);
    expect(consoleLogs).toContain("In the last 60 articles...");
    expect(consoleLogs).toContain("spekcular has posted 2 articles.");
    expect(consoleLogs).toContain("Tomte has posted 3 articles.");

    // restore the original console.log function
    console.log = originalConsoleLog;
  });
});