/**
 * MenuManager - 
 * Manages player settings, volume, and game state transitions between menu and gameplay.
 */
class MenuManager {

  constructor(gameManager) {
    this.gameManager = gameManager;
    this.playerAmount = 2; // Default to 2 players
    this.volumeLevel = 0.5; // 0 to 1, default to 50%
    this.isGameRunning = false;
    this.menuState = 'main'; // 'main', 'settings', 'playing'
  }

  /**
   * Set the number of players
   * @param {number} amount - Number of players (typically 2-4)
   * @returns {boolean} - Success status
   */
  setPlayerAmount(amount) {
    if (amount < 1 || amount > 4) {
      console.warn(`Invalid player amount: ${amount}. Must be between 1 and 4.`);
      return false;
    }
    this.playerAmount = amount;
    console.log(`Player amount set to: ${this.playerAmount}`);
    return true;
  }

  /**
   * Get the current player amount
   * @returns {number} - Current number of players
   */
  getPlayerAmount() {
    return this.playerAmount;
  }

  /**
   * Change volume settings
   * @param {number} volume - Volume level (0 to 1)
   * @returns {boolean} - Success status
   */
  changeVolume(volume) {
    if (volume < 0 || volume > 1) {
      console.warn(`Invalid volume level: ${volume}. Must be between 0 and 1.`);
      return false;
    }
    this.volumeLevel = volume;
    console.log(`Volume set to: ${(this.volumeLevel * 100).toFixed(0)}%`);
    return true;
  }

  /**
   * Get the current volume level
   * @returns {number} - Current volume (0 to 1)
   */
  getVolume() {
    return this.volumeLevel;
  }

  /**
   * Increase volume by 10%
   * @returns {number} - New volume level
   */
  increaseVolume() {
    this.changeVolume(Math.min(this.volumeLevel + 0.1, 1));
    return this.volumeLevel;
  }

  /**
   * Decrease volume by 10%
   * @returns {number} - New volume level
   */
  decreaseVolume() {
    this.changeVolume(Math.max(this.volumeLevel - 0.1, 0));
    return this.volumeLevel;
  }

  /**
   * Start the game with current settings
   * @returns {boolean} - Success status
   */
  startGame() {
    if (this.isGameRunning) {
      console.warn('Game is already running');
      return false;
    }
    
    console.log(`Starting game with ${this.playerAmount} player(s)...`);
    this.isGameRunning = true;
    this.menuState = 'playing';
    
    // Initialize game with current settings
    if (this.gameManager && this.gameManager.initializeGame) {
      this.gameManager.initializeGame(this.playerAmount);
    }
    
    return true;
  }

  /**
   * Leave/quit the game
   * @returns {boolean} - Success status
   */
  leaveGame() {
    if (!this.isGameRunning) {
      console.warn('Game is not currently running');
      return false;
    }
    
    console.log('Leaving game...');
    this.isGameRunning = false;
    this.menuState = 'main';
    
    // Reset game state
    if (this.gameManager && this.gameManager.resetGame) {
      this.gameManager.resetGame();
    }
    
    return true;
  }

  /**
   * Get current menu state
   * @returns {string} - Current menu state
   */
  getMenuState() {
    return this.menuState;
  }

  /**
   * Get all current settings
   * @returns {object} - Current menu settings
   */
  getSettings() {
    return {
      playerAmount: this.playerAmount,
      volume: this.volumeLevel,
      isGameRunning: this.isGameRunning,
      menuState: this.menuState
    };
  }
}

export default MenuManager;
