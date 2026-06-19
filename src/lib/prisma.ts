import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown on production during container restarts or deployments, to avoid connection leaks and ensure proper cleanup of resources.
//unconditional event listeners, works for both dev and prod env.
process.on("SIGTERM", async () => {             
  await prisma.$disconnect();
});

// UNIX signal( Ctrl + C) sent to the process to request termination , if someone presses Ctrl + C in the terminal, the process will receive a SIGINT signal, and this event listener will be triggered. It ensures that the Prisma client disconnects from the database before the application exits.

process.on("SIGINT", async () => {               
  await prisma.$disconnect();
});
