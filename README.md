# Playwright Web Scraper

This was a short project used to learn PlayWright and web scraping with JavaScript, as I'd only done it with Python before. The original goal was to just grab the latest 100 articles from Y Combinator's "Hacker News", and validate they were ordered correctly. Several additions were made beyond that original goal:

- **Extended functionality**: The script can validate more than 100 articles (tested up to 1000). You can pass any integer into `saveHackerNewsArticles()`.
- **Detailed Reporting**: The script displays the first article found out of chronological order if there is any.
- **Entire New Script**: To verify I understood playwright, I went ahead and created another script without referring back to documentation that related to author names rather than article dates.
- **Testing Cases with Playwright Testing**: Added tests for both `index.js` and `findRepeatAuthors.js`.

## Instructions To Run

1. Run `rm -rf node_modules package-lock.json`
   - When downloading my finished zip file from google drive, my mac had some security pop-ups when running tests. I found removing the `package-lock.json` before reinstalling circumvented this.
2. Install node modules by running `npm i`.
3. Run `node index.js` to validate the chronological ordering of articles.
   - You can test a larger number of articles by changing the integer passed into `saveHackerNewsArticles()`.
   - **Warning**: Running it with too high of a number may cause the website to block you entirely, preventing the proper running of the other scripts. So I would try running the commands below once each, before testing higher article counts.
4. Run `node findRepeatAuthors.js` to see if there have been any repeat authors.
   - You can test a larger number of articles by changing the integer passed into `findRepeatAuthors()`.
   - **Warning**: Run the tests before trying high numbers of articles repeatedly.
5. Run `npx playwright test tests/index.spec.js` to run the Playwright test for `index.js`.
6. Run `npx playwright test tests/findRepeatAuthors.spec.js` to run the Playwright test for `findRepeatAuthors.js`.

## Scripts Breakdown

### `index.js`

This is the final chronological order validating script with extended functionality.

- It can handle more than 100 articles.
  - I've only tested up to 1000 articles successfully. After ~1200, the website blocked me for a while.
- Logs the first out-of-order article if one exists.
- It has a check to see if we're on the rate limiting page and clicks the reload button automatically to continue scraping.
- Has error handling if blocked by Hacker News.

### `findRepeatAuthors.js`

There were often repeat usernames showing up that posted the articles on HackerNews, so I thought it'd be fun to make a script that identified those names and how many articles they'd posted in the last specified number of articles.

This functionality was not integrated into `index.js` in order to have that script be solely related to chronological ordering.

### `prototype.js` (Deprecated)

This is the original, simple script to reach the original goal. I mainly used this to learn about Playwright locators.

## Tests Breakdown

I originally implemented unit tests with Jest I read about Playwright testing in the documentation and decided to implement test cases that way. You can still see the Jest unit tests under (Old Jest Tests) but can't run them as I uninstalled Jest from the packages.

### `index.spec.js`

- Tests the `validateChronology()` function in parallel to verify:
  - It validates properly sorted timestamps.
  - It recognizes improperly sorted timestamps.
  - It identifies the first out-of-order article from improperly sorted timestamps.
- Tests the `fetchNewestTimestamps()` function to verify:
  - It can locate 30 articles on each page.
  - It can extract 100 timestamps by clicking through several pages.
  - It extracts the expected timestamps in the expected order from a static Hacker News page.

### `findRepeatAuthors.spec.js`

- Tests the `logRepeatAuthors()` function in parallel to verify:
  - It logs the correct repeat authors when they exist in the dictionary.
  - It doesn't log any repeat authors when none exist in the dictionary.
- Tests the `fetchArticleAuthors()` function to verify:
  - It fetches the expected repeat author names and their number of posted articles from the test URL.
- Tests the `findRepeatAuthors()` function to verify:
  - That both `logRepeatAuthors()` and `fetchArticleAuthors()` work together as expected for the test URL.

Playwright is able to run tests parallel, but this caused rate-limiting conflicts from Hacker News with the tests that clicked through multiple pages, so I decided to run them serially. I considered the possibility of setting up a proxy to circumvent this problem but decided to try that in the future on a more complicated project.
