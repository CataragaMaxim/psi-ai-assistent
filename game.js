const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

const ui = {
  lives: document.getElementById('lives'),
  score: document.getElementById('score'),
  level: document.getElementById('level')
};

const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const MOVE_SPEED = 4;

let score = 0;
let lives = 3;
let currentLevel = 1;
let gameRunning = true;

const keys = { left: false, right: false, up: false, jumpRequested: false };
const game = { won: false };
const platforms = [];
const movingPlatforms = [];
const coins = [];
const enemies = [];
const particles = [];
const powerUps = [];
const checkpoint = { x: 50, y: 300, level: 0, active: false };
let collectedCoins = 0;
let powerUpTimer = 0;
let audioContext;
let musicTimer;
const powerUpState = {
  doubleJump: false,
  invincible: false,
  magnet: false
};
const exitDoor = {
  x: canvas.width - 60,
  y: 340,
  width: 30,
  height: 40,
  color: '#ffd93d'
};
let levelFlash = 0;
let damageFlash = 0;

const player = {
  x: 50,
  y: 300,
  width: 30,
  height: 40,
  vx: 0,
  vy: 0,
  isGrounded: false,
  jumpsRemaining: 1,

  // Desenează playerul și aura aurie când invincibilitatea este activă.
  draw() {
    if (powerUpState.invincible) {
      context.save();
      context.shadowColor = '#ffd93d';
      context.shadowBlur = 22 + Math.sin(performance.now() / 90) * 5;
      context.fillStyle = 'rgba(255, 217, 61, 0.28)';
      context.beginPath();
      context.arc(this.x + this.width / 2, this.y + this.height / 2, 30, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    context.fillStyle = '#e94560';
    if (powerUpState.invincible) context.fillStyle = '#ffd93d';
    context.fillRect(this.x, this.y, this.width, this.height);

    context.fillStyle = '#fff4fa';
    context.fillRect(this.x + 6, this.y + 9, 6, 6);
    context.fillRect(this.x + 18, this.y + 9, 6, 6);

    context.fillStyle = '#241b35';
    context.fillRect(this.x + 8, this.y + 28, 14, 4);
  },

  // Aplică inputul, gravitația și coliziunile playerului cu platformele.
  update() {
    if (keys.left) this.vx = -MOVE_SPEED;
    else if (keys.right) this.vx = MOVE_SPEED;
    else this.vx *= 0.8;

    const wasGrounded = this.isGrounded;
    if (keys.jumpRequested && (wasGrounded || (powerUpState.doubleJump && this.jumpsRemaining > 0))) {
      this.vy = JUMP_FORCE;
      this.isGrounded = false;
      if (wasGrounded) this.jumpsRemaining = powerUpState.doubleJump ? 1 : 0;
      else this.jumpsRemaining -= 1;
      createParticles(this.x + this.width / 2, this.y + this.height, 7, '#57f4ff', 'spark');
      playTone(520, 0.08, 'square');
    }
    keys.jumpRequested = false;

    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    this.isGrounded = false;

    platforms.forEach((platform) => {
      const fallingOntoPlatform = this.vy >= 0 &&
        this.x + this.width > platform.x && this.x < platform.x + platform.width &&
        this.y + this.height >= platform.y && this.y + this.height - this.vy <= platform.y;
      if (fallingOntoPlatform) {
        if (!this.isGrounded && this.vy > 2) createParticles(this.x + this.width / 2, platform.y, 6, '#a8a5c6', 'dust');
        this.y = platform.y - this.height;
        this.vy = 0;
        this.isGrounded = true;
        this.jumpsRemaining = powerUpState.doubleJump ? 2 : 1;
      }
    });
  }
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Creează particule pentru salt, aterizare și colectarea monedelor.
function createParticles(x, y, count, color, type = 'burst') {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = type === 'dust' ? randomBetween(1, 3) : randomBetween(2, 5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: type === 'dust' ? -Math.random() * 2 : Math.sin(angle) * speed,
      life: randomBetween(18, 35),
      color
    });
  }
}

// Actualizează poziția și durata de viață a particulelor.
function updateParticles() {
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.12;
    particle.life -= 1;
    if (particle.life <= 0) particles.splice(index, 1);
  }
}

function drawParticles() {
  particles.forEach((particle) => {
    context.globalAlpha = Math.max(0, particle.life / 35);
    context.fillStyle = particle.color;
    context.fillRect(particle.x, particle.y, 3, 3);
  });
  context.globalAlpha = 1;
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    startMusic();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
}

function playTone(frequency, duration, type = 'sine', delay = 0) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + delay + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(audioContext.currentTime + delay);
  oscillator.stop(audioContext.currentTime + delay + duration);
}

function startMusic() {
  if (musicTimer) return;
  const notes = [196, 247, 294, 247];
  let noteIndex = 0;
  musicTimer = window.setInterval(() => {
    if (gameRunning) playTone(notes[noteIndex++ % notes.length], 0.16, 'triangle');
  }, 520);
}

function resetPowerUps() {
  powerUpState.doubleJump = false;
  powerUpState.invincible = false;
  powerUpState.magnet = false;
  powerUpTimer = 0;
}

function coinOverlapsPlatform(x, y, radius) {
  return platforms.some((platform) =>
    x + radius > platform.x && x - radius < platform.x + platform.width &&
    y + radius > platform.y && y - radius < platform.y + platform.height
  );
}

// Resetează și generează platforme, monede, inamici, power-up-uri și checkpoint-uri.
function generateLevel(level) {
  platforms.length = 0;
  movingPlatforms.length = 0;
  coins.length = 0;
  enemies.length = 0;
  powerUps.length = 0;
  particles.length = 0;
  resetPowerUps();

  platforms.push({ x: 0, y: 380, width: canvas.width, height: 20, color: '#4a4a6a', isGround: true });

  const platformCount = Math.min(12, 5 + level);
  for (let index = 0; index < platformCount; index += 1) {
    const width = randomBetween(60, 160);
    const x = randomBetween(0, canvas.width - width);
    const y = randomBetween(100, 300);
    const hue = (index * 47 + level * 35) % 360;
    platforms.push({
      x,
      y,
      width,
      height: 15,
      color: `hsl(${hue} 72% 58%)`,
      isGround: false
    });
  }

  const movingCount = randomBetween(2, 3);
  for (let index = 0; index < movingCount; index += 1) {
    const width = randomBetween(70, 120);
    const startX = randomBetween(50, canvas.width - width - 160);
    const endX = Math.min(canvas.width - width, startX + randomBetween(100, 220));
    const platform = {
      x: startX,
      y: randomBetween(140, 290),
      width,
      height: 15,
      color: `hsl(${180 + index * 45} 78% 62%)`,
      startX,
      endX,
      speed: 1 + level * 0.12,
      direction: 1,
      moving: true
    };
    movingPlatforms.push(platform);
    platforms.push(platform);
  }

  const coinCount = Math.min(30, 15 + (level - 1) * 3);
  for (let index = 0; index < coinCount; index += 1) {
    const radius = 10;
    const surface = platforms[randomBetween(1, platforms.length - 1)];
    let x = randomBetween(
      Math.ceil(surface.x + radius),
      Math.floor(surface.x + surface.width - radius)
    );
    let y = surface.y - radius - 2;
    let attempts = 0;
    while (coinOverlapsPlatform(x, y, radius) && attempts < 100) {
      x = randomBetween(radius, canvas.width - radius);
      y = randomBetween(50, 350);
      attempts += 1;
    }

    coins.push({ x, y, radius, collected: false });
  }

  const enemyCount = Math.min(8, 2 + level);
  const enemySpeed = Math.min(3, 1 + level * 0.35);
  for (let index = 0; index < enemyCount; index += 1) {
    enemies.push({
      x: randomBetween(80, canvas.width - 30),
      y: 360,
      width: 30,
      height: 30,
      speed: enemySpeed,
      direction: 1,
      color: '#ff6b6b',
      alive: true
    });
  }

  if (level % 3 === 0) {
    checkpoint.x = 50;
    checkpoint.y = 300;
    checkpoint.level = level;
    checkpoint.active = true;
    localStorage.setItem('pixelQuestCheckpoint', JSON.stringify(checkpoint));
  }

  exitDoor.x = canvas.width - 60;
  exitDoor.y = 340;
}

// Sincronizează valorile jocului cu HUD-ul din HTML.
function updateUI() {
  ui.lives.textContent = `❤️ ${lives}`;
  ui.score.textContent = `⭐ ${score}`;
  ui.level.textContent = `🚩 ${currentLevel}`;
}

function resetPlayer() {
  player.x = 50;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
}

// Scade o viață, redă efectul de damage și reapare la checkpoint.
function loseLife() {
  lives -= 1;
  damageFlash = 1;
  playTone(220, 0.18, 'sawtooth');
  playTone(140, 0.22, 'sawtooth', 0.1);
  if (lives <= 0) {
    updateUI();
    gameOver();
    return;
  }
  generateLevel(currentLevel);
  game.won = false;
  player.x = checkpoint.active ? checkpoint.x : 50;
  player.y = checkpoint.active ? checkpoint.y : 300;
  player.vx = 0;
  player.vy = 0;
  player.isGrounded = false;
  updateUI();
}

// Oprește jocul și lasă draw() să afișeze ecranul de game over.
function gameOver() {
  gameRunning = false;
  draw();
}

function restartLevel() {
  loseLife();
}

// Încarcă nivelul următor și resetează poziția playerului.
function nextLevel() {
  currentLevel += 1;
  generateLevel(currentLevel);
  player.x = 50;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.isGrounded = false;
  game.won = false;
  levelFlash = 1;
  playTone(523, 0.12, 'square');
  playTone(659, 0.12, 'square', 0.12);
  playTone(784, 0.2, 'square', 0.24);
  updateUI();
}

function overlaps(first, second) {
  return first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y;
}

function updateEnemies() {
  enemies.forEach((enemy) => {
    if (!enemy.alive) return;

    enemy.x += enemy.speed * enemy.direction;
    if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
      enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.x));
      enemy.direction *= -1;
    }
  });
}

function updateMovingPlatforms() {
  movingPlatforms.forEach((platform) => {
    platform.x += platform.speed * platform.direction;
    if (platform.x <= platform.startX || platform.x >= platform.endX) {
      platform.x = Math.max(platform.startX, Math.min(platform.endX, platform.x));
      platform.direction *= -1;
    }
  });
}

function spawnPowerUp() {
  const types = ['doubleJump', 'invincible', 'magnet'];
  const type = types[randomBetween(0, types.length - 1)];
  powerUps.push({
    x: randomBetween(30, canvas.width - 30),
    y: randomBetween(80, 280),
    size: 18,
    type,
    collected: false
  });
}

function activatePowerUp(powerUp) {
  powerUp.collected = true;
  powerUpState[powerUp.type] = true;
  powerUpTimer = 5 * 60;
}

function updatePowerUps() {
  if (powerUpTimer > 0) {
    powerUpTimer -= 1;
    if (powerUpTimer === 0) resetPowerUps();
  }

  if (powerUpState.magnet) {
    coins.forEach((coin) => {
      if (coin.collected) return;
      const distance = Math.hypot(player.x + player.width / 2 - coin.x, player.y + player.height / 2 - coin.y);
      if (distance < 150) {
        coin.x += (player.x + player.width / 2 - coin.x) * 0.06;
        coin.y += (player.y + player.height / 2 - coin.y) * 0.06;
      }
    });
  }
}

// Rezolvă colectarea monedelor, power-up-urile, inamicii și ușa EXIT.
function checkCollisions() {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  coins.forEach((coin) => {
    const distance = Math.hypot(playerCenterX - coin.x, playerCenterY - coin.y);
    if (!coin.collected && distance < coin.radius + 15) {
      coin.collected = true;
      score += 10;
      collectedCoins += 1;
      createParticles(coin.x, coin.y, 12, '#ffd93d');
      playTone(660, 0.1, 'sine');
      playTone(880, 0.12, 'sine', 0.08);
      if (collectedCoins % 5 === 0) spawnPowerUp();
      updateUI();
    }
  });

  enemies.forEach((enemy) => {
    if (!enemy.alive || !overlaps(player, enemy)) return;

    const enemyCenterX = enemy.x + enemy.width / 2;
    const enemyCenterY = enemy.y + enemy.height / 2;
    const distance = Math.hypot(playerCenterX - enemyCenterX, playerCenterY - enemyCenterY);
    if (powerUpState.invincible) {
      enemy.alive = false;
      score += 20;
      createParticles(enemyCenterX, enemyCenterY, 14, '#ffd93d');
      updateUI();
      return;
    }
    if (player.vy > 0 && distance < 20) {
      enemy.alive = false;
      player.vy = -8;
      score += 20;
      createParticles(enemyCenterX, enemyCenterY, 14, '#ff6b6b');
      updateUI();
    } else {
      loseLife();
    }
  });

  powerUps.forEach((powerUp) => {
    if (!powerUp.collected && overlaps(player, {
      x: powerUp.x - powerUp.size / 2,
      y: powerUp.y - powerUp.size / 2,
      width: powerUp.size,
      height: powerUp.size
    })) activatePowerUp(powerUp);
  });

  if (overlaps(player, exitDoor)) nextLevel();
}

function drawBackground() {
  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#17183d');
  sky.addColorStop(1, '#34204d');
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = 'rgba(87, 244, 255, 0.12)';
  for (let x = 30; x < canvas.width; x += 80) {
    context.fillRect(x, 55 + (x % 3) * 16, 3, 3);
  }
  context.fillStyle = '#ff4fa3';
  context.fillRect(650, 48, 4, 4);
  context.fillRect(660, 48, 4, 4);
  context.fillRect(655, 43, 4, 4);
}

// Desenează lumea, obiectele, particulele și overlay-urile jocului.
function draw() {
  drawBackground();

  platforms.forEach((platform) => {
    context.save();
    context.shadowColor = 'rgba(0, 0, 0, 0.45)';
    context.shadowBlur = 8;
    context.shadowOffsetY = 5;
    context.fillStyle = platform.color;
    context.fillRect(platform.x, platform.y, platform.width, platform.height);
    context.restore();
  });

  powerUps.forEach((powerUp) => {
    if (powerUp.collected) return;
    const colors = { doubleJump: '#57f4ff', invincible: '#ffd93d', magnet: '#ff4fa3' };
    context.save();
    context.shadowColor = colors[powerUp.type];
    context.shadowBlur = 12;
    context.fillStyle = colors[powerUp.type];
    context.fillRect(powerUp.x - 9, powerUp.y - 9, 18, 18);
    context.restore();
    context.fillStyle = '#17183d';
    context.font = 'bold 12px Courier New';
    context.textAlign = 'center';
    context.fillText(powerUp.type === 'doubleJump' ? '2' : powerUp.type === 'magnet' ? 'M' : '★', powerUp.x, powerUp.y + 4);
    context.textAlign = 'start';
  });

  coins.forEach((coin) => {
    if (coin.collected) return;
    const pulse = Math.sin(performance.now() / 180 + coin.x) * 2;
    context.save();
    context.shadowColor = '#ffd93d';
    context.shadowBlur = 14;
    context.fillStyle = '#ffd93d';
    context.beginPath();
    context.arc(coin.x, coin.y, coin.radius + pulse, 0, Math.PI * 2);
    context.closePath();
    context.fill();
    context.restore();
  });

  context.save();
  context.shadowColor = '#ffd93d';
  context.shadowBlur = 12;
  context.fillStyle = exitDoor.color;
  context.fillRect(exitDoor.x, exitDoor.y, exitDoor.width, exitDoor.height);
  context.restore();
  context.fillStyle = '#241b35';
  context.fillRect(exitDoor.x + 6, exitDoor.y + 8, 18, 3);
  context.fillRect(exitDoor.x + 7, exitDoor.y + 12, 3, 20);
  context.fillStyle = '#fff4a3';
  context.fillRect(exitDoor.x + 21, exitDoor.y + 22, 4, 4);
  context.font = 'bold 11px Trebuchet MS';
  context.fillStyle = '#ffd93d';
  context.fillText('EXIT', exitDoor.x - 1, exitDoor.y - 8);

  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    context.save();
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.shadowBlur = 7;
    context.shadowOffsetY = 4;
    context.fillStyle = enemy.color;
    context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    context.restore();

    context.fillStyle = '#ffffff';
    context.fillRect(enemy.x + 5, enemy.y + 7, 7, 7);
    context.fillRect(enemy.x + 18, enemy.y + 7, 7, 7);
    context.fillStyle = '#17183d';
    context.fillRect(enemy.x + 8, enemy.y + 10, 3, 3);
    context.fillRect(enemy.x + 21, enemy.y + 10, 3, 3);
  });

  player.draw();
  drawParticles();

  if (checkpoint.active) {
    context.fillStyle = '#ffd93d';
    context.font = '22px serif';
    context.fillText('★', checkpoint.x, checkpoint.y - 12);
  }

  if (powerUpTimer > 0) {
    context.fillStyle = '#ffffff';
    context.font = 'bold 14px Courier New';
    context.fillText(`POWER-UP ${Math.ceil(powerUpTimer / 60)}s`, 12, 24);
  }

  if (levelFlash > 0) {
    context.fillStyle = `rgba(255, 255, 255, ${levelFlash * 0.65})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (damageFlash > 0) {
    context.fillStyle = `rgba(255, 30, 45, ${damageFlash * 0.35})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (!gameRunning) {
    context.fillStyle = 'rgba(9, 11, 24, 0.78)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textAlign = 'center';
    context.fillStyle = '#ff3b55';
    context.font = 'bold 48px Courier New';
    context.fillText('GAME OVER', canvas.width / 2, 170);
    context.fillStyle = '#ffffff';
    context.font = 'bold 20px Courier New';
    context.fillText(`Scor final: ${score}`, canvas.width / 2, 215);
    context.font = '16px Courier New';
    context.fillText('Apasă F5 pentru a reîncepe', canvas.width / 2, 255);
    context.textAlign = 'start';
  }
}

// Rulează un cadru complet doar cât timp jocul este activ.
function gameLoop() {
  if (!gameRunning) {
    draw();
    return;
  }
  updateMovingPlatforms();
  player.update();
  updateEnemies();
  updatePowerUps();
  updateParticles();
  checkCollisions();
  if (player.y > canvas.height + 20) loseLife();
  levelFlash = Math.max(0, levelFlash - 0.035);
  damageFlash = Math.max(0, damageFlash - 0.06);
  draw();
  if (gameRunning) requestAnimationFrame(gameLoop);
}

// Event listener pentru tastatură și activarea audio la prima interacțiune.
window.addEventListener('keydown', (event) => {
  ensureAudio();
  if (event.key === 'ArrowLeft') keys.left = true;
  if (event.key === 'ArrowRight') keys.right = true;
  if ((event.key === 'ArrowUp' || event.key === ' ') && !event.repeat) {
    keys.up = true;
    keys.jumpRequested = true;
  }
  if (['ArrowUp', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft') keys.left = false;
  if (event.key === 'ArrowRight') keys.right = false;
  if (event.key === 'ArrowUp' || event.key === ' ') keys.up = false;
});

canvas.addEventListener('click', () => {
  ensureAudio();
  if (gameRunning && (player.isGrounded || (powerUpState.doubleJump && player.jumpsRemaining > 0))) {
    keys.jumpRequested = true;
  }
});

const savedCheckpoint = localStorage.getItem('pixelQuestCheckpoint');
if (savedCheckpoint) {
  Object.assign(checkpoint, JSON.parse(savedCheckpoint));
}

generateLevel(currentLevel);
updateUI();
gameLoop();