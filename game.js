// Portrait Side-Scroller (Arcade Style)
// Framework: Phaser 3 (Arcade Physics)
// Runs with generated placeholder textures so it's playable immediately.
// Replace placeholders with your real assets (see README for filenames).
// ---------------------------------------------------------------

const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;
const WORLD_SCROLL_SPEED = 280; // px/sec (platforms/background move left)
const SPAWN_EVERY_MS = 1100;    // obstacle spawn cadence
const GRAVITY_Y = 1800;
const JUMP_VELOCITY = -800;
const DOUBLE_JUMP_VELOCITY = -700;

const CONFIG = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY_Y },
      debug: false
    }
  },
  backgroundColor: '#0b0f14',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, PlayScene, UIScene]
};

// --------------------------------------
// BootScene: generate placeholder assets
// --------------------------------------
function BootScene() {}
BootScene.prototype = {
  preload() {},
  create() {
    // Generate textures programmatically so game runs without external assets
    const g = this.add.graphics();

    // Background layer textures (tileable stripes / stars)
    g.clear();
    g.fillStyle(0x0f1720, 1); g.fillRect(0, 0, 512, 512);
    g.lineStyle(3, 0x1f2a38, 0.5);
    for (let y=0; y<512; y+=32) { g.lineBetween(0, y, 512, y); }
    g.generateTexture('bg-far', 512, 512);

    g.clear();
    g.fillStyle(0x101926, 1); g.fillRect(0, 0, 512, 512);
    g.lineStyle(6, 0x2b3b51, 0.6);
    for (let y=0; y<512; y+=48) { g.lineBetween(0, y, 512, y); }
    g.generateTexture('bg-mid', 512, 512);

    g.clear();
    g.fillStyle(0x0f141a, 1); g.fillRect(0, 0, 512, 512);
    for (let i=0; i<200; i++) {
      const x = Math.random()*512, y = Math.random()*512;
      const r = Math.random()*2+0.5;
      g.fillStyle(0x91d1ff, Math.random()*0.7+0.3);
      g.fillCircle(x,y,r);
    }
    g.generateTexture('bg-near', 512, 512);

    // Ground tile
    g.clear();
    g.fillStyle(0x21415a, 1); g.fillRect(0, 0, 512, 64);
    g.lineStyle(4, 0x102536, 0.9);
    for (let x=0; x<512; x+=32) { g.lineBetween(x, 0, x, 64); }
    g.generateTexture('ground', 512, 64);

    // Player (simple rounded rectangle)
    g.clear();
    g.fillStyle(0x6cf1a5, 1); g.fillRoundedRect(0, 0, 84, 108, 16);
    g.lineStyle(6, 0x144f37, 1); g.strokeRoundedRect(0,0,84,108,16);
    g.generateTexture('player', 84, 108);

    // Obstacle (spike)
    g.clear();
    g.fillStyle(0xff6677, 1);
    const w = 96, h = 96;
    g.beginPath();
    g.moveTo(0,h); g.lineTo(w*0.5,0); g.lineTo(w,h); g.closePath(); g.fillPath();
    g.lineStyle(6, 0x7a1f29, 1); g.strokePath();
    g.generateTexture('spike', w, h);

    // Coin
    g.clear();
    g.fillStyle(0xffe083, 1); g.fillCircle(30, 30, 30);
    g.lineStyle(6, 0xa1782f, 1); g.strokeCircle(30, 30, 30);
    g.generateTexture('coin', 60, 60);

    // Heart (UI life icon)
    g.clear();
    g.fillStyle(0xff8a9a, 1);
    g.beginPath();
    g.moveTo(30, 55);
    g.bezierCurveTo(30, 35, 0, 30, 0, 10);
    g.bezierCurveTo(0, -10, 30, 0, 30, 15);
    g.bezierCurveTo(30, 0, 60, -10, 60, 10);
    g.bezierCurveTo(60, 30, 30, 35, 30, 55);
    g.fillPath();
    g.lineStyle(6, 0x7a2f3a, 1); g.strokePath();
    g.generateTexture('heart', 60, 60);

    this.scene.start('PlayScene');
  }
};

// --------------------------------------
// PlayScene: core game loop
// --------------------------------------
function PlayScene() {
  this.bgFar = null;
  this.bgMid = null;
  this.bgNear = null;
  this.groundGroup = null;
  this.player = null;
  this.canDouble = true;
  this.obstacles = null;
  this.coins = null;
  this.score = 0;
  this.lives = 3;
  this.nextSpawnAt = 0;
}

PlayScene.prototype = {
  preload() {},
  create() {
    // Parallax tile sprites
    this.bgFar  = this.add.tileSprite(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 'bg-far').setScrollFactor(0);
    this.bgMid  = this.add.tileSprite(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 'bg-mid').setScrollFactor(0);
    this.bgNear = this.add.tileSprite(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 'bg-near').setScrollFactor(0);

    // Ground (two tiles scrolling)
    this.groundGroup = this.physics.add.staticGroup();
    const groundY = GAME_HEIGHT * 0.78;
    const groundTileW = 512;
    for (let i=0; i<3; i++) {
      const x = i*groundTileW;
      const ground = this.add.image(x, groundY, 'ground').setOrigin(0,0).setScale(1.4, 1);
      this.physics.add.existing(ground, true);
      ground.body.updateFromGameObject();
      ground.setData('isGround', true);
      this.groundGroup.add(ground);
    }

    // Player
    this.player = this.physics.add.sprite(140, groundY-90, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(64, 96).setOffset(10, 6);
    this.player.setDepth(10);

    // Groups
    this.obstacles = this.physics.add.group();
    this.coins = this.physics.add.group();

    // Colliders
    this.physics.add.collider(this.player, this.groundGroup);
    this.physics.add.overlap(this.player, this.obstacles, this.onHitObstacle, null, this);
    this.physics.add.overlap(this.player, this.coins, this.onCollectCoin, null, this);

    // Input
    this.input.on('pointerdown', this.handleJump, this);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // UI
    this.events.on('add-score', (n) => {
      this.score += n;
      this.scene.get('UIScene').events.emit('score-changed', this.score, this.lives);
    });
    this.scene.launch('UIScene', { score: this.score, lives: this.lives });

    // Start
    this.time.addEvent({ delay: 1000, callback: () => this.events.emit('add-score', 0) });
  },

  update(time, delta) {
    const dt = delta / 1000;
    // Parallax scroll
    this.bgFar.tilePositionX += WORLD_SCROLL_SPEED * 0.12 * dt;
    this.bgMid.tilePositionX += WORLD_SCROLL_SPEED * 0.25 * dt;
    this.bgNear.tilePositionX += WORLD_SCROLL_SPEED * 0.5  * dt;

    // Move ground tiles left, loop
    this.groundGroup.children.iterate(child => {
      child.x -= WORLD_SCROLL_SPEED * dt;
      if (child.x + child.displayWidth < 0) {
        // send to the right
        const maxRight = this.maxRightGroundX();
        child.x = maxRight + 0.1;
      }
    });

    // Spawn obstacles/coins
    if (time > this.nextSpawnAt) {
      this.spawnChunk();
      this.nextSpawnAt = time + SPAWN_EVERY_MS;
    }

    // Player input for jump
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || (this.cursors.up && Phaser.Input.Keyboard.JustDown(this.cursors.up))) {
      this.handleJump();
    }

    // Award passive score over time
    this.events.emit('add-score', Math.floor(10*dt));
  },

  maxRightGroundX() {
    let maxX = -Infinity;
    this.groundGroup.children.iterate(child => { if (child.x > maxX) maxX = child.x; });
    return maxX + 512*1.4 - 1;
  },

  handleJump() {
    if (this.player.body.touching.down) {
      this.player.setVelocityY(JUMP_VELOCITY);
      this.canDouble = true;
    } else if (this.canDouble) {
      this.player.setVelocityY(DOUBLE_JUMP_VELOCITY);
      this.canDouble = false;
    }
  },

  spawnChunk() {
    const groundY = GAME_HEIGHT * 0.78;
    const xStart = GAME_WIDTH + 80;

    // Randomly choose pattern
    const pattern = Phaser.Math.Between(0, 2);
    if (pattern === 0) {
      // Single spike + coin arc
      const spike = this.obstacles.create(xStart, groundY-48, 'spike');
      spike.setVelocityX(-WORLD_SCROLL_SPEED);
      spike.body.setAllowGravity(false);
      spike.setImmovable(true);

      for (let i=0;i<5;i++) {
        const coin = this.coins.create(xStart + 80 + i*60, groundY-180 - i*12, 'coin');
        coin.setVelocityX(-WORLD_SCROLL_SPEED);
        coin.body.setAllowGravity(false);
      }
    } else if (pattern === 1) {
      // Small floating platform: simulate with ground tile segment
      const plat = this.physics.add.image(xStart, groundY-220, 'ground').setScale(0.6, 1);
      plat.body.updateFromGameObject();
      plat.body.setAllowGravity(false);
      plat.setVelocityX(-WORLD_SCROLL_SPEED*1.1);
      plat.setImmovable(true);
      this.groundGroup.add(plat);

      // A few coins above platform
      for (let i=0;i<4;i++) {
        const coin = this.coins.create(xStart - 30 + i*50, groundY-300, 'coin');
        coin.setVelocityX(-WORLD_SCROLL_SPEED*1.1);
        coin.body.setAllowGravity(false);
      }
    } else {
      // Double spikes cluster
      for (let i=0;i<2;i++) {
        const spike = this.obstacles.create(xStart + i*110, groundY-48, 'spike');
        spike.setVelocityX(-WORLD_SCROLL_SPEED*1.05);
        spike.body.setAllowGravity(false);
        spike.setImmovable(true);
      }
    }

    // Cleanup off-screen
    this.obstacles.children.iterate(child => { if (child.x < -200) child.destroy(); });
    this.coins.children.iterate(child => { if (child.x < -200) child.destroy(); });
  },

  onHitObstacle(player, obstacle) {
    obstacle.destroy();
    this.lives = Math.max(0, this.lives - 1);
    this.cameras.main.shake(120, 0.01);
    this.scene.get('UIScene').events.emit('score-changed', this.score, this.lives);
    if (this.lives <= 0) {
      this.gameOver();
    }
  },

  onCollectCoin(player, coin) {
    coin.destroy();
    this.events.emit('add-score', 50);
    this.cameras.main.flash(60, 255, 210, 90, false);
  },

  gameOver() {
    this.physics.pause();
    const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setDepth(999);
    const txt = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 40, 'Game Over', {
      fontFamily: 'monospace', fontSize: '64px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(999);
    const sub = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 20, 'Tap to retry', {
      fontFamily: 'monospace', fontSize: '28px', color: '#cccccc'
    }).setOrigin(0.5).setDepth(999);
    this.input.once('pointerdown', () => this.scene.restart());
  }
};

// --------------------------------------
// UIScene: HUD for score & lives
// --------------------------------------
function UIScene() {
  this.scoreText = null;
  this.hearts = [];
}
UIScene.prototype = {
  init(data) { this.score = data.score ?? 0; this.lives = data.lives ?? 3; },
  create() {
    this.scoreText = this.add.text(24, 24, 'Score 0', { fontFamily: 'monospace', fontSize: '36px', color: '#bde1ff' }).setScrollFactor(0).setDepth(1000);
    for (let i=0;i<3;i++) {
      const heart = this.add.image(GAME_WIDTH - 24 - i*40, 36, 'heart').setOrigin(1,0).setScale(0.6).setDepth(1000);
      this.hearts.push(heart);
    }
    this.events.on('score-changed', (score, lives) => {
      this.updateHUD(score, lives);
    });
  },
  updateHUD(score, lives) {
    this.scoreText.setText('Score ' + score);
    for (let i=0;i<this.hearts.length;i++) {
      this.hearts[i].setAlpha(i < lives ? 1 : 0.2);
    }
  }
};

// Start game
new Phaser.Game(CONFIG);
