// let's go!

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';

import express from 'express';
import createServer from './createServer.js';
import http from 'http';

import { prisma } from './db.js';

const environment = process.env.NODE_ENV || 'development';

import stripe from './stripe.js';

const server = createServer();

const app = express();
const httpServer = http.createServer(app);

app.use(cookieParser());

app.post(
  '/stripe-webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(err);
      console.log(`⚠️  Webhook signature verification failed.`);
      console.log(
        `⚠️  Check the env file and enter the correct webhook secret.`
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
  }
);

app.use(bodyParser({ limit: '1mb' }));
//decode JWT so we can get user ID on each req
app.use(bodyParser(), (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // put the userID on the req for future reqs.
    req.userId = userId;
  }

  next();
});

app.post('/create-customer-portal-session', async (req, res) => {
  // Authenticate your user.
  let customer = req.user.customerId;

  if (!customer) {
    return res.redirect(`${origin}/settings`);
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${origin}/settings`,
    });
    res.redirect(session.url);
  } catch (e) {
    console.log(e);
    return res.send(500);
  }
});

app.post(
  '/create-checkout-session',
  bodyParser.urlencoded({ extended: true }),
  async (req, res) => {
    // The price ID passed from the client
    const { priceId } = req.body;

    if (!req.user) {
      throw new Error("You're not signed in!");
    }

    let session;

    try {
      let createOptions = {
        mode: 'subscription',
        payment_method_types: ['card'],
        automatic_tax: {
          enabled: true,
        },
        line_items: [
          {
            price: priceId,
            // For metered billing, do not pass quantity
            quantity: 1,
          },
        ],
        // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
        // the actual Session ID is returned in the query parameter when your customer
        // is redirected to the success page.
        allow_promotion_codes: true,
        success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}`,
      };
      // Create a new customer or use the old customerId
      if (!req.user.customerId) {
        createOptions.customer_email = req.user.email;
      } else {
        createOptions.customer = req.user.customerId;
      }

      session = await stripe.checkout.sessions.create(createOptions);
    } catch (e) {
      console.log(e);
    }
    // Redirect to the URL returned on the Checkout Session.
    // With express, you can redirect with:
    if (session) {
      return res.redirect(303, session.url);
    }
    return res.send(400);
  }
);

var origin =
  environment == 'development'
    ? process.env.DEV_FRONTEND_URL
    : process.env.FRONTEND_URL;

let cors = {
  origin: [origin, 'https://studio.apollographql.com'],
  credentials: true,
};

console.log(cors);

await server.start();

server.applyMiddleware({ app, cors });

await httpServer.listen({ port: process.env.PORT || 4444 }, () => {
  console.log(
    `Server is now running on port http://localhost:${process.env.PORT || 4444}`
  );
});

process.on('SIGINT', function () {
  process.exit();
});
