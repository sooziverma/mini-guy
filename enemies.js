// Phaser Enemies System (Zombies)

class Zombie extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'normal') {
        let texture = 'zombie_walk_0';
        
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        if (scene.zombies) {
            scene.zombies.add(this);
        }
        
        this.type = 'normal';
        this.id = 'zombie_' + Phaser.Math.RND.uuid();
        this.isDead = false;
        
        // Normal
        this.speed = -(30 + Math.random() * 20); // Standard speed
        this.maxHealth = 30;
        this.scoreValue = 150;
        this.typeKey = 'normal';
        
        this.setScale(2);
        this.body.setSize(10, 14);
        this.body.setOffset(3, 1);

        this.health = this.maxHealth;
        this.body.setGravityY(2000); // Affected by gravity
        this.body.setCollideWorldBounds(false); // Can walk off left side
        
        // Start walk animation
        this.playZombieWalk();
        
        // Flip texture since zombies face left and sprites point right
        this.setFlipX(true);
        
        this.hurtTimer = 0;
        this.deadTimer = 1.2; // Stay dead on ground for 1.2s before fadeout
        this.obstacleTurnaroundTimer = 0;
        this.turnaroundDirection = 1;
    }

    turnAround(forcedDirection) {
        if (this.isDead) return;
        if (this.obstacleTurnaroundTimer > 0) return;

        this.obstacleTurnaroundTimer = 1.2; // Move away for 1.2s
        if (forcedDirection !== undefined) {
            this.turnaroundDirection = forcedDirection;
        } else {
            // Reverse velocity direction
            this.turnaroundDirection = this.body.velocity.x > 0 ? -1 : 1;
        }
    }

    playZombieWalk() {
        this.play('zombie_walk', true);
    }

    takeDamage(dmg, isHeadshot, hitX, hitY) {
        if (this.isDead) return;
        
        // Spawn small death splatter particle
        if (this.scene.spawnParticle) {
            this.scene.spawnParticle(hitX, hitY, 0, -10, '#ff007f', 3, 0.25);
        }
        
        this.die();
    }

    die() {
        this.isDead = true;
        this.body.setVelocity(0, 0);
        this.body.setEnable(false); // disable collisions
        
        // Add to statistics
        this.scene.zombiesKilled++;
        this.scene.score += this.scoreValue;
        if (this.scene.uiBridge) this.scene.uiBridge.updateHUD();
        
        // SFX and screen shake
        gameAudio.playZombieDeath();
        
        // Set dead texture
        this.setTexture('zombie_dead');
        
        this.stop(); // Stop animations
    }

    update(time, delta) {
        const dt = delta / 1000;
        
        if (this.isDead) {
            this.deadTimer -= dt;
            if (this.deadTimer <= 0) {
                // Fadeout and destroy
                this.alpha -= dt;
                if (this.alpha <= 0) {
                    this.destroy();
                }
            }
            return;
        }

        // Walk towards player relative to the scrolling world or turnaround if triggered
        if (this.obstacleTurnaroundTimer > 0) {
            this.obstacleTurnaroundTimer -= dt;
            this.body.setVelocityX(this.turnaroundDirection * Math.abs(this.speed));
            this.setFlipX(this.turnaroundDirection < 0);
        } else if (this.scene.player && !this.scene.player.isDead && this.scene.player.active) {
            const direction = this.scene.player.x > this.x ? 1 : -1;
            this.body.setVelocityX(direction * Math.abs(this.speed));
            this.setFlipX(direction < 0);
        } else {
            this.body.setVelocityX(this.speed);
            this.setFlipX(true);
        }

        // Update hurt timer texture flashing
        if (this.hurtTimer > 0) {
            this.hurtTimer -= dt;
            this.setTexture('zombie_hurt');
        } else {
            // Restore walking texture state
            let baseTexture = 'zombie_walk_0';
            
            if (this.texture.key.includes('hurt')) {
                this.setTexture(baseTexture);
                this.playZombieWalk();
            }
        }

        // Destroy if way off the left side of screen
        const cam = this.scene.cameras.main;
        if (this.x < cam.scrollX - 100) {
            this.destroy();
        }
    }
}
