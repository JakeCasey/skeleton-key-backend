let bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const { randomBytes } = require('crypto');
const { promisify } = require('util');
const oneYear = 1000 * 60 * 60 * 24 * 365; // 1 year
const { transport, makeAPasswordResetEmail } = require('../mail');
const { getPlanInfoByPriceIdOrName } = require('../utils');

const { addUserToMailchimp } = require('../utils/mailchimp');
const { sendMessageToTelegram } = require('../utils/telegram');

const stripe = require('../stripe');

const environment = process.env.NODE_ENV || 'development';
const origin =
  environment == 'development'
    ? process.env.DEV_FRONTEND_URL
    : process.env.FRONTEND_URL;

const Mutations = {
  async signup(parent, args, ctx, info) {
    if (!args.email || !args.password || !args.name) {
      throw new Error('Please fill in all the fields!');
    }

    //lowercase email
    args.email = args.email.toLowerCase();
    //hash their password
    const password = await bcrypt.hash(args.password, 10);
    //create user in the database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          name: args.name,
          email: args.email,
          password,
          permissions: { set: ['USER'] },
        },
      },
      info
    );
    //create JWT toekn for them
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //we set JWT as cookie on response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: oneYear,
    });
    // Handle Mailchimp.

    if (environment != 'development') {
      addUserToMailchimp(args.email, args.name, args.allowMailchimp);
    }

    sendMessageToTelegram(`✨ ${args.email} has signed up. ✨`);

    //return user to browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    //1. check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email: email } });
    if (!user) {
      throw new Error(`No such user found ${email}`);
    }
    //2. check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password');
    }
    //3. generate the jwt token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //4. set the cookie with the token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: oneYear, // 1 year cookie
    });
    //5. return the user
    return user;
  },
  async signout(parent, args, ctx, info) {
    const isSignedIn = await ctx.request.cookies.token;
    if (!isSignedIn) {
      throw new Error(`You're not logged in!`);
    } else {
      ctx.response.clearCookie('token');
    }
    return 'You have successfully logged out!';
  },
  async requestReset(parent, args, ctx, info) {
    //1. Check if this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user sfound for email ${args.email}`);
    }
    //2. set a reset tokena nd expiry on that user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; //1 hr from now
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry },
    });

    let html = makeAPasswordResetEmail(
      `<mj-text>Your Password Reset Token is here! \n\n <a href="${origin}/reset?resetToken=${resetToken}"> Click Here to Reset</a></mj-text>`
    ).html;

    console.log(html);

    //3 Email them that reset token
    const mailRes = await transport.sendMail({
      from: process.env.MAIL_FROM_ADDRESS,
      to: user.email,
      subject: 'Your Password Reset Token',
      html,
    });

    //4. return the message
    return { message: 'Thanks!' };
  },
  async resetPassword(parent, args, ctx, info) {
    //1. check if passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error('Passwords do not match!');
    }

    //2. Check if it's a legit reset
    //3. check if it's expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });
    if (!user) {
      throw new Error('This token is either invalid or expired.');
    }
    //4. hash their new password
    const password = await bcrypt.hash(args.password, 10);
    //5. save new password to user and remove old reset token fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    //6. Generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    //7. Set JWT Cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: oneYear,
    });

    //8. return new user
    return updatedUser;
    //9. Have a beer
  },
  async subscribe(parent, { paymentMethodId, priceId }, ctx, info) {
    //1. Find or Create Customer
    //1a. Check if there is already a customer ID in the User model
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId,
        },
      },
      `{ id email customerId }`
    );

    let subscription;
    //1b. if a customerId exists, subscribe it to our planId
    if (currentUser.customerId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: currentUser.customerId,
      });

      await stripe.customers.update(currentUser.customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      //2. Subscribe Customer to planId with customerId
      subscription = await stripe.subscriptions.create({
        customer: currentUser.customerId,
        items: [
          {
            price: priceId,
          },
        ],
      });
    } else {
      const customer = await stripe.customers.create({
        email: currentUser.email,
      });

      currentUser.customerId = customer.id;
      //1c. else create a customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: currentUser.customerId,
      });

      await stripe.customers.update(currentUser.customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      //2. Subscribe Customer to planId with customerId
      subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: priceId,
          },
        ],
      });
    }

    // 3. Get our plan name so we can refer back to it later.
    let { plan_name } = getPlanInfoByPriceIdOrName(priceId);

    ctx.db.mutation.updateUser({
      data: {
        customerId: currentUser.customerId || customer.id,
        subscriptionId: subscription.id,
        period_ends: subscription.current_period_end,
        plan_name,
        isSubscribed: true,
      },
      where: {
        id: ctx.request.userId,
      },
    });

    sendMessageToTelegram(`🎉 ${currentUser.email} has subscribed! 🎉`);
    //return our successmessage or failure.
    if (subscription) {
      return { message: 'Successfully subscribed!' };
    } else {
      throw new Error('Something went wrong, sorry.');
    }
  },
  async unsubscribe(parent, args, ctx, info) {
    //1. Get User
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId,
        },
      },
      '{subscriptionId}'
    );

    //2. if subscriptionId, unsubscribe at end of term, and delete subscriptionId.
    if (currentUser.subscriptionId) {
      await stripe.subscriptions.update(currentUser.subscriptionId, {
        cancel_at_period_end: true,
      });

      //remove subscription ID and Plan from respective arrays
      subscriptionId = '';

      //3. Update local user with stripeCustomerId
      const updatedUser = await ctx.db.mutation.updateUser(
        {
          data: {
            subscriptionId,
            isSubscribed: false,
          },
          where: {
            id: ctx.request.userId,
          },
        },
        info
      );
      return updatedUser;
    } else {
      throw new Error("This user isn't subscribed to anything...!");
    }
  },
};

module.exports = Mutations;
