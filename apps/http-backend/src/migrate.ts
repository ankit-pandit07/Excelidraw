import { prismaClient } from "@repo/db/client";

async function runTest() {
  const chats = await prismaClient.chat.findMany({
    orderBy: { id: "asc" }
  });

  let totalMigrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const chat of chats) {
    try {
      const parsedMessage = JSON.parse(chat.message);
      
      if (parsedMessage && parsedMessage.shape && parsedMessage.shape.type) {
        const shape = parsedMessage.shape;

        const existing = await prismaClient.canvasElement.findFirst({
          where: {
            roomId: chat.roomId,
            type: shape.type,
            data: { equals: shape }
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prismaClient.canvasElement.create({
          data: {
            roomId: chat.roomId,
            type: shape.type,
            data: shape,
          }
        });

        totalMigrated++;
      } else {
        skipped++;
      }
    } catch (e) {
      failed++;
    }
  }

}

runTest()
  .catch((e) => {
    console.error("Migration fatal error:", e);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
