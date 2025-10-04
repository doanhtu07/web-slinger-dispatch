import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

export const appContext = {
  prisma,
};
