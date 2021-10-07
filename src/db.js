//this file conencts to remote prisma db and gives u ability to query it with js
require('dotenv').config({ path: '../variables.env' });
const { Prisma } = require('prisma-binding');
const path = require('path');
const environment = process.env.NODE_ENV || 'development';
var endpoint =
  environment === 'development'
    ? process.env.DEV_PRISMA_ENDPOINT
    : process.env.PRISMA_ENDPOINT;

console.log(endpoint);

const db = new Prisma({
  typeDefs: path.join(__dirname + '/generated/prisma.graphql'),
  endpoint: endpoint,
  secret: process.env.PRISMA_SECRET,
  debug: false,
});

module.exports = db;
