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

enum GameStatus {
  LOBBY,
  RUNNING,
  ENDED
}

interface MyGame {
  status: GameStatus;
  id: number;
  name: string;
  p1Name: string;
  p1Socket: sio.Socket;
  p2Name: string;
  p2Socket: sio.Socket;
  p1points: number;
  p2points: number;
  watching: sio.Socket[];
}

interface MyGameDto {
  id: number;
  name: string;
  numPlayers: number;
  status: GameStatus;
}


// Handle the connection of new websocket clients
io.on('connection', (socket) => {
  socket.on('Start', function (gameId) {
    console.log(gameId);
    // Broadcast the event to all connected clients except the sender
    socket.broadcast.emit('Move', gameId);
  });
  // Handle an ArrowKey event
  

  //Deprecated - use TODO: sync all x seconds
  socket.on('Move', function (pos) {
    socket.broadcast.emit('Move', pos);
  }); 

  socket.on('ArrowUp', function (code) {
    socket.broadcast.emit('ArrowUp', code);
  });

  socket.on('ArrowDown', function (code) {
    socket.broadcast.emit('ArrowDown', code);
  });



  //Lobby stuff
  
  socket.on('Games', function (gameStuff) {
    let allGames:MyGameDto[]=[];
    for(let i=0;i<games.length;i++){
      allGames.push({id:games[i].id,name:games[i].name,numPlayers:games[i].p2Name!==null?2:1,status:games[i].status});
    }
    socket.emit('Games', allGames);
  });

  socket.on('Create', function (gameStuff) {
    games.push({ status:GameStatus.LOBBY, id: games.length,name:gameStuff.gameName, p1Name: gameStuff.playerName, p1Socket: socket, p2Name: null, p2Socket: null, p1points: 0, p2points: 0, watching: [] });
    socket.emit('Created', games.length - 1);
    socket.broadcast.emit('Created', games.length - 1);
  });

  socket.on('Join', function (gameStuff) {
    let toJoin = games.filter(game => game.id === gameStuff.gameId);
    if (toJoin.length === 0) {
      socket.emit('Join', "Error: no Game to join found");
      return;
    } else if (toJoin[0].p2Name != null||toJoin[0].p2Socket != null) {
      socket.emit('Join', "Error: Game is already full");
      return;
    }
    toJoin[0].p2Name = gameStuff.pName;
    toJoin[0].p2Socket = socket;
    socket.emit('Join', gameStuff.gameId);
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
});
