// Gravity Link: Galactic Siege - Mini Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let level = 1;

// Player Ship
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 30,
    height: 40,
    speed: 5,
    velocityX: 0,
    velocityY: 0,
    shieldActive: false,
    shieldDuration: 0
};

// Stars (collectibles)
let stars = [];
let enemies = [];
let gravityPoints = [];
let particles = [];

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') {
        e.preventDefault();
        activateShield();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Button handlers
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
canvas.addEventListener('click', (e) => {
    if (gameRunning && !gamePaused) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        createGravityPoint(x, y);
    }
});

function startGame() {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    lives = 3;
    level = 1;
    player.x = canvas.width / 2;
    player.y = canvas.height - 60;
    player.velocityX = 0;
    player.velocityY = 0;
    
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    stars = [];
    enemies = [];
    gravityPoints = [];
    particles = [];
    
    generateLevel();
    gameLoop();
}

function togglePause() {
    gamePaused = !gamePaused;
    document.getElementById('pauseBtn').textContent = gamePaused ? 'Resume Game' : 'Pause Game';
}

function generateLevel() {
    stars = [];
    enemies = [];
    
    // Create stars
    for (let i = 0; i < 5 + level; i++) {
        stars.push({
            x: Math.random() * (canvas.width - 20) + 10,
            y: Math.random() * (canvas.height - 150) + 30,
            size: 8,
            collected: false
        });
    }
    
    // Create enemies
    for (let i = 0; i < Math.min(2 + level, 5); i++) {
        enemies.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: Math.random() * (canvas.height / 2) + 30,
            width: 25,
            height: 25,
            speed: 1 + level * 0.3,
            velocityX: (Math.random() - 0.5) * 3,
            velocityY: (Math.random() - 0.5) * 3
        });
    }
}

function activateShield() {
    if (!player.shieldActive && gameRunning && !gamePaused) {
        player.shieldActive = true;
        player.shieldDuration = 120; // 2 seconds at 60fps
    }
}

function createGravityPoint(x, y) {
    gravityPoints.push({
        x: x,
        y: y,
        radius: 60,
        duration: 60,
        maxDuration: 60,
        strength: 3
    });
}

function updatePlayer() {
    // Handle input
    if (keys['arrowleft'] || keys['a']) {
        player.velocityX = -player.speed;
    } else if (keys['arrowright'] || keys['d']) {
        player.velocityX = player.speed;
    } else {
        player.velocityX *= 0.8;
    }
    
    if (keys['arrowup'] || keys['w']) {
        player.velocityY = -player.speed;
    } else if (keys['arrowdown'] || keys['s']) {
        player.velocityY = player.speed;
    } else {
        player.velocityY *= 0.8;
    }
    
    // Apply gravity effects from gravity points
    gravityPoints.forEach(gp => {
        const dx = gp.x - player.x;
        const dy = gp.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < gp.radius) {
            const force = (gp.strength * (1 - distance / gp.radius)) * 0.5;
            player.velocityX += (dx / distance) * force;
            player.velocityY += (dy / distance) * force;
        }
    });
    
    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Boundaries
    if (player.x < 15) player.x = 15;
    if (player.x > canvas.width - 15) player.x = canvas.width - 15;
    if (player.y < 20) player.y = 20;
    if (player.y > canvas.height - 20) player.y = canvas.height - 20;
    
    // Update shield
    if (player.shieldActive) {
        player.shieldDuration--;
        if (player.shieldDuration <= 0) {
            player.shieldActive = false;
        }
    }
}

function updateEnemies() {
    enemies.forEach(enemy => {
        // Apply gravity from gravity points
        gravityPoints.forEach(gp => {
            const dx = gp.x - enemy.x;
            const dy = gp.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < gp.radius) {
                const force = (gp.strength * (1 - distance / gp.radius)) * 0.3;
                enemy.velocityX += (dx / distance) * force;
                enemy.velocityY += (dy / distance) * force;
            }
        });
        
        // Move
        enemy.x += enemy.velocityX;
        enemy.y += enemy.velocityY;
        
        // Bounce off walls
        if (enemy.x < 10 || enemy.x > canvas.width - 10) {
            enemy.velocityX *= -1;
        }
        if (enemy.y < 10 || enemy.y > canvas.height - 80) {
            enemy.velocityY *= -1;
        }
        
        // Friction
        enemy.velocityX *= 0.98;
        enemy.velocityY *= 0.98;
        
        // Keep in bounds
        if (enemy.x < 15) enemy.x = 15;
        if (enemy.x > canvas.width - 15) enemy.x = canvas.width - 15;
        if (enemy.y < 15) enemy.y = 15;
        if (enemy.y > canvas.height - 80) enemy.y = canvas.height - 80;
    });
}

function updateStars() {
    stars.forEach(star => {
        if (!star.collected) {
            const dx = player.x - star.x;
            const dy = player.y - star.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 25) {
                star.collected = true;
                score += 10;
                createExplosion(star.x, star.y, '#FFD700');
            }
        }
    });
}

function updateGravityPoints() {
    gravityPoints = gravityPoints.filter(gp => {
        gp.duration--;
        return gp.duration > 0;
    });
}

function checkCollisions() {
    enemies.forEach((enemy, index) => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30) {
            if (player.shieldActive) {
                enemies.splice(index, 1);
                score += 50;
                createExplosion(enemy.x, enemy.y, '#FF6B6B');
            } else {
                lives--;
                createExplosion(player.x, player.y, '#FF6B6B');
                player.x = canvas.width / 2;
                player.y = canvas.height - 60;
            }
        }
    });
}

function checkLevelComplete() {
    const allCollected = stars.every(star => star.collected);
    if (allCollected && stars.length > 0) {
        level++;
        score += 100;
        generateLevel();
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            color: color
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.vy += 0.1; // gravity
        return p.life > 0;
    });
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(15, 15, 30, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // Draw gravity points
    gravityPoints.forEach(gp => {
        const alpha = gp.duration / gp.maxDuration;
        ctx.strokeStyle = `rgba(0, 212, 255, ${alpha * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gp.x, gp.y, gp.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = `rgba(0, 212, 255, ${alpha * 0.2})`;
        ctx.beginPath();
        ctx.arc(gp.x, gp.y, gp.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw stars
    stars.forEach(star => {
        if (!star.collected) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
    
    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);
        
        // Enemy eyes
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(enemy.x - 8, enemy.y - 5, 4, 4);
        ctx.fillRect(enemy.x + 4, enemy.y - 5, 4, 4);
    });
    
    // Draw player
    ctx.fillStyle = '#00D4FF';
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    
    // Draw player cockpit
    ctx.fillStyle = '#9333EA';
    ctx.fillRect(player.x - 8, player.y - 15, 16, 12);
    
    // Draw shield
    if (player.shieldActive) {
        const shieldAlpha = player.shieldDuration / 120;
        ctx.strokeStyle = `rgba(147, 51, 234, ${shieldAlpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 40, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Draw particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
}

function gameLoop() {
    if (!gamePaused) {
        updatePlayer();
        updateEnemies();
        updateStars();
        updateGravityPoints();
        updateParticles();
        checkCollisions();
        checkLevelComplete();
    }
    
    draw();
    updateHUD();
    
    if (lives <= 0) {
        gameRunning = false;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        return;
    }
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Initial draw
draw();
