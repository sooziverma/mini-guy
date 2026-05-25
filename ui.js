// UI Manager for Mini Guy: Zombie Run
// Bridges Phaser game state to the HTML DOM overlays, handles pause menus, sliders, and audio state syncing.
// Enhanced with Base Sepolia onchain Web3 integration, Daily Check-In, score submission, and Leaderboard.

const CHECKIN_REWARDS = {
    1: 100,
    2: 150,
    3: 200,
    4: 250,
    5: 300,
    6: 350,
    7: 500
};

class UIManager {
    constructor() {
        this.scene = null; // Set dynamically when PlayScene starts
        this.countdownInterval = null;

        // --- Web3 State Management ---
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.contract = null;
        this.contractABI = [
            "event DailyCheckInClaimed(address user, uint256 reward, uint256 streak)",
            "event ScoreSubmitted(address indexed player, uint256 score, bool isNewHighScore)",
            "function claimDailyCheckIn() external payable returns (uint256)",
            "function getLeaderboard() external view returns (tuple(address player, uint256 score)[10])",
            "function getPlayerState(address account) external view returns (uint256 coinBalance, uint256 streak, uint256 lastClaimTime, uint256 highScore)",
            "function leaderboard(uint256) external view returns (address player, uint256 score)",
            "function players(address) external view returns (uint256 coinBalance, uint256 streak, uint256 lastClaimTime, uint256 highScore)",
            "function rewards(uint256) external view returns (uint256)",
            "function submitScore(uint256 score) external payable"
        ];
        this.contractAddress = "0x177C3E282E6DF8AC0DE2EE13AE22BBDD56C50F00";
        this.onchainState = null; // Cached { coins, streak, lastCheckIn, highScore }
        this.latestGameScore = 0;
        this.latestDistance = 0;
        this.latestKills = 0;

        // Builder Code: bc_hnqc0q7b
        // Encoded Builder String: 0x62635f736a6b65787032306f0b00802180218021802180218021802180218021
        this.builderCodeHex = "62635f736a6b65787032306f0b00802180218021802180218021802180218021";

        this.initDOMElements();
        this.setupGlobalListeners();
        this.updateCoinsDisplay();

        // Populate username from localStorage if existing
        if (this.usernameInput) {
            this.usernameInput.value = localStorage.getItem('miniguy_username') || '';
        }

        // Listeners for EIP-1193 events
        const ethereum = this.getInjectedProvider();
        if (ethereum) {
            ethereum.on('chainChanged', (chainIdHex) => {
                this.handleChainChanged(chainIdHex);
            });
            ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });
        }

        this.updateOnboardingState();

        // Auto-connect wallet if previously connected in this session/browser
        if (localStorage.getItem('miniguy_web3_connected') === 'true') {
            setTimeout(() => {
                this.connectWallet().catch(err => console.log("Auto-connect deferred:", err));
            }, 500);
        } else {
            this.updateContractDisplay();
            this.fetchLeaderboard();
        }
    }

    getInjectedProvider() {
        if (typeof window.ethereum === 'undefined') {
            return null;
        }
        if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
            const coinbase = window.ethereum.providers.find(p => p.isCoinbaseWallet);
            const metamask = window.ethereum.providers.find(p => p.isMetaMask);
            return coinbase || metamask || window.ethereum.providers[0];
        }
        return window.ethereum;
    }

    initDOMElements() {
        this.hud = document.getElementById('hud');
        this.scoreVal = document.getElementById('score-val');
        this.killsVal = document.getElementById('kills-val');
        this.coinsVal = document.getElementById('coins-val');
        this.healthVal = document.getElementById('health-val');
        
        this.startScreen = document.getElementById('start-screen');
        this.menuCoinsVal = document.getElementById('menu-coins-val');
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
        
        // Daily Check-In Overlay DOM elements
        this.btnCheckinOpen = document.getElementById('btn-checkin-open');
        this.checkinScreen = document.getElementById('checkin-screen');
        this.btnCheckinClose = document.getElementById('btn-checkin-close');
        this.btnCheckinClaim = document.getElementById('btn-checkin-claim');
        this.checkinTimer = document.getElementById('checkin-timer');
        this.checkinStreakVal = document.getElementById('checkin-streak-val');
        this.checkinCoinsVal = document.getElementById('checkin-coins-val');
        this.checkinGrid = document.getElementById('checkin-grid');
        this.checkinCards = document.querySelectorAll('.checkin-card');
        
        // Claim Success Popup DOM elements
        this.claimPopupOverlay = document.getElementById('claim-popup-overlay');
        this.popupRewardAmount = document.getElementById('popup-reward-amount');
        this.btnPopupOk = document.getElementById('btn-popup-ok');
        this.coinsContainer = document.getElementById('coins-container');
        
        this.statDistance = document.getElementById('stat-distance');
        this.statKills = document.getElementById('stat-kills');
        this.statScore = document.getElementById('stat-score');
        
        // Web3 Connection HUD elements
        this.btnWeb3Connect = document.getElementById('btn-web3-connect');
        this.web3Info = document.getElementById('web3-info');
        this.web3Address = document.getElementById('web3-address');
        this.btnWeb3Disconnect = document.getElementById('btn-web3-disconnect');
        this.startContractVal = document.getElementById('start-contract-val');
        this.btnSubmitScore = document.getElementById('btn-submit-score');
        this.submitScoreFeeNote = document.getElementById('submit-score-fee-note');
        this.leaderboardList = document.getElementById('leaderboard-list');

        // Mobile controls
        this.mobileControls = document.getElementById('mobile-controls');
        this.btnLeft = document.getElementById('btn-left');
        this.btnRight = document.getElementById('btn-right');
        this.btnShoot = document.getElementById('btn-shoot');
        this.btnJump = document.getElementById('btn-jump');

        // Onboarding & Network Warning DOM elements
        this.usernameInput = document.getElementById('username-input');
        this.networkWarningOverlay = document.getElementById('network-warning-overlay');
        this.networkWarningMsg = document.getElementById('network-warning-msg');
        this.btnSwitchNetwork = document.getElementById('btn-switch-network');
        this.instructionsBox = document.getElementById('instructions-box');
        this.contractInfoFooter = document.getElementById('contract-info-footer');
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

        // Daily Check-In button event listener
        if (this.btnCheckinOpen) {
            this.btnCheckinOpen.addEventListener('click', (e) => {
                e.stopPropagation();
                gameAudio.init();
                gameAudio.playAmmo(); // Play nice chiptune click
                if (this.checkinScreen) this.checkinScreen.classList.remove('hidden');
                this.updateCheckinModal();
                this.fetchLeaderboard();
            });
        }

        // Close Check-In button event listener
        if (this.btnCheckinClose) {
            this.btnCheckinClose.addEventListener('click', (e) => {
                e.stopPropagation();
                gameAudio.init();
                gameAudio.playHit();
                if (this.checkinScreen) this.checkinScreen.classList.add('hidden');
                if (this.countdownInterval) {
                    clearInterval(this.countdownInterval);
                    this.countdownInterval = null;
                }
            });
        }

        // Claim button event listener
        if (this.btnCheckinClaim) {
            this.btnCheckinClaim.addEventListener('click', (e) => {
                e.stopPropagation();
                this.claimReward();
            });
        }

        // Popup Ok button event listener
        if (this.btnPopupOk) {
            this.btnPopupOk.addEventListener('click', (e) => {
                e.stopPropagation();
                gameAudio.init();
                gameAudio.playAmmo();
                if (this.claimPopupOverlay) this.claimPopupOverlay.classList.add('hidden');
                this.updateCheckinModal();
            });
        }

        // Web3 Connection Listeners
        if (this.btnWeb3Connect) {
            this.btnWeb3Connect.addEventListener('click', (e) => {
                e.stopPropagation();
                this.connectWallet();
            });
        }

        if (this.btnWeb3Disconnect) {
            this.btnWeb3Disconnect.addEventListener('click', (e) => {
                e.stopPropagation();
                this.disconnectWallet();
            });
        }

        if (this.btnSubmitScore) {
            this.btnSubmitScore.addEventListener('click', (e) => {
                e.stopPropagation();
                this.submitScoreOnchain();
            });
        }

        // Prevent space bar / keys from triggering focused buttons accidentally
        const preventButtonFocusLoss = (btn) => {
            if (btn) {
                btn.addEventListener('keydown', (e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                    }
                });
            }
        };
        
        [
            this.btnPlay, this.btnResume, this.btnPauseRestart, this.btnRestart, 
            this.btnPauseToggle, this.audioToggle, this.btnCheckinOpen, 
            this.btnCheckinClose, this.btnCheckinClaim, this.btnPopupOk,
            this.btnWeb3Connect, this.btnWeb3Disconnect, this.btnSubmitScore
        ].forEach(preventButtonFocusLoss);

        // Setup mobile controls listeners (once global)
        const setupMobileButton = (btn, callbackDown, callbackUp) => {
            if (btn) {
                // Use PointerEvent if supported to avoid double-triggering touch and pointer events
                const usePointer = !!window.PointerEvent;
                const eventsDown = usePointer ? ['pointerdown'] : ['touchstart'];
                const eventsUp = usePointer ? ['pointerup', 'pointerout'] : ['touchend', 'touchcancel'];

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

        // Username Input listener
        if (this.usernameInput) {
            this.usernameInput.value = localStorage.getItem('miniguy_username') || '';
            
            this.usernameInput.addEventListener('input', () => {
                const val = this.usernameInput.value.trim();
                localStorage.setItem('miniguy_username', val);
                this.updateOnboardingState();
            });

            // Prevent event propagation so Phaser doesn't intercept keys (W, A, S, D, Space, Backspace, etc.)
            const stopProp = (e) => {
                e.stopPropagation();
            };
            this.usernameInput.addEventListener('keydown', stopProp);
            this.usernameInput.addEventListener('keyup', stopProp);
            this.usernameInput.addEventListener('keypress', stopProp);

            // Toggle Phaser keyboard manager enabled state to avoid interception when typing
            this.usernameInput.addEventListener('focus', () => {
                if (window.gameInstance && window.gameInstance.input && window.gameInstance.input.keyboard) {
                    window.gameInstance.input.keyboard.enabled = false;
                }
            });
            this.usernameInput.addEventListener('blur', () => {
                if (window.gameInstance && window.gameInstance.input && window.gameInstance.input.keyboard) {
                    window.gameInstance.input.keyboard.enabled = true;
                }
            });
        }

        // Switch network button listener
        if (this.btnSwitchNetwork) {
            this.btnSwitchNetwork.addEventListener('click', async (e) => {
                e.stopPropagation();
                const ethereum = this.getInjectedProvider();
                if (!ethereum) return;
                
                try {
                    this.btnSwitchNetwork.innerText = "SWITCHING...";
                    await ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x2105' }],
                    });
                } catch (switchError) {
                    const isUnrecognized = switchError.code === 4902 || 
                                           (switchError.message && switchError.message.toLowerCase().includes("unrecognized")) ||
                                           switchError.code === -32603;
                    if (isUnrecognized) {
                        try {
                            await ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x2105',
                                    chainName: 'Base',
                                    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                                    rpcUrls: ['https://mainnet.base.org'],
                                    blockExplorerUrls: ['https://basescan.org']
                                }],
                            });
                        } catch (addError) {
                            console.error("Could not add Base network:", addError);
                            alert("Could not add Base network. Please add it manually.");
                        }
                    } else {
                        console.error("Could not switch to Base network:", switchError);
                        alert("Could not switch network: " + switchError.message);
                    }
                } finally {
                    if (this.btnSwitchNetwork) this.btnSwitchNetwork.innerText = "SWITCH TO BASE";
                }
            });
        }
    }

    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.hud.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.mobileControls.classList.add('hidden');
        this.updateContractDisplay();
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

        // Cache score for submission
        this.latestGameScore = score;
        this.latestDistance = distance;
        this.latestKills = kills;

        // Toggle submit score button based on connection status
        if (this.btnSubmitScore) {
            this.btnSubmitScore.classList.remove('hidden');
            this.btnSubmitScore.disabled = false;
            this.btnSubmitScore.style.borderColor = 'var(--color-warning)';
            this.btnSubmitScore.style.color = 'var(--color-warning)';
            if (this.userAddress) {
                this.btnSubmitScore.innerText = "SUBMIT SCORE ONCHAIN";
                if (this.submitScoreFeeNote) this.submitScoreFeeNote.classList.remove('hidden');
            } else {
                this.btnSubmitScore.innerText = "CONNECT TO SUBMIT SCORE";
                if (this.submitScoreFeeNote) this.submitScoreFeeNote.classList.add('hidden');
            }
        }
    }

    hideGameOverScreen() {
        this.gameOverScreen.classList.add('hidden');
        if (this.submitScoreFeeNote) this.submitScoreFeeNote.classList.add('hidden');
    }

    updateHUD() {
        if (!this.scene) return;

        // Score
        this.scoreVal.innerText = String(Math.floor(this.scene.score)).padStart(6, '0');
        if (this.killsVal) {
            this.killsVal.innerText = String(this.scene.zombiesKilled).padStart(6, '0');
        }
        
        // Dynamic Coins HUD Update
        this.updateCoinsDisplay();

        if (this.healthVal) {
            const hp = Math.max(0, this.scene.health);
            let heartsHtml = '';
            for (let i = 1; i <= 3; i++) {
                if (i <= hp) {
                    heartsHtml += '<span class="heart active">♥</span>';
                } else {
                    heartsHtml += '<span class="heart depleted">♥</span>';
                }
            }
            this.healthVal.innerHTML = heartsHtml;
        }
    }

    getCoins() {
        return parseInt(localStorage.getItem('miniguy_coins') || 0);
    }

    setCoins(val) {
        localStorage.setItem('miniguy_coins', val);
        this.updateCoinsDisplay();
    }

    getLastClaimTime() {
        return parseInt(localStorage.getItem('miniguy_last_claim_time') || 0);
    }

    setLastClaimTime(val) {
        localStorage.setItem('miniguy_last_claim_time', val);
    }

    getStreakDay() {
        return parseInt(localStorage.getItem('miniguy_streak_day') || 0);
    }

    setStreakDay(val) {
        localStorage.setItem('miniguy_streak_day', val);
    }

    updateCoinsDisplay() {
        const coins = this.getCoins();
        const formattedCoins = String(coins).padStart(6, '0');
        if (this.coinsVal) this.coinsVal.innerText = formattedCoins;
        if (this.menuCoinsVal) this.menuCoinsVal.innerText = formattedCoins;
        if (this.checkinCoinsVal) this.checkinCoinsVal.innerText = formattedCoins;
    }

    getCheckinState() {
        const now = Date.now();
        const lastClaim = this.getLastClaimTime();
        const streakDay = this.getStreakDay();
        
        // Cooldown claim interval (24 hours)
        const claimCooldown = 24 * 60 * 60 * 1000;
        // Streak breach limit (48 hours)
        const streakGrace = 48 * 60 * 60 * 1000;
        
        const timeDiff = now - lastClaim;
        const canClaim = lastClaim === 0 || timeDiff >= claimCooldown;
        
        let activeDay = 1;
        if (lastClaim !== 0) {
            if (timeDiff < streakGrace) {
                // Streak is maintained
                if (canClaim) {
                    activeDay = (streakDay % 7) + 1;
                } else {
                    activeDay = streakDay;
                }
            } else {
                // More than 48 hours passed: streak breaks!
                activeDay = 1;
            }
        }
        
        return {
            canClaim,
            activeDay,
            timeDiff,
            lastClaim,
            streakDay,
            timeLeft: claimCooldown - timeDiff
        };
    }

    updateCheckinModal() {
        const state = this.getCheckinState();
        
        if (this.checkinStreakVal) {
            const currentStreak = (state.lastClaim !== 0 && (Date.now() - state.lastClaim < 48 * 60 * 60 * 1000)) ? state.streakDay : 0;
            this.checkinStreakVal.innerText = currentStreak;
        }
        
        this.updateCoinsDisplay();
        
        this.checkinCards.forEach(card => {
            const day = parseInt(card.getAttribute('data-day'));
            card.classList.remove('claimed', 'active', 'locked');
            
            const isStreakMaintained = state.lastClaim !== 0 && (Date.now() - state.lastClaim < 48 * 60 * 60 * 1000);
            
            if (isStreakMaintained) {
                if (day <= state.streakDay) {
                    card.classList.add('claimed');
                } else if (day === state.activeDay && state.canClaim) {
                    card.classList.add('active');
                } else {
                    card.classList.add('locked');
                }
            } else {
                if (day === 1 && state.canClaim) {
                    card.classList.add('active');
                } else {
                    card.classList.add('locked');
                }
            }
        });
        
        if (state.canClaim) {
            if (this.btnCheckinClaim) this.btnCheckinClaim.classList.remove('hidden');
            if (this.checkinTimer) this.checkinTimer.classList.add('hidden');
            
            const rewardAmount = CHECKIN_REWARDS[state.activeDay];
            if (this.btnCheckinClaim) {
                if (this.userAddress && this.contract) {
                    this.btnCheckinClaim.innerText = `CLAIM ${rewardAmount} COINS`;
                } else {
                    this.btnCheckinClaim.innerText = `CONNECT WALLET TO CLAIM`;
                }
            }
            if (this.btnCheckinClaim) this.btnCheckinClaim.disabled = false;
        } else {
            if (this.btnCheckinClaim) this.btnCheckinClaim.classList.add('hidden');
            if (this.checkinTimer) this.checkinTimer.classList.remove('hidden');
            this.startCountdownTimer(state.timeLeft);
        }
    }

    startCountdownTimer(timeLeftMs) {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        let remaining = timeLeftMs;
        const updateText = () => {
            if (remaining <= 0) {
                clearInterval(this.countdownInterval);
                this.updateCheckinModal();
                return;
            }
            
            const hours = Math.floor(remaining / (3600 * 1000));
            const minutes = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
            const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
            
            const formattedTime = [
                String(hours).padStart(2, '0'),
                String(minutes).padStart(2, '0'),
                String(seconds).padStart(2, '0')
            ].join(':');
            
            if (this.checkinTimer) {
                this.checkinTimer.innerText = `NEXT CLAIM IN ${formattedTime}`;
            }
            
            remaining -= 1000;
        };
        
        updateText();
        this.countdownInterval = setInterval(updateText, 1000);
    }

    // --- Web3 Interactions ---

    async connectWallet() {
        const ethereum = this.getInjectedProvider();
        if (!ethereum) {
            alert("No Web3 wallet found! Please install MetaMask or Coinbase Wallet.");
            return;
        }

        try {
            if (this.btnWeb3Connect) {
                this.btnWeb3Connect.innerText = "CONNECTING...";
                this.btnWeb3Connect.disabled = true;
            }

            this.provider = new ethers.BrowserProvider(ethereum);
            
            // Request accounts
            const accounts = await this.provider.send("eth_requestAccounts", []);
            this.userAddress = accounts[0];
            
            // Get signer and instantiate contract using connected network as-is
            this.signer = await this.provider.getSigner();
            this.contractAddress = localStorage.getItem('miniguy_contract_address') || null;
            
            if (this.contractAddress) {
                this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
            } else {
                this.contract = null;
            }

            // Save connection preference
            localStorage.setItem('miniguy_web3_connected', 'true');

            // Update UI components
            if (this.btnWeb3Connect) this.btnWeb3Connect.classList.add('hidden');
            if (this.web3Info) this.web3Info.classList.remove('hidden');
            if (this.web3Address) {
                this.web3Address.innerText = `${this.userAddress.substring(0, 6)}...${this.userAddress.substring(38)}`;
            }

            // Perform network check and overlay warning triggering
            const isCorrectNetwork = await this.checkNetwork();

            if (isCorrectNetwork) {
                // Sync onchain state & leaderboard
                await this.loadOnchainPlayerState();
                await this.fetchLeaderboard();

                // If Game Over screen is active, adjust button
                if (this.gameOverScreen && !this.gameOverScreen.classList.contains('hidden') && this.btnSubmitScore) {
                    this.btnSubmitScore.innerText = "SUBMIT SCORE ONCHAIN";
                    if (this.submitScoreFeeNote) this.submitScoreFeeNote.classList.remove('hidden');
                }
            }
        } catch (e) {
            console.error("Wallet connection failed:", e);
            alert("Connection failed: " + e.message);
            this.disconnectWallet();
        } finally {
            if (this.btnWeb3Connect) {
                this.btnWeb3Connect.innerText = "CONNECT BASE WALLET";
                this.btnWeb3Connect.disabled = false;
            }
        }
    }

    disconnectWallet() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.contract = null;
        this.onchainState = null;
        localStorage.removeItem('miniguy_web3_connected');

        if (this.btnWeb3Connect) this.btnWeb3Connect.classList.remove('hidden');
        if (this.web3Info) this.web3Info.classList.add('hidden');
        if (this.btnSubmitScore) {
            this.btnSubmitScore.innerText = "CONNECT TO SUBMIT SCORE";
            if (this.submitScoreFeeNote) this.submitScoreFeeNote.classList.add('hidden');
        }
        if (this.networkWarningOverlay) {
            this.networkWarningOverlay.classList.add('hidden');
            this.networkWarningOverlay.style.display = 'none';
        }

        this.updateCoinsDisplay();
        this.updateCheckinModal();
        this.updateOnboardingState();
        this.fetchLeaderboard();
    }

    updateContractDisplay() {
        this.contractAddress = localStorage.getItem('miniguy_contract_address') || null;
        if (this.startContractVal) {
            if (this.contractAddress) {
                this.startContractVal.innerText = `${this.contractAddress.substring(0, 6)}...${this.contractAddress.substring(38)}`;
                this.startContractVal.style.color = 'var(--color-success)';
                this.startContractVal.title = this.contractAddress;
            } else {
                this.startContractVal.innerText = 'NONE (DEPLOY ONE FIRST)';
                this.startContractVal.style.color = 'var(--color-danger)';
            }
        }
    }

    async loadOnchainPlayerState() {
        if (!this.userAddress) return;
        this.updateContractDisplay();

        if (!this.contractAddress) {
            console.log("Onchain player progress: no smart contract deployed.");
            return;
        }

        try {
            if (!this.contract && this.signer) {
                this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
            }

            if (this.contract) {
                const state = await this.contract.getPlayerState(this.userAddress);
                this.onchainState = {
                    coins: Number(state[0]),
                    streak: Number(state[1]),
                    lastCheckIn: Number(state[2]) * 1000, // block timestamp seconds to ms
                    highScore: Number(state[3])
                };

                // Sync locally so internal game loops read synced variables
                localStorage.setItem('miniguy_coins', this.onchainState.coins);
                localStorage.setItem('miniguy_streak_day', this.onchainState.streak);
                localStorage.setItem('miniguy_last_claim_time', this.onchainState.lastCheckIn);
                localStorage.setItem('miniguy_highscore', this.onchainState.highScore);

                this.updateCoinsDisplay();
                this.updateCheckinModal();
            }
        } catch (e) {
            console.error("Failed to load onchain state:", e);
        }
    }

    async claimReward() {
        const state = this.getCheckinState();
        if (!state.canClaim) return;

        // If no wallet is connected or contract not loaded, trigger wallet connection
        if (!this.userAddress || !this.contract) {
            await this.connectWallet();
            // Check again after connection attempt
            if (!this.userAddress || !this.contract) {
                if (!this.contractAddress) {
                    alert("No smart contract deployed. Please deploy the game contract first using deploy-contract.html!");
                }
                return;
            }
        }

        // Onchain Claim with Builder Code attribution
        try {
            this.btnCheckinClaim.innerText = "PENDING WALLET...";
            this.btnCheckinClaim.disabled = true;

            // Generate calldata and append Builder Code
            let tx;
            if (typeof this.contract.claimDailyCheckIn.populateTransaction === 'function') {
                tx = await this.contract.claimDailyCheckIn.populateTransaction({ value: ethers.parseEther("0.000003") });
            } else {
                tx = await this.contract.getFunction("claimDailyCheckIn").populateTransaction({ value: ethers.parseEther("0.000003") });
            }
            tx.data = tx.data + this.builderCodeHex;
            console.log("Onchain check-in transaction calldata with builder suffix:", tx.data);

            // Send transaction
            const response = await this.signer.sendTransaction(tx);
            this.btnCheckinClaim.innerText = "MINING TRANSACTION...";
            console.log("Onchain check-in transaction sent:", response.hash);

            // Wait for mining
            await response.wait();
            console.log("Onchain check-in confirmed!");

            // Re-load onchain state to sync to local storage/UI
            await this.loadOnchainPlayerState();

            // Trigger explosion & sound using current active day reward amount
            const rewardAmount = CHECKIN_REWARDS[state.activeDay];
            gameAudio.init();
            if (typeof gameAudio.playCoin === 'function') {
                gameAudio.playCoin();
            } else {
                gameAudio.playPowerup();
            }
            this.triggerClaimAnimation(rewardAmount);
        } catch (e) {
            console.error("Onchain check-in failed:", e);
            alert("Transaction failed: " + (e.reason || e.message || e));
        } finally {
            this.updateCheckinModal();
        }
    }

    async submitScoreOnchain() {
        if (!this.userAddress || !this.contract) {
            await this.connectWallet();
            if (!this.userAddress || !this.contract) return;
        }

        // Validate values
        const rawScore = this.latestGameScore;
        const rawDistance = this.latestDistance;
        const rawKills = this.latestKills;
        const username = localStorage.getItem('miniguy_username') || '';
        const walletAddress = this.userAddress;

        // Perform validations
        if (typeof rawScore !== 'number' || isNaN(rawScore) || rawScore < 0) {
            alert("Validation failed: Invalid score value.");
            return;
        }
        if (typeof rawDistance !== 'number' || isNaN(rawDistance) || rawDistance < 0) {
            alert("Validation failed: Invalid distance value.");
            return;
        }
        if (typeof rawKills !== 'number' || isNaN(rawKills) || rawKills < 0) {
            alert("Validation failed: Invalid zombies defeated value.");
            return;
        }
        if (typeof username !== 'string' || username.trim().length === 0) {
            alert("Validation failed: Username is not set.");
            return;
        }
        if (typeof walletAddress !== 'string' || walletAddress.length === 0) {
            alert("Validation failed: Wallet address is not set.");
            return;
        }

        // Convert numbers to correct BigInt (uint256) format
        const scoreVal = BigInt(Math.floor(rawScore));
        const distanceVal = BigInt(Math.floor(rawDistance));
        const killsVal = BigInt(Math.floor(rawKills));
        const usernameStr = String(username);
        const walletAddrStr = String(walletAddress);

        // Add console logs before transaction showing exact submitScore arguments
        console.log("-----------------------------------------");
        console.log("Onchain score submission pre-flight validation passed!");
        console.log("Contract Address:", this.contractAddress);
        console.log("Connected Network Signer Address:", walletAddrStr);
        console.log("Username (string):", usernameStr);
        console.log("Distance (uint256):", distanceVal.toString());
        console.log("Zombies Defeated (uint256):", killsVal.toString());
        console.log("Exact submitScore argument:");
        console.log("  - score (uint256):", scoreVal.toString());
        console.log("-----------------------------------------");

        try {
            if (this.btnSubmitScore) {
                this.btnSubmitScore.innerText = "PENDING WALLET...";
                this.btnSubmitScore.disabled = true;
            }

            // Generate calldata and append Builder Code
            let tx;
            if (typeof this.contract.submitScore.populateTransaction === 'function') {
                tx = await this.contract.submitScore.populateTransaction(scoreVal, { value: ethers.parseEther("0.000003") });
            } else {
                tx = await this.contract.getFunction("submitScore").populateTransaction(scoreVal, { value: ethers.parseEther("0.000003") });
            }
            tx.data = tx.data + this.builderCodeHex;
            console.log("Onchain score submission transaction calldata with builder suffix:", tx.data);

            // Send transaction
            const response = await this.signer.sendTransaction(tx);
            if (this.btnSubmitScore) {
                this.btnSubmitScore.innerText = "MINING SCORE...";
            }
            console.log("Score submission transaction sent:", response.hash);

            // Wait for mining
            await response.wait();
            console.log("Score submission confirmed!");

            if (this.btnSubmitScore) {
                this.btnSubmitScore.innerText = "SCORE SUBMITTED!";
                this.btnSubmitScore.style.borderColor = 'var(--color-success)';
                this.btnSubmitScore.style.color = 'var(--color-success)';
            }

            // Sync onchain state & reload leaderboard
            await this.loadOnchainPlayerState();
            await this.fetchLeaderboard();
        } catch (e) {
            console.error("Score submission failed:", e);
            
            // Extract clear error/revert reason
            let revertReason = e.message || String(e);
            if (e.reason) {
                revertReason = e.reason;
            } else if (e.data && e.data.message) {
                revertReason = e.data.message;
            } else if (e.error && e.error.message) {
                revertReason = e.error.message;
            } else if (e.message && e.message.includes("Panic")) {
                const match = e.message.match(/Panic due to [A-Z_]+(?:\(\d+\))?/);
                if (match) revertReason = match[0];
            }
            
            alert("Submission failed: " + revertReason);
            
            if (this.btnSubmitScore) {
                this.btnSubmitScore.innerText = "SUBMIT SCORE ONCHAIN";
                this.btnSubmitScore.disabled = false;
            }
        }
    }

    async fetchLeaderboard() {
        this.contractAddress = localStorage.getItem('miniguy_contract_address') || null;
        this.updateContractDisplay();

        if (!this.leaderboardList) return;

        if (!this.contractAddress) {
            this.leaderboardList.innerHTML = '<div style="text-align: center; color: #666; font-size: 7px; padding: 10px;">DEPLOY CONTRACT TO VIEW SCORES</div>';
            return;
        }

        try {
            let activeContract = this.contract;
            
            // Build a read-only instance if not connected to wallet
            if (!activeContract) {
                let readProvider;
                const ethereum = this.getInjectedProvider();
                if (ethereum) {
                    readProvider = new ethers.BrowserProvider(ethereum);
                } else {
                    readProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
                }
                activeContract = new ethers.Contract(this.contractAddress, this.contractABI, readProvider);
            }

            const entries = await activeContract.getLeaderboard();
            let html = "";
            let rank = 1;
            let hasEntries = false;

            for (let i = 0; i < entries.length; i++) {
                const playerAddr = entries[i].player;
                const score = Number(entries[i].score);

                // Ignore uninitialized or empty entries
                if (!playerAddr || playerAddr === "0x0000000000000000000000000000000000000000") {
                    continue;
                }

                hasEntries = true;
                const isCurrentUser = this.userAddress && (playerAddr.toLowerCase() === this.userAddress.toLowerCase());
                const truncatedAddr = `${playerAddr.substring(0, 6)}...${playerAddr.substring(38)}`;
                const itemClass = `leaderboard-item rank-${rank <= 3 ? rank : 'normal'}`;
                const highlightStyle = isCurrentUser ? 'style="background: #0d250d; border-color: var(--color-success);"' : '';
                const youLabel = isCurrentUser ? ' <span style="color: var(--color-warning);">[YOU]</span>' : '';

                html += `
                    <div class="${itemClass}" ${highlightStyle}>
                        <div>
                            <span class="rank-num">${rank}.</span>
                            <span class="player-addr">${truncatedAddr}${youLabel}</span>
                        </div>
                        <span class="player-score">${score.toLocaleString()}</span>
                    </div>
                `;
                rank++;
            }

            if (!hasEntries) {
                html = '<div style="text-align: center; color: #888; font-size: 7px; padding: 10px;">NO ONCHAIN SCORES YET</div>';
            }

            this.leaderboardList.innerHTML = html;
        } catch (e) {
            console.error("Failed to fetch leaderboard:", e);
            this.leaderboardList.innerHTML = '<div style="text-align: center; color: #ff3333; font-size: 7px; padding: 10px;">ERROR LOADING LEADERBOARD</div>';
        }
    }

    triggerClaimAnimation(amount) {
        if (this.popupRewardAmount) {
            this.popupRewardAmount.innerText = `+${amount} COINS`;
        }
        
        if (this.claimPopupOverlay) {
            this.claimPopupOverlay.classList.remove('hidden');
        }
        
        if (this.coinsContainer) {
            this.coinsContainer.innerHTML = '';
            
            // Spawn coin particles floating up
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    if (!this.coinsContainer) return;
                    
                    const coin = document.createElement('div');
                    coin.className = 'floating-coin-particle';
                    coin.innerText = Math.random() > 0.35 ? '🪙' : '⭐';
                    
                    const leftOffset = Math.random() * 80 + 10; // 10% to 90%
                    coin.style.left = `${leftOffset}%`;
                    
                    const duration = 0.6 + Math.random() * 0.6;
                    coin.style.animationDuration = `${duration}s`;
                    
                    this.coinsContainer.appendChild(coin);
                    
                    setTimeout(() => {
                        if (coin.parentNode === this.coinsContainer) {
                            this.coinsContainer.removeChild(coin);
                        }
                    }, duration * 1000);
                }, i * 45);
            }
        }
    }

    isTouchDevice() {
        return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
    }

    updateOnboardingState() {
        const username = this.usernameInput ? this.usernameInput.value.trim() : "";
        const isUsernameValid = username.length >= 2;
        const isWalletConnected = !!this.userAddress;

        if (this.btnPlay) {
            if (!isWalletConnected && !isUsernameValid) {
                this.btnPlay.innerText = "CONNECT WALLET & CHOOSE USERNAME";
                this.btnPlay.disabled = true;
                if (this.instructionsBox) this.instructionsBox.classList.add('hidden');
                if (this.btnCheckinOpen) this.btnCheckinOpen.classList.add('hidden');
                if (this.contractInfoFooter) this.contractInfoFooter.classList.add('hidden');
            } else if (!isWalletConnected) {
                this.btnPlay.innerText = "CONNECT BASE WALLET TO PLAY";
                this.btnPlay.disabled = true;
                if (this.instructionsBox) this.instructionsBox.classList.add('hidden');
                if (this.btnCheckinOpen) this.btnCheckinOpen.classList.add('hidden');
                if (this.contractInfoFooter) this.contractInfoFooter.classList.add('hidden');
            } else if (!isUsernameValid) {
                this.btnPlay.innerText = "ENTER USERNAME TO PLAY";
                this.btnPlay.disabled = true;
                if (this.instructionsBox) this.instructionsBox.classList.add('hidden');
                if (this.btnCheckinOpen) this.btnCheckinOpen.classList.add('hidden');
                if (this.contractInfoFooter) this.contractInfoFooter.classList.add('hidden');
            } else {
                this.btnPlay.innerText = "START MISSION";
                this.btnPlay.disabled = false;
                if (this.instructionsBox) this.instructionsBox.classList.remove('hidden');
                if (this.btnCheckinOpen) this.btnCheckinOpen.classList.remove('hidden');
                if (this.contractInfoFooter) this.contractInfoFooter.classList.remove('hidden');
            }
        }
    }

    async checkNetwork() {
        if (!this.provider) {
            if (this.networkWarningOverlay) {
                this.networkWarningOverlay.classList.add('hidden');
                this.networkWarningOverlay.style.display = 'none';
            }
            this.updateOnboardingState();
            return true;
        }

        try {
            const network = await this.provider.getNetwork();
            const chainId = network.chainId;
            if (chainId !== 8453n) { // Base L2 Mainnet
                if (this.networkWarningOverlay) {
                    this.networkWarningOverlay.classList.remove('hidden');
                    this.networkWarningOverlay.style.display = 'flex';
                }
                if (this.networkWarningMsg) {
                    this.networkWarningMsg.innerText = "You are currently on an unsupported network. Please switch to the Base Mainnet network to play, submit scores, and claim rewards.";
                }
                this.updateOnboardingState();
                return false;
            }
        } catch (e) {
            console.error("Network check failed:", e);
        }

        if (this.networkWarningOverlay) {
            this.networkWarningOverlay.classList.add('hidden');
            this.networkWarningOverlay.style.display = 'none';
        }
        this.updateOnboardingState();
        return true;
    }

    async handleChainChanged(chainIdHex) {
        console.log("Network chain changed to:", chainIdHex);
        let chainId;
        try {
            chainId = BigInt(chainIdHex);
        } catch (e) {
            console.error("Failed to parse chainId:", chainIdHex, e);
            return;
        }

        const ethereum = this.getInjectedProvider();
        if (ethereum) {
            this.provider = new ethers.BrowserProvider(ethereum);
            if (this.userAddress) {
                this.signer = await this.provider.getSigner();
                if (this.contractAddress) {
                    this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
                }
            }
        }
        
        const isCorrect = await this.checkNetwork();
        if (isCorrect && this.userAddress) {
            await this.loadOnchainPlayerState();
            await this.fetchLeaderboard();
        }
    }

    async handleAccountsChanged(accounts) {
        console.log("Accounts changed:", accounts);
        if (accounts.length === 0) {
            this.disconnectWallet();
        } else {
            this.userAddress = accounts[0];
            const ethereum = this.getInjectedProvider();
            if (ethereum) {
                this.provider = new ethers.BrowserProvider(ethereum);
                this.signer = await this.provider.getSigner();
                if (this.contractAddress) {
                    this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
                }
            }
            if (this.web3Address) {
                this.web3Address.innerText = `${this.userAddress.substring(0, 6)}...${this.userAddress.substring(38)}`;
            }
            if (this.btnWeb3Connect) this.btnWeb3Connect.classList.add('hidden');
            if (this.web3Info) this.web3Info.classList.remove('hidden');
            
            const isCorrect = await this.checkNetwork();
            if (isCorrect) {
                await this.loadOnchainPlayerState();
                await this.fetchLeaderboard();
            }
        }
    }
}

// Global UI Manager
const gameUI = new UIManager();
