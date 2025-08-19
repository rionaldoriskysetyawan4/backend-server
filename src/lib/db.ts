import { PrismaClient } from "@db/index";

const prisma = new PrismaClient({
    // useful for cold boot database instances
    transactionOptions: {
        maxWait: 3000,
        timeout: 10000
    }
});

// Connect to the database
prisma.$connect();

export default prisma;