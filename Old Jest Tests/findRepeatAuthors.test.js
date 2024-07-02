const { findRepeatAuthors, fetchArticleAuthors, logRepeatAuthors } = require("../findRepeatAuthors");
const { chromium } = require("playwright");

// Since /newest changes frequently, we'll use a specific date for the front page to have a static test URL
const testURL = "https://news.ycombinator.com/front?day=2022-05-21";

describe("logRepeatAuthors", () => {
  test("logs the authors who have posted more articles than the threshold", () => {
    const consoleSpy = jest.spyOn(console, "log");
    const authors = {
      "abdullahi": 3,
      "bob": 1,
      "charlie": 2
    };
    logRepeatAuthors(authors, 1);
    expect(consoleSpy).toHaveBeenCalledWith("abdullahi has posted 3 articles.");
    expect(consoleSpy).toHaveBeenCalledWith("charlie has posted 2 articles.");
    consoleSpy.mockRestore();
  });

  test("does not log any author names when no authors have posted more than the threshold", () => {
    const consoleSpy = jest.spyOn(console, "log");
    const authors = {
      "abdullahi": 1,
      "bob": 1,
      "charlie": 1
    };
    logRepeatAuthors(authors, 1);
    expect(consoleSpy).toHaveBeenCalledWith("No repeat authors were found. Every article has a unique author.");
    consoleSpy.mockRestore();
  });
});

describe("fetchArticleAuthors", () => {
  test("fetches authors from the test URL and returns expected values for the repeat authors", async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(testURL);

    const authors = await fetchArticleAuthors(page, 60);
    expect(authors["spekcular"]).toBe(2);
    expect(authors["Tomte"]).toBe(3);

    await context.close();
    await browser.close();
  });
});

describe("findRepeatAuthors", () => {
  test("finds and logs repeat authors from the test URL with expected output", async () => {
    const consoleSpy = jest.spyOn(console, "log");
    await findRepeatAuthors(testURL, 60);
    expect(consoleSpy).toHaveBeenCalledWith("In the last 60 articles...");
    expect(consoleSpy).toHaveBeenCalledWith("spekcular has posted 2 articles.");
    expect(consoleSpy).toHaveBeenCalledWith("Tomte has posted 3 articles.");
    consoleSpy.mockRestore();
  });
});