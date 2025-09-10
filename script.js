class PomodoroTimer {
    constructor() {
        this.timer = null;
        this.isRunning = false;
        this.currentMode = 'work';
        this.sessionCount = 0;
        this.timeLeft = 25 * 60;
        this.totalTime = 25 * 60;

        this.modes = {
            work: { duration: 25, label: '工作时间', color: '#374151' },
            'short-break': { duration: 5, label: '短休息', color: '#374151' },
            'long-break': { duration: 15, label: '长休息', color: '#374151' }
        };

        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeElements() {
        this.timeLeftElement = document.getElementById('timeLeft');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.sessionCountElement = document.getElementById('sessionCount');
        this.currentModeElement = document.getElementById('currentMode');
        this.progressCircle = document.getElementById('progressCircle');
        this.alarmSound = document.getElementById('alarmSound');

        this.workDurationInput = document.getElementById('workDuration');
        this.shortBreakInput = document.getElementById('shortBreakDuration');
        this.longBreakInput = document.getElementById('longBreakDuration');
        this.autoStartInput = document.getElementById('autoStart');

        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.settingsToggle = document.getElementById('settingsToggle');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.settingsIcon = document.getElementById('settingsIcon');
        this.isSettingsOpen = false;
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());

        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isRunning) {
                    this.switchMode(e.target.dataset.mode);
                }
            });
        });

        [this.workDurationInput, this.shortBreakInput, this.longBreakInput].forEach(input => {
            input.addEventListener('change', () => {
                if (!this.isRunning) {
                    this.updateModeDurations();
                    this.resetTimer();
                }
            });
        });

        this.settingsToggle.addEventListener('click', () => this.toggleSettings());
        
        // Close settings when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isSettingsOpen && !this.settingsPanel.contains(e.target) && !this.settingsToggle.contains(e.target)) {
                this.closeSettings();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning) {
                this.lastTimestamp = Date.now();
            } else if (!document.hidden && this.isRunning && this.lastTimestamp) {
                const elapsed = Math.floor((Date.now() - this.lastTimestamp) / 1000);
                this.timeLeft = Math.max(0, this.timeLeft - elapsed);
                if (this.timeLeft === 0) {
                    this.completeTimer();
                } else {
                    this.updateDisplay();
                }
            }
        });
    }

    updateModeDurations() {
        this.modes.work.duration = parseInt(this.workDurationInput.value);
        this.modes['short-break'].duration = parseInt(this.shortBreakInput.value);
        this.modes['long-break'].duration = parseInt(this.longBreakInput.value);
    }

    switchMode(mode) {
        this.currentMode = mode;
        this.updateModeDurations();
        this.timeLeft = this.modes[mode].duration * 60;
        this.totalTime = this.timeLeft;

        this.modeButtons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.className = 'mode-btn px-4 py-2 text-sm font-medium rounded-lg border-2 border-gray-300 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400 active';
            } else {
                btn.className = 'mode-btn px-4 py-2 text-sm font-medium rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-600 transition-all duration-200 hover:border-gray-400';
            }
        });

        this.progressCircle.style.stroke = this.modes[mode].color;
        this.currentModeElement.textContent = this.modes[mode].label;
        this.updateDisplay();
        this.resetProgress();
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.isRunning = true;
        this.startBtn.textContent = '暂停';
        this.startBtn.className = 'px-8 py-3 bg-amber-500 text-white rounded-lg font-medium transition-all duration-200 hover:bg-amber-600 active:scale-95';
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgress();

            if (this.timeLeft <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.startBtn.textContent = '开始';
        this.startBtn.className = 'px-8 py-3 bg-gray-900 text-white rounded-lg font-medium transition-all duration-200 hover:bg-gray-800 active:scale-95';
        clearInterval(this.timer);
    }

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.modes[this.currentMode].duration * 60;
        this.totalTime = this.timeLeft;
        this.updateDisplay();
        this.resetProgress();
    }

    completeTimer() {
        this.pauseTimer();
        this.playAlarm();
        this.showNotification();

        if (this.currentMode === 'work') {
            this.sessionCount++;
            this.sessionCountElement.textContent = this.sessionCount;
            
            const nextMode = this.sessionCount % 4 === 0 ? 'long-break' : 'short-break';
            
            if (this.autoStartInput.checked) {
                setTimeout(() => {
                    this.switchMode(nextMode);
                    this.startTimer();
                }, 3000);
            } else {
                this.switchMode(nextMode);
            }
        } else {
            if (this.autoStartInput.checked) {
                setTimeout(() => {
                    this.switchMode('work');
                    this.startTimer();
                }, 3000);
            } else {
                this.switchMode('work');
            }
        }
    }

    playAlarm() {
        // 创建更清晰的提示音
        this.createBetterAlarm();
        
        // 播放原始音频作为备选
        this.alarmSound.currentTime = 0;
        this.alarmSound.play().catch(e => {
            console.log('无法播放音频:', e);
        });
    }

    createBetterAlarm() {
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioCtx();
                
                // 创建三声提示音序列
                const frequencies = [800, 1000, 800]; // Hz
                const duration = 0.15; // 每声持续时间
                const gap = 0.1; // 间隔时间
                
                frequencies.forEach((freq, index) => {
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
                    oscillator.type = 'sine';
                    
                    // 设置音量包络（淡入淡出）
                    const startTime = audioCtx.currentTime + index * (duration + gap);
                    const endTime = startTime + duration;
                    
                    gainNode.gain.setValueAtTime(0, startTime);
                    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
                    gainNode.gain.linearRampToValueAtTime(0.3, endTime - 0.02);
                    gainNode.gain.linearRampToValueAtTime(0, endTime);
                    
                    oscillator.start(startTime);
                    oscillator.stop(endTime);
                });
                
                // 添加额外的长提示音
                setTimeout(() => {
                    const longOscillator = audioCtx.createOscillator();
                    const longGain = audioCtx.createGain();
                    
                    longOscillator.connect(longGain);
                    longGain.connect(audioCtx.destination);
                    
                    longOscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
                    longOscillator.type = 'triangle';
                    
                    const longStartTime = audioCtx.currentTime;
                    const longEndTime = longStartTime + 0.5;
                    
                    longGain.gain.setValueAtTime(0, longStartTime);
                    longGain.gain.linearRampToValueAtTime(0.2, longStartTime + 0.05);
                    longGain.gain.linearRampToValueAtTime(0.2, longEndTime - 0.1);
                    longGain.gain.linearRampToValueAtTime(0, longEndTime);
                    
                    longOscillator.start(longStartTime);
                    longOscillator.stop(longEndTime);
                }, 800);
                
            } catch (e) {
                console.log('Web Audio API 不可用:', e);
            }
        }
    }

    showNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            const messages = {
                work: '工作时间结束！该休息了 🎉',
                'short-break': '短休息结束！继续工作 💪',
                'long-break': '长休息结束！准备新一轮工作 🚀'
            };
            
            new Notification('番茄时钟', {
                body: messages[this.currentMode],
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🍅</text></svg>'
            });
        } else if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        document.title = this.currentMode === 'work' ? '休息时间！' : '工作时间！';
        setTimeout(() => {
            document.title = '🍅 番茄时钟';
        }, 5000);
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeLeftElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.title = this.isRunning ? 
            `${this.timeLeftElement.textContent} - ${this.modes[this.currentMode].label}` : 
            '🍅 番茄时钟';
    }

    updateProgress() {
        const progress = (this.totalTime - this.timeLeft) / this.totalTime;
        const circumference = 2 * Math.PI * 120;
        const offset = circumference - (progress * circumference);
        this.progressCircle.style.strokeDashoffset = offset;
    }

    resetProgress() {
        const circumference = 2 * Math.PI * 120;
        this.progressCircle.style.strokeDashoffset = circumference;
    }
    
    toggleSettings() {
        this.isSettingsOpen = !this.isSettingsOpen;
        if (this.isSettingsOpen) {
            this.openSettings();
        } else {
            this.closeSettings();
        }
    }
    
    openSettings() {
        this.settingsPanel.classList.remove('translate-x-full');
        this.settingsPanel.classList.add('translate-x-0');
        this.settingsIcon.style.transform = 'rotate(90deg)';
        this.isSettingsOpen = true;
    }
    
    closeSettings() {
        this.settingsPanel.classList.remove('translate-x-0');
        this.settingsPanel.classList.add('translate-x-full');
        this.settingsIcon.style.transform = 'rotate(0deg)';
        this.isSettingsOpen = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
    
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            Notification.requestPermission();
        }, 3000);
    }
});