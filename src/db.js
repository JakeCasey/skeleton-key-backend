//this file conencts to remote prisma db and gives u ability to query it with js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export { prisma };
