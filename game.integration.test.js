const {
  addCoinScore,
  generateLevelData,
  resolveEnemyCollision,
  updateUI,
  loseLife,
  saveCheckpoint
} = require('./gameLogic');

describe('Pixel Quest - teste de integrare', () => {
  test('flux complet: start, moneda, inamic si trecere de nivel', () => {
    const level = generateLevelData(1, 800, () => 0.5);
    const state = { lives: 3, score: 0, currentLevel: 1, gameRunning: true };
    state.score = addCoinScore(state.score);
    const player = { x: 100, y: 70, width: 30, height: 40, vy: 5 };
    const enemy = { x: 100, y: 100, width: 30, height: 30, alive: true };
    const result = resolveEnemyCollision(player, enemy);
    state.score += result.score;
    state.currentLevel += 1;

    expect(level.platforms.length).toBeGreaterThan(1);
    expect(state).toEqual({ lives: 3, score: 30, currentLevel: 2, gameRunning: true });
    expect(result.type).toBe('stomp');
    expect(enemy.alive).toBe(false);
  });

  test('actualizeaza corect UI-ul', () => {
    const elements = { lives: {}, score: {}, level: {} };
    updateUI(elements, { lives: 2, score: 130, currentLevel: 3 });
    expect(elements.lives.textContent).toBe('❤️ 2');
    expect(elements.score.textContent).toBe('⭐ 130');
    expect(elements.level.textContent).toBe('🚩 3');
  });

  test('game over dupa pierderea tuturor vietilor', () => {
    let state = { lives: 2, score: 90, gameRunning: true };
    state = loseLife(state);
    expect(state.gameOver).toBe(false);
    state = loseLife(state);
    expect(state).toMatchObject({ lives: 0, gameRunning: false, gameOver: true });
  });

  test('checkpoint-ul se salveaza la fiecare trei niveluri', () => {
    const storage = { data: {}, setItem(key, value) { this.data[key] = value; } };
    expect(saveCheckpoint(2, { x: 50, y: 300 }, storage)).toBeNull();
    const checkpoint = saveCheckpoint(3, { x: 220, y: 260 }, storage);
    expect(checkpoint).toMatchObject({ level: 3, x: 220, y: 260, active: true });
    expect(JSON.parse(storage.data.pixelQuestCheckpoint)).toEqual(checkpoint);
  });
});
