let bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const oneYear = 1000 * 60 * 60 * 24 * 365; // 1 year
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');
const stripe = require('../stripe');

const Mutations = {
  async signup(parent, args, ctx, info) {
    //lowercase email
    args.email = args.email.toLowerCase();
    //hash their password
    const password = await bcrypt.hash(args.password, 10);
    //create user in the database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] },
        },
      },
      info,
    );
    //create JWT toekn for them
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //we set JWT as cookie on response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: oneYear,
    });
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
    //3 Email them that reset token
    const mailRes = await transport.sendMail({
      from: 'jakeacasey@gmail.com',
      to: user.email,
      subject: 'Your Password Reset Token',
      html: makeANiceEmail(
        `Your Password Reset Token is here! \n\n <a href="${
        process.env.FRONTEND_URL
        }/reset?resetToken=${resetToken}"> Click Here to Reset</a>`,
      ),
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
  async updatePermissions(parent, args, ctx, info) {
    //1. check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in!');
    }
    //2. query current user
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId,
        },
      },
      info,
    );
    //3. check if they have permissions to do this
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    //4. update permissions.
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions,
          },
        },
        where: {
          id: args.userId,
        },
      },
      info,
    );
  },
  async subscribe(parent, args, ctx, info) {
    //1. Create Customer
    const { tokenId, planId } = args;
    console.log(tokenId, planId);

    //2. Update user with stripeCustomerId
    //3. Subscribe Customer to Plan
    //4. If Plan does not exist, create plan in local DB
    //5. Add User to Plan
  },
  async unsubscribe(parent, args, ctx, info) {
    //1. 


  },
};

module.exports = Mutations;
