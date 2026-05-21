// Phaser Player Class

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_idle');
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Physics attributes
        this.setScale(2);
        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(1600); // Satisfying gravity
        this.body.setSize(10, 14); // Hitbox matches feet directly (row 14)
        this.body.setOffset(3, 0);
        this.wasOnGround = true;
        
        // Game variables
        this.speed = 100;
        this.jumpForce = -480;
        this.doubleJumpForce = -420; // Slightly lighter second jump
        this.jumpsRemaining = 2;
        
        // Timers
        this.hurtTimer = 0;
        this.invincibleTimer = 0;
        this.shootPoseTimer = 0;
        this.recoilOffsetX = 0;
        
        // Facing
        this.facingRight = true;
    }

    jump() {
        if (this.jumpsRemaining > 0) {
            const isDoubleJump = (this.jumpsRemaining === 1);
            
            // Set vertical velocity
            if (isDoubleJump) {
                this.body.setVelocityY(this.doubleJumpForce);
                // Trigger double jump particles
                this.spawnDoubleJumpParticles();
                // Floating text
                if (this.scene.spawnFloatingText) {
                    this.scene.spawnFloatingText(this.x, this.y - 16, "DOUBLE JUMP!", "#bb9af7");
                }
            } else {
                this.body.setVelocityY(this.jumpForce);
            }
            
            this.jumpsRemaining--;
            gameAudio.playJump();
        }
    }

    spawnDoubleJumpParticles() {
        // Disabled for performance
    }

    takeDamage() {
        if (this.scene.isGameOver) return;
        
        this.scene.health = 0;
        gameAudio.playPlayerHit();
        
        // Trigger small camera shake
        this.scene.cameras.main.shake(50, 0.005);
        
        // Update HUD
        if (this.scene.uiBridge) {
            this.scene.uiBridge.updateHUD();
        }
        
        // Spawn minimal damage splatter particles (reduced for performance)
        for (let i = 0; i < 2; i++) {
            const vx = (Math.random() * 100 - 50);
            const vy = (Math.random() * 100 - 50);
            if (this.scene.spawnParticle) {
                this.scene.spawnParticle(this.x, this.y, vx, vy, '#f7768e', 2, 0.3);
            }
        }

        this.scene.endGame();
    }

    shoot(aimTowardsMouse = false) {
        if (this.scene.isGameOver || this.scene.isPaused) return;

        // Check weapon cooldown first
        if (this.scene.weaponSystem) {
            const time = this.scene.time.now;
            let currentFireRate = this.scene.weaponSystem.fireRate;
            if (time - this.scene.weaponSystem.lastFired < currentFireRate) {
                return; // Still on cooldown, do nothing!
            }
        }

        this.shootPoseTimer = 0.2; // Show shooting arm for 0.2s
        this.recoilOffsetX = 6;    // Apply weapon recoil pushback

        // Determine aim angle - ONLY straight forward in direction player is facing
        const angle = this.facingRight ? 0 : Math.PI;
        
        // Fire bullet via weapon system
        if (this.scene.weaponSystem) {
            this.scene.weaponSystem.fire(this.x, this.y, angle);
        }
    }

    update(time, delta) {
        const dt = delta / 1000;
        
        // Decay timers
        if (this.hurtTimer > 0) this.hurtTimer -= dt;
        if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
        if (this.shootPoseTimer > 0) this.shootPoseTimer -= dt;
        
        if (this.recoilOffsetX > 0) {
            this.recoilOffsetX -= dt * 35;
            if (this.recoilOffsetX < 0) this.recoilOffsetX = 0;
        }

        // Ground check reset double jumps & detect landing feel
        const onGround = this.body.blocked.down || this.body.touching.down;
        if (onGround && !this.wasOnGround) {
            // Player just touched ground: trigger landing feedback
            gameAudio.playHit();
        }
        this.wasOnGround = onGround;

        if (onGround) {
            this.jumpsRemaining = 2;
        } else if (this.jumpsRemaining === 2) {
            // Player walked off an edge, allow 1 double jump
            this.jumpsRemaining = 1;
        }

        // Horizontal Movement Input (cursors or WASD or mobile touch)
        let moveX = 0;
        const keys = this.scene.keys;
        
        if (keys.left.isDown || keys.A.isDown || this.scene.mobileMoveLeft) {
            moveX = -1;
        } else if (keys.right.isDown || keys.D.isDown || this.scene.mobileMoveRight) {
            moveX = 1;
        }

        // Calculate horizontal velocity
        // Snappy movement: smooth acceleration / deceleration (increased rate for responsive controls)
        const targetVx = moveX * this.speed;
        const accelRate = moveX !== 0 ? 0.55 : 0.65; // Snappy responsiveness
        this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, targetVx, accelRate);

        // Auto scrolling speed addition (forces player to move with screen)
        // Set actual velocity including scroll speed
        this.body.velocity.x += this.scene.scrollSpeed;

        // Sprite Facing and Animations
        // If moving left, face left. If moving right, face right.
        if (moveX < 0) {
            this.facingRight = false;
        } else if (moveX > 0) {
            this.facingRight = true;
        }

        // Set flip based on facing
        this.setFlipX(!this.facingRight);

        // Select Animation
        if (this.hurtTimer > 0) {
            this.play('player_hurt', true);
        } else if (!this.body.blocked.down && !this.body.touching.down) {
            this.play('player_jump', true);
        } else if (this.shootPoseTimer > 0) {
            this.play('player_shoot', true);
        } else if (Math.abs(this.body.velocity.x - this.scene.scrollSpeed) > 10) {
            this.play('player_run', true);
            
            // Running dust particles disabled for performance
        } else {
            this.play('player_idle', true);
        }

        this.setAlpha(1.0);

        // Apply recoil visual offset to the sprite (does not affect physical body position)
        this.x -= (this.facingRight ? this.recoilOffsetX : -this.recoilOffsetX);
    }
}
