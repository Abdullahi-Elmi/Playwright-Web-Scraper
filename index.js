const { chromium } = require("playwright");

async function saveHackerNewsArticles(url = "https://news.ycombinator.com/newest", articleCount = 100) {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto(url);

  // Fetch the timestamps of the (specified number of) newest articles
  // If we've been rate limited, numberOfArticles < articleCount, otherwise they're equal
  const {timestamps, numberOfArticles} = await fetchNewestTimestamps(page, articleCount);
  
  // Check if the timestamps are sorted chronologically from newest to oldest
  const isSorted = validateChronology(timestamps);

  console.log(isSorted ? `The first ${numberOfArticles} articles are properly sorted from newest to oldest.` : `The first ${numberOfArticles} articles are NOT properly sorted from newest to oldest.`);

  await context.close();
  await browser.close();
}

// Used to introduce a random delay between page loads to avoid rate limiting
async function randomDelay(min, max) {
  const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delayTime));
}

// Collect timestamps of the articleCount (100) newest articles
async function fetchNewestTimestamps(page, articleCount) {
  const timestamps = []; // Stores the timestamps of the articles from newest to oldest
  
  while (timestamps.length < articleCount) {

    // Select all article rows on the current page (they all have the "athing" class)
    const articleRows = page.locator("tr.athing");
    const count = await articleRows.count();

    // Loop over each article row to get the time it was posted
    for (let i = 0; i < count; i++) {
      const articleRow = articleRows.nth(i);

      // The subtext row that contains the timestamp for each article is the next element in the DOM after the article row
      const subtextRow = articleRow.locator("~ tr").first();
      const timestamp = await subtextRow.locator(".age").getAttribute("title");

      // Appending the 'Z' to the timestamp to clarify it's UTC, otherwise the Date object assumes it's local time, and changes the time.
      const utcTimestamp = `${timestamp}Z`;
      const utcDate = new Date(utcTimestamp);
      timestamps.push(utcDate);

      if (timestamps.length >= articleCount) {
        break;
      }
    }

    // After collecting all timestamps on the current page, if still below the article count click the "More" button to load the next set of articles
    if (timestamps.length < articleCount) {
      // Add a 1-3 second delay, before clicking "More" to try and avoid rate limiting.
      await randomDelay(1000, 3000); 
      // await page.locator(".morelink").click();
      
      // Wait for the next page to load by checking for a new article. After 3 seconds of waiting, we've likely been rate limited and need to reload the page
      try {
        await page.locator(".morelink").click();
        await page.locator("tr.athing").first().waitFor({ timeout: 3000 });
      } catch (error) {
        // This try-catch block is used to handle the case where the page/context closes due to timing out (better error handling for testing purposes)
        try {
          // If the article doesn't load, we've been taken to the rate limiting page, and need to click the reload button
          const reloadButton = page.locator("a", { hasText: "reload" });
          if (await reloadButton.isVisible()) {
            console.log("Reloading the page due to rate limiting...");
            await reloadButton.first().click();
            await page.locator("tr.athing").first().waitFor();
          }
        } catch (innerError) {
          if (innerError.message.includes("Target page, context or browser has been closed")) {
            console.log("Due to Hacker News' rate limiting, the script was unable to fetch the timestamps for that many articles. Please try a lesser amount next time.");
            break;
          } else {
            throw innerError; // rethrow the error if it's not related to the page/context being closed
          }
        }
      }
    }
  }

  return {timestamps, numberOfArticles: timestamps.length};
}

// Validate that the timestamps are sorted from newest (greatest) to oldest (least)
function validateChronology(timestamps) {
  // If any timestamp at an index i is older (lesser) than the timestamp at the next index i+1, the array is not sorted correctly.
  const unsortedIndex = timestamps.findIndex((date, index) => index < timestamps.length - 1 && date < timestamps[index + 1]);
  
  // If an incorrectly sorted article was found, mention the number (rank on Hacker News) of the article that is out of order
  if (unsortedIndex !== -1) {
    console.log(`Article #${unsortedIndex + 1} is older than Article #${unsortedIndex  + 2}`);
    return false;
  }

  // If findIndex() returned a value of -1, no out of order timestamps were found, the articles are properly sorted
  return true;
}

// Stop the script from running when it's being imported for testing, only run when the script is executed directly
if (require.main === module) {
  (async () => {
    await saveHackerNewsArticles("https://news.ycombinator.com/newest", 100);
  })();
}

module.exports = {
  saveHackerNewsArticles,
  fetchNewestTimestamps,
  validateChronology,
};