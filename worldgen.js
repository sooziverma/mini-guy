// World Generator for Mini Guy: Zombie Run
// Handles endless procedural chunk generation, placing platforms, crates, hazards, and items.

class WorldGenerator {
    constructor(scene) {
        this.scene = scene;
        this.farthestGeneratedX = 0;
        this.chunkWidth = 320; // 10 columns of 32px tiles
        this.tileSize = 32;
        this.groundRow = 11; // Ground level Y = 11 * 32 = 352
    }

    init() {
        this.farthestGeneratedX = 0;
    }

    update(cameraX) {
        // Generate new chunks ahead of the camera
        const viewportWidth = this.scene.scale.width;
        while (cameraX + viewportWidth > this.farthestGeneratedX - this.chunkWidth) {
            this.generateNextChunk();
        }

        // Clean up old entities that are far behind the camera
        this.cleanOldEntities(cameraX);
    }

    getRandomZombieType() {
        return 'normal';
    }

    generateNextChunk() {
        const chunkX = this.farthestGeneratedX;
        
        // Select random pattern from 0 to 4
        // 60% flat ground chunks, 10% basic pits, 10% multi-level platforms, 10% staircase, 10% pillars
        const randPattern = Math.random();
        let pattern = 0;
        if (randPattern < 0.60) {
            pattern = 0;
        } else if (randPattern < 0.70) {
            pattern = 1;
        } else if (randPattern < 0.80) {
            pattern = 2;
        } else if (randPattern < 0.90) {
            pattern = 3;
        } else {
            pattern = 4;
        }
        
        // The very first chunk must be flat to let the player start safely
        if (chunkX === 0) {
            pattern = 0;
        }

        switch (pattern) {
            case 0: // Flat Terrain
                const spawnFloatingPlatform = Math.random() < 0.4;
                for (let col = 0; col < 10; col++) {
                    const tx = chunkX + col * this.tileSize;
                    
                    // Create ground blocks
                    this.spawnBlock(tx, this.groundRow * this.tileSize, 'grass');
                    this.spawnBlock(tx, (this.groundRow + 1) * this.tileSize, 'dirt');
                    this.spawnBlock(tx, (this.groundRow + 2) * this.tileSize, 'dirt');

                    // Spawn obstacles procedurally on ground
                    if (col === 4) {
                        const rand = Math.random();
                        if (rand < 0.25) {
                            this.spawnCrate(tx, (this.groundRow - 1) * this.tileSize);
                        } else if (rand < 0.45) {
                            this.spawnSpikes(tx, (this.groundRow - 1) * this.tileSize);
                        }
                    }

                    // Floating platform beyond the ground
                    if (spawnFloatingPlatform && col >= 3 && col <= 6) {
                        this.spawnBlock(tx, 8 * this.tileSize, 'grass');
                        if (col === 4 && Math.random() < 0.5) {
                            this.spawnCrate(tx, 7 * this.tileSize);
                        } else if (col === 5 && Math.random() < 0.5) {
                            this.spawnSpikes(tx, 7 * this.tileSize);
                        }
                    }

                    if (col === 8 && Math.random() < 0.35) {
                        this.spawnZombie(tx + 16, this.groundRow * this.tileSize - 32);
                    }
                }
                break;

            case 1: // Pit with Floating Platforms
                for (let col = 0; col < 10; col++) {
                    const tx = chunkX + col * this.tileSize;
                    const isPit = col >= 3 && col <= 6;

                    if (!isPit) {
                        this.spawnBlock(tx, this.groundRow * this.tileSize, 'grass');
                        this.spawnBlock(tx, (this.groundRow + 1) * this.tileSize, 'dirt');
                        this.spawnBlock(tx, (this.groundRow + 2) * this.tileSize, 'dirt');
                    } else {
                        // Floating platform bridge over the pit (at row 8)
                        if (col === 4 || col === 5) {
                            this.spawnBlock(tx, 8 * this.tileSize, 'grass');
                            const randObstacle = Math.random();
                            if (col === 4 && randObstacle < 0.45) {
                                this.spawnCrate(tx, 7 * this.tileSize);
                            } else if (col === 5 && randObstacle < 0.45) {
                                this.spawnSpikes(tx, 7 * this.tileSize);
                            }
                        }
                    }

                    // Spawn zombies at safety banks
                    if (col === 1 && Math.random() < 0.4) {
                        this.spawnZombie(tx + 16, this.groundRow * this.tileSize - 32);
                    }
                    if (col === 8 && Math.random() < 0.4) {
                        this.spawnZombie(tx + 16, this.groundRow * this.tileSize - 32);
                    }
                }
                break;

            case 2: // Multi-Level Platform Jumps
                for (let col = 0; col < 10; col++) {
                    const tx = chunkX + col * this.tileSize;

                    // Main Ground edges
                    if (col < 2 || col > 7) {
                        this.spawnBlock(tx, this.groundRow * this.tileSize, 'grass');
                        this.spawnBlock(tx, (this.groundRow + 1) * this.tileSize, 'dirt');
                        this.spawnBlock(tx, (this.groundRow + 2) * this.tileSize, 'dirt');
                    }

                    // Mid-platforms
                    if (col === 3 || col === 4) {
                        this.spawnBlock(tx, 9 * this.tileSize, 'grass');
                        if (col === 3 && Math.random() < 0.4) {
                            this.spawnCrate(tx, 8 * this.tileSize);
                        }
                    }
                    if (col === 5 || col === 6) {
                        this.spawnBlock(tx, 7 * this.tileSize, 'grass');
                        if (col === 5 && Math.random() < 0.4) {
                            this.spawnSpikes(tx, 6 * this.tileSize);
                        }
                    }

                    // Zombie on the banks
                    if (col === 1 && Math.random() < 0.3) {
                        this.spawnZombie(tx + 16, this.groundRow * this.tileSize - 32);
                    }
                    if (col === 8 && Math.random() < 0.4) {
                        this.spawnZombie(tx + 16, this.groundRow * this.tileSize - 32);
                    }
                }
                break;

            case 3: // Staircase Climbing
                for (let col = 0; col < 10; col++) {
                    const tx = chunkX + col * this.tileSize;

                    // Lower ground everywhere underneath
                    this.spawnBlock(tx, this.groundRow * this.tileSize, 'grass');
                    this.spawnBlock(tx, (this.groundRow + 1) * this.tileSize, 'dirt');

                    // Stairs rising up (cols 2-4)
                    if (col >= 2 && col <= 4) {
                        const stepHeight = this.groundRow - (col - 1);
                        this.spawnBlock(tx, stepHeight * this.tileSize, 'grass');
                        for (let d = stepHeight + 1; d < this.groundRow; d++) {
                            this.spawnBlock(tx, d * this.tileSize, 'dirt');
                        }
                        if (col === 4 && Math.random() < 0.4) {
                            this.spawnCrate(tx, (stepHeight - 1) * this.tileSize);
                        }
                    }

                    // Stairs descending (cols 5-7)
                    if (col >= 5 && col <= 7) {
                        const stepHeight = this.groundRow - (8 - col);
                        this.spawnBlock(tx, stepHeight * this.tileSize, 'grass');
                        for (let d = stepHeight + 1; d < this.groundRow; d++) {
                            this.spawnBlock(tx, d * this.tileSize, 'dirt');
                        }
                        if (col === 5 && Math.random() < 0.4) {
                            this.spawnSpikes(tx, (stepHeight - 1) * this.tileSize);
                        }
                    }

                    // Zombie on descent/flat
                    if (col === 8 && Math.random() < 0.45) {
                        this.spawnZombie(tx + 16, this.groundRow * this.tileSize - 32);
                    }
                }
                break;

            case 4: // Pillars and Hazards (Precision jumping)
                for (let col = 0; col < 10; col++) {
                    const tx = chunkX + col * this.tileSize;
                    const isPillar = col === 3 || col === 7;
                    const isPit = col === 4 || col === 5 || col === 6;

                    if (!isPit) {
                        const hRow = isPillar ? this.groundRow - 2 : this.groundRow;
                        this.spawnBlock(tx, hRow * this.tileSize, 'grass');
                        this.spawnBlock(tx, (hRow + 1) * this.tileSize, 'dirt');
                        this.spawnBlock(tx, (hRow + 2) * this.tileSize, 'dirt');
                        if (isPillar && Math.random() < 0.5) {
                            this.spawnCrate(tx, (hRow - 1) * this.tileSize);
                        }
                    }

                    // Spawn zombie on flat ground
                    if (col === 1 && Math.random() < 0.4) {
                        this.spawnZombie(tx + 16, this.groundRow * this.tileSize - 32);
                    }
                }
                break;
        }

        this.farthestGeneratedX += this.chunkWidth;
    }

    spawnBlock(x, y, textureKey) {
        if (textureKey === 'dirt') {
            const block = this.scene.add.image(x, y, textureKey);
            block.setOrigin(0, 0);
            block.setDisplaySize(this.tileSize, this.tileSize);
            if (this.scene.dirtGroup) {
                this.scene.dirtGroup.add(block);
            }
            return block;
        } else {
            const block = this.scene.platforms.create(x, y, textureKey);
            block.setOrigin(0, 0);
            block.setDisplaySize(this.tileSize, this.tileSize);
            block.refreshBody();
            return block;
        }
    }

    spawnCrate(x, y) {
        // Crates are solid, so we add them to the platforms group
        const crate = this.scene.platforms.create(x, y, 'crate');
        crate.setOrigin(0, 0);
        crate.setDisplaySize(this.tileSize, this.tileSize);
        crate.refreshBody();
        return crate;
    }

    spawnSpikes(x, y) {
        const spikes = this.scene.spikes.create(x, y, 'spikes');
        spikes.setOrigin(0, 0);
        spikes.setDisplaySize(this.tileSize, this.tileSize);
        spikes.refreshBody();
        return spikes;
    }

    spawnScenery(x, y, type) {
        const scenery = this.scene.add.sprite(x, y, type);
        scenery.setOrigin(0, 0);
        scenery.setDepth(-1); // Render behind player, weapons, and enemies
        
        if (type === 'bush') {
            scenery.setDisplaySize(24, 16);
        } else if (type === 'tree') {
            scenery.setDisplaySize(32, 48);
        }
        
        // Track scenery for cleanup
        this.scene.sceneryGroup.add(scenery);
        return scenery;
    }

    spawnZombie(x, y) {
        const maxZombies = Math.min(4 + Math.floor((this.scene.scrollSpeed - 30) / 10), 8);
        if (this.scene.zombies.getLength() >= maxZombies) return;
        // Check if there is already a zombie nearby to avoid grouping overlapping zombies
        const nearby = this.scene.zombies.getChildren().some(z => Math.abs(z.x - x) < 64);
        if (!nearby) {
            const type = this.getRandomZombieType();
            new Zombie(this.scene, x, y, type);
        }
    }

    cleanOldEntities(cameraX) {
        const threshold = cameraX - 250;

        // Clean up platforms
        this.scene.platforms.getChildren().forEach(child => {
            if (child.x + child.displayWidth < threshold) {
                child.destroy();
            }
        });

        // Clean up dirt tiles (visual images)
        if (this.scene.dirtGroup) {
            this.scene.dirtGroup.getChildren().forEach(child => {
                if (child.x + child.displayWidth < threshold) {
                    child.destroy();
                }
            });
        }



        // Clean up zombies that got left behind
        this.scene.zombies.getChildren().forEach(child => {
            if (child.x < threshold) {
                child.destroy();
            }
        });

        // Clean up spikes that got left behind
        if (this.scene.spikes) {
            this.scene.spikes.getChildren().forEach(child => {
                if (child.x + child.displayWidth < threshold) {
                    child.destroy();
                }
            });
        }
    }
}
