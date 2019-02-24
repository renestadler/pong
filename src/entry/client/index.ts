
let player: number;
let paddle1;
let paddle2;
let paddleHeight;
let paddleHalfHeight;
const clientSocket = io();
let currentPaddlePosition1;
let currentPaddlePosition2;
let ball;
let ballSize;
let ballHalfSize;
let clientSize;
let clientHalfSize;
let paddleSize;
let widthFactor;
let heightFactor;
const speedPaddle1 = 1;
const speedPaddle2 = 1;

let intervalPaddle1: NodeJS.Timeout;
let intervalPaddle2: NodeJS.Timeout;
let directionPaddle1: number;
let directionPaddle2: number;
let pointsToWin: number = 2;
let pointsPlayer1: number = 0;
let pointsPlayer2: number = 0;


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



// Listen to keydown event
document.addEventListener('keydown', event => {
  // We have to check whether a movement is already in progress. This is
  // necessary because keydown events arrive often when key is
  // continuously pressed.
  if (player === 1) {
    if (!intervalPaddle1) {
      switch (event.code) {
        case 'ArrowDown':
          directionPaddle1 = speedPaddle1;
          startMoving(player);
          break;
        case 'ArrowUp':
          directionPaddle1 = speedPaddle1 * -1;
          startMoving(player);
          break;
      }
    }
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      // Send ArrowKey message to server
      clientSocket.emit('ArrowDown', event.code);
    }
  } else if (player === 2) {
    if (!intervalPaddle2) {
      switch (event.code) {
        case 'ArrowDown':
          directionPaddle2 = speedPaddle2;
          startMoving(player);
          break;
        case 'ArrowUp':
          directionPaddle2 = speedPaddle2 * -1;
          startMoving(player);
          break;
      }
    }
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      // Send ArrowKey message to server
      clientSocket.emit('ArrowDown', event.code);
    }
  }
});

// Listen to keyup event
document.addEventListener('keyup', event => {
  if (player === 1) {
    switch (event.code) {
      case 'ArrowDown':
      case 'ArrowUp':
        stopMoving(player);
        break;
    }
  } else if (player === 2) {
    switch (event.code) {
      case 'ArrowDown':
      case 'ArrowUp':
        stopMoving(player);
        break;
    }
  }
});


socket.on('Move', async code => {
  if (player === 1) {
    currentPaddlePosition2 = code.pos * heightFactor;
    paddle2.style.setProperty('top', `${currentPaddlePosition2}px`);
  }
  else if (player === 2) {
    currentPaddlePosition1 = code.pos * heightFactor;
    paddle1.style.setProperty('top', `${currentPaddlePosition1}px`);
  }
});

socket.on("Options", async code => {
  heightFactor = document.documentElement.clientHeight / code.client.height;
  widthFactor = document.documentElement.clientWidth / code.client.width;
  ballSize = { width: code.ball.width * widthFactor, height: code.ball.height * heightFactor };
  paddleSize = { width: code.paddle.width * widthFactor, height: code.paddle.height * heightFactor };
  paddleHeight = paddleSize.height;
  paddleHalfHeight = paddleHeight / 2;
  ballHalfSize = splitSize(ballSize, 2);
  clientSize = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
  clientHalfSize = splitSize(clientSize, 2);
  ball.style.setProperty('width', ballSize.width + "px");
  ball.style.setProperty('height', ballSize.height + "px");
  paddle1.style.setProperty('width', paddleSize.width + "px");
  paddle1.style.setProperty('height', paddleSize.height + "px")
  paddle2.style.setProperty('width', paddleSize.width + "px");
  paddle2.style.setProperty('height', paddleSize.height + "px");
});

socket.on("Wait", async code => {
  document.getElementById("winner").innerText = "Game starts in " + code;
});

socket.on("Prepare", async code => {
  let startPos: Point = { x: code.startPos.x * widthFactor, y: code.startPos.y * heightFactor };
  document.getElementById("winner").innerText = "";
  moveBall(startPos);
});

socket.on("BallMove", async code => {
  let pos: Point = { x: code.x * widthFactor, y: code.y * heightFactor };
  moveBall(pos);
});

socket.on("Point", async code => {
  switch (code.pId) {
    case 1:
      document.getElementById("pointsPl1").innerText = code.points;
      break;
    case 2:
      document.getElementById("pointsPl2").innerText = code.points;
      break;
  }
});

socket.on("Win", async code => {
  switch (code.pId) {
    case 1:
      document.getElementById("winner").innerText = "Player 1("+code.name+") won!";
      break;
    case 2:
    document.getElementById("winner").innerText = "Player 2("+code.name+") won!";
      break;
  }
});

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setPlayer(val: string) {
  document.getElementById("game").style.display = "block";
  document.getElementById("player").style.display = "none";
  paddle1 = document.getElementsByClassName('paddle1')[0];
  paddle2 = document.getElementsByClassName('paddle2')[0];
  paddleHeight = paddle1.clientHeight;
  paddleHalfHeight = paddleHeight / 2;
  currentPaddlePosition1 = paddle1.clientTop;
  currentPaddlePosition2 = paddle2.clientTop;
  ball = document.getElementById('ball');
  ballSize = { width: ball.clientWidth, height: ball.clientHeight };
  ballHalfSize = splitSize(ballSize, 2);
  clientSize = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
  clientHalfSize = splitSize(clientSize, 2);
  document.getElementById("pointsPl1").innerText = "0";
  document.getElementById("pointsPl2").innerText = "0";
  clientSocket.emit('Start', 'futureGameID');

  player = parseInt(val);
  if (player === 1) {
    const hammertime = new Hammer(paddle1);
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_DOWN | Hammer.DIRECTION_UP });
    hammertime.on('pan', ev => {
      // Put center of paddle to the center of the user's finger
      movePaddle(ev.center.y - paddleHalfHeight, player);
    });
  }
  else if (player === 2) {
    const hammertime = new Hammer(paddle2);
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_DOWN | Hammer.DIRECTION_UP });
    hammertime.on('pan', ev => {
      // Put center of paddle to the center of the user's finger
      movePaddle(ev.center.y - paddleHalfHeight, player);
    });
  }
  while (true) {
    if (player === 1) {
      socket.emit('Move', { pos: currentPaddlePosition1 / heightFactor, paddleNum: 1 });
    }
    else if (player === 2) {
      socket.emit('Move', { pos: currentPaddlePosition2 / heightFactor, paddleNum: 2 });
    }
    await delay(16);
  }
}

/** Helper function that starts movement when keydown happens */
function startMoving(player: number) {
  if (player === 1) {
    intervalPaddle1 = setInterval(() => movePaddle(currentPaddlePosition1 + directionPaddle1, player), 4);
  }
  else if (player === 2) {
    intervalPaddle2 = setInterval(() => movePaddle(currentPaddlePosition2 + directionPaddle2, player), 4);
  }
}

/** Helper function that stops movement when keyup happens */
function stopMoving(player: number) {
  if (player === 1) {
    clearInterval(intervalPaddle1);
    intervalPaddle1 = directionPaddle1 = undefined;
  }
  else if (player === 2) {
    clearInterval(intervalPaddle2);
    intervalPaddle2 = directionPaddle2 = undefined;
  }
}

/**
 * Helper function that moves the paddle to a given position
 * @param targetPosition Target position. No movement is done if target position is invalid
 */
function movePaddle(targetPosition: number, player: number): void {
  if (player === 1) {
    if (targetPosition >= 0 && (targetPosition + paddleHeight) <= document.documentElement.clientHeight) {
      currentPaddlePosition1 = targetPosition;

      // Note the 'px' at the end of the coordinates for CSS. Don't
      // forget it. Without the 'px', it doesn't work.
      paddle1.style.setProperty('top', `${currentPaddlePosition1}px`);
    }
  }
  else if (player === 2) {
    if (targetPosition >= 0 && (targetPosition + paddleHeight) <= document.documentElement.clientHeight) {
      currentPaddlePosition2 = targetPosition;

      // Note the 'px' at the end of the coordinates for CSS. Don't
      // forget it. Without the 'px', it doesn't work.
      paddle2.style.setProperty('top', `${currentPaddlePosition2}px`);
    }
  }
}

/**
 * Animate the ball from the current position to the target position. Stops
 * animation if border of browser window is reached.
 * @returns Position and direction where ball touched the border of the browser window
 *          at the end of the animation
 */
function animateBall(currentBallPosition: Point, targetBallPosition: Point): Promise<{ touchPosition: Point, touchDirection: Direction, borderTouched: number }> {
  // Calculate x and y distances from current to target position
  const distanceToTarget: Size = subtractPoints(targetBallPosition, currentBallPosition);

  // Use Pythagoras to calculate distance from current to target position
  const distance = Math.sqrt(distanceToTarget.width * distanceToTarget.width + distanceToTarget.height * distanceToTarget.height);

  // Variable defining the speed of the animation (pixels that the ball travels per interval)
  const pixelsPerInterval = 1;

  // Calculate distance per interval
  const distancePerInterval = splitSize(distanceToTarget, distance * pixelsPerInterval);

  // Return a promise that will resolve when animation is done
  return new Promise<{ touchPosition: Point, touchDirection: Direction, borderTouched: number }>(res => {
    // Start at current ball position
    let animatedPosition: Point = currentBallPosition;

    // Move point every 4ms
    const interval = setInterval(() => {
      // Move animated position by the distance it has to travel per interval
      animatedPosition = movePoint(animatedPosition, distancePerInterval);

      // Move the ball to the new position
      moveBall(animatedPosition);

      // Check if the ball touches the browser window's border
      let touchDirection: Direction;
      //borderTouched returns the number of the paddle where the ball exited (so the loser of the round)
      let borderTouched: number = -1;
      if ((animatedPosition.x - ballHalfSize.width) < 0) { touchDirection = Direction.left; borderTouched = 1; }
      if ((animatedPosition.y - ballHalfSize.height) < 0) { touchDirection = Direction.top; }
      if ((animatedPosition.x + ballHalfSize.width) > clientSize.width) { touchDirection = Direction.right; borderTouched = 2; }
      if ((animatedPosition.y + ballHalfSize.height) > clientSize.height) { touchDirection = Direction.bottom; }
      if ((animatedPosition.x - ballHalfSize.width) > 50 && (animatedPosition.x - ballHalfSize.width) < 70 && (animatedPosition.y + ballHalfSize.height) > currentPaddlePosition1 && (animatedPosition.y + ballHalfSize.height) < (currentPaddlePosition1 + 100)) {
        touchDirection = Direction.left;
      }
      if ((animatedPosition.x - ballHalfSize.width) > 50 && (animatedPosition.x - ballHalfSize.width) < 70 && (animatedPosition.y + ballHalfSize.height) === currentPaddlePosition1) {
        touchDirection = Direction.top;
      }
      if ((animatedPosition.x - ballHalfSize.width) > 50 && (animatedPosition.x - ballHalfSize.width) < 70 && (animatedPosition.y + ballHalfSize.height) === (currentPaddlePosition1 + 100)) {
        touchDirection = Direction.bottom;
      }

      if ((animatedPosition.x + ballHalfSize.width) < (clientSize.width - 50) && (animatedPosition.x + ballHalfSize.width) > (clientSize.width - 70) && (animatedPosition.y + ballHalfSize.height) > currentPaddlePosition2 && (animatedPosition.y + ballHalfSize.height) < (currentPaddlePosition2 + 100)) {
        touchDirection = Direction.right;
      }
      if ((animatedPosition.x + ballHalfSize.width) < (clientSize.width - 50) && (animatedPosition.x + ballHalfSize.width) > (clientSize.width - 70) && (animatedPosition.y + ballHalfSize.height) === (currentPaddlePosition2)) {
        touchDirection = Direction.top;
      }
      if ((animatedPosition.x + ballHalfSize.width) < (clientSize.width - 50) && (animatedPosition.x + ballHalfSize.width) > (clientSize.width - 70) && (animatedPosition.y + ballHalfSize.height) === (currentPaddlePosition2 + 100)) {
        touchDirection = Direction.bottom;
      }

      if (touchDirection !== undefined) {
        // Ball touches border -> stop animation
        clearInterval(interval);
        res({ touchPosition: animatedPosition, touchDirection: touchDirection, borderTouched: borderTouched });
      }
    }, 4);
  });
}

/** Move the center of the ball to given position **/
function moveBall(targetPosition: Point): void {
  // Note the 'px' at the end of the coordinates for CSS. Don't
  // forget it. Without the 'px', it doesn't work.
  const leftPos = `${targetPosition.x - ballHalfSize.width}px`;
  const topPos = `${targetPosition.y - ballHalfSize.height}px`;

  if (ball.style.left !== leftPos) {
    ball.style.setProperty('left', leftPos);
  }

  if (ball.style.top !== topPos) {
    ball.style.setProperty('top', topPos);
  }
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