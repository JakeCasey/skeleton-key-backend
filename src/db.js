//this file conencts to remote prisma db and gives u ability to query it with js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
