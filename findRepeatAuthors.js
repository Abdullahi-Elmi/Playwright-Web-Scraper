const { chromium } = require("playwright");

async function findRepeatAuthors(url = "https://news.ycombinator.com/newest", articleCount = 100) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(url);

  // Fetch the authors of the x newest articles
  const {authors, numberOfArticles} = await fetchArticleAuthors(page, articleCount);

  // Identify and log the authors who have posted more than (postingThreshold) articles in the last (numberOfArticles) articles
  console.log(`In the last ${numberOfArticles} articles...`);
  // You can identify high frequency authors by changing the postingThreshold to whatever you want
  const postingThreshold = 1;
  logRepeatAuthors(authors, postingThreshold); 

  await context.close();
  await browser.close();
}

// Used to introduce a random delay between page loads to avoid rate limiting
async function randomDelay(min, max) {
  const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delayTime));
}

// Get the unique authors of the `x` newest articles, and the number of articles they've each posted
async function fetchArticleAuthors(page, articleCount) {
  const authorCounts = {}; // Dictionary to store (author, article count) pairs
  let articlesProcessed = 0; // Counter for the number of articles processed

  while (articlesProcessed < articleCount) {
    const articleRows = page.locator("tr.athing");
    const count = await articleRows.count();

    for (let i = 0; i < count; i++) {
      const articleRow = articleRows.nth(i);
      const subtextRow = articleRow.locator("~ tr").first();
      const author = await subtextRow.locator(".hnuser").innerText(); // "hnuser" is the class name for the tag that contains the author's name

      // If the author's name already exists in the dictionary, increment their article count, otherwise add the author to the dictionary
      if (authorCounts[author]) {
        authorCounts[author]++;
      } else {
        authorCounts[author] = 1;
      }

      articlesProcessed++;

      if (articlesProcessed >= articleCount) {
        break;
      }
    }

    if (articlesProcessed < articleCount) {
      // Add a 1-3 second delay, before clicking "More" to try and avoid rate limiting.
      await randomDelay(1000, 3000); 
      
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

  return {authors: authorCounts, numberOfArticles: articlesProcessed};
}

// Identify and log the authors who have posted multiple articles
function logRepeatAuthors(authors, postingThreshold = 1) {
  let amountOfRepeatAuthors = 0;
  
  for (const [author, count] of Object.entries(authors)) {
    if (count > postingThreshold) {
      console.log(`${author} has posted ${count} articles.`);
      amountOfRepeatAuthors++;
    }
  }

  if (amountOfRepeatAuthors === 0) {
    console.log("No repeat authors were found. Every article has a unique author.");
  }
}

// Stop the script from running when it's being imported for testing, only run when the script is executed directly
if (require.main === module) {
  (async () => {
    await findRepeatAuthors("https://news.ycombinator.com/newest", 100);
  })(); 
}

module.exports = {
  findRepeatAuthors, 
  fetchArticleAuthors, 
  logRepeatAuthors 
};