const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const grid = 20; // size of each cell
const canvasSize = canvas.width;
let snake = [{ x: 200, y: 200 }];
let dx = grid; // movement in x
let dy = 0;   // movement in y
let food = { x: 0, y: 0 };
let score = 0;

// Place initial food
placeFood();

function gameLoop() {
    moveSnake();
    if (checkCollision()) {
        resetGame(); // just reset without alert
        return;
    }
    if (checkFood()) {
        snake.push({...snake[snake.length - 1]});
        score++;
        placeFood();
    }
    draw();
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.fillStyle = 'lime';
    snake.forEach(segment => ctx.fillRect(segment.x, segment.y, grid-1, grid-1));

    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, grid-1, grid-1);
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    snake.pop();
}

function checkCollision() {
    const head = snake[0];
    if (head.x < 0 || head.x >= canvasSize || head.y < 0 || head.y >= canvasSize) return true;
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    return false;
}

function checkFood() {
    const head = snake[0];
    return head.x === food.x && head.y === food.y;
}

function placeFood() {
    food.x = Math.floor(Math.random() * (canvasSize / grid)) * grid;
    food.y = Math.floor(Math.random() * (canvasSize / grid)) * grid;
}

function resetGame() {
    snake = [{ x: 200, y: 200 }];
    dx = grid;
    dy = 0;
    score = 0;
    placeFood();
}

window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -grid; }
    if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = grid; }
    if (e.key === 'ArrowLeft' && dx === 0) { dx = -grid; dy = 0; }
    if (e.key === 'ArrowRight' && dx === 0) { dx = grid; dy = 0; }
});

let gameInterval; // store the game interval

const startButton = document.getElementById('startButton');

startButton.addEventListener('click', () => {
    if (!gameInterval) { // only start if not already running
        gameInterval = setInterval(gameLoop, 170);
        startButton.disabled = true; // disable button after starting
    }
});
