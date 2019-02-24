import express = require('express');
import http = require('http');
import path = require('path');
import sio = require('socket.io');
import { Socket } from 'dgram';
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'entry')));
const server = http.createServer(app);
const port = 8081;
server.listen(port, () => console.log(`Server is listening on port ${port}...`));
const io = sio(server);

let games: MyGame[];
interface MyGame {
  id: number;
  p1Name: string;
  p2Name: string;
  p1points: number;
  p2points: number;
  watching: string[];

}


// Handle the connection of new websocket clients
io.on('connection', (socket) => {
  socket.on('Start', function (gameId) {
    console.log(gameId);
    // Broadcast the event to all connected clients except the sender
    socket.broadcast.emit('Move', gameId);
  });

  socket.on('Create', function (player1) {
    games.push({ id: games.length, p1Name: player1, p2Name: null, p1points: 0, p2points: 0, watching: [] });
    socket.emit('Created', games.length - 1);
    socket.broadcast.emit('Created', games.length - 1);
  });

  socket.on('Join', function (gameStuff) {
    let toJoin = games.filter(game => game.id === gameStuff.gameId);
    if (toJoin.length === 0) {
      socket.emit('Join', "Error: no Game to join found");
      return;
    } else if (toJoin[0].p2Name != null) {
      socket.emit('Join', "Error: Game is already full");
      return;
      socket.broadcast.emit('Joined', gameStuff.gameId);
    }
    toJoin[0].p2Name = gameStuff.pName;
    socket.broadcast.emit('Joined', gameStuff.gameId);
  });

  socket.on('Watch', function (gameStuff) {
    let toJoin = games.filter(game => game.id === gameStuff.gameId);
    if (toJoin.length === 0) {
      socket.emit('Watch', "Error:  Game not found");
      return;
    }
    toJoin[0].watching = gameStuff.pName;
    socket.emit('Watching', gameStuff.gameId);
  });

  // Handle an ArrowKey event
  socket.on('ArrowDown', function (code) {

    // Broadcast the event to all connected clients except the sender
    socket.broadcast.emit('ArrowDown', code);
  });
  socket.on('ArrowUp', function (code) {

    // Broadcast the event to all connected clients except the sender
    socket.broadcast.emit('ArrowUp', code);
  });
  socket.on('Move', function (pos) {

    // Broadcast the event to all connected clients except the sender
    socket.broadcast.emit('Move', pos);
  });
});
