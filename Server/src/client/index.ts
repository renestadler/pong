
let player: number;
let paddle1;
let paddle2;
let paddleHeight;
let paddleHalfHeight;
const socket = io();
let currentPaddlePosition1;
let currentPaddlePosition2;

const speedPaddle1 = 1;
const speedPaddle2 = 1;

let intervalPaddle1: NodeJS.Timeout;
let intervalPaddle2: NodeJS.Timeout;
let directionPaddle1: number;
let directionPaddle2: number;

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

// Get some information about the browser window and the ball. This information will
// never change. So it makes sense to get it only once to make the rest of the program faster.
const ball = document.getElementById('ball');
const ballSize: Size = { width: ball.clientWidth, height: ball.clientHeight };
const ballHalfSize = splitSize(ballSize, 2);
const clientSize: Size = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
const clientHalfSize = splitSize(clientSize, 2);

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
      console.log(directionPaddle1);
      // Send ArrowKey message to server
      socket.emit('ArrowDown', event.code);
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
      console.log(directionPaddle2);
      // Send ArrowKey message to server
      socket.emit('ArrowDown', event.code);
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
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      // Send ArrowKey message to server
      socket.emit('ArrowUp', { code: event.code, pos: currentPaddlePosition1 });
    }
  } else if (player === 2) {
    switch (event.code) {
      case 'ArrowDown':
      case 'ArrowUp':
        stopMoving(player);
        break;
    }
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      // Send ArrowKey message to server
      socket.emit('ArrowUp', { code: event.code, pos: currentPaddlePosition2 });
    }
  }
});

socket.on('ArrowDown', code => {
  if (player === 1) {
    if (!intervalPaddle2) {
      switch (code) {
        case 'ArrowDown':
          directionPaddle2 = speedPaddle2;
          startMoving(2);
          break;
        case 'ArrowUp':
          directionPaddle2 = speedPaddle2 * -1;
          startMoving(2);
          break;
      }
    }
  } else if (player === 2) {
    if (!intervalPaddle1) {
      switch (code) {
        case 'ArrowDown':
          directionPaddle1 = speedPaddle1;
          startMoving(1);
          break;
        case 'ArrowUp':
          directionPaddle1 = speedPaddle1 * -1;
          startMoving(1);
          break;
      }
    }
  }
});

socket.on('ArrowUp', async code => {
  if (player === 1) {
    currentPaddlePosition2 = code.pos;
    await delay(4);
    switch (code.code) {
      case 'ArrowDown':
      case 'ArrowUp':
        stopMoving(2);
        break;
    }
  }
  else if (player === 2) {
    currentPaddlePosition1 = code.pos;
    await delay(4);
    switch (code.code) {
      case 'ArrowDown':
      case 'ArrowUp':
        stopMoving(1);
        break;
    }
  }
});
socket.on('Move', async code => {
  console.log(code.pos);
  console.log(code);
  if (player === 1) {
    currentPaddlePosition2 = code.pos;
    paddle2.style.setProperty('top', `${currentPaddlePosition2}px`);
  }
  else if (player === 2) {
    currentPaddlePosition1 = code.pos;
    paddle1.style.setProperty('top', `${currentPaddlePosition1}px`);
  }
});

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setPlayer(val: string) {
  console.log(parseInt(val));
  document.getElementById("game").style.display = "block";
  document.getElementById("player").style.display = "none";
  paddle1 = document.getElementsByClassName('paddle1')[0];
  paddle2 = document.getElementsByClassName('paddle2')[0];
  paddleHeight = paddle1.clientHeight;
  paddleHalfHeight = paddleHeight / 2;
  currentPaddlePosition1 = paddle1.clientTop;
  currentPaddlePosition2 = paddle2.clientTop;

  player = parseInt(val);
  if (player === 1) {
    const hammertime = new Hammer(paddle1);
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_DOWN | Hammer.DIRECTION_UP });
    hammertime.on('pan', ev => {
      // Put center of paddle to the center of the user's finger
      movePaddle(ev.center.y - paddleHalfHeight, player);
      console.log(currentPaddlePosition1)
      socket.emit('Move', { pos: currentPaddlePosition1 });
    });
  }
  else if (player === 2) {
    const hammertime = new Hammer(paddle2);
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_DOWN | Hammer.DIRECTION_UP });
    hammertime.on('pan', ev => {
      // Put center of paddle to the center of the user's finger
      movePaddle(ev.center.y - paddleHalfHeight, player);
      console.log(currentPaddlePosition2)
      socket.emit('Move', { pos: currentPaddlePosition2 });
    });
  }

  // Move ball to center of the screen
  let ballCurrentPosition: Point = { x: clientHalfSize.width, y: clientHalfSize.height };
  moveBall(ballCurrentPosition);

  // Calculate the random angle that the ball should initially travel.
  // Should be an angle between 27.5 and 45 DEG (=PI/8 and PI/4 RAD)
  const angle = Math.PI / 8 + Math.random() * Math.PI / 8;

  // Calculate the random quadrant into which the ball should initially travel.
  // 0 = upper right, 1 = lower right, 2 = lower left, 3 = upper left
  let quadrant = Math.floor(Math.random() * 4);

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
    const borderTouch = await animateBall(ballCurrentPosition, targetBallPosition);

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
  } while (true); // Forever
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
  function animateBall(currentBallPosition: Point, targetBallPosition: Point): Promise<{touchPosition: Point, touchDirection: Direction}> {
    // Calculate x and y distances from current to target position
    const distanceToTarget: Size = subtractPoints(targetBallPosition, currentBallPosition);

    // Use Pythagoras to calculate distance from current to target position
    const distance = Math.sqrt(distanceToTarget.width * distanceToTarget.width + distanceToTarget.height * distanceToTarget.height);

    // Variable defining the speed of the animation (pixels that the ball travels per interval)
    const pixelsPerInterval = 1;

    // Calculate distance per interval
    const distancePerInterval = splitSize(distanceToTarget, distance * pixelsPerInterval);

    // Return a promise that will resolve when animation is done
    return new Promise<{touchPosition: Point, touchDirection: Direction}>(res => {
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
        if ((animatedPosition.x - ballHalfSize.width) < 0) { touchDirection = Direction.left; }
        if ((animatedPosition.y - ballHalfSize.height) < 0) { touchDirection = Direction.top; }
        if ((animatedPosition.x + ballHalfSize.width) > clientSize.width) { touchDirection = Direction.right; }
        if ((animatedPosition.y + ballHalfSize.height) > clientSize.height) { touchDirection = Direction.bottom; }

        if (touchDirection !== undefined) {
          // Ball touches border -> stop animation
          clearInterval(interval);
          res({ touchPosition: animatedPosition, touchDirection: touchDirection });
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