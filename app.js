const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db/db');
const emailer = require('./lib/emailer');
//const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

const createListing = (count, title, price, link, dateRetrieved) => ({
  count,
  title,
  price,
  link,
  dateRetrieved,
});

const createEmailHtml = (newListing) => {
  let listing = '';
  listing += `<h2>${newListing.title}</h2>`;
  listing += `<p>Price: ${newListing.price}</p>`;
  listing += `<a href="${newListing.link}">View Listing</a>`;
  listing += `<hr>`;
  return listing;
};

async function scrapeCraigslist() {
  const runTime = new Date();
  const baseUrl = process.env.BASE_URL;
  const pagesToScrape = 3;

  for (let page = 0; page < pagesToScrape; page++) {
    const url = `${baseUrl}~list~${page}~0`;

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      $('li').each((index, element) => {
        const count = index;
        const title = $(element).find('.title').text();
        const price = $(element).find('.price').text();
        const dateRetrieved = formatDate(runTime);
        const link = $(element).find('a').attr('href');
        const listing = createListing(count, title, price, link, dateRetrieved);

        if (title !== '') {
          db.insertListing(count, title, price, link, dateRetrieved);
        }
      });
    } catch (error) {
      console.error(`Error scraping page ${page}: ${error.message}`);
    }
  }

  const newListings = await db.getNewListings();

  if (newListings.length > 0) {
    console.log('printing new listings');
    console.log(newListings);

    let listingsEmail = newListings.map(createEmailHtml).join('');

    newListings.forEach(async (newListing) => {
      await db.setEmailSent(newListing.link);
    });

    emailer.sendEmail(listingsEmail);
  }
}

scrapeCraigslist();
