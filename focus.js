// Setting up initial variables for the timer
let timeLeft = 0;          // Tracks remaining time in seconds
let timerId = null;        // For storing the timer interval ID
let lastWaterBreakTime = 0;// Keeps track of last water break time

function initializeFocusMode() {
    // Getting all the elements I need to control
    const timeDisplay = document.querySelector('.time');          // Shows the countdown
    const statusDisplay = document.querySelector('.status');      // Shows current timer status
    const startButton = document.getElementById('start');         // Start button
    const pauseButton = document.getElementById('pause');         // Pause button
    const resetButton = document.getElementById('reset');         // Reset button
    const focusHoursInput = document.getElementById('focusHours');      // Hours input
    const focusMinutesInput = document.getElementById('focusMinutes');  // Minutes input
    const focusSecondsInput = document.getElementById('focusSeconds');  // Seconds input
    const waterBreakToggle = document.getElementById('waterBreak');
    const waterBreakHoursInput = document.getElementById('waterBreakHours');
    const waterBreakMinutesInput = document.getElementById('waterBreakMinutes');
    const waterBreakSecondsInput = document.getElementById('waterBreakSeconds');
    const waterBreakIntervalSetting = document.getElementById('waterBreakIntervalSetting');
    const waterBreakModal = document.getElementById('waterBreakModal');
    const drankButton = document.getElementById('drank');
    const timerEndSound = document.getElementById('timerEndSound');
    const waterBreakSound = document.getElementById('waterBreakSound');
    const timerEndModal = document.getElementById('timerEndModal');
    const closeTimerButton = document.getElementById('closeTimer');

    // Helper function to convert hours, minutes, and seconds into total seconds
    // This helps me work with a single unit (seconds) for the timer
    function calculateTotalSeconds() {
        const hours = parseInt(focusHoursInput.value) || 0;
        const minutes = parseInt(focusMinutesInput.value) || 0;
        const seconds = parseInt(focusSecondsInput.value) || 0;
        return (hours * 3600) + (minutes * 60) + seconds;  // Converting everything to seconds
    }

    // Similar to above, but for water break intervals
    // Need this separate function because it uses different input fields
    function calculateWaterBreakInterval() {
        const hours = parseInt(waterBreakHoursInput.value) || 0;
        const minutes = parseInt(waterBreakMinutesInput.value) || 0;
        const seconds = parseInt(waterBreakSecondsInput.value) || 0;
        return (hours * 3600) + (minutes * 60) + seconds;  // Same conversion logic
    }

    // Converts seconds back into HH:MM:SS format for display
    // Added padStart to always show two digits (e.g., 01:05:08)
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Updates the timer display with current time left
    function updateDisplay() {
        timeDisplay.textContent = formatTime(timeLeft);
    }

    // Shows the water break reminder and plays the notification sound
    function showWaterBreakModal() {
        waterBreakModal.style.display = 'flex';
        if (waterBreakSound) {
            waterBreakSound.currentTime = 0;  // Reset sound to start
            waterBreakSound.play().catch(e => console.log('Error playing sound:', e));
        }
    }

    // Main timer function - handles starting the countdown
    // Added checks to prevent multiple timers and handle empty time
    function startTimer() {
        if (timerId) return;  // Prevents multiple timers running at once

        // If timer is at 0, grab the time from input fields
        if (timeLeft <= 0) {
            timeLeft = calculateTotalSeconds();
        }

        // Update UI state
        startButton.disabled = true;
        pauseButton.disabled = false;
        statusDisplay.textContent = 'Focus time!';
        lastWaterBreakTime = Math.floor(Date.now() / 1000);  // Track when we started

        timerId = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();

                // Check for water break
                const currentTime = Math.floor(Date.now() / 1000);
                if (waterBreakToggle.checked && 
                    timeLeft > 0 && 
                    currentTime - lastWaterBreakTime >= calculateWaterBreakInterval()) {
                    pauseTimer();
                    lastWaterBreakTime = currentTime;
                    showWaterBreakModal();
                }
            }

            if (timeLeft <= 0) {
                clearInterval(timerId);
                timerId = null;
                statusDisplay.textContent = 'Time\'s up!';
                startButton.disabled = false;
                pauseButton.disabled = true;
                if (timerEndSound) {
                    timerEndSound.currentTime = 0;
                    timerEndSound.play().catch(e => console.log('Error playing sound:', e));
                }
                timerEndModal.style.display = 'flex';
            }
        }, 1000);
    }

    // Pause timer
    function pauseTimer() {
        if (!timerId) return;
        clearInterval(timerId);
        timerId = null;
        startButton.disabled = false;
        pauseButton.disabled = true;
        statusDisplay.textContent = 'Paused';
    }

    // Reset timer
    function resetTimer() {
        clearInterval(timerId);
        timerId = null;
        timeLeft = calculateTotalSeconds();
        updateDisplay();
        startButton.disabled = false;
        pauseButton.disabled = true;
        statusDisplay.textContent = 'Ready to focus';
        lastWaterBreakTime = 0;
    }

    // Event listeners for inputs
    function onTimeInputChange() {
        if (!timerId) {  // Only update if timer is not running
            timeLeft = calculateTotalSeconds();
            updateDisplay();
            console.log('Time input changed:', timeLeft); // Debug log
        }
    }

    // Add input event listeners for real-time updates
    focusHoursInput.addEventListener('input', onTimeInputChange);
    focusMinutesInput.addEventListener('input', onTimeInputChange);
    focusSecondsInput.addEventListener('input', onTimeInputChange);


    // Mobile audio unlock: play silent sound on first Start click to enable audio on mobile browsers
    let audioUnlocked = false;
    const enableSoundBtn = document.getElementById('enableSound');
    const soundModal = document.getElementById('soundModal');
    const soundAllowBtn = document.getElementById('soundAllowBtn');
    function unlockAudio(forceShowBtn = false) {
        if (audioUnlocked) return;
        let unlockAttempts = 0;
        function tryUnlock() {
            let timerPromise = timerEndSound ? timerEndSound.play() : Promise.resolve();
            let waterPromise = waterBreakSound ? waterBreakSound.play() : Promise.resolve();
            Promise.all([timerPromise, waterPromise]).then(() => {
                if (timerEndSound) {
                    timerEndSound.pause();
                    timerEndSound.currentTime = 0;
                }
                if (waterBreakSound) {
                    waterBreakSound.pause();
                    waterBreakSound.currentTime = 0;
                }
                audioUnlocked = true;
                if (enableSoundBtn) enableSoundBtn.style.display = 'none';
                if (soundModal) soundModal.style.display = 'none';
                removeUnlockListeners();
            }).catch(() => {
                unlockAttempts++;
                if (unlockAttempts < 2 && forceShowBtn) {
                    if (enableSoundBtn) enableSoundBtn.style.display = 'block';
                }
                if (soundModal) soundModal.style.display = 'flex';
            });
        }
        tryUnlock();
    if (soundAllowBtn) {
        soundAllowBtn.addEventListener('click', function() {
            unlockAudio(true);
        });
    }
    }

    // Listen for any user interaction to unlock audio
    function unlockListener() {
        unlockAudio();
    }
    function removeUnlockListeners() {
        window.removeEventListener('touchstart', unlockListener);
        window.removeEventListener('click', unlockListener);
        window.removeEventListener('keydown', unlockListener);
    }
    window.addEventListener('touchstart', unlockListener, { once: true });
    window.addEventListener('click', unlockListener, { once: true });
    window.addEventListener('keydown', unlockListener, { once: true });

    // Show enable sound button on mobile if not unlocked
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        setTimeout(() => {
            if (!audioUnlocked && enableSoundBtn) enableSoundBtn.style.display = 'block';
        }, 1000);
    }
    if (enableSoundBtn) {
        enableSoundBtn.addEventListener('click', function() {
            unlockAudio(true);
        });
    }

    startButton.addEventListener('click', function() {
        unlockAudio();
        startTimer();
    });
    pauseButton.addEventListener('click', pauseTimer);
    resetButton.addEventListener('click', resetTimer);

    // Water break related listeners
    waterBreakToggle.addEventListener('change', () => {
        waterBreakIntervalSetting.style.display = waterBreakToggle.checked ? 'block' : 'none';
    });

    drankButton.addEventListener('click', () => {
        if (waterBreakSound) {
            waterBreakSound.pause();
            waterBreakSound.currentTime = 0;
        }
        waterBreakModal.style.display = 'none';
        startTimer();  // Resume the timer
    });

    // Close timer end modal and stop sound
    closeTimerButton.addEventListener('click', () => {
        if (timerEndSound) {
            timerEndSound.pause();
            timerEndSound.currentTime = 0;
        }
        timerEndModal.style.display = 'none';
    });

    // Initialize
    timeLeft = calculateTotalSeconds();
    updateDisplay();
    waterBreakIntervalSetting.style.display = waterBreakToggle.checked ? 'block' : 'none';

    console.log('Focus mode initialized with time:', timeLeft); // Debug log
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFocusMode);
} else {
    initializeFocusMode();
}