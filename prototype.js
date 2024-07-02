const { chromium } = require("playwright");

async function saveHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  // Collect timestamps of the 100 newest articles
  const timestamps = [];
  while (timestamps.length < 100) {
    
    // Select all article rows on the current page (they all have the "athing" class)
    const articleRows = page.locator("tr.athing");
    const count = await articleRows.count();

    for (let i = 0; i < count; i++) {
      const articleRow = articleRows.nth(i);

      // The subtext row that contains the timestamp for each article is the next element in the DOM after the article row
      const subtextRow = articleRow.locator("~ tr").first();
      const timestamp = await subtextRow.locator(".age").getAttribute("title");

      // Appending the "Z" to the timestamp to clarify it's UTC, otherwise the Date object assumes it's local time, and changes the time.
      const utcTimestamp = `${timestamp}Z`;
      const utcDate = new Date(utcTimestamp);
      timestamps.push(utcDate);

      if (timestamps.length >= 100) {
        break;
      }
    }

    // After collecting all timestamps on the current page, if still below 100, click the "More" button to load the next set of articles
    if (timestamps.length < 100) {
      await page.locator(".morelink").click();
      // Wait for the next page to load by checking for a new article
      await page.locator("tr.athing").first().waitFor();
    }
  }

  // Validate that the timestamps are sorted from newest to oldest
  const isSorted = timestamps.every((date, index) => {
    // Besides the first, every timestamp should be less than or equal to the previous one
    return index === 0 || date <= timestamps[index - 1];
  });

  console.log(isSorted ? "Articles are properly sorted from newest to oldest" : "Articles are NOT properly sorted from newest to oldest");
  await context.close();
  await browser.close();
}

(async () => {
  await saveHackerNewsArticles();
})();