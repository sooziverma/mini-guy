// UI Manager for Mini Guy: Zombie Run
// Bridges Phaser game state to the HTML DOM overlays, handles pause menus, sliders, and audio state syncing.

class UIManager {
    constructor() {
        this.scene = null; // Set dynamically when PlayScene starts
        this.initDOMElements();
        this.setupGlobalListeners();
    }

    initDOMElements() {
        this.hud = document.getElementById('hud');
        this.scoreVal = document.getElementById('score-val');
        this.killsVal = document.getElementById('kills-val');
        
        this.startScreen = document.getElementById('start-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        
        this.sliderMusic = document.getElementById('slider-music');
        this.sliderSfx = document.getElementById('slider-sfx');
        this.musicVolVal = document.getElementById('music-vol-val');
        this.sfxVolVal = document.getElementById('sfx-vol-val');
        
        this.btnResume = document.getElementById('btn-resume');
        this.btnPauseRestart = document.getElementById('btn-pause-restart');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnPlay = document.getElementById('btn-play');
        this.btnPauseToggle = document.getElementById('btn-pause-toggle');
        this.audioToggle = document.getElementById('audio-toggle');
        
        this.statDistance = document.getElementById('stat-distance');
        this.statKills = document.getElementById('stat-kills');
        this.statScore = document.getElementById('stat-score');
        

        
        // Mobile controls
        this.mobileControls = document.getElementById('mobile-controls');
        this.btnLeft = document.getElementById('btn-left');
        this.btnRight = document.getElementById('btn-right');
        this.btnShoot = document.getElementById('btn-shoot');
        this.btnJump = document.getElementById('btn-jump');
    }

    setScene(scene) {
        this.scene = scene;
        this.updateHUD();
    }

    setupGlobalListeners() {
        // Start Button
        this.btnPlay.addEventListener('click', () => {
            gameAudio.init();
            gameAudio.startBGM();
            this.hideStartScreen();
            
            if (window.gameInstance) {
                const playScene = window.gameInstance.scene.getScene('PlayScene');
                if (playScene) {
                    playScene.startGame();
                }
            }
        });

        // Resume Button
        this.btnResume.addEventListener('click', () => {
            if (window.gameInstance) {
                const playScene = window.gameInstance.scene.getScene('PlayScene');
                if (playScene) {
                    playScene.togglePause();
                }
            }
        });

        // Restart buttons
        const handleRestart = () => {
            gameAudio.init();
            gameAudio.resume();
            if (window.gameInstance) {
                const playScene = window.gameInstance.scene.getScene('PlayScene');
                if (playScene) {
                    playScene.restartGame();
                }
            }
        };

        this.btnPauseRestart.addEventListener('click', handleRestart);
        this.btnRestart.addEventListener('click', handleRestart);

        // Allow Space bar to trigger restart when Game Over screen is active
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.code === 'Space') {
                if (this.gameOverScreen && !this.gameOverScreen.classList.contains('hidden')) {
                    e.preventDefault();
                    handleRestart();
                }
            }
        });

        // Pause Toggle Button (bottom-left HUD)
        this.btnPauseToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.gameInstance) {
                const playScene = window.gameInstance.scene.getScene('PlayScene');
                if (playScene && playScene.isPlaying) {
                    playScene.togglePause();
                }
            }
        });

        // Mute Button (bottom-left HUD)
        this.audioToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            gameAudio.init();
            const isMuted = gameAudio.toggleMute();
            
            if (isMuted) {
                this.audioToggle.classList.remove('active');
                this.audioToggle.innerText = '🔇';
            } else {
                this.audioToggle.classList.add('active');
                this.audioToggle.innerText = '🔊';
            }
        });

        // Music Volume Slider
        this.sliderMusic.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.musicVolVal.innerText = `${val}%`;
            gameAudio.init();
            gameAudio.setMusicVolume(val / 100);
        });

        // SFX Volume Slider
        this.sliderSfx.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.sfxVolVal.innerText = `${val}%`;
            gameAudio.init();
            gameAudio.setSfxVolume(val / 100);
        });

        // Prevent space bar / keys from triggering focused buttons accidentally
        const preventButtonFocusLoss = (btn) => {
            btn.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                }
            });
        };
        
        [this.btnPlay, this.btnResume, this.btnPauseRestart, this.btnRestart, this.btnPauseToggle, this.audioToggle].forEach(preventButtonFocusLoss);

        // Setup mobile controls listeners (once global)
        const setupMobileButton = (btn, callbackDown, callbackUp) => {
            if (btn) {
                const eventsDown = ['pointerdown', 'touchstart'];
                const eventsUp = ['pointerup', 'touchend', 'pointerout', 'touchcancel'];

                eventsDown.forEach(evt => {
                    btn.addEventListener(evt, (e) => {
                        e.preventDefault();
                        gameAudio.init();
                        if (callbackDown) callbackDown();
                    });
                });

                if (callbackUp) {
                    eventsUp.forEach(evt => {
                        btn.addEventListener(evt, (e) => {
                            e.preventDefault();
                            callbackUp();
                        });
                    });
                }
            }
        };

        setupMobileButton(this.btnLeft,
            () => { if (this.scene) this.scene.mobileMoveLeft = true; },
            () => { if (this.scene) this.scene.mobileMoveLeft = false; }
        );
        setupMobileButton(this.btnRight,
            () => { if (this.scene) this.scene.mobileMoveRight = true; },
            () => { if (this.scene) this.scene.mobileMoveRight = false; }
        );
        setupMobileButton(this.btnJump, () => {
            if (this.scene && this.scene.player && this.scene.isPlaying && !this.scene.isPaused && !this.scene.isGameOver) {
                this.scene.player.jump();
            }
        });
        setupMobileButton(this.btnShoot,
            () => { if (this.scene) this.scene.mobileShoot = true; },
            () => { if (this.scene) this.scene.mobileShoot = false; }
        );
    }

    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.hud.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.mobileControls.classList.add('hidden');
    }

    hideStartScreen() {
        this.startScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        
        // Show mobile controls if touch interface is active (or always for simplicity if window is small)
        if (this.isTouchDevice()) {
            this.mobileControls.classList.remove('hidden');
        }
    }

    showPauseScreen() {
        this.pauseScreen.classList.remove('hidden');
    }

    hidePauseScreen() {
        this.pauseScreen.classList.add('hidden');
    }

    showGameOverScreen(distance, kills, score) {
        this.statDistance.innerText = `${distance}m`;
        this.statKills.innerText = kills;
        this.statScore.innerText = String(score).padStart(6, '0');
        this.gameOverScreen.classList.remove('hidden');
    }

    hideGameOverScreen() {
        this.gameOverScreen.classList.add('hidden');
    }

    updateHUD() {
        if (!this.scene) return;

        // Score
        this.scoreVal.innerText = String(Math.floor(this.scene.score)).padStart(6, '0');
        if (this.killsVal) {
            this.killsVal.innerText = String(this.scene.zombiesKilled).padStart(6, '0');
        }
    }

    isTouchDevice() {
        return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
    }
}

// Global UI Manager
const gameUI = new UIManager();
