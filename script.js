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
        this.loadData();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeElements() {
        const $ = id => document.getElementById(id);
        
        [this.timeLeftElement, this.startBtn, this.resetBtn, this.sessionCountElement, 
         this.currentModeElement, this.progressCircle, this.alarmSound] = 
        ['timeLeft', 'startBtn', 'resetBtn', 'sessionCount', 'currentMode', 'progressCircle', 'alarmSound'].map($);

        [this.workDurationInput, this.shortBreakInput, this.longBreakInput, this.autoStartInput, this.testSoundBtn] = 
        ['workDuration', 'shortBreakDuration', 'longBreakDuration', 'autoStart', 'testSoundBtn'].map($);

        [this.settingsToggle, this.settingsPanel, this.settingsIcon] = 
        ['settingsToggle', 'settingsPanel', 'settingsIcon'].map($);

        [this.dataToggle, this.dataPanel, this.dataContent] = 
        ['dataToggle', 'dataPanel', 'dataContent'].map($);

        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.isSettingsOpen = false;
        this.isDataOpen = false;
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
        this.dataToggle.addEventListener('click', () => this.toggleData());
        this.testSoundBtn.addEventListener('click', () => this.testSound());
        
        // Close panels when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isSettingsOpen && !this.settingsPanel.contains(e.target) && !this.settingsToggle.contains(e.target)) {
                this.closeSettings();
            }
            if (this.isDataOpen && !this.dataPanel.contains(e.target) && !this.dataToggle.contains(e.target)) {
                this.closeData();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning) {
                this.lastTimestamp = Date.now();
                this.saveData(); // 应用切换到后台时保存数据
            } else if (!document.hidden && this.isRunning && this.lastTimestamp) {
                const elapsed = Math.floor((Date.now() - this.lastTimestamp) / 1000);
                this.timeLeft = Math.max(0, this.timeLeft - elapsed);
                if (this.timeLeft === 0) {
                    this.completeTimer();
                } else {
                    this.updateDisplay();
                }
                this.saveData(); // 应用切换到前台时也保存数据
            }
        });
        
        // 页面卸载前保存数据
        window.addEventListener('beforeunload', () => {
            this.saveData();
        });
        
        // 定期保存数据（每30秒）
        setInterval(() => {
            if (this.isRunning) {
                this.saveData();
            }
        }, 30000);
    }

    updateModeDurations() {
        this.modes.work.duration = parseInt(this.workDurationInput.value);
        this.modes['short-break'].duration = parseInt(this.shortBreakInput.value);
        this.modes['long-break'].duration = parseInt(this.longBreakInput.value);
        this.saveData();
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
            this.saveData();
            
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
        // 先尝试播放原始音频（优先级高，因为已经有用户交互）
        this.alarmSound.currentTime = 0;
        const audioPromise = this.alarmSound.play();
        
        if (audioPromise !== undefined) {
            audioPromise.then(() => {
                console.log('音频播放成功');
            }).catch(e => {
                console.log('音频播放失败，尝试Web Audio API:', e);
                // 如果原始音频失败，尝试Web Audio API
                this.createBetterAlarm();
            });
        } else {
            // 如果不支持Promise，直接尝试Web Audio API作为备选
            this.createBetterAlarm();
        }
        
        // 为iOS Safari添加额外的提示
        if (this.isIOS()) {
            // 尝试唤醒设备（如果在后台）
            navigator.vibrate && navigator.vibrate([200, 100, 200]);
        }
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

    loadData() {
        try {
            // 先尝试从localStorage加载，如果失败则从sessionStorage加载
            let dataStr = localStorage.getItem('pomodoroData') || sessionStorage.getItem('pomodoroData') || '{}';
            const data = JSON.parse(dataStr);
            const defaults = { 
                sessionCount: 0, 
                workDuration: 25, 
                shortBreakDuration: 5, 
                longBreakDuration: 15, 
                autoStart: false,
                currentMode: 'work',
                timeLeft: null,
                isRunning: false,
                lastSaveTime: null
            };
            
            Object.assign(defaults, data);
            
            this.sessionCount = defaults.sessionCount;
            Object.assign(this.modes, {
                work: { ...this.modes.work, duration: defaults.workDuration },
                'short-break': { ...this.modes['short-break'], duration: defaults.shortBreakDuration },
                'long-break': { ...this.modes['long-break'], duration: defaults.longBreakDuration }
            });
            
            [this.workDurationInput.value, this.shortBreakInput.value, this.longBreakInput.value] = 
            [defaults.workDuration, defaults.shortBreakDuration, defaults.longBreakDuration];
            this.autoStartInput.checked = defaults.autoStart;
            
            // 恢复计时器状态（如果在合理时间内）
            if (defaults.timeLeft && defaults.lastSaveTime && 
                (Date.now() - defaults.lastSaveTime) < 5 * 60 * 1000) { // 5分钟内
                this.currentMode = defaults.currentMode;
                this.timeLeft = defaults.timeLeft;
                this.totalTime = this.modes[this.currentMode].duration * 60;
                this.switchMode(this.currentMode);
            }
            
            this.updateModeDurations();
            console.log('数据已加载:', defaults);
        } catch (error) {
            console.log('加载数据失败:', error);
        }
    }

    saveData() {
        try {
            const data = {
                sessionCount: this.sessionCount,
                workDuration: this.modes.work.duration,
                shortBreakDuration: this.modes['short-break'].duration,
                longBreakDuration: this.modes['long-break'].duration,
                autoStart: this.autoStartInput.checked,
                currentMode: this.currentMode,
                timeLeft: this.timeLeft,
                isRunning: this.isRunning,
                lastSaveTime: Date.now()
            };
            localStorage.setItem('pomodoroData', JSON.stringify(data));
            
            // 额外备份到sessionStorage（防止localStorage被清除）
            sessionStorage.setItem('pomodoroData', JSON.stringify(data));
            
            console.log('数据已保存:', data);
        } catch (error) {
            console.log('保存数据失败:', error);
        }
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
        // 如果数据面板是打开的，先关闭它
        if (this.isDataOpen) {
            this.closeData();
        }
        
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
    
    toggleData() {
        this.isDataOpen = !this.isDataOpen;
        if (this.isDataOpen) {
            this.openData();
        } else {
            this.closeData();
        }
    }
    
    openData() {
        // 如果设置面板是打开的，先关闭它
        if (this.isSettingsOpen) {
            this.closeSettings();
        }
        
        this.dataPanel.classList.remove('translate-x-full');
        this.dataPanel.classList.add('translate-x-0');
        this.isDataOpen = true;
        this.updateDataDisplay();
    }
    
    closeData() {
        this.dataPanel.classList.remove('translate-x-0');
        this.dataPanel.classList.add('translate-x-full');
        this.isDataOpen = false;
    }
    
    updateDataDisplay() {
        try {
            const localData = localStorage.getItem('pomodoroData');
            const sessionData = sessionStorage.getItem('pomodoroData');
            
            let displayContent = '<div class="space-y-3">';
            
            if (localData) {
                const data = JSON.parse(localData);
                displayContent += `
                    <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <h4 class="font-semibold mb-2 text-gray-900 dark:text-gray-100">LocalStorage 数据:</h4>
                        <div class="space-y-1">
                            <div>番茄数: <span class="font-mono">${data.sessionCount || 0}</span></div>
                            <div>工作时长: <span class="font-mono">${data.workDuration || 25}</span> 分钟</div>
                            <div>短休息: <span class="font-mono">${data.shortBreakDuration || 5}</span> 分钟</div>
                            <div>长休息: <span class="font-mono">${data.longBreakDuration || 15}</span> 分钟</div>
                            <div>自动开始: <span class="font-mono">${data.autoStart ? '是' : '否'}</span></div>
                            ${data.currentMode ? `<div>当前模式: <span class="font-mono">${data.currentMode}</span></div>` : ''}
                            ${data.timeLeft ? `<div>剩余时间: <span class="font-mono">${Math.floor(data.timeLeft / 60)}:${(data.timeLeft % 60).toString().padStart(2, '0')}</span></div>` : ''}
                            ${data.lastSaveTime ? `<div>最后保存: <span class="font-mono">${new Date(data.lastSaveTime).toLocaleString()}</span></div>` : ''}
                        </div>
                    </div>
                `;
            } else {
                displayContent += '<div class="text-gray-500">LocalStorage 中没有数据</div>';
            }
            
            if (sessionData && sessionData !== localData) {
                const data = JSON.parse(sessionData);
                displayContent += `
                    <div class="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                        <h4 class="font-semibold mb-2 text-gray-900 dark:text-gray-100">SessionStorage 数据:</h4>
                        <div class="space-y-1">
                            <div>番茄数: <span class="font-mono">${data.sessionCount || 0}</span></div>
                            <div>当前模式: <span class="font-mono">${data.currentMode || 'work'}</span></div>
                            ${data.timeLeft ? `<div>剩余时间: <span class="font-mono">${Math.floor(data.timeLeft / 60)}:${(data.timeLeft % 60).toString().padStart(2, '0')}</span></div>` : ''}
                            ${data.lastSaveTime ? `<div>最后保存: <span class="font-mono">${new Date(data.lastSaveTime).toLocaleString()}</span></div>` : ''}
                        </div>
                    </div>
                `;
            }
            
            displayContent += `
                <div class="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <button id="clearDataBtn" class="w-full px-3 py-2 text-sm bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-800 transition-colors">
                        清除所有数据
                    </button>
                </div>
            `;
            
            displayContent += '</div>';
            this.dataContent.innerHTML = displayContent;
            
            // 绑定清除数据按钮事件
            const clearBtn = document.getElementById('clearDataBtn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearAllData());
            }
            
        } catch (error) {
            this.dataContent.innerHTML = `<div class="text-red-500">数据解析错误: ${error.message}</div>`;
        }
    }
    
    clearAllData() {
        if (confirm('确定要清除所有本地数据吗？这将无法恢复！')) {
            localStorage.removeItem('pomodoroData');
            sessionStorage.removeItem('pomodoroData');
            this.sessionCount = 0;
            this.sessionCountElement.textContent = '0';
            this.updateDataDisplay();
            alert('数据已清除');
        }
    }
    
    testSound() {
        // 更新按钮状态
        this.testSoundBtn.textContent = '🔄 播放中...';
        this.testSoundBtn.disabled = true;
        
        console.log('开始测试声音播放...');
        
        // 调用播放声音的方法
        this.playAlarm();
        
        // 2秒后恢复按钮状态
        setTimeout(() => {
            this.testSoundBtn.textContent = '🔊 测试提示音';
            this.testSoundBtn.disabled = false;
            console.log('声音测试完成');
        }, 2000);
    }
    
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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