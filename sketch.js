// Game settings
const PLAYER_SIZE = 40;
const GRAVITY = 0.7;
const JUMP_FORCE = -14;
const MOVE_SPEED = 5;
const PLATFORM_WIDTH = 180;
const PLATFORM_HEIGHT = 25;
const PLATFORM_GAP = 220;
const COIN_SIZE = 17.5;
const GLIDE_GRAVITY = 0.075;
const GLIDE_DRAG = 0.975;

// Game state
let player, platforms = [], coins = [], score = 0, gameState = 'playing';
let cameraX = 0, jumpsRemaining = 2, isGliding = false;
let scoreDisplay;

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    select('canvas').parent('game-container');
    scoreDisplay = select('#score-display');
    resetGame();
}

function resetGame() {
    player = {
        x: 200,
        y: 300,
        size: PLAYER_SIZE,
        velX: 0,
        velY: 0,
        isJumping: true
    };
    score = 0;
    cameraX = 0;
    jumpsRemaining = 2;
    isGliding = false;
    gameState = 'playing';
    platforms = [];
    coins = [];

    // Create initial platforms
    platforms.push({ x: -10000, y: height - 40, w: 20000, h: 40 });
    for (let i = 0, platformX = 0; i < 20; i++) {
        platformX += random(PLATFORM_GAP - 50, PLATFORM_GAP + 50);
        platforms.push({
            x: platformX,
            y: random(height/2, height - 100),
            w: PLATFORM_WIDTH,
            h: PLATFORM_HEIGHT
        });
    }

    // Create initial coins
    platforms.forEach(p => {
        if (random() > 0.6 && p.y < height - 100) {
            coins.push({
                x: p.x + random(20, p.w - 20),
                y: p.y - 40,
                size: COIN_SIZE,
                collected: false
            });
        }
    });

    for (let i = 0; i < 15; i++) {
        coins.push({
            x: random(width * 2),
            y: random(100, height - 150),
            size: COIN_SIZE,
            collected: false
        });
    }
}

function draw() {
    background(135, 206, 235);
    translate(-cameraX, 0);

    if (gameState === 'playing') {
        updateGame();
    } else {
        drawGameOver();
    }

    drawGameElements();
}

function updateGame() {
    // Apply physics
    if (isGliding && player.velY > 0) {
        player.velY += GLIDE_GRAVITY;
        player.velX *= GLIDE_DRAG;
    } else {
        player.velY += GRAVITY;
    }

    player.x += player.velX;
    player.y += player.velY;
    cameraX = player.x - width/3;

    checkCollisions();
    checkCoinCollection();
    generateTerrain();
    generateCoins();
}

function checkCollisions() {
    let onGround = false;

    platforms.forEach(p => {
        if (player.y + player.size >= p.y &&
            player.y <= p.y + p.h &&
            player.x + player.size > p.x &&
            player.x < p.x + p.w) {

            if (player.velY > 0) {
                player.y = p.y - player.size;
                player.velY = 0;
                onGround = true;
                jumpsRemaining = 2;
                isGliding = false;

                // Reset drag effect when landing
                if (player.velX !== 0) {
                    player.velX = player.velX > 0 ? MOVE_SPEED : -MOVE_SPEED;
                }
            }
        }
    });

    player.isJumping = !onGround;

    if (player.y > height + 100) {
        gameState = 'gameOver';
    }
}

function drawGameElements() {
    // Draw platforms
    fill(139, 69, 19);
    platforms.forEach(p => rect(p.x, p.y, p.w, p.h));

    // Draw coins
    fill(255, 215, 0);
    coins.forEach(c => {
        if (!c.collected) {
            ellipse(c.x, c.y, c.size);
        }
    });

    // Draw player
    fill(255, 70, 70);
    rect(player.x, player.y, player.size, player.size);

    // Draw glide effect
    if (isGliding && player.velY > 0) {
        fill(200, 200, 255, 150);
        ellipse(player.x + player.size/2, player.y - 15,
               player.size * 1.8, player.size/1.5);
    }
}

function checkCoinCollection() {
    coins.forEach(c => {
        if (!c.collected &&
            dist(player.x + player.size/2, player.y + player.size/2,
                 c.x, c.y) < (player.size/2 + c.size/2)) {
            c.collected = true;
            score += 10;
            scoreDisplay.html(`Score: ${score}`);
        }
    });
}

function generateTerrain() {
    const lastPlatform = platforms[platforms.length-1];
    if (lastPlatform.x + lastPlatform.w < cameraX + width + 1000) {
        const newPlatform = {
            x: lastPlatform.x + lastPlatform.w + random(PLATFORM_GAP - 50, PLATFORM_GAP + 50),
            y: random(height/2, height - 100),
            w: PLATFORM_WIDTH,
            h: PLATFORM_HEIGHT
        };
        platforms.push(newPlatform);

        if (random() > 0.5) {
            coins.push({
                x: newPlatform.x + random(20, newPlatform.w - 20),
                y: newPlatform.y - 40,
                size: COIN_SIZE,
                collected: false
            });
        }
    }

    // Remove platforms that are far behind
    platforms = platforms.filter(p => p.x + p.w > cameraX - 500);
}

function generateCoins() {
    if (random() < 0.02 && coins.filter(c => !c.collected).length < 20) {
        coins.push({
            x: cameraX + width + random(100, 500),
            y: random(100, height - 200),
            size: COIN_SIZE,
            collected: false
        });
    }

    // Remove collected coins that are far behind
    coins = coins.filter(c => !c.collected || c.x > cameraX - 100);
}

function drawGameOver() {
    resetMatrix();
    fill(255, 0, 0);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width/2, height/2 - 40);

    fill(255);
    textSize(24);
    text(`Final Score: ${score}`, width/2, height/2 + 20);
    text("Press SPACE to restart", width/2, height/2 + 60);
}

function keyPressed() {
    if (gameState === 'playing') {
        if ((key === 'w' || key === 'W' || keyCode === 32) && jumpsRemaining > 0) {
            player.velY = JUMP_FORCE;
            jumpsRemaining--;
            isGliding = false;
        }
        if (key === 'x' || key === 'X') {
            isGliding = true;
        }
    } else if (key === ' ' && gameState === 'gameOver') {
        resetGame();
    }
}

function keyReleased() {
    if (key === 'a' || key === 'd') {
        player.velX = 0;
    }
    if (key === 'x' || key === 'X') {
        isGliding = false;
    }
}

function keyTyped() {
    if (gameState === 'playing') {
        if (key === 'a' || key === 'A') {
            player.velX = -MOVE_SPEED;
        }
        if (key === 'd' || key === 'D') {
            player.velX = MOVE_SPEED;
        }
    }
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}
