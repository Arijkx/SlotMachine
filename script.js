class SlotMachine {
    constructor() {
        this.balance = 100;
        this.accountBalance = 0;
        this.betAmount = 5;
        this.totalWins = 0;
        this.lastWin = 0;
        this.isSpinning = false;
        this.autoSpinActive = false;
        this.autoSpinInterval = null;
        this.lastBonusClaim = null;
        this.lastHourlyBonusClaim = null;
        this.bonusHistory = [];
        
        // Achievements System
        this.achievements = {
            'first-win': { unlocked: false, reward: 10 },
            'big-winner': { unlocked: false, reward: 100 },
            'player': { unlocked: false, reward: 50 },
            'star-hunter': { unlocked: false, reward: 200 },
            'level-5': { unlocked: false, reward: 50 },
            'level-10': { unlocked: false, reward: 100 },
            'level-20': { unlocked: false, reward: 250 },
            'lucky-streak': { unlocked: false, reward: 75 },
            'diamond-collector': { unlocked: false, reward: 300 },
            'hot-wire': { unlocked: false, reward: 150 },
            'grape-king': { unlocked: false, reward: 80 },
            'precision-shooter': { unlocked: false, reward: 60 },
            'lightning-fast': { unlocked: false, reward: 150 },
            'slot-king': { unlocked: false, reward: 1000 },
            'circus-director': { unlocked: false, reward: 500 },
            'money-machine': { unlocked: false, reward: 750 }
        };
        
        // Achievement tracking variables
        this.consecutiveWins = 0;
        this.wonSymbols = new Set();
        
        // Level System
        this.playerLevel = 1;
        this.totalXP = 0;
        this.currentLevelXP = 0;
        this.totalSpins = 0;
        this.wonXP = 0;
        
        // Symbol-Multiplier für Gewinne
        this.symbolMultipliers = {
            '🍒': 10,
            '🍋': 15,
            '🍊': 20,
            '🍇': 25,
            '🔔': 50,
            '⭐': 100
        };
        
        this.symbols = Object.keys(this.symbolMultipliers);
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadFromStorage();
        this.updateDisplay();
        this.initializeTabs();
        this.initializeDailyBonus();
        this.initializeHourlyBonus();
        this.initializeLevelSystem();
        this.initializeSettings();
        this.initializeAchievements();
    }
    
    initializeElements() {
        this.betAmountInput = document.getElementById('bet-amount');
        this.betUpBtn = document.getElementById('bet-up');
        this.betDownBtn = document.getElementById('bet-down');
        this.quickBetBtns = document.querySelectorAll('.quick-bet-btn');
        this.spinBtn = document.getElementById('spin-btn');
        this.autoSpinBtn = document.getElementById('auto-spin-btn');
        this.lastWinElement = document.getElementById('last-win');
        this.totalWinsElement = document.getElementById('total-wins');
        this.balanceInfoElement = document.getElementById('balance-info');
        this.accountBalanceElement = document.getElementById('account-balance');
        this.winMessage = document.getElementById('win-message');
        this.winAmount = document.getElementById('win-amount');
        
        // Transfer popup elements
        this.moneyTransferPopup = document.getElementById('money-transfer-popup');
        this.popupTitle = document.getElementById('popup-title');
        this.transferDescription = document.getElementById('transfer-description');
        this.transferAmountInput = document.getElementById('transfer-amount');
        this.availableBalanceDisplay = document.getElementById('available-balance');
        this.accountBalanceDisplay = document.getElementById('account-balance-display');
        this.availableBalanceLabel = document.getElementById('available-balance-label');
        this.accountBalanceLabel = document.getElementById('account-balance-label');
        this.closePopupBtn = document.getElementById('close-popup');
        this.confirmTransferBtn = document.getElementById('confirm-transfer');
        this.cancelTransferBtn = document.getElementById('cancel-transfer');
        this.quickAmountBtns = document.querySelectorAll('.quick-amount');
        
        this.currentTransferType = null; // 'withdraw' or 'deposit'
        
        this.reels = [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3')
        ];
        
        // Tab elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Daily bonus elements
        this.availableBonusesList = document.getElementById('available-bonuses');
        this.bonusList = document.getElementById('bonus-list');
        
        // Level elements
        this.playerLevelElement = document.getElementById('player-level');
        this.currentXPElement = document.getElementById('current-xp');
        this.nextLevelXPElement = document.getElementById('next-level-xp');
        this.xpProgressElement = document.getElementById('xp-progress');
        this.levelDisplayElement = document.getElementById('level-display');
        this.totalXPDisplayElement = document.getElementById('total-xp-display');
        this.totalSpinsDisplayElement = document.getElementById('total-spins-display');
        this.wonXPDisplayElement = document.getElementById('won-xp-display');
        
        console.log('Level Elements initialisiert:', {
            playerLevelElement: !!this.playerLevelElement,
            currentXPElement: !!this.currentXPElement,
            nextLevelXPElement: !!this.nextLevelXPElement,
            xpProgressElement: !!this.xpProgressElement,
            levelDisplayElement: !!this.levelDisplayElement,
            totalXPDisplayElement: !!this.totalXPDisplayElement,
            totalSpinsDisplayElement: !!this.totalSpinsDisplayElement,
            wonXPDisplayElement: !!this.wonXPDisplayElement
        });
        
        // Settings elements
        this.downloadBackupBtn = document.getElementById('download-backup');
        this.uploadBackupBtn = document.getElementById('upload-backup');
        this.backupFileInput = document.getElementById('backup-file');
        this.storageStatus = document.getElementById('storage-status');
    }
    
    setupEventListeners() {
        this.spinBtn.addEventListener('click', () => this.spin());
        this.autoSpinBtn.addEventListener('click', () => this.toggleAutoSpin());
        this.betUpBtn.addEventListener('click', () => this.increaseBet());
        this.betDownBtn.addEventListener('click', () => this.decreaseBet());
        this.betAmountInput.addEventListener('change', () => this.updateBetAmount());
        
        // Quick bet buttons
        this.quickBetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const betAmount = parseInt(btn.getAttribute('data-bet'));
                this.setQuickBet(betAmount);
            });
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isSpinning) {
                e.preventDefault();
                this.spin();
            }
        });
        
        // Daily bonus events - handled in updateAvailableBonuses()
        
        // Settings events
        this.downloadBackupBtn.addEventListener('click', () => this.downloadBackup());
        this.uploadBackupBtn.addEventListener('click', () => this.backupFileInput.click());
        this.backupFileInput.addEventListener('change', (e) => this.uploadBackup(e));
        this.resetGameBtn = document.getElementById('reset-game');
        this.resetGameBtn.addEventListener('click', () => this.resetGame());
        
        // Balance and account click events
        document.querySelector('.balance-info').addEventListener('click', () => this.openTransferPopup('withdraw'));
        document.querySelector('.account-info').addEventListener('click', () => this.openTransferPopup('deposit'));
        
        // Transfer popup events
        this.closePopupBtn.addEventListener('click', () => this.closeTransferPopup());
        this.cancelTransferBtn.addEventListener('click', () => this.closeTransferPopup());
        this.confirmTransferBtn.addEventListener('click', () => this.confirmTransfer());
        this.transferAmountInput.addEventListener('change', () => this.updateTransferAmount());
        
        // Quick amount buttons
        this.quickAmountBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.getAttribute('data-amount'));
                this.transferAmountInput.value = amount;
                this.updateTransferAmount();
            });
        });
        
        // Close popup when clicking outside
        this.moneyTransferPopup.addEventListener('click', (e) => {
            if (e.target === this.moneyTransferPopup) {
                this.closeTransferPopup();
            }
        });
    }
    
    updateBetAmount() {
        const newBet = parseInt(this.betAmountInput.value);
        if (newBet >= 1 && newBet <= 50 && newBet <= this.balance) {
            this.betAmount = newBet;
        } else {
            this.betAmountInput.value = this.betAmount;
        }
    }
    
    setQuickBet(amount) {
        // Limit to available balance and max bet
        const maxBet = Math.min(50, this.balance);
        const finalAmount = Math.min(amount, maxBet);
        
        if (finalAmount >= 1) {
            this.betAmount = finalAmount;
            this.betAmountInput.value = finalAmount;
            this.updateDisplay();
            
            // Show notification if amount was limited
            if (amount > maxBet) {
                this.showNotification(`Einsatz auf €${finalAmount} begrenzt (max. verfügbar)`, 'info');
            }
        } else {
            this.showNotification('Nicht genug Guthaben für diesen Einsatz!', 'error');
        }
    }
    
    increaseBet() {
        if (this.betAmount < 50 && this.betAmount < this.balance) {
            this.betAmount = Math.min(this.betAmount + 1, 50, this.balance);
            this.betAmountInput.value = this.betAmount;
        }
    }
    
    decreaseBet() {
        if (this.betAmount > 1) {
            this.betAmount = Math.max(this.betAmount - 1, 1);
            this.betAmountInput.value = this.betAmount;
        }
    }
    
    async spin() {
        if (this.isSpinning || this.balance < this.betAmount) {
            return;
        }
        
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.spinBtn.textContent = 'SPINNING';
        
        // Deduct bet from balance
        this.balance -= this.betAmount;
        this.totalSpins++;
        this.addXP(1, 'spin'); // 1 XP pro Spin
        this.updateDisplay();
        
        // Start spinning animation
        this.startSpinning();
        
        // Stop reels at different times for realistic effect
        setTimeout(() => this.stopReel(0), 1000);
        setTimeout(() => this.stopReel(1), 1500);
        setTimeout(() => this.stopReel(2), 2000);
        
        // Check for wins after all reels stop
        setTimeout(() => {
            this.checkWin();
            this.isSpinning = false;
            this.spinBtn.disabled = false;
            this.spinBtn.textContent = 'SPIN';
            this.updateDisplay();
            
            // Continue auto spin if active
            if (this.autoSpinActive && this.balance >= this.betAmount) {
                setTimeout(() => this.spin(), 1000);
            } else if (this.autoSpinActive && this.balance < this.betAmount) {
                this.stopAutoSpin();
            }
        }, 2500);
    }
    
    startSpinning() {
        this.reels.forEach(reel => {
            reel.classList.add('spinning');
        });
    }
    
    stopReel(reelIndex) {
        const reel = this.reels[reelIndex];
        reel.classList.remove('spinning');
        
        // Set final symbol
        const finalSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        this.setReelSymbol(reelIndex, finalSymbol);
    }
    
    setReelSymbol(reelIndex, symbol) {
        const reel = this.reels[reelIndex];
        const symbols = reel.querySelectorAll('.symbol');
        
        // Set the middle symbol (index 4) to the final symbol
        symbols[4].textContent = symbol;
        
        // Set surrounding symbols for visual continuity
        const symbolIndex = this.symbols.indexOf(symbol);
        symbols.forEach((sym, index) => {
            if (index !== 4) {
                const surroundingIndex = (symbolIndex + index - 4 + this.symbols.length) % this.symbols.length;
                sym.textContent = this.symbols[surroundingIndex];
            }
        });
    }
    
    checkWin() {
        const symbols = this.getVisibleSymbols();
        const winAmount = this.calculateWin(symbols);
        
        if (winAmount > 0) {
            this.balance += winAmount;
            this.lastWin = winAmount;
            this.totalWins += winAmount;
            this.addXP(winAmount, 'win'); // 1 XP pro gewonnenem Euro
            this.showWinMessage(winAmount);
            
            // Track consecutive wins
            this.consecutiveWins++;
            
            // Check achievements after a win
            this.checkAchievements();
            this.checkStarHunterAchievement(symbols);
        } else {
            this.lastWin = 0;
            // Reset consecutive wins on loss
            this.consecutiveWins = 0;
        }
    }
    
    getVisibleSymbols() {
        const symbols = [];
        this.reels.forEach((reel, index) => {
            const allSymbols = reel.querySelectorAll('.symbol');
            const middleSymbol = allSymbols[1];
            symbols.push(middleSymbol ? middleSymbol.textContent : '');
        });
        return symbols;
    }
    
    calculateWin(symbols) {
        // Check for three of a kind
        if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
            const multiplier = this.symbolMultipliers[symbols[0]];
            return this.betAmount * multiplier;
        }
        
        // Check for two of a kind (smaller win)
        if (symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2]) {
            return this.betAmount * 2;
        }
        
        return 0;
    }
    
    showWinMessage(winAmount) {
        this.showNotification(`Du hast ${this.formatNumber(winAmount)}€ gewonnen!`, 'success');
    }
    
    toggleAutoSpin() {
        if (this.autoSpinActive) {
            this.stopAutoSpin();
        } else {
            this.startAutoSpin();
        }
    }
    
    startAutoSpin() {
        if (this.balance < this.betAmount) {
            return;
        }
        
        this.autoSpinActive = true;
        this.autoSpinBtn.textContent = 'STOP AUTO';
        this.autoSpinBtn.classList.add('active');
        this.spinBtn.disabled = true;
        
        // Start first spin
        this.spin();
    }
    
    stopAutoSpin() {
        this.autoSpinActive = false;
        this.autoSpinBtn.textContent = 'AUTO SPIN';
        this.autoSpinBtn.classList.remove('active');
        this.spinBtn.disabled = false;
    }
    
    updateDisplay() {
        this.balanceInfoElement.textContent = this.formatNumber(this.balance);
        this.accountBalanceElement.textContent = this.formatNumber(this.accountBalance);
        this.lastWinElement.textContent = this.formatNumber(this.lastWin);
        this.totalWinsElement.textContent = this.formatNumber(this.totalWins);
        
        // Save to storage whenever display is updated
        this.saveToStorage();
        
        // Update bet input max value
        this.betAmountInput.max = Math.min(50, this.balance);
        
        // Disable spin button if not enough balance
        if (this.balance < this.betAmount) {
            this.spinBtn.disabled = true;
            this.spinBtn.textContent = 'no money';
            if (this.autoSpinActive) {
                this.stopAutoSpin();
            }
        } else if (!this.isSpinning && !this.autoSpinActive) {
            this.spinBtn.disabled = false;
            this.spinBtn.textContent = 'SPIN';
        }
    }
    
    // Transfer Popup System
    openTransferPopup(type) {
        this.currentTransferType = type;
        
        if (type === 'withdraw') {
            this.popupTitle.textContent = 'Guthaben auszahlen';
            this.transferDescription.textContent = 'Wählen Sie den Betrag, den Sie auf Ihr Konto auszahlen möchten:';
            this.availableBalanceLabel.textContent = 'Verfügbares Guthaben: €';
            this.accountBalanceLabel.textContent = 'Kontostand: €';
            this.availableBalanceDisplay.textContent = this.balance;
            this.accountBalanceDisplay.textContent = this.accountBalance;
        } else if (type === 'deposit') {
            this.popupTitle.textContent = 'Guthaben einzahlen';
            this.transferDescription.textContent = 'Wählen Sie den Betrag, den Sie von Ihrem Konto einzahlen möchten:';
            this.availableBalanceLabel.textContent = 'Verfügbares Guthaben: €';
            this.accountBalanceLabel.textContent = 'Automat: €';
            this.availableBalanceDisplay.textContent = this.accountBalance;
            this.accountBalanceDisplay.textContent = this.balance;
        }
        
        this.transferAmountInput.value = 10;
        this.updateTransferAmount();
        this.moneyTransferPopup.classList.remove('hidden');
    }
    
    closeTransferPopup() {
        this.moneyTransferPopup.classList.add('hidden');
        this.currentTransferType = null;
    }
    
    updateTransferAmount() {
        const amount = parseInt(this.transferAmountInput.value) || 0;
        const maxAmount = this.currentTransferType === 'withdraw' ? this.balance : this.accountBalance;
        
        if (amount > maxAmount) {
            this.transferAmountInput.value = maxAmount;
        }
        
        if (amount < 1) {
            this.transferAmountInput.value = 1;
        }
        
        if (amount > 1000) {
            this.transferAmountInput.value = 1000;
        }
        
        this.updateTransferButton();
    }
    
    updateTransferButton() {
        const amount = parseInt(this.transferAmountInput.value) || 0;
        const maxAmount = this.currentTransferType === 'withdraw' ? this.balance : this.accountBalance;
        const canTransfer = amount > 0 && amount <= maxAmount && amount <= 1000;
        
        this.confirmTransferBtn.disabled = !canTransfer;
        this.confirmTransferBtn.textContent = canTransfer ? 'Bestätigen' : 'Ungültiger Betrag';
    }
    
    confirmTransfer() {
        const amount = parseInt(this.transferAmountInput.value);
        
        if (this.currentTransferType === 'withdraw') {
            if (amount > this.balance || amount <= 0) {
                this.showNotification('Ungültiger Auszahlungsbetrag!', 'error');
                return;
            }
            
            this.balance -= amount;
            this.accountBalance += amount;
            
            this.showNotification(`€${amount} erfolgreich auf Ihr Konto überwiesen!`, 'success');
        } else if (this.currentTransferType === 'deposit') {
            if (amount > this.accountBalance || amount <= 0) {
                this.showNotification('Ungültiger Einzahlungsbetrag!', 'error');
                return;
            }
            
            this.accountBalance -= amount;
            this.balance += amount;
            
            this.showNotification(`€${amount} erfolgreich auf Ihr Guthaben eingezahlt!`, 'success');
        }
        
        this.updateDisplay();
        this.closeTransferPopup();
    }
    
    showNotification(message, type = 'info') {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    // Tab System
    initializeTabs() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }
    
    switchTab(tabId) {
        // Remove active class from all tabs and contents
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }
    
    // Local Storage
    saveToStorage() {
        const gameData = {
            balance: this.balance,
            accountBalance: this.accountBalance,
            betAmount: this.betAmount,
            totalWins: this.totalWins,
            lastWin: this.lastWin,
            lastBonusClaim: this.lastBonusClaim,
            lastHourlyBonusClaim: this.lastHourlyBonusClaim,
            bonusHistory: this.bonusHistory,
            playerLevel: this.playerLevel,
            totalXP: this.totalXP,
            totalSpins: this.totalSpins,
            wonXP: this.wonXP,
            achievements: this.achievements,
            consecutiveWins: this.consecutiveWins,
            wonSymbols: Array.from(this.wonSymbols),
            timestamp: Date.now()
        };
        localStorage.setItem('slotMachineData', JSON.stringify(gameData));
    }
    
    loadFromStorage() {
        const savedData = localStorage.getItem('slotMachineData');
        if (savedData) {
            try {
                const gameData = JSON.parse(savedData);
                this.balance = gameData.balance !== undefined ? gameData.balance : 100;
                this.accountBalance = gameData.accountBalance !== undefined ? gameData.accountBalance : 0;
                this.betAmount = gameData.betAmount !== undefined ? gameData.betAmount : 5;
                this.totalWins = gameData.totalWins !== undefined ? gameData.totalWins : 0;
            this.lastWin = gameData.lastWin !== undefined ? gameData.lastWin : 0;
            this.lastBonusClaim = gameData.lastBonusClaim || null;
            this.lastHourlyBonusClaim = gameData.lastHourlyBonusClaim || null;
            this.bonusHistory = gameData.bonusHistory || [];
            this.playerLevel = gameData.playerLevel !== undefined ? gameData.playerLevel : 1;
            this.totalXP = gameData.totalXP !== undefined ? gameData.totalXP : 0;
            this.totalSpins = gameData.totalSpins !== undefined ? gameData.totalSpins : 0;
            this.wonXP = gameData.wonXP !== undefined ? gameData.wonXP : 0;
            this.achievements = gameData.achievements || this.achievements;
            this.consecutiveWins = gameData.consecutiveWins || 0;
            this.wonSymbols = new Set(gameData.wonSymbols || []);
            } catch (e) {
                console.log('Error loading saved data:', e);
            }
        }
    }
    
    // Daily Bonus System
    initializeDailyBonus() {
        this.updateAvailableBonuses();
        this.updateBonusHistory();
        setInterval(() => this.updateAvailableBonuses(), 1000);
    }
    
    // Hourly Bonus System
    initializeHourlyBonus() {
        setInterval(() => this.updateAvailableBonuses(), 1000);
    }
    
    // Level System
    initializeLevelSystem() {
        this.updateLevelDisplay();
    }
    
    addXP(amount, source = 'spin') {
        this.totalXP += amount;
        
        if (source === 'win') {
            this.wonXP += amount;
        }
        
        console.log(`XP hinzugefügt: ${amount} (${source}), Total XP: ${this.totalXP}, Level: ${this.playerLevel}`);
        console.log(`Elements existieren: playerLevelElement=${!!this.playerLevelElement}, currentXPElement=${!!this.currentXPElement}, xpProgressElement=${!!this.xpProgressElement}`);
        
        this.checkLevelUp();
        this.updateLevelDisplay();
        this.saveToStorage();
    }
    
    checkLevelUp() {
        const xpNeededForNextLevel = this.getXPForLevel(this.playerLevel + 1);
        
        if (this.totalXP >= xpNeededForNextLevel) {
            this.playerLevel++;
            this.showNotification(`Level Up! Jetzt Level ${this.playerLevel}!`, 'success');
            this.checkLevelRewards();
        }
    }
    
    getXPForLevel(level) {
        // XP needed to REACH this level (cumulative)
        // Level 1: 0 XP, Level 2: 100 XP, Level 3: 282 XP, etc.
        if (level <= 1) return 0;
        return Math.floor(100 * Math.pow(level - 1, 1.5));
    }
    
    checkLevelRewards() {
        // Level rewards are now handled as achievements
        this.checkLevelAchievements();
    }
    
    checkLevelAchievements() {
        // Level 5 Achievement
        if (!this.achievements['level-5'].unlocked && this.playerLevel >= 5) {
            this.unlockAchievement('level-5');
        }
        
        // Level 10 Achievement
        if (!this.achievements['level-10'].unlocked && this.playerLevel >= 10) {
            this.unlockAchievement('level-10');
        }
        
        // Level 20 Achievement
        if (!this.achievements['level-20'].unlocked && this.playerLevel >= 20) {
            this.unlockAchievement('level-20');
        }
    }
    
    updateLevelDisplay() {
        // Calculate XP for current level
        const currentLevelStartXP = this.getXPForLevel(this.playerLevel);
        const nextLevelXP = this.getXPForLevel(this.playerLevel + 1);
        const xpInCurrentLevel = this.totalXP - currentLevelStartXP;
        const xpNeededForNextLevel = nextLevelXP - currentLevelStartXP;
        const progressPercentage = Math.max(0, Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100));
        
        console.log(`Level Display Update: Level ${this.playerLevel}, Total XP: ${this.totalXP}, Current Level Start: ${currentLevelStartXP}, Next Level: ${nextLevelXP}, XP in Level: ${xpInCurrentLevel}, Needed: ${xpNeededForNextLevel}, Progress: ${progressPercentage}%`);
        
        // Update XP Bar
        if (this.playerLevelElement) this.playerLevelElement.textContent = this.playerLevel;
        if (this.currentXPElement) this.currentXPElement.textContent = Math.max(0, xpInCurrentLevel);
        if (this.nextLevelXPElement) this.nextLevelXPElement.textContent = xpNeededForNextLevel;
        if (this.xpProgressElement) this.xpProgressElement.style.width = `${progressPercentage}%`;
        
        // Update Level Panel
        if (this.levelDisplayElement) this.levelDisplayElement.textContent = this.playerLevel;
        if (this.totalXPDisplayElement) this.totalXPDisplayElement.textContent = this.formatNumber(this.totalXP);
        if (this.totalSpinsDisplayElement) this.totalSpinsDisplayElement.textContent = this.formatNumber(this.totalSpins);
        if (this.wonXPDisplayElement) this.wonXPDisplayElement.textContent = this.formatNumber(this.wonXP);
    }
    
    
    claimBonus() {
        this.accountBalance += 100;
        this.lastBonusClaim = Date.now();
        this.bonusHistory.unshift({
            date: new Date().toLocaleString(),
            amount: 100,
            type: 'daily'
        });
        
        // Keep only last 10 bonus claims
        if (this.bonusHistory.length > 10) {
            this.bonusHistory = this.bonusHistory.slice(0, 10);
        }
        
        this.updateDisplay();
        this.updateAvailableBonuses();
        this.updateBonusHistory();
        this.saveToStorage();
        
        // Show success message
        this.showNotification('100€ Bonus auf Ihr Konto überwiesen!', 'success');
    }
    
    
    claimHourlyBonus() {
        this.accountBalance += 50;
        this.lastHourlyBonusClaim = Date.now();
        this.bonusHistory.unshift({
            date: new Date().toLocaleString(),
            amount: 50,
            type: 'hourly'
        });
        
        // Keep only last 10 bonus claims
        if (this.bonusHistory.length > 10) {
            this.bonusHistory = this.bonusHistory.slice(0, 10);
        }
        
        this.updateDisplay();
        this.updateAvailableBonuses();
        this.updateBonusHistory();
        this.saveToStorage();
        
        // Show success message
        this.showNotification('50€ Bonus auf Ihr Konto überwiesen!', 'success');
    }
    
    updateBonusHistory() {
        this.bonusList.innerHTML = '';
        if (this.bonusHistory.length === 0) {
            this.bonusList.innerHTML = '<div class="bonus-item">Keine Bonus-Historie verfügbar</div>';
        } else {
            this.bonusHistory.forEach(bonus => {
                const bonusItem = document.createElement('div');
                bonusItem.className = 'bonus-item';
                
                const typeLabel = bonus.type === 'daily' ? 'DAILY' : 'HOURLY';
                const typeClass = bonus.type === 'daily' ? 'daily' : 'hourly';
                
                bonusItem.innerHTML = `
                    <div class="bonus-info">
                        <div class="bonus-amount">€${this.formatNumber(bonus.amount)}</div>
                        <div class="bonus-date">${bonus.date}</div>
                    </div>
                    <div class="bonus-type ${typeClass}">${typeLabel}</div>
                `;
                
                this.bonusList.appendChild(bonusItem);
            });
        }
    }
    
    updateAvailableBonuses() {
        // Only create elements if they don't exist
        if (!this.dailyBonusElement) {
            this.createBonusElements();
        }
        
        // Update only the dynamic content
        this.updateBonusTimers();
    }
    
    createBonusElements() {
        this.availableBonusesList.innerHTML = '';
        
        // Daily Bonus
        this.dailyBonusElement = document.createElement('div');
        this.dailyBonusElement.className = 'available-bonus-item';
        this.dailyBonusElement.innerHTML = `
            <div class="bonus-details">
                <div class="bonus-title">🎁 Daily Bonus</div>
                <div class="bonus-description">Holen Sie sich jeden Tag 100€ Bonus!</div>
                <div class="bonus-timer" id="daily-timer">00:00:00</div>
            </div>
            <div class="bonus-actions">
                <div class="bonus-amount-large">€100</div>
                <button class="claim-button-list" id="daily-claim-btn" onclick="slotMachine.claimBonus()">
                    Warten...
                </button>
            </div>
        `;
        
        this.availableBonusesList.appendChild(this.dailyBonusElement);
        
        // Hourly Bonus
        this.hourlyBonusElement = document.createElement('div');
        this.hourlyBonusElement.className = 'available-bonus-item';
        this.hourlyBonusElement.innerHTML = `
            <div class="bonus-details">
                <div class="bonus-title">⏰ 60-Minuten Bonus</div>
                <div class="bonus-description">Holen Sie sich alle 60 Minuten 50€ Bonus!</div>
                <div class="bonus-timer" id="hourly-timer">00:00:00</div>
            </div>
            <div class="bonus-actions">
                <div class="bonus-amount-large">€50</div>
                <button class="claim-button-list" id="hourly-claim-btn" onclick="slotMachine.claimHourlyBonus()">
                    Warten...
                </button>
            </div>
        `;
        
        this.availableBonusesList.appendChild(this.hourlyBonusElement);
        
        // Store references for updates
        this.dailyTimer = document.getElementById('daily-timer');
        this.dailyClaimBtn = document.getElementById('daily-claim-btn');
        this.hourlyTimer = document.getElementById('hourly-timer');
        this.hourlyClaimBtn = document.getElementById('hourly-claim-btn');
    }
    
    updateBonusTimers() {
        const now = Date.now();
        
        // Daily Bonus
        const lastDailyClaim = this.lastBonusClaim || 0;
        const timeSinceLastDaily = now - lastDailyClaim;
        const timeUntilNextDaily = (24 * 60 * 60 * 1000) - timeSinceLastDaily;
        const dailyReady = timeUntilNextDaily <= 0;
        
        this.dailyTimer.textContent = dailyReady ? 'Bereit!' : this.formatTime(timeUntilNextDaily);
        this.dailyClaimBtn.disabled = !dailyReady;
        this.dailyClaimBtn.textContent = dailyReady ? 'Abholen' : 'Warten...';
        this.dailyBonusElement.className = `available-bonus-item ${dailyReady ? 'ready' : ''}`;
        
        // Hourly Bonus
        const lastHourlyClaim = this.lastHourlyBonusClaim || 0;
        const timeSinceLastHourly = now - lastHourlyClaim;
        const timeUntilNextHourly = (60 * 60 * 1000) - timeSinceLastHourly;
        const hourlyReady = timeUntilNextHourly <= 0;
        
        this.hourlyTimer.textContent = hourlyReady ? 'Bereit!' : this.formatTime(timeUntilNextHourly);
        this.hourlyClaimBtn.disabled = !hourlyReady;
        this.hourlyClaimBtn.textContent = hourlyReady ? 'Abholen' : 'Warten...';
        this.hourlyBonusElement.className = `available-bonus-item ${hourlyReady ? 'ready' : ''}`;
    }
    
    formatTime(milliseconds) {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    formatNumber(number) {
        if (number >= 1000000) {
            return (number / 1000000).toFixed(1).replace('.0', '') + 'Mio';
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1).replace('.0', '') + 'k';
        } else {
            return number.toString();
        }
    }
    
    // Settings System
    initializeSettings() {
        this.updateStorageStatus();
    }
    
    updateStorageStatus() {
        const data = localStorage.getItem('slotMachineData');
        const size = data ? new Blob([data]).size : 0;
        const lastSave = data ? new Date(JSON.parse(data).timestamp).toLocaleString() : 'Nie';
        
        this.storageStatus.innerHTML = `
            <div>Speichergröße: ${size} bytes</div>
            <div>Letzter Speichervorgang: ${lastSave}</div>
            <div>Daten vorhanden: ${data ? 'Ja' : 'Nein'}</div>
        `;
    }
    
    downloadBackup() {
        const gameData = {
            balance: this.balance,
            accountBalance: this.accountBalance,
            betAmount: this.betAmount,
            totalWins: this.totalWins,
            lastWin: this.lastWin,
            lastBonusClaim: this.lastBonusClaim,
            lastHourlyBonusClaim: this.lastHourlyBonusClaim,
            bonusHistory: this.bonusHistory,
            playerLevel: this.playerLevel,
            totalXP: this.totalXP,
            totalSpins: this.totalSpins,
            wonXP: this.wonXP,
            achievements: this.achievements,
            consecutiveWins: this.consecutiveWins,
            wonSymbols: Array.from(this.wonSymbols),
            timestamp: Date.now(),
            version: '2.0'
        };
        
        const dataStr = JSON.stringify(gameData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `slot-machine-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        this.showNotification('Backup erfolgreich heruntergeladen!', 'success');
    }
    
    uploadBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                
                // Validate backup data
                if (backupData.version && backupData.balance !== undefined) {
                    // Core game data
                    this.balance = backupData.balance;
                    this.accountBalance = backupData.accountBalance || 0;
                    this.betAmount = backupData.betAmount || 5;
                    this.totalWins = backupData.totalWins || 0;
                    this.lastWin = backupData.lastWin || 0;
                    
                    // Bonus system data
                    this.lastBonusClaim = backupData.lastBonusClaim || null;
                    this.lastHourlyBonusClaim = backupData.lastHourlyBonusClaim || null;
                    this.bonusHistory = backupData.bonusHistory || [];
                    
                    // Level system data
                    this.playerLevel = backupData.playerLevel || 1;
                    this.totalXP = backupData.totalXP || 0;
                    this.totalSpins = backupData.totalSpins || 0;
                    this.wonXP = backupData.wonXP || 0;
                    
                    // Achievements data
                    this.achievements = backupData.achievements || this.achievements;
                    this.consecutiveWins = backupData.consecutiveWins || 0;
                    this.wonSymbols = new Set(backupData.wonSymbols || []);
                    
                    // Update all displays
                    this.updateDisplay();
                    this.updateBonusHistory();
                    this.updateLevelDisplay();
                    this.updateAchievementsDisplay();
                    this.updateStorageStatus();
                    this.saveToStorage();
                    
                    this.showNotification('✅ Backup erfolgreich wiederhergestellt!', 'success');
                } else {
                    this.showNotification('❌ Ungültige Backup-Datei!', 'error');
                }
            } catch (error) {
                this.showNotification('❌ Fehler beim Laden der Backup-Datei!', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    resetGame() {
        // Show confirmation dialog
        const confirmed = confirm(
            '⚠️ WARNUNG: Dies wird ALLE Ihre Spielstände zurücksetzen!\n\n' +
            '• Guthaben: 100€ (Standard)\n' +
            '• Konto: 0€\n' +
            '• Level: 1\n' +
            '• Alle Erfolge: Gesperrt\n' +
            '• Alle Statistiken: Zurückgesetzt\n\n' +
            'Möchten Sie wirklich fortfahren?'
        );
        
        if (confirmed) {
            // Reset all game data to initial values
            this.balance = 100;
            this.accountBalance = 0;
            this.betAmount = 5;
            this.totalWins = 0;
            this.lastWin = 0;
            this.isSpinning = false;
            this.autoSpinActive = false;
            this.autoSpinInterval = null;
            this.lastBonusClaim = null;
            this.lastHourlyBonusClaim = null;
            this.bonusHistory = [];
            
            // Reset level system
            this.playerLevel = 1;
            this.totalXP = 0;
            this.currentLevelXP = 0;
            this.totalSpins = 0;
            this.wonXP = 0;
            
            // Reset achievements
            this.achievements = {
                'first-win': { unlocked: false, reward: 10 },
                'big-winner': { unlocked: false, reward: 100 },
                'player': { unlocked: false, reward: 50 },
                'star-hunter': { unlocked: false, reward: 200 },
                'level-5': { unlocked: false, reward: 50 },
                'level-10': { unlocked: false, reward: 100 },
                'level-20': { unlocked: false, reward: 250 },
                'lucky-streak': { unlocked: false, reward: 75 },
                'diamond-collector': { unlocked: false, reward: 300 },
                'hot-wire': { unlocked: false, reward: 150 },
                'grape-king': { unlocked: false, reward: 80 },
                'precision-shooter': { unlocked: false, reward: 60 },
                'lightning-fast': { unlocked: false, reward: 150 },
                'slot-king': { unlocked: false, reward: 1000 },
                'circus-director': { unlocked: false, reward: 500 },
                'money-machine': { unlocked: false, reward: 750 }
            };
            
            // Reset achievement tracking
            this.consecutiveWins = 0;
            this.wonSymbols = new Set();
            
            // Stop auto spin if active
            if (this.autoSpinActive) {
                this.stopAutoSpin();
            }
            
            // Update all displays
            this.updateDisplay();
            this.updateBonusHistory();
            this.updateLevelDisplay();
            this.updateAchievementsDisplay();
            this.updateStorageStatus();
            this.saveToStorage();
            
            this.showNotification('🔄 Spiel erfolgreich zurückgesetzt!', 'success');
        }
    }
    
    // Achievements System
    initializeAchievements() {
        this.updateAchievementsDisplay();
    }
    
    checkAchievements() {
        // First Win Achievement
        if (!this.achievements['first-win'].unlocked && this.totalWins > 0) {
            this.unlockAchievement('first-win');
        }
        
        // Big Winner Achievement
        if (!this.achievements['big-winner'].unlocked && this.totalWins >= 1000) {
            this.unlockAchievement('big-winner');
        }
        
        // Player Achievement
        if (!this.achievements['player'].unlocked && this.totalSpins >= 100) {
            this.unlockAchievement('player');
        }
        
        // Lucky Streak Achievement
        if (!this.achievements['lucky-streak'].unlocked && this.consecutiveWins >= 5) {
            this.unlockAchievement('lucky-streak');
        }
        
        // Diamond Collector Achievement
        if (!this.achievements['diamond-collector'].unlocked && this.totalWins >= 5000) {
            this.unlockAchievement('diamond-collector');
        }
        
        // Lightning Fast Achievement
        if (!this.achievements['lightning-fast'].unlocked && this.totalSpins >= 500) {
            this.unlockAchievement('lightning-fast');
        }
        
        // Slot King Achievement
        if (!this.achievements['slot-king'].unlocked && this.playerLevel >= 50) {
            this.unlockAchievement('slot-king');
        }
        
        // Money Machine Achievement
        if (!this.achievements['money-machine'].unlocked && this.totalWins >= 10000) {
            this.unlockAchievement('money-machine');
        }
        
        // Circus Director Achievement
        if (!this.achievements['circus-director'].unlocked && this.wonSymbols.size >= 6) {
            this.unlockAchievement('circus-director');
        }
    }
    
    checkStarHunterAchievement(symbols) {
        // Check for 3x same symbol achievements
        if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
            const symbol = symbols[0];
            
            // Add to won symbols set
            this.wonSymbols.add(symbol);
            
            // Check specific symbol achievements
            if (symbol === '⭐' && !this.achievements['star-hunter'].unlocked) {
                this.unlockAchievement('star-hunter');
            }
            if (symbol === '🔔' && !this.achievements['hot-wire'].unlocked) {
                this.unlockAchievement('hot-wire');
            }
            if (symbol === '🍇' && !this.achievements['grape-king'].unlocked) {
                this.unlockAchievement('grape-king');
            }
            if (symbol === '🍒' && !this.achievements['precision-shooter'].unlocked) {
                this.unlockAchievement('precision-shooter');
            }
        }
    }
    
    unlockAchievement(achievementId) {
        if (!this.achievements[achievementId].unlocked) {
            this.achievements[achievementId].unlocked = true;
            const reward = this.achievements[achievementId].reward;
            this.accountBalance += reward;
            
            this.showNotification(`🏆 Erfolg freigeschaltet! +${reward}€ Bonus!`, 'success');
            this.updateAchievementsDisplay();
            this.updateDisplay();
            this.saveToStorage();
        }
    }
    
    updateAchievementsDisplay() {
        const achievementElements = {
            'first-win': document.getElementById('achievement-first-win'),
            'big-winner': document.getElementById('achievement-big-winner'),
            'player': document.getElementById('achievement-player'),
            'star-hunter': document.getElementById('achievement-star-hunter'),
            'level-5': document.getElementById('achievement-level-5'),
            'level-10': document.getElementById('achievement-level-10'),
            'level-20': document.getElementById('achievement-level-20'),
            'lucky-streak': document.getElementById('achievement-lucky-streak'),
            'diamond-collector': document.getElementById('achievement-diamond-collector'),
            'hot-wire': document.getElementById('achievement-hot-wire'),
            'grape-king': document.getElementById('achievement-grape-king'),
            'precision-shooter': document.getElementById('achievement-precision-shooter'),
            'lightning-fast': document.getElementById('achievement-lightning-fast'),
            'slot-king': document.getElementById('achievement-slot-king'),
            'circus-director': document.getElementById('achievement-circus-director'),
            'money-machine': document.getElementById('achievement-money-machine')
        };
        
        Object.keys(this.achievements).forEach(achievementId => {
            const element = achievementElements[achievementId];
            if (element) {
                if (this.achievements[achievementId].unlocked) {
                    element.textContent = '✅';
                    element.parentElement.classList.add('unlocked');
                } else {
                    element.textContent = '🔒';
                    element.parentElement.classList.remove('unlocked');
                }
            }
        });
    }
}

// Initialize the slot machine when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.slotMachine = new SlotMachine();
});

// Add some fun sound effects (optional - requires audio files)
class SoundEffects {
    constructor() {
        this.audioContext = null;
        this.initAudio();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Audio context not supported:', error);
        }
    }
    
    playSpinSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    playWinSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
}

// Initialize sound effects
const soundEffects = new SoundEffects();
