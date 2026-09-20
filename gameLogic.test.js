const {
  addCoinScore,
  canPlayerJump,
  generateLevelData,
  resolveEnemyCollision,
  updateLevelFromScore
} = require('./gameLogic');

describe('Pixel Quest - teste unitare', () => {
  test('calculeaza scorul dupa colectarea unei monede', () => {
    expect(addCoinScore(40)).toBe(50);
    expect(addCoinScore(40, 25)).toBe(65);
  });

  test('determina daca playerul poate sari', () => {
    expect(canPlayerJump({ isGrounded: true, jumpsRemaining: 0 })).toBe(true);
    expect(canPlayerJump({ isGrounded: false, jumpsRemaining: 1 }, true)).toBe(true);
    expect(canPlayerJump({ isGrounded: false, jumpsRemaining: 0 }, true)).toBe(false);
    expect(canPlayerJump({ isGrounded: false, jumpsRemaining: 1 }, false)).toBe(false);
  });

  test('genereaza intre 6 si 12 platforme, inclusiv pamantul', () => {
    const level = generateLevelData(1, 800, () => 0.5);
    expect(level.platforms.length).toBeGreaterThanOrEqual(6);
    expect(level.platforms.length).toBeLessThanOrEqual(13);
    expect(level.platforms[0]).toMatchObject({ x: 0, y: 380, width: 800, isGround: true });
  });

  test('elimina inamicul cand playerul cade pe el si acorda puncte', () => {
    const player = { x: 100, y: 70, width: 30, height: 40, vy: 5 };
    const enemy = { x: 100, y: 100, width: 30, height: 30, alive: true };
    expect(resolveEnemyCollision(player, enemy)).toEqual({ type: 'stomp', score: 20 });
    expect(enemy.alive).toBe(false);
    expect(player.vy).toBe(-8);
  });

  test('detecteaza lovirea laterala si invincibilitatea', () => {
    const player = { x: 100, y: 100, width: 30, height: 40, vy: 0 };
    const enemy = { x: 110, y: 110, width: 30, height: 30, alive: true };
    expect(resolveEnemyCollision(player, enemy).type).toBe('damage');
    expect(resolveEnemyCollision(player, enemy, true).type).toBe('none');
  });

  test('actualizeaza nivelul in functie de scor', () => {
    expect(updateLevelFromScore(0, 1)).toBe(1);
    expect(updateLevelFromScore(100, 1)).toBe(2);
    expect(updateLevelFromScore(350, 2)).toBe(4);
    expect(updateLevelFromScore(50, 3)).toBe(3);
  });
});
