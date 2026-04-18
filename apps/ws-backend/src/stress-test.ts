import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8080';
const ROOM_ID = 'stress-test-room';
const TOTAL_CLIENTS = 10;
const DURATION_SEC = 10;

// You need a valid token to bypass auth. Replace this with a token from localStorage.
const MOCK_TOKEN = process.argv[2];

if (!MOCK_TOKEN) {
  console.error("Usage: npx ts-node stress-test.ts <YOUR_VALID_JWT_TOKEN>");
  process.exit(1);
}

async function runTest() {
  const clients: WebSocket[] = [];

  for (let i = 0; i < TOTAL_CLIENTS; i++) {
    const ws = new WebSocket(`${WS_URL}?token=${MOCK_TOKEN}`);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: "join_room", payload: { roomId: ROOM_ID } }));
      
      // Spam cursor movement at 20fps
      setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "cursor_move",
            payload: { x: Math.random() * 1000, y: Math.random() * 1000, roomId: ROOM_ID, username: `Bot_${i}` }
          }));
        }
      }, 50);

      // Spam drawing every 500ms
      setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "draw",
            payload: {
              roomId: ROOM_ID,
              shape: {
                id: Math.random().toString(),
                type: "rect",
                x: Math.random() * 800,
                y: Math.random() * 800,
                width: 50,
                height: 50
              }
            }
          }));
        }
      }, 500);
    });

    ws.on('error', (err) => console.error(`Client ${i} Error:`, err));
    clients.push(ws);
  }

  setTimeout(() => {
    clients.forEach(c => c.close());
    process.exit(0);
  }, DURATION_SEC * 1000);
}

runTest();
