// Mini Guy: Zombie Run - Core Game Engine (Phaser.js Version)
// Handles game instantiation, BootScene texture generation, PlayScene update loops, and collisions.

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Initialize procedurally drawn canvases
        Sprites.init();

        // 1. Register Player Textures
        this.textures.addCanvas('player_idle', Sprites.player.idle);
        Sprites.player.run.forEach((frameCanvas, index) => {
            this.textures.addCanvas(`player_run_${index}`, frameCanvas);
        });
        this.textures.addCanvas('player_jump', Sprites.player.jump);
        this.textures.addCanvas('player_shoot', Sprites.player.shoot);
        this.textures.addCanvas('player_hurt', Sprites.player.hurt);
        this.textures.addCanvas('player_dead', Sprites.player.dead);

        // 2. Register Zombie normal Textures
        Sprites.zombie.walk.forEach((frameCanvas, index) => {
            this.textures.addCanvas(`zombie_walk_${index}`, frameCanvas);
        });
        this.textures.addCanvas('zombie_hurt', Sprites.zombie.hurt);
        this.textures.addCanvas('zombie_dead', Sprites.zombie.dead);





        // 6. Register Terrain/Obstacles/Collectibles
        this.textures.addCanvas('grass', Sprites.grass);
        this.textures.addCanvas('dirt', Sprites.dirt);
        if (Sprites.bush) this.textures.addCanvas('bush', Sprites.bush);
        if (Sprites.tree) this.textures.addCanvas('tree', Sprites.tree);
        if (Sprites.cloud) this.textures.addCanvas('cloud', Sprites.cloud);
        if (Sprites.crate) this.textures.addCanvas('crate', Sprites.crate);
        if (Sprites.spikes) this.textures.addCanvas('spikes', Sprites.spikes);
        if (Sprites.health) this.textures.addCanvas('health', Sprites.health);
        this.textures.addCanvas('ammo', Sprites.ammo);



        // --- Animations Creation ---
        this.anims.create({
            key: 'player_idle',
            frames: [{ key: 'player_idle' }],
            frameRate: 1
        });
        this.anims.create({
            key: 'player_run',
            frames: [
                { key: 'player_run_0' },
                { key: 'player_run_1' }
            ],
            frameRate: 4,
            repeat: -1
        });
        this.anims.create({
            key: 'player_jump',
            frames: [{ key: 'player_jump' }],
            frameRate: 1
        });
        this.anims.create({
            key: 'player_shoot',
            frames: [{ key: 'player_shoot' }],
            frameRate: 1
        });
        this.anims.create({
            key: 'player_hurt',
            frames: [{ key: 'player_hurt' }],
            frameRate: 1
        });
        this.anims.create({
            key: 'player_dead',
            frames: [{ key: 'player_dead' }],
            frameRate: 1
        });

        // Zombie Normal animations
        this.anims.create({
            key: 'zombie_walk',
            frames: [
                { key: 'zombie_walk_0' },
                { key: 'zombie_walk_1' }
            ],
            frameRate: 6,
            repeat: -1
        });




        // (Sky gradient canvas generation removed for performance)

        // Transition immediately to the play scene
        this.scene.start('PlayScene');
    }
}

class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');
        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;

        // State trackers
        this.score = 0;
        this.ammo = 15;
        this.health = 3;
        this.zombiesKilled = 0;
        this.scrollSpeed = 30;
        this.difficultyTimer = 0;



        // Mobile flags
        this.mobileMoveLeft = false;
        this.mobileMoveRight = false;
        this.mobileShoot = false;
    }

    create(data) {
        // Set solid black background color directly on the camera
        this.cameras.main.setBackgroundColor('#000000');

        // Setup Arcade Physics Groups
        this.platforms = this.physics.add.staticGroup();
        this.dirtGroup = this.add.group();
        this.spikes = this.physics.add.staticGroup();
        this.zombies = this.physics.add.group();
        this.bullets = this.physics.add.group({ runChildUpdate: true });

        // Core weapon and procedural world systems
        this.weaponSystem = new WeaponSystem(this);
        this.worldGenerator = new WorldGenerator(this);

        // Setup controls keys
        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            W: Phaser.Input.Keyboard.KeyCodes.W,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            F: Phaser.Input.Keyboard.KeyCodes.F,
            P: Phaser.Input.Keyboard.KeyCodes.P
        });

        // Click to shoot binding
    this.input.on('pointerdown', (pointer) => {

    // Ignore left side of screen
    this.input.off('pointerdown');

this.input.on('pointerdown', (pointer) => {
    console.log('tap detected');

    if (!this.isPlaying) return;
    if (this.isPaused) return;
    if (this.isGameOver) return;
    if (!this.player) return;

    this.player.shoot(false);
});

        // Keep system cursor and setup graphics
        this.input.setDefaultCursor('default');
        this.uiGraphics = this.add.graphics();
        this.uiGraphics.setScrollFactor(0);
        this.uiGraphics.setDepth(100);

        // Keyboard pause handlers
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.isPlaying && !this.isGameOver) {
                this.togglePause();
            }
        });
        this.input.keyboard.on('keydown-P', () => {
            if (this.isPlaying && !this.isGameOver) {
                this.togglePause();
            }
        });

        // Connect global UI manager
        this.uiBridge = gameUI;
        gameUI.setScene(this);

        if (data && data.autoStart) {
            gameUI.hideStartScreen();
            this.startGame();
        } else {
            gameUI.showStartScreen();
        }
    }

    startGame() {
        this.score = 0;
        this.ammo = 15;
        this.health = 3;
        this.zombiesKilled = 0;
        this.scrollSpeed = 30;
        this.difficultyTimer = 0;


        // Reset input flags
        this.mobileMoveLeft = false;
        this.mobileMoveRight = false;
        this.mobileShoot = false;

        // Wipe clean previous items
        this.platforms.clear(true, true);
        if (this.dirtGroup) {
            this.dirtGroup.clear(true, true);
        }
        this.spikes.clear(true, true);
        this.zombies.clear(true, true);
        this.bullets.clear(true, true);

        // Instantiate player sprite
        this.player = new Player(this, 100, 200);

        // Register collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.zombies, this.platforms, this.handleZombiePlatformCollide, null, this);

        this.physics.add.overlap(this.bullets, this.zombies, this.handleBulletZombieOverlap, null, this);
        this.physics.add.overlap(this.bullets, this.platforms, this.handleBulletPlatformOverlap, null, this);

        this.physics.add.overlap(this.player, this.zombies, this.handlePlayerZombieOverlap, null, this);
        this.physics.add.overlap(this.player, this.spikes, this.handlePlayerSpikesOverlap, null, this);
        this.physics.add.overlap(this.zombies, this.spikes, this.handleZombieSpikesOverlap, null, this);

        // Reset generator and build initial environment
        this.worldGenerator.init();
        for (let i = 0; i < 4; i++) {
            this.worldGenerator.generateNextChunk();
        }

        // Viewport camera and bounds setup
        this.cameras.main.scrollX = 0;
        this.cameras.main.scrollY = 0;
        this.cameras.main.setBounds(0, 0, 99999999, 600);
        this.physics.world.setBounds(0, 0, 99999999, 450, true, false, true, false);

        gameUI.updateHUD();
        gameUI.hidePauseScreen();
        gameUI.hideGameOverScreen();

        this.isPlaying = true;
        this.isPaused = false;
        this.isGameOver = false;

        // BGM looping sequencer start
        gameAudio.stopBGM();
        gameAudio.startBGM();

        // Fade in
        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    restartGame() {
        this.scene.restart({ autoStart: true });
    }

    togglePause() {
        if (!this.isPlaying || this.isGameOver) return;

        if (this.isPaused) {
            this.isPaused = false;
            this.physics.resume();
            this.anims.resumeAll();
            gameUI.hidePauseScreen();
            gameAudio.resume();
        } else {
            this.isPaused = true;
            this.physics.pause();
            this.anims.pauseAll();
            gameUI.showPauseScreen();
        }
    }

    endGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isPlaying = false;

        this.physics.pause();
        this.player.play('player_dead');
        this.player.setVelocity(0, 0);
        this.player.body.setAllowGravity(false); // Float on ground

        // Stop music and play game over
        gameAudio.stopBGM();
        gameAudio.playGameOver();

        // Crunch camera impact
        this.cameras.main.shake(300, 0.02);
        this.cameras.main.flash(200, 255, 0, 0); // red blood splatter flash

        // Display results DOM after shake
        this.time.delayedCall(300, () => {
            const finalScore = Math.floor(this.score);
            const currentHighScore = parseInt(localStorage.getItem('miniguy_highscore') || 0);
            if (finalScore > currentHighScore) {
                localStorage.setItem('miniguy_highscore', finalScore);
            }

            gameUI.showGameOverScreen(
                Math.floor(this.cameras.main.scrollX / 32),
                this.zombiesKilled,
                finalScore
            );
        });
    }

    update(time, delta) {
        // Custom crosshair disabled, clear overlay graphics
        this.uiGraphics.clear();

        if (!this.isPlaying || this.isPaused || this.isGameOver) {
            return;
        }

        const dt = delta / 1000;

        // Auto-scroll difficulty acceleration
        this.difficultyTimer += dt;
        if (this.difficultyTimer > 5) {
            this.scrollSpeed = Math.min(this.scrollSpeed + 1, 60); // Cap auto scroll speed
            this.difficultyTimer = 0;
        }

        // Advance viewport scroll X
        const oldScrollX = this.cameras.main.scrollX;
        this.cameras.main.scrollX += this.scrollSpeed * dt;

        // Smoothly follow the player horizontally (keeping player around left-middle of screen)
        const targetScrollX = this.player.x - 250;
        if (this.cameras.main.scrollX < targetScrollX) {
            this.cameras.main.scrollX = targetScrollX;
        }

        // Add to score based on actual distance scrolled
        const scrolledDistance = this.cameras.main.scrollX - oldScrollX;
        this.score += scrolledDistance * 0.1;
        gameUI.updateHUD();

        const camX = this.cameras.main.scrollX;
        this.physics.world.setBounds(camX, 0, 99999999, 450, true, false, true, false);

        // (Parallax backgrounds and cloud updates removed for performance)

        // Expand terrain chunks
        this.worldGenerator.update(camX);

        // Update player body, keyboard triggers
        if (this.player && this.player.active) {
            this.player.update(time, delta);

            // Void pits check (instant death)
            if (this.player.y > 450) {
                this.health = 0;
                gameUI.updateHUD();
                
                this.isGameOver = true;
                this.isPlaying = false;
                
                // Stop player horizontal movement but let them fall
                this.player.setVelocity(0, Math.max(200, this.player.body.velocity.y));
                this.player.play('player_dead', true);
                
                // Let camera follow the fall briefly by panning down
                this.tweens.add({
                    targets: this.cameras.main,
                    scrollY: 100,
                    duration: 300,
                    ease: 'Cubic.easeOut'
                });
                
                // Fade out
                this.cameras.main.fadeOut(300, 0, 0, 0);
                
                // Stop music and play game over SFX
                gameAudio.stopBGM();
                gameAudio.playPlayerHit();
                
                // Trigger game over UI after fall animation
                this.time.delayedCall(300, () => {
                    this.physics.pause();
                    gameAudio.playGameOver();
                    
                    const finalScore = Math.floor(this.score);
                    const currentHighScore = parseInt(localStorage.getItem('miniguy_highscore') || 0);
                    if (finalScore > currentHighScore) {
                        localStorage.setItem('miniguy_highscore', finalScore);
                    }
                    
                    gameUI.showGameOverScreen(
                        Math.floor(this.cameras.main.scrollX / 32),
                        this.zombiesKilled,
                        finalScore
                    );
                });
            }

            // Keyboard Jump triggers
            if (Phaser.Input.Keyboard.JustDown(this.keys.space) || Phaser.Input.Keyboard.JustDown(this.keys.up)) {
                this.player.jump();
            }

            // Continuous Firing loops (holding down F, mouse clicks or mobile shoot triggers)
            if (this.keys.F.isDown || this.mobileShoot || this.input.activePointer.isDown) {
                this.player.shoot(false); // Shoot straight forward
            }
        }



        // Tick bullet behaviors
        this.bullets.getChildren().forEach(b => {
            if (b && b.active) b.update(time, delta);
        });

        // Tick zombie behaviors
        this.zombies.getChildren().forEach(z => {
            if (z && z.active) z.update(time, delta);
        });

        // Spontaneous zombie spawner ahead of camera
        if (Math.random() < 0.012 + (this.scrollSpeed / 14000)) {
            const sx = camX + 830 + Math.random() * 100;
            const sy = 11 * 32 - 32;
            this.worldGenerator.spawnZombie(sx, sy);
        }
    }

    // drawParallaxBackground removed for performance

    drawUIOverlay() {
        this.uiGraphics.clear();
    }

    handleBulletZombieOverlap(bullet, zombie) {
        if (!bullet.active || !zombie.active || zombie.isDead) return;

        // Headshots: top 25% height of bounding box
        const topOfZombie = zombie.y - zombie.displayHeight / 2;
        const relativeY = bullet.y - topOfZombie;
        const isHeadshot = relativeY <= zombie.displayHeight * 0.25;

        bullet.onCollide(zombie, isHeadshot);
    }

    handleBulletPlatformOverlap(bullet, platform) {
        if (!bullet.active) return;

        if (bullet.onCollideWorld) {
            bullet.onCollideWorld(); // triggers ExplosiveBullet splash
        } else {
            bullet.destroy();
        }
    }

    handlePlayerZombieOverlap(player, zombie) {
        if (zombie.isDead) return;
        player.takeDamage();
    }

    handlePlayerSpikesOverlap(player, spikes) {
        player.takeDamage();
    }

    handleZombiePlatformCollide(zombie, platform) {
        if (zombie.isDead) return;
        
        // Only trigger turnaround if collision is with a crate
        if (platform.texture.key === 'crate') {
            // Check if collision is horizontal (blocked on left or right)
            if (zombie.body.blocked.left) {
                zombie.turnAround(1); // Force walk right
            } else if (zombie.body.blocked.right) {
                zombie.turnAround(-1); // Force walk left
            }
        }
    }

    handleZombieSpikesOverlap(zombie, spikes) {
        if (zombie.isDead) return;
        zombie.turnAround();
    }



    spawnParticle(x, y, vx, vy, color, size, duration) {
        new RetroParticle(this, x, y, vx, vy, color, size, duration);
    }

    spawnFloatingText(x, y, text, color) {
        const textStyle = {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '8px',
            fill: color,
            align: 'center'
        };
        const textObject = this.add.text(x, y, text, textStyle);
        textObject.setOrigin(0.5, 0.5);
        textObject.setDepth(15);

        this.tweens.add({
            targets: textObject,
            y: y - 25,
            alpha: 0,
            duration: 850,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                textObject.destroy();
            }
        });
    }
}

// Custom Rectangle Particle Game Object
class RetroParticle extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, vx, vy, color, size, duration) {
        const hexColor = parseInt(color.replace('#', '0x'));
        super(scene, x, y, size, size, hexColor);

        scene.add.existing(this);
        this.setDepth(5);

        scene.tweens.add({
            targets: this,
            x: x + vx * duration,
            y: y + vy * duration,
            alpha: 0,
            duration: duration * 1000,
            onComplete: () => {
                this.destroy();
            }
        });
    }
}

// Config Phaser initialization
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 450,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, PlayScene]
};

// Start Game Instance
window.onload = () => {
    window.gameInstance = new Phaser.Game(config);
};
