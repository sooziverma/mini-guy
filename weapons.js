// Phaser Weapons System

class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, angle, speed = 650, damage = 10) {
        // Initialize dynamic texture if not present
        if (!scene.textures.exists('bullet_texture')) {
            const canvas = document.createElement('canvas');
            canvas.width = 6;
            canvas.height = 6;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffe066';
            ctx.fillRect(0, 0, 6, 6);
            scene.textures.addCanvas('bullet_texture', canvas);
        }
        
        super(scene, x, y, 'bullet_texture');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        if (scene.bullets) {
            scene.bullets.add(this);
        }
        
        this.damage = damage;
        this.body.setAllowGravity(false);
        this.body.setSize(6, 6);
        
        // Set velocity
        this.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        this.angle = Phaser.Math.RadToDeg(angle);
    }

    update(time, delta) {
        // Destroy if offscreen (relative to camera scroll)
        const cam = this.scene.cameras.main;
        if (this.x < cam.scrollX - 50 || this.x > cam.scrollX + 850 ||
            this.y < -50 || this.y > 500) {
            this.destroy();
        }
    }

    onCollide(zombie, headshot) {
        zombie.takeDamage(this.damage, headshot, this.x, this.y);
        this.destroy();
    }
}

class WeaponSystem {
    constructor(scene) {
        this.scene = scene;
        this.lastFired = 0;
        this.fireRate = 220; // Default millisecond delay between shots
    }

    fire(x, y, angle) {
        const time = this.scene.time.now;
        
        let currentFireRate = this.fireRate;
        
        if (time - this.lastFired < currentFireRate) {
            return;
        }
        
        this.lastFired = time;
        
        // Offset starting position to align with player's gun height and muzzle position
        const bx = x + Math.cos(angle) * 12;
        const by = y - 4;
        
        // Trigger minimal camera shake for weapon recoil (reduced for performance)
        this.scene.cameras.main.shake(20, 0.0005);
        
        // Standard fire
        gameAudio.playShoot();
        const b = new Bullet(this.scene, bx, by, angle, 650, 10);
        
        // Spawn 1 Muzzle Flash particle (minimized for performance)
        if (this.scene.spawnParticle) {
            this.scene.spawnParticle(bx, by, Math.cos(angle) * 100, -10, '#ffe066', 2, 0.1);
        }
    }
}
