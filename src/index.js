// let's go!

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');
const environment = process.env.NODE_ENV || 'development';

const server = createServer();

server.express.use(cookieParser());

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

server.start(
  {
    cors: {
      credentials: true,
      origin:
        environment == 'development'
          ? process.env.DEV_FRONTEND_URL
          : process.env.FRONTEND_URL,
    },
  },
  deets => {
    console.log(`Server is now running on port http://localhost:${deets.port}`);
  },
);
