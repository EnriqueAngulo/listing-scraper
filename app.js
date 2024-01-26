const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db/db');
const emailer = require('./lib/emailer');

//import models
const jobModel = require('./models/job');
const jobItemModel = require('./models/jobItem');

const dotenv = require('dotenv');
dotenv.config();

const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

const createEmailHtml = (newListing) => {
  let listing = '';
  listing += `<h2>${newListing.title}</h2>`;
  listing += `<p>Price: ${newListing.price}</p>`;
  listing += `<a href="${newListing.link}">View Listing</a>`;
  listing += `<hr>`;
  return listing;
};

async function getItemsFromPage(job, emailList) {
  const runTime = new Date();
  const baseUrl = job.link;
  const pagesToScrape = 3;

  for (let page = 0; page < pagesToScrape; page++) {
    const url = `${baseUrl}~list~${page}~0`;

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      $('li').each(async (_, element) => {
        const title = $(element).find('.title').text();
        const price = $(element).find('.price').text();
        const dateRetrieved = formatDate(runTime);
        const link = $(element).find('a').attr('href');

        if (title !== '') {
          await jobItemModel.insertItem(
            job.id,
            title,
            price,
            link,
            dateRetrieved
          );
        }
      });
    } catch (error) {
      console.error(`Error scraping page ${page}: ${error.message}`);
    }
  }

  const newItems = await jobItemModel.getNewItems(job.id);

  if (newItems.length > 0) {
    console.log('printing new items');
    console.log(newItems);

    let emailContent = newItems.map(createEmailHtml).join('');

    newItems.forEach(async (newItem) => {
      await jobItemModel.setEmailSent(newItem.id);
    });

    emailer.sendEmail(job.title, emailContent, emailList);
  } else {
    console.log(`no new items for job ${job.title}`);
  }
}

//function to run jobs
async function runJobs() {
  console.log('checking for jobs to run');
  const jobs = await jobModel.getJobsToRun();

  if (jobs.length > 0) {
    for (const job of jobs) {
      console.log(`running job '${job.title}'`);
      console.log(job);
      //get email addresses for job
      const emails = await jobModel.getEmailsForJob(job.id);
      let emailList = [];

      for (const email of emails) {
        emailList.push(email.email);
      }
      console.log('email list for job');
      console.log(emailList);

      await getItemsFromPage(job, emailList);

      await jobModel.updateLastRuntime(job.id);
    }
  } else {
    console.log('no jobs to run');
  }
}

runJobs();
