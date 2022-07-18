import { ApolloServer, gql } from 'apollo-server-express';

import Mutation from './resolvers/Mutation.js';
import Query from './resolvers/Query.js';
import jwt from 'jsonwebtoken';

import { readFileSync } from 'fs';

import { prisma } from './db.js';

const typeDefs = readFileSync('./prisma/schema.graphql').toString('utf-8');

//create graphql yoga server
function createServer() {
  return new ApolloServer({
    typeDefs,
    csrfPrevention: true,
    cache: 'bounded',
    resolvers: {
      Mutation,
      Query,
    },
    context: async ({ req, res }) => {
      //decode JWT so we can get user ID on each req
      const { token } = req.cookies;
      if (token) {
        const { userId } = jwt.verify(token, process.env.APP_SECRET);
        // put the userID on the req for future reqs.
        req.userId = userId;
      }

      if (req.userId) {
        const user = await db.query.user(
          { where: { id: req.userId } },
          '{id, permissions, email, name}'
        );
        req.user = user;
      }

      return { req, prisma, res };
    },
  });
}

export default createServer;
