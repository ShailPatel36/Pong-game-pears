// Get canvas element and context
const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
const gameMessage = document.getElementById('game-message');

// Game state
let gameMode = '1P'; // '1P' or '2P'
let isPaused = false;
let lastScoreCheck = 0; // To prevent multiple scoring in one frame

// Game objects with updated pear-themed colors
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    velocityX: 5,
    velocityY: 5,
    speed: 7,
    color: '#2C3E50'  // Sophisticated dark blue-gray
};

const player = {
    x: 10,
    y: (canvas.height - 100) / 2,
    width: 10,
    height: 100,
    score: 0,
    color: '#4299E1'  // Soft blue
};

const computer = {
    x: canvas.width - 20,
    y: (canvas.height - 100) / 2,
    width: 10,
    height: 100,
    score: 0,
    color: '#48BB78'  // Muted green
};

const net = {
    x: (canvas.width - 2) / 2,
    y: 0,
    width: 2,
    height: 10,
    color: 'rgba(44, 62, 80, 0.3)'  // Matching ball color with transparency
};

// Game variables
let gameRunning = false;
let gamePaused = false;
let lastScoreTime = 0;
let scoreDelay = 1000; // 1 second delay after scoring
const playerScoreDisplay = document.getElementById('player-score');
const computerScoreDisplay = document.getElementById('computer-score');

// Particle effects
let particles = [];

// Event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Key states
const keys = {
    w: false,
    s: false,
    up: false,
    down: false
};

// Control handlers
function handleKeyDown(e) {
    if (e.key === 'w' || e.key === 'W') keys.w = true;
    else if (e.key === 's' || e.key === 'S') keys.s = true;
    else if (e.key === 'ArrowUp' && gameMode === '2P') keys.up = true;
    else if (e.key === 'ArrowDown' && gameMode === '2P') keys.down = true;
    else if (e.key === ' ') {
        if (!gameRunning) showGameModeSelection();
        else if (isPaused) togglePause();
    } else if (e.key === 'p' || e.key === 'P') togglePause();
}

function handleKeyUp(e) {
    if (e.key === 'w' || e.key === 'W') keys.w = false;
    else if (e.key === 's' || e.key === 'S') keys.s = false;
    else if (e.key === 'ArrowUp') keys.up = false;
    else if (e.key === 'ArrowDown') keys.down = false;
}

// Draw functions
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
}

function drawNet() {
    for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

// Particle system
function createScoreParticles(x, y, color) {
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 5 + 2,
            color: color,
            alpha: 1,
            life: Math.random() * 30 + 20
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = p.life / 50;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        drawCircle(p.x, p.y, p.radius, p.color);
    });
    ctx.globalAlpha = 1;
}

// Game logic
function resetBall() {
    if (Date.now() - lastScoreTime > scoreDelay) {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.velocityX = -ball.velocityX;
        ball.speed = 7;
        gamePaused = false;
        lastScoreCheck = 0; // Reset score check
    }
}

function collision(b, p) {
    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

function updateScore() {
    playerScoreDisplay.textContent = player.score;
    computerScoreDisplay.textContent = computer.score;
}

function update() {
    if (gamePaused || isPaused) {
        if (Date.now() - lastScoreTime > scoreDelay) gamePaused = false;
        return;
    }

    // Player paddle movement
    if (keys.w && player.y > 0) player.y -= 8;
    if (keys.s && player.y < canvas.height - player.height) player.y += 8;

    // Second player or AI
    if (gameMode === '2P') {
        if (keys.up && computer.y > 0) computer.y -= 8;
        if (keys.down && computer.y < canvas.height - computer.height) computer.y += 8;
    } else {
        const computerSpeed = 6 + ball.speed * 0.1;
        const computerCenter = computer.y + computer.height / 2;
        const ballCenter = ball.y;
        const targetY = ball.velocityX > 0 ? ballCenter : computer.y + computer.height / 2;

        if (computerCenter < targetY - 15) computer.y += computerSpeed;
        else if (computerCenter > targetY + 15) computer.y -= computerSpeed;

        if (computer.y < 0) computer.y = 0;
        else if (computer.y + computer.height > canvas.height) computer.y = canvas.height - computer.height;
    }

    // Ball movement
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Wall collision with visibility fix
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.velocityY = -ball.velocityY;
        createScoreParticles(ball.x, ball.y, '#FFFF00');
    } else if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.velocityY = -ball.velocityY;
        createScoreParticles(ball.x, ball.y, '#FFFF00');
    }

    // Paddle collision
    if (ball.velocityX < 0 && ball.x < canvas.width / 2 && collision(ball, player)) {
        let collidePoint = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        const angleRad = (Math.PI / 4) * collidePoint;
        ball.velocityX = ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        ball.speed += 0.2;
        createScoreParticles(ball.x, ball.y, player.color);
    } else if (ball.velocityX > 0 && ball.x > canvas.width / 2 && collision(ball, computer)) {
        let collidePoint = (ball.y - (computer.y + computer.height / 2)) / (computer.height / 2);
        const angleRad = (Math.PI / 4) * collidePoint;
        ball.velocityX = -ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        ball.speed += 0.2;
        createScoreParticles(ball.x, ball.y, computer.color);
    }

    // Scoring with single increment check
    const currentTime = Date.now();
    if (currentTime - lastScoreCheck > 100) { // Minimum 100ms between score checks
        if (ball.x - ball.radius < 0 && ball.velocityX < 0) {
            computer.score++;
            updateScore();
            lastScoreTime = currentTime;
            gamePaused = true;
            createScoreParticles(ball.x + 20, ball.y, computer.color);
            gameMessage.textContent = "CPU Scores!";
            gameMessage.style.display = 'block';
            setTimeout(() => {
                gameMessage.style.display = 'none';
                resetBall();
            }, scoreDelay);
            lastScoreCheck = currentTime;
        } else if (ball.x + ball.radius > canvas.width && ball.velocityX > 0) {
            player.score++;
            updateScore();
            lastScoreTime = currentTime;
            gamePaused = true;
            createScoreParticles(ball.x - 20, ball.y, player.color);
            gameMessage.textContent = "You Score!";
            gameMessage.style.display = 'block';
            setTimeout(() => {
                gameMessage.style.display = 'none';
                resetBall();
            }, scoreDelay);
            lastScoreCheck = currentTime;
        }
    }

    updateParticles();
}

// Modified render function with softer shadows
// Modified render function with reduced shadows
function render() {
    // Soft blue-gray gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#F0F4F8');  // Ice blue
    gradient.addColorStop(1, '#E0EBF5');  // Light steel blue
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawNet();
    
    // Clean paddle design
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 4;
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(computer.x, computer.y, computer.width, computer.height, computer.color);
    
    // Crisp ball rendering
    ctx.shadowBlur = 6;
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
    
    ctx.shadowBlur = 0;
    drawParticles();
}

function animate() {
    update();
    render();
    if (gameRunning && !isPaused) requestAnimationFrame(animate);
}

function init() {
    render();
    gameMessage.innerHTML = "Press SPACE to select game mode<br>P to pause/resume";
    gameMessage.style.display = 'block';
    updateScore(); // Ensure scores are initialized
}

init();

function showGameModeSelection() {
    gameMessage.innerHTML = `
        <div style="background-color: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 10px;">
            Select Game Mode:<br>
            Press '1' for 1 Player<br>
            Press '2' for 2 Players
        </div>`;
    gameMessage.style.display = 'block';
    
    const modeHandler = (e) => {
        if (e.key === '1') {
            gameMode = '1P';
            startGame();
            document.removeEventListener('keydown', modeHandler);
        } else if (e.key === '2') {
            gameMode = '2P';
            startGame();
            document.removeEventListener('keydown', modeHandler);
        }
    };
    document.addEventListener('keydown', modeHandler);
}

function startGame() {
    gameMessage.style.display = 'none';
    gameRunning = true;
    resetGame();
    animate();
}

function togglePause() {
    if (gameRunning) {
        isPaused = !isPaused;
        gamePaused = isPaused;
        if (isPaused) {
            gameMessage.innerHTML = `
                <div style="background-color: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 10px;">
                    PAUSED<br>Press SPACE or P to resume
                </div>`;
            gameMessage.style.display = 'block';
        } else {
            gameMessage.style.display = 'none';
            animate();
        }
    }
}

function resetGame() {
    player.score = 0;
    computer.score = 0;
    updateScore();
    resetBall();
}