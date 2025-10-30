// Setting up initial variables for the timer
let timeLeft = 0;          // Tracks remaining time in seconds
let timerId = null;        // For storing the timer interval ID
let deadline = null;       // Absolute timestamp (ms) when the timer should hit zero
let lastWaterBreakMs = 0;  // Keeps track of last water break time in milliseconds

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
    // Disable/enable inputs while running
    function setInputsEnabled(enabled) {
        [focusHoursInput, focusMinutesInput, focusSecondsInput,
         waterBreakHoursInput, waterBreakMinutesInput, waterBreakSecondsInput,
         waterBreakToggle].forEach(el => { if (el) el.disabled = !enabled; });
    }

    // Main timer function - handles starting/resuming the countdown (deadline-based)
    function startTimer() {
        if (timerId) return;  // Prevent multiple timers

        // Initialize time if needed
        if (timeLeft <= 0) {
            timeLeft = calculateTotalSeconds();
        }
        if (timeLeft <= 0) return; // nothing to do

        // Compute or recompute deadline
        if (!deadline) {
            deadline = Date.now() + (timeLeft * 1000);
        }

        // Update UI state
        startButton.disabled = true;
        pauseButton.disabled = false;
        statusDisplay.textContent = 'Focus time!';
        setInputsEnabled(false);
        if (lastWaterBreakMs === 0) {
            lastWaterBreakMs = Date.now();
        }

        // Use a shorter tick to improve accuracy, but only update display when whole second changes
        timerId = setInterval(() => {
            const now = Date.now();
            const remainingMs = Math.max(0, deadline - now);
            const nextTimeLeft = Math.max(0, Math.ceil(remainingMs / 1000));

            if (nextTimeLeft !== timeLeft) {
                timeLeft = nextTimeLeft;
                updateDisplay();
            }

            // Check for water break (skip if interval is zero)
            const wbIntervalSec = calculateWaterBreakInterval();
            if (waterBreakToggle.checked && wbIntervalSec > 0 && timeLeft > 0 &&
                (now - lastWaterBreakMs) >= (wbIntervalSec * 1000)) {
                pauseTimer();
                lastWaterBreakMs = now;
                showWaterBreakModal();
                return;
            }

            if (remainingMs <= 0) {
                clearInterval(timerId);
                timerId = null;
                deadline = null;
                statusDisplay.textContent = 'Time\'s up!';
                startButton.disabled = false;
                pauseButton.disabled = true;
                setInputsEnabled(true);
                if (timerEndSound) {
                    timerEndSound.currentTime = 0;
                    timerEndSound.play().catch(e => console.log('Error playing sound:', e));
                }
                timerEndModal.style.display = 'flex';
            }
        }, 250);
    }


    // Pause timer
    function pauseTimer() {
        if (!timerId) return;
        clearInterval(timerId);
        timerId = null;
        // Recompute remaining time precisely based on deadline
        if (deadline) {
            const remainingMs = Math.max(0, deadline - Date.now());
            timeLeft = Math.max(0, Math.ceil(remainingMs / 1000));
        }
        deadline = null;
        startButton.disabled = false;
        pauseButton.disabled = true;
        statusDisplay.textContent = 'Paused';
        setInputsEnabled(true);
    }

    // Reset timer
    function resetTimer() {
        clearInterval(timerId);
        timerId = null;
        deadline = null;
        timeLeft = calculateTotalSeconds();
        updateDisplay();
        startButton.disabled = false;
        pauseButton.disabled = true;
        statusDisplay.textContent = 'Ready to focus';
        lastWaterBreakMs = 0;
        setInputsEnabled(true);
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
    // Create an AudioContext to help unlock audio on some mobile browsers (iOS/Chrome)
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    const enableSoundBtn = document.getElementById('enableSound');
    const soundModal = document.getElementById('soundModal');
    const soundAllowBtn = document.getElementById('soundAllowBtn');
        function unlockAudio(event, forceShowBtn = false) {
            if (audioUnlocked) return;
            // Ensure an AudioContext exists and try to resume it (required on some mobile browsers)
            try {
                if (!audioCtx && AudioContextClass) audioCtx = new AudioContextClass();
                if (audioCtx && audioCtx.state === 'suspended') {
                    // resume inside user gesture when possible
                    if (event) {
                        audioCtx.resume().then(() => console.log('AudioContext resumed')).catch(() => {});
                    }
                }
            } catch (e) {
                console.log('AudioContext not available:', e);
            }

            let unlockAttempts = 0;
            function tryUnlock(syncInEvent = false) {
                // If this was triggered directly by a user event, attempt immediate play inside the handler
                if (syncInEvent && event) {
                    try {
                        if (timerEndSound) { timerEndSound.play(); timerEndSound.pause(); timerEndSound.currentTime = 0; }
                        if (waterBreakSound) { waterBreakSound.play(); waterBreakSound.pause(); waterBreakSound.currentTime = 0; }
                        audioUnlocked = true;
                        if (enableSoundBtn) enableSoundBtn.style.display = 'none';
                        if (soundModal) soundModal.style.display = 'none';
                        removeUnlockListeners();
                        console.log('Audio unlocked synchronously in user event');
                        return;
                    } catch (e) {
                        console.log('Sync unlock failed, will try async:', e);
                    }
                }

                // Fallback: try playing via promises (may still be allowed if called from gesture)
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
                    console.log('Audio unlocked via Promise.play()');
                }).catch((err) => {
                    unlockAttempts++;
                    console.log('Audio unlock attempt failed:', err, 'attempt', unlockAttempts);
                    if (unlockAttempts < 2 && forceShowBtn) {
                        if (enableSoundBtn) enableSoundBtn.style.display = 'block';
                    }
                    if (soundModal) soundModal.style.display = 'flex';
                });
            }

            // Prefer synchronous unlock if we have the actual event
            tryUnlock(!!event);

            if (soundAllowBtn) {
                soundAllowBtn.addEventListener('click', function(e) {
                    unlockAudio(e, true);
                });
            }
        }

    // Listen for any user interaction to unlock audio
    function unlockListener(e) {
        unlockAudio(e);
    }
    function removeUnlockListeners() {
        window.removeEventListener('touchstart', unlockListener);
        window.removeEventListener('click', unlockListener);
        window.removeEventListener('keydown', unlockListener);
    }
    // Attach handlers to resume/unlock audio on actual user gestures
    window.addEventListener('touchstart', unlockListener, { once: true, passive: true });
    window.addEventListener('click', unlockListener, { once: true });
    window.addEventListener('keydown', unlockListener, { once: true });

    // Show enable sound button on mobile if not unlocked
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        setTimeout(() => {
            if (!audioUnlocked && enableSoundBtn) enableSoundBtn.style.display = 'block';
        }, 1000);
    }
    if (enableSoundBtn) {
        enableSoundBtn.addEventListener('click', function(e) {
            unlockAudio(e, true);
        });
    }

    // Ensure start button triggers unlock inside the same user event
    startButton.addEventListener('click', function(e) {
        unlockAudio(e);
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
        // Reset the water break baseline and recreate deadline based on current timeLeft and resume
        lastWaterBreakMs = Date.now();
        deadline = null;
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