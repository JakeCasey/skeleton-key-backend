require('dotenv').config({ path: '../.env' });
const mailchimp = require('@mailchimp/mailchimp_marketing');
const { sendMessageToTelegram } = require('./telegram');

let audienceId = '0cc6d370c1';

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: 'us4',
});

let addUserToMailchimp = async (email, firstName, allowMailchimp) => {
  // 1. Add user to mailchimp with appropriate tags.
  let tags = ['leads'];
  if (allowMailchimp) {
    tags.push('marketing');

    sendMessageToTelegram(
      `🙊 ${email} has agreed to receive marketing emails! 🙊`
    );
  }

  // 2. send to Mailchimp
  const response = await mailchimp.lists.addListMember(audienceId, {
    email_address: email,
    status: 'subscribed',
    merge_fields: {
      FNAME: firstName,
    },
    tags,
  });
};

exports.addUserToMailchimp = addUserToMailchimp;
