//TODO: add position after end of movement; differ between paddles
window.addEventListener('load', async () => {
  const paddle1 = <HTMLDivElement>document.getElementsByClassName('paddle1')[0];
  const paddle2 = <HTMLDivElement>document.getElementsByClassName('paddle2')[0];
  const paddleHeight = paddle1.clientHeight;
  const paddleHalfHeight = paddleHeight / 2;
  const socket = io();
  let currentPaddlePosition = paddle1.clientTop;

  const speed = 1;

  let interval: NodeJS.Timeout;
  let direction: number;



  const hammertime = new Hammer(paddle1);
  hammertime.get('pan').set({ direction: Hammer.DIRECTION_DOWN | Hammer.DIRECTION_UP });
  hammertime.on('pan', ev =>
    // Put center of paddle to the center of the user's finger
    movePaddle(ev.center.y - paddleHalfHeight));

  /** Helper function that starts movement when keydown happens */
  function startMoving() {
    // Move paddle every 4ms
    interval = setInterval(() => movePaddle(currentPaddlePosition + direction), 4);
  }

  /** Helper function that stops movement when keyup happens */
  function stopMoving() {
    clearInterval(interval);
    interval = direction = undefined;
  }

  /**
   * Helper function that moves the paddle to a given position
   * @param targetPosition Target position. No movement is done if target position is invalid
   */
  function movePaddle(targetPosition: number): void {
    if (targetPosition >= 0 && (targetPosition + paddleHeight) <= document.documentElement.clientHeight) {
      currentPaddlePosition = targetPosition;

      // Note the 'px' at the end of the coordinates for CSS. Don't
      // forget it. Without the 'px', it doesn't work.
      paddle1.style.setProperty('top', `${currentPaddlePosition}px`);
    }
  }

  // Listen to keydown event
  document.addEventListener('keydown', event => {
    // We have to check whether a movement is already in progress. This is
    // necessary because keydown events arrive often when key is
    // continuously pressed.
    if (!interval) {
      switch (event.code) {
        case 'ArrowDown':
          direction = speed;
          startMoving();
          break;
        case 'ArrowUp':
          direction = speed * -1;
          startMoving();
          break;
      }
    }
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      // Send ArrowKey message to server
      socket.emit('ArrowDown', event.code);
    }
  });

  // Listen to keyup event
  document.addEventListener('keyup', event => {
    switch (event.code) {
      case 'ArrowDown':
      case 'ArrowUp':
        stopMoving();
        break;
    }
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      // Send ArrowKey message to server
      socket.emit('ArrowUp', event.code,"hi");
    }
  });

  socket.on('ArrowDown', code => {
    if (!interval) {
      switch (code) {
        case 'ArrowDown':
          direction = speed;
          startMoving();
          break;
        case 'ArrowUp':
          direction = speed * -1;
          startMoving();
          break;
      }
    }
  });
  socket.on('ArrowUp', code => {
      switch (code[0]) {
        case 'ArrowDown':
        case 'ArrowUp':
        stopMoving();
          break;
      }
  });
});