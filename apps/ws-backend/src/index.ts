import { WebSocket, WebSocketServer } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket,
  rooms: string[],
  userId: string
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }

    return decoded.userId;
  } catch(e) {
    return null;
  }
}

wss.on('connection', function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  const userId = checkUser(token);

  if (userId == null) {
    ws.close()
    return null;
  }

  users.push({
    userId,
    rooms: [],
    ws
  })

  ws.on('message', async function message(data) {
    let parseData;
    if (typeof data !== "string") {
      parseData = JSON.parse(data.toString());
    } else {
      parseData = JSON.parse(data); // {type: "join-room", roomId: 1}
    }

    if (parseData.type === "join_room") {
      const user = users.find(x => x.ws === ws);
      user?.rooms.push(parseData.payload.roomId);
    }

    if (parseData.type === "leave_room") {
      const user = users.find(x => x.ws === ws);
      if (!user) {
        return;
      }
      user.rooms = user?.rooms.filter(x => x === parseData.payload.roomId);
    }

    if (parseData.type === "draw") {
      const roomId = parseData.payload.roomId;
      const shape = parseData.payload.shape;

      try {

        if (shape) {
          await prismaClient.canvasElement.create({
            data: {
              roomId: Number(roomId),
              type: shape.type,
              data: shape
            }
          });
        }
      } catch (err) {
        console.error(`[WS] Failed to save drawing event:`, err);
      }

      users.forEach(user => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(JSON.stringify({
            type: "draw",
            payload: { shape, roomId }
          }))
        }
      })
    }

    if (parseData.type === "erase") {
      const roomId = parseData.payload.roomId;
      const shapeId = parseData.payload.id;

      try {
        await prismaClient.canvasElement.update({
          where: { id: shapeId },
          data: { isDeleted: true }
        });
      } catch (err) {
        console.error(`[WS] Failed to erase shape:`, err);
      }

      users.forEach(user => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(JSON.stringify({
            type: "erase",
            payload: { id: shapeId, roomId }
          }));
        }
      });
    }

    if (parseData.type === "undo" || parseData.type === "redo") {
      const roomId = parseData.payload.roomId;
      const shapeId = parseData.payload.id;
      const action = parseData.payload.action; // "erase" or "restore"

      try {
        await prismaClient.canvasElement.update({
          where: { id: shapeId },
          data: { isDeleted: action === "erase" }
        });
      } catch (err) {
        console.error(`[WS] Failed to process ${parseData.type}:`, err);
      }

      users.forEach(user => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(JSON.stringify({
            type: parseData.type,
            payload: { id: shapeId, action, roomId }
          }));
        }
      });
    }

    if (parseData.type === "cursor_move") {
      const roomId = parseData.payload.roomId;
      const senderUserId = users.find(x => x.ws === ws)?.userId;

      users.forEach(user => {
        if (user.ws !== ws && user.rooms.includes(roomId)) {
          user.ws.send(JSON.stringify({
            type: "cursor_move",
            payload: { ...parseData.payload, userId: senderUserId }
          }));
        }
      });
    }
  });

  ws.on('close', () => {
    const userIndex = users.findIndex(x => x.ws === ws);
    if (userIndex !== -1) {
      const user = users[userIndex];
      if (user) {
        user.rooms.forEach(roomId => {
          users.forEach(otherUser => {
            if (otherUser.ws !== ws && otherUser.rooms.includes(roomId)) {
              otherUser.ws.send(JSON.stringify({
                type: "user_left",
                payload: { userId: user.userId, roomId }
              }));
            }
          });
        });
      }
      users.splice(userIndex, 1);
    }
  });

});