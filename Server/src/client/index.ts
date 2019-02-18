
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

function setPlayer(val: string) {
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
}