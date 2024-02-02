const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();

//scrape facebook marketplace url for items using puppeteer
async function getItemsFromPage(link, runTime) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_BIN || null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(link);

  //After inspecting the page, it looks like x3ct3a4 is the common class for the listing items. Using it as the selector
  await page.waitForSelector('.x3ct3a4');

  let items = await page.$$('.x3ct3a4');

  let listingItems = [];

  for (let item of items) {
    let listingData = await item.evaluate((el) => [
      el.textContent,
      el.innerHTML,
    ]);

    let listingLink = listingData[1].match(/href="([^?]*)/)[1];
    let listingTitle = listingData[1].match(
      /-webkit-box;">([^?]+?(?=<\/span))/
    )[1];
    let listingPrice = listingData[1].match(/\$[^?]+?(?=<\/span)/)[0];

    const listingItem = {
      title: listingTitle,
      price: listingPrice,
      link: `https://facebook.com${listingLink}`,
      dateRetrieved: runTime,
    };

    listingItems.push(listingItem);
  }

  browser.close();

  return listingItems;
}

module.exports = {
  getItemsFromPage,
};
