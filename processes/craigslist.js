const axios = require('axios');
const cheerio = require('cheerio');

async function getItemsFromPage(link, runTime) {
  const baseUrl = link;
  const pagesToScrape = 3;

  let listingItems = [];

  for (let page = 0; page < pagesToScrape; page++) {
    const url = `${baseUrl}~list~${page}~0`;

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      $('li').each(async (_, element) => {
        const title = $(element).find('.title').text();
        const price = $(element).find('.price').text();
        const dateRetrieved = runTime;
        const link = $(element).find('a').attr('href');

        if (title !== '') {
          const listingItem = {
            title,
            price,
            link,
            dateRetrieved,
          };

          listingItems.push(listingItem);
        }
      });
    } catch (error) {
      console.error(`Error scraping page ${page}: ${error.message}`);
    }
  }

  console.log(listingItems);
  return listingItems;
}

module.exports = {
  getItemsFromPage,
};
