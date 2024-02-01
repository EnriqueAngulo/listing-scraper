const dotenv = require('dotenv');
dotenv.config();

// Import models
const jobModel = require('./models/job');
const jobItemModel = require('./models/jobItem');

//Import processes
const facebook = require('./processes/facebook');
const craigslist = require('./processes/craigslist');

const emailer = require('./lib/emailer');

//const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

const createEmailHtml = (newListing) => `
  <h2>${newListing.title}</h2>
  <p>Price: ${newListing.price}</p>
  <a href="${newListing.link}">View Listing</a>
  <hr>
`;

// Function to run jobs
async function runJobs() {
  const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

  console.log(`[${currentTime}]: checking for jobs to run`);
  const jobs = await jobModel.getJobsToRun();

  if (jobs.length > 0) {
    const jobPromises = jobs.map(async (job) => {
      console.log(`running job '${job.title}'`);

      const emails = await jobModel.getEmailsForJob(job.id);
      const emailList = emails.map((email) => email.email);

      let items;

      if (job.link.includes('facebook.com')) {
        items = await facebook.getItemsFromPage(job.link, currentTime);
      } else if (job.link.includes('craigslist.org')) {
        items = await craigslist.getItemsFromPage(job.link, currentTime);
      }

      //add items to the database
      if (items.length > 0) {
        for (let item of items) {
          await jobItemModel.insertItem(
            job.id,
            item.title,
            item.price,
            item.link,
            item.dateRetrieved
          );
        }

        //Grab new items from the database
        const newItems = await jobItemModel.getNewItems(job.id);

        if (newItems.length > 0) {
          console.log(
            `found ${newItems.length} new items for job ${job.title}`
          );

          const emailContent = newItems.map(createEmailHtml).join('');

          let emailSent = await emailer.sendEmail(
            job.title,
            emailContent,
            emailList
          );

          if (emailSent) {
            await Promise.all(
              newItems.map((newItem) => jobItemModel.setEmailSent(newItem.id))
            );
          }
        } else {
          console.log(`no new items for job ${job.title}`);
        }

        await jobModel.updateLastRuntime(job.id);
      }
    });

    await Promise.all(jobPromises);
  } else {
    console.log('no jobs to run');
  }
}

runJobs();
setInterval(runJobs, 1000 * 60);
