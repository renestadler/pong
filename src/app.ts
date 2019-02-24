import express = require('express');
import http = require('http');
import path = require('path');
import sio = require('socket.io');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'entry')));
const server = http.createServer(app);
const port = 8081;
server.listen(port, () => console.log(`Server is listening on port ${port}...`));
const io = sio(server);

let games: MyGame[] = [];

enum GameStatus {
  LOBBY,
  RUNNING,
  ENDED
}

/** Represents a 2d point */
interface Point {
  x: number;
  y: number
};

/** Represents the size of a 2d object */
interface Size {
  width: number;
  height: number;
}


/** Represents directions  */
enum Direction { top, right, bottom, left };


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
  pointsToWin: number;
  difficulty: number;
  watching: sio.Socket[];
}

interface MyGameDto {
  id: number;
  name: string;
  numPlayers: number;
  status: GameStatus;
  p1Name: string;
  p2Name: string;
}

const ballSize: Size = { width: 1, height: 1 };
const ballHalfSize: Size = { width: 1, height: 1 };
const clientSize: Size = { width: 160, height: 90 };
const clientHalfSize: Size = { width: 80, height: 45 };
const paddleSize: Size = { width: 2, height: 16 };
let currentPaddlePosition1 = 0;
let currentPaddlePosition2 = 0;

// Handle the connection of new websocket clients
io.on('connection', (socket) => {
  socket.on('Start', async function (gameId) {
    let toJoin = games.filter(game => game.id === gameId);
    let curGame: MyGame;
    if (gameId === "futureGameID") {
      curGame = { status: GameStatus.RUNNING, id: 0, pointsToWin: 2, difficulty: 1, name: null, p1Name: null, p1Socket: socket, p2Name: null, p2Socket: null, p1points: 0, p2points: 0, watching: [] };
    } else {
      if (toJoin.length === 0) {
        socket.emit('Join', "Error: Game not found");
        console.log("Error: Game not found" + gameId);
        return;
      }
      curGame = toJoin[0];
    }
    sendToAll('Start', '', curGame);

    sendToAll('Options', { ball: ballSize, client: clientSize, paddle: paddleSize }, curGame);
    sendToAll('Wait', 3, curGame);
    await delay(1000);
    sendToAll('Wait', 2, curGame);
    await delay(1000);
    sendToAll('Wait', 1, curGame);
    await delay(1000);
    sendToAll('Prepare', { startPos: { x: clientHalfSize.width, y: clientHalfSize.height }, ballSize: ballSize.height }, curGame);

    let ballCurrentPosition: Point = { x: clientHalfSize.width, y: clientHalfSize.height };

    // Calculate the random angle that the ball should initially travel.
    // Should be an angle between 27.5 and 45 DEG (=PI/8 and PI/4 RAD)
    let angle = Math.PI / 8 + Math.random() * Math.PI / 8;

    // Calculate the random quadrant into which the ball should initially travel.
    // 0 = upper right, 1 = lower right, 2 = lower left, 3 = upper left
    let quadrant = Math.floor(Math.random() * 4);

    let won: boolean = false;
    do {
      // Calculate target.
      // X-coordinate iw either right or left border of browser window (depending on
      //              target quadrant)
      // y-coordinate is calculated using tangens angle function of angle
      //              (note: tan(angle) = delta-y / delta-x). The sign depends on
      //              the target quadrant)
      const targetX = (quadrant === 0 || quadrant === 1) ? clientSize.width - ballSize.width : 0;
      const targetBallPosition: Point = {
        x: targetX,
        y: ballCurrentPosition.y + Math.tan(angle) * Math.abs(targetX - ballCurrentPosition.x) * ((quadrant === 0 || quadrant === 3) ? -1 : 1)
      };
      // Animate ball to calculated target position
      const borderTouch = await animateBall(ballCurrentPosition, targetBallPosition, curGame);
      if (borderTouch.borderTouched > 0) {
        if (borderTouch.borderTouched === 1) {
          curGame.p2points++;
          sendToAll('Point', { pId: 2, points: curGame.p2points }, curGame);
          //Player 1 lost
        } else if (borderTouch.borderTouched === 2) {
          //Player 2 lost
          curGame.p1points++;
          sendToAll('Point', { pId: 1, points: curGame.p1points }, curGame);
        }
        //TODO: send to client

        ballCurrentPosition.x = clientHalfSize.width;
        ballCurrentPosition.y = clientHalfSize.height;
        angle = Math.PI / 8 + Math.random() * Math.PI / 8;
        await delay(1000);

        //Who won?
        if (curGame.p1points >= curGame.pointsToWin) {
          //Player 1 won
          won = true;
          curGame.status = GameStatus.ENDED;
          sendToAll('Win', { pId: 1, points: curGame.p1Name }, curGame);
        } else if (curGame.p2points >= curGame.pointsToWin) {
          //Player 2 won
          won = true;
          curGame.status = GameStatus.ENDED;
          sendToAll('Win', { pId: 2, points: curGame.p2Name }, curGame);
        }
      } else {
        // Based on where the ball touched the browser window, we change the new target quadrant.
        // Note that in this solution the angle stays the same.
        switch (borderTouch.touchDirection) {
          case Direction.left:
            quadrant = (quadrant === 2) ? 1 : 0;
            break;
          case Direction.right:
            quadrant = (quadrant === 0) ? 3 : 2;
            break;
          case Direction.top:
            quadrant = (quadrant === 0) ? 1 : 2;
            break;
          case Direction.bottom:
            quadrant = (quadrant === 2) ? 3 : 0;
            break;
          default:
            throw new Error('Invalid direction, should never happen');
        }

        // The touch position is the new current position of the ball.
        // Note that we fix the position here slightly in case a small piece of the ball has reached an area
        // outside of the visible browser window.
        ballCurrentPosition.x = Math.min(Math.max(borderTouch.touchPosition.x - ballHalfSize.width, 0) + ballHalfSize.width, clientSize.width);
        ballCurrentPosition.y = Math.min(Math.max(borderTouch.touchPosition.y - ballHalfSize.height, 0) + ballHalfSize.height, clientSize.height);
      }
    } while (!won);
    //WIN
  });
  // Handle an ArrowKey event

  socket.on('Move', function (pos) {
    pos.paddleNum === 1 ? currentPaddlePosition1 = pos.pos :
      currentPaddlePosition2 = pos.pos;
    socket.broadcast.emit('Move', pos);
  });

  //Lobby stuff

  socket.on('UpdatePTW', function (gameStuff) {
    let toJoin = games.filter(game => game.id === gameStuff.gameId);
    if (toJoin.length === 0) {
      socket.emit('UpdatePTW', "Error: no Game to join found");
      return;
    }
    toJoin[0].pointsToWin = gameStuff.change;
    sendToAll('UpdatePTW', gameStuff.change, toJoin[0]);
  });

  socket.on('UpdateDifficulty', function (gameStuff) {
    let toJoin = games.filter(game => game.id === gameStuff.gameId);
    if (toJoin.length === 0) {
      socket.emit('UpdateDifficulty', "Error: no Game to join found");
      return;
    }
    toJoin[0].difficulty = gameStuff.change;
    sendToAll('UpdateDifficulty', gameStuff.change, toJoin[0]);
  });

  socket.on('Games', function () {
    let allGames: MyGameDto[] = [];
    for (let i = 0; i < games.length; i++) {
      allGames.push({ id: games[i].id, name: games[i].name, numPlayers: games[i].p2Name !== null ? 2 : 1, status: games[i].status, p1Name: games[i].p1Name, p2Name: games[i].p2Name });
    }
    socket.emit('Games', allGames);
  });

  socket.on('Create', function (gameStuff) {
    games.push({ status: GameStatus.LOBBY, id: games.length, pointsToWin: 2, difficulty: 1, name: gameStuff.gameName, p1Name: gameStuff.playerName, p1Socket: socket, p2Name: null, p2Socket: null, p1points: 0, p2points: 0, watching: [] });
    socket.emit('Create', games.length - 1);
    socket.broadcast.emit('Created', games.length - 1);
  });

  socket.on('Join', function (gameStuff) {
    let toJoin = games.filter(game => game.id === gameStuff.gameId);
    if (toJoin.length === 0) {
      socket.emit('Join', "Error: no Game to join found");
      return;
    } else if (toJoin[0].p2Name != null || toJoin[0].p2Socket != null) {
      socket.emit('Join', "Error: Game is already full");
      return;
    }
    toJoin[0].p2Name = gameStuff.pName;
    toJoin[0].p2Socket = socket;
    socket.emit('Join', { gameName: toJoin[0].name, id: gameStuff.gameId, playerName: toJoin[0].p1Name, status: toJoin[0].status });
    toJoin[0].p1Socket.emit('Join', { gameName: toJoin[0].name, id: gameStuff.gameId, playerName: toJoin[0].p1Name, status: toJoin[0].status });
    sendToAll('Joined',gameStuff.pName,toJoin[0]);
    socket.broadcast.emit('Joined', gameStuff.gameId);
  });

  socket.on('Watch', function (gameStuff) {
    let toJoin = games.filter(game => game.id === gameStuff.gameId);
    if (toJoin.length === 0) {
      socket.emit('Watch', "Error:  Game not found");
      return;
    }
    toJoin[0].watching = gameStuff.pName;
    socket.emit('Watch', { gameName: toJoin[0].name, id: gameStuff.gameId, playerName1: toJoin[0].p1Name, playerName2: toJoin[0].p2Name, status: toJoin[0].status });
  });

  socket.on('Clear', function (playerId) {
  });
});

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function animateBall(currentBallPosition: Point, targetBallPosition: Point, game: MyGame): Promise<{ touchPosition: Point, touchDirection: Direction, borderTouched: number }> {

  // Calculate x and y distances from current to target position
  const distanceToTarget: Size = subtractPoints(targetBallPosition, currentBallPosition);

  // Use Pythagoras to calculate distance from current to target position
  const distance = Math.sqrt(distanceToTarget.width * distanceToTarget.width + distanceToTarget.height * distanceToTarget.height);

  // Variable defining the speed of the animation (pixels that the ball travels per interval)
  const pixelsPerInterval = 2;
  // Calculate distance per interval
  const distancePerInterval = splitSize(distanceToTarget, distance * pixelsPerInterval);
  // Return a promise that will resolve when animation is done
  return new Promise<{ touchPosition: Point, touchDirection: Direction, borderTouched: number }>(res => {
    // Start at current ball position
    let animatedPosition: Point = currentBallPosition;

    // Move point every 16ms
    const interval = setInterval(() => {
      // Move animated position by the distance it has to travel per interval
      animatedPosition = movePoint(animatedPosition, distancePerInterval);
      // Move the ball to the new position
      //moveBall(animatedPosition);

      sendToAll('BallMove', animatedPosition, game);

      console.log(currentPaddlePosition1)
      // Check if the ball touches the browser window's border
      let touchDirection: Direction;
      //borderTouched returns the number of the paddle where the ball exited (so the loser of the round)
      let borderTouched: number = -1;
      if ((animatedPosition.x - ballHalfSize.width) < 0) { touchDirection = Direction.left; borderTouched = 1; }
      if ((animatedPosition.y - ballHalfSize.height) < 0) { touchDirection = Direction.top; }
      if ((animatedPosition.x + ballHalfSize.width) > clientSize.width) { touchDirection = Direction.right; borderTouched = 2; }
      if ((animatedPosition.y + ballHalfSize.height) > clientSize.height) { touchDirection = Direction.bottom; }
      if ((animatedPosition.x - ballHalfSize.width) > 8 && (animatedPosition.x - ballHalfSize.width) < (8 + paddleSize.width) && (animatedPosition.y + ballHalfSize.height) > currentPaddlePosition1 && (animatedPosition.y + ballHalfSize.height) < (currentPaddlePosition1 + paddleSize.height)) {
        touchDirection = Direction.left;
      }
      if ((animatedPosition.x - ballHalfSize.width) > 8 && (animatedPosition.x - ballHalfSize.width) < (8 + paddleSize.width) && (animatedPosition.y + ballHalfSize.height) === currentPaddlePosition1) {
        touchDirection = Direction.top;
      }
      if ((animatedPosition.x - ballHalfSize.width) > 8 && (animatedPosition.x - ballHalfSize.width) < (8 + paddleSize.width) && (animatedPosition.y + ballHalfSize.height) === (currentPaddlePosition1 + paddleSize.height)) {
        touchDirection = Direction.bottom;
      }

      if ((animatedPosition.x + ballHalfSize.width) < (clientSize.width - 8) && (animatedPosition.x + ballHalfSize.width) > (clientSize.width - (8 + paddleSize.width)) && (animatedPosition.y + ballHalfSize.height) > currentPaddlePosition2 && (animatedPosition.y + ballHalfSize.height) < (currentPaddlePosition2 + paddleSize.height)) {
        touchDirection = Direction.right;
      }
      if ((animatedPosition.x + ballHalfSize.width) < (clientSize.width - 8) && (animatedPosition.x + ballHalfSize.width) > (clientSize.width - (8 + paddleSize.width)) && (animatedPosition.y + ballHalfSize.height) === (currentPaddlePosition2)) {
        touchDirection = Direction.top;
      }
      if ((animatedPosition.x + ballHalfSize.width) < (clientSize.width - 8) && (animatedPosition.x + ballHalfSize.width) > (clientSize.width - (8 + paddleSize.width)) && (animatedPosition.y + ballHalfSize.height) === (currentPaddlePosition2 + 100)) {
        touchDirection = Direction.bottom;
      }

      if (touchDirection !== undefined) {
        // Ball touches border -> stop animation
        clearInterval(interval);
        res({ touchPosition: animatedPosition, touchDirection: touchDirection, borderTouched: borderTouched });
      }
    }, 16);
  });
}

/** Subtracts two points and returns the size between them */
function subtractPoints(a: Point, b: Point): Size {
  return {
    width: a.x - b.x,
    height: a.y - b.y
  };
}

/** Moves a point by the given size */
function movePoint(p: Point, s: Size): Point {
  return {
    x: p.x + s.width,
    y: p.y + s.height
  };
}

/** Divides the width and height of the given size by the given divider */
function splitSize(s: Size, divider: number): Size {
  return {
    width: s.width / divider,
    height: s.height / divider
  };
}

function sendToAll(topic: string, val: any, game: MyGame) {
  game.p1Socket.emit(topic, val);
  game.p2Socket.emit(topic, val);
  for (let i = 0; i < game.watching.length; i++) {
    game.watching[i].emit(topic, val);
  }
}