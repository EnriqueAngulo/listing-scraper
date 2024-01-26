const axios = require('axios');
const cheerio = require('cheerio');
const dotenv = require('dotenv');
dotenv.config();

// Import models
const jobModel = require('./models/job');
const jobItemModel = require('./models/jobItem');

const emailer = require('./lib/emailer');

const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

const createEmailHtml = (newListing) => `
  <h2>${newListing.title}</h2>
  <p>Price: ${newListing.price}</p>
  <a href="${newListing.link}">View Listing</a>
  <hr>
`;

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
    console.log(`found ${newItems.length} new items for job ${job.title}`);

    const emailContent = newItems.map(createEmailHtml).join('');

    let emailSent = await emailer.sendEmail(job.title, emailContent, emailList);

    if (emailSent) {
      await Promise.all(
        newItems.map((newItem) => jobItemModel.setEmailSent(newItem.id))
      );
    }
  } else {
    console.log(`no new items for job ${job.title}`);
  }
}

// Function to run jobs
async function runJobs() {
  console.log('checking for jobs to run');
  const jobs = await jobModel.getJobsToRun();

  if (jobs.length > 0) {
    const jobPromises = jobs.map(async (job) => {
      console.log(`running job '${job.title}'`);

      const emails = await jobModel.getEmailsForJob(job.id);
      const emailList = emails.map((email) => email.email);

      await getItemsFromPage(job, emailList);

      await jobModel.updateLastRuntime(job.id);
    });

    await Promise.all(jobPromises);
  } else {
    console.log('no jobs to run');
  }
}

runJobs();
