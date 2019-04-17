// let's go!

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');
const environment = process.env.NODE_ENV || 'development';

const server = createServer();

server.express.use(cookieParser());
server.express.use(bodyParser());

server.express.use('/api/stripe/webhooks', async (req, res) => {
  var period_ends = req.body.data.object.lines.data[0].period.end.toString();
  var customerId = req.body.data.object.customer;
  // this handles our stripe webhooks use Ngrok for testing.
  // listen for the paid event and update user subscribedUntil value
  try {
    var result = await db.mutation.updateUser({
      data: {
        period_ends,
      },
      where: {
        customerId,
      },
    });
  } catch (error) {
    console.log(error);
  }

  if (!result) {
    res.sendStatus(500);
  } else {
    res.sendStatus(200);
  }
});

//decode JWT so we can get user ID on each req
server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // put the userID on the req for future reqs.
    req.userId = userId;
  }

  next();
});

//2. Create a middleware that populates the user on each request
server.express.use(async (req, res, next) => {
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
    cors: {
      credentials: true,
      origin: origin,
    },
  },
  deets => {
    console.log(`Server is now running on port http://localhost:${deets.port}`);
  },
);
