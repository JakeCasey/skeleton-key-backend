// let's go!

require('dotenv').config({ path: 'variables.env' });
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const basicAuth = require('express-basic-auth');

const createServer = require('./createServer');
const db = require('./db');

const environment = process.env.NODE_ENV || 'development';
const stripe = require('./stripe');

const server = createServer();

// server.express.use(
//   '/api/v1/',
//   cors(),
//   bodyParser.json(),
//   validateAPIKey,
//   validateUrl,
//   validateTarget,
//   API,
// );

server.express.use(cookieParser());

// Our Cron Job for Monitors.
// */5 * * * *
server.express.post(
  '/stripe-webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.log(err);
      console.log(`⚠️  Webhook signature verification failed.`);
      console.log(
        `⚠️  Check the env file and enter the correct webhook secret.`,
      );
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    const dataObject = event.data.object;

    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // Remove comment to see the various objects sent for this sample
    switch (event.type) {
      case 'invoice.paid':
        // Used to provision services after the trial has ended.
        // The status of the invoice will show up as paid. Store the status in your
        // database to reference when a user accesses your service to avoid hitting rate limits.
        console.log('[Payment succeeded for:]', event.data.object.customer);

        let newPeriodEnd = event.data.object.lines.data[0].period.end;
        let customerId = event.data.object.customer;

        try {
          await db.mutation.updateUser({
            where: { customerId },
            data: {
              period_ends: newPeriodEnd,
            },
          });
        } catch (e) {
          console.log('Unable to update period for user.');
        }

        break;
      case 'invoice.payment_failed':
        // If the payment fails or the customer does not have a valid payment method,
        //  an invoice.payment_failed event is sent, the subscription becomes past_due.
        // Use this webhook to notify your user that their payment has
        // failed and to retrieve new card details.
        break;
      case 'customer.subscription.deleted':
        if (event.request != null) {
          // handle a subscription cancelled by your request
          // from above.
        } else {
          // handle subscription cancelled automatically based
          // upon your subscription settings.
        }
        break;
      default:
      // Unexpected event type
    }
    res.sendStatus(200);
  },
);

server.express.use(bodyParser({ limit: '1mb' }));
//decode JWT so we can get user ID on each req
server.express.use(bodyParser(), (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // put the userID on the req for future reqs.
    req.userId = userId;
  }

  next();
});

//2. Create a middleware that populates the user on each request
server.express.use(bodyParser(), async (req, res, next) => {
  //if they aren't logged in skip this
  if (!req.userId) {
    return next();
  }
  const user = await db.query.user(
    { where: { id: req.userId } },
    '{id, permissions, email, name}',
  );
  req.user = user;
  next();
});

var origin =
  environment == 'development'
    ? process.env.DEV_FRONTEND_URL
    : process.env.FRONTEND_URL;

server.start(
  {
    playground: false,
    cors: {
      credentials: true,
      origin: origin,
    },
  },
  deets => {
    console.log(`Server is now running on port http://localhost:${deets.port}`);
  },
);

process.on('SIGINT', function() {
  process.exit();
});
