// Functii pure pentru regulile Pixel Quest, usor de testat cu Jest.

/** Calculeaza scorul dupa colectarea unei monede. */
function addCoinScore(score, points = 10) {
  return score + points;
}

/** Stabileste daca playerul poate sari de pe sol sau prin double jump. */
function canPlayerJump(player, doubleJump = false) {
  return player.isGrounded || (doubleJump && player.jumpsRemaining > 0);
}

/** Genereaza structura unui nivel fara dependente de canvas sau DOM. */
function generateLevelData(level, width = 800, random = Math.random) {
  const randomBetween = (min, max) => Math.floor(random() * (max - min + 1)) + min;
  const platformCount = Math.min(12, 5 + level);
  const platforms = [{ x: 0, y: 380, width, height: 20, isGround: true }];

  for (let index = 0; index < platformCount; index += 1) {
    const platformWidth = randomBetween(60, 160);
    platforms.push({
      x: randomBetween(0, width - platformWidth),
      y: randomBetween(100, 300),
      width: platformWidth,
      height: 15,
      isGround: false
    });
  }

  const enemyCount = Math.min(8, 2 + level);
  const enemies = Array.from({ length: enemyCount }, () => ({ alive: true, width: 30, height: 30 }));
  const coinCount = Math.min(30, 15 + (level - 1) * 3);
  const coins = Array.from({ length: coinCount }, () => ({ collected: false, radius: 10 }));
  return { platforms, enemies, coins };
}

/** Rezolva coliziunea player-inamic: stomp, invincibilitate sau damage. */
function resolveEnemyCollision(player, enemy, invincible = false) {
  if (!enemy.alive || invincible) return { type: 'none', score: 0 };
  
  const overlaps = player.x < enemy.x + enemy.width &&
    player.x + player.width > enemy.x &&
    player.y < enemy.y + enemy.height &&
    player.y + player.height > enemy.y;
  if (!overlaps) return { type: 'none', score: 0 };

  const playerBottom = player.y + player.height;
  const enemyTop = enemy.y;
  
  // Player cade de sus pe inamic
  if (player.vy > 0 && playerBottom - player.vy <= enemyTop + 10) {
    enemy.alive = false;
    player.vy = -8;
    return { type: 'stomp', score: 20 };
  }
  
  return { type: 'damage', score: 0 };
}

/** Calculeaza nivelul pe baza scorului, cu prag configurabil. */
function updateLevelFromScore(score, currentLevel, threshold = 100) {
  return Math.max(currentLevel, Math.floor(score / threshold) + 1);
}

/** Actualizeaza HUD-ul primit ca obiect de elemente DOM. */
function updateUI(elements, state) {
  elements.lives.textContent = `❤️ ${state.lives}`;
  elements.score.textContent = `⭐ ${state.score}`;
  elements.level.textContent = `🚩 ${state.currentLevel}`;
}

/** Simuleaza fluxul de game over pentru testare si UI. */
function loseLife(state) {
  const next = { ...state, lives: state.lives - 1 };
  return {
    ...next,
    gameRunning: next.lives > 0,
    gameOver: next.lives <= 0
  };
}

/** Salveaza si restaureaza un checkpoint la fiecare al treilea nivel. */
function saveCheckpoint(level, position, storage) {
  if (level % 3 !== 0) return null;
  const checkpoint = { level, ...position, active: true };
  storage.setItem('pixelQuestCheckpoint', JSON.stringify(checkpoint));
  return checkpoint;
}

module.exports = {
  addCoinScore,
  canPlayerJump,
  generateLevelData,
  resolveEnemyCollision,
  updateLevelFromScore,
  updateUI,
  loseLife,
  saveCheckpoint
};
