const nodemailer = require('nodemailer');
const mjml2html = require('mjml');

//mjml responsive email templating framework

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const makeAPasswordResetEmail = text => {
  return mailTemplate(text);
};

const mailTemplate = text => {
  return mjml2html(
    `<mjml>
  <mj-body background-color="#F4F4F4" color="#55575d" font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'" >
    <mj-section background-color="#ffffff" background-repeat="repeat" padding-bottom="0px" padding-top="30px" padding="20px 0" text-align="center" vertical-align="top">
      <mj-column>
        <mj-image align="center" padding="10px 25px" src="https://diffup.com/images/logo.png" target="_blank" width="214px"></mj-image>
        <mj-text align="left" color="#55575d" font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'" font-size="13px" line-height="22px" padding-bottom="15px" padding-top="0px" padding="10px 25px">
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" background-repeat="repeat" background-size="auto" padding-top="30px" padding="20px 0px 50px 0px" text-align="center" vertical-align="top">
      <mj-column>
      ${text}
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
  );
};

exports.transport = transport;
exports.makeAPasswordResetEmail = makeAPasswordResetEmail;
