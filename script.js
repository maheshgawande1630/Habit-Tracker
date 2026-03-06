/* =========================================
   AURA HABIT TRACKER - LOGIC
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // === Variables & DOM Elements ===
    const habitInput = document.getElementById('habit-input');
    const addHabitForm = document.getElementById('add-habit-form');
    const habitsList = document.getElementById('habits-list');

    const dailyProgressText = document.getElementById('daily-progress-text');
    const circularProgress = document.getElementById('circular-progress');
    const currentStreakEl = document.getElementById('current-streak');
    const bestStreakEl = document.getElementById('best-streak');

    const currentDateEl = document.getElementById('current-date');
    const navbar = document.querySelector('.navbar');

    // === State Management ===
    let habits = JSON.parse(localStorage.getItem('aura-habits')) || [];
    let stats = JSON.parse(localStorage.getItem('aura-stats')) || {
        currentStreak: 0,
        bestStreak: 0,
        lastCompletedDate: null
    };

    // Calculate circumference for circular progress bar
    const circleRadius = circularProgress.r.baseVal.value;
    const circumference = circleRadius * 2 * Math.PI;

    circularProgress.style.strokeDasharray = `${circumference} ${circumference}`;
    circularProgress.style.strokeDashoffset = circumference;

    // === Initialization ===
    function init() {
        checkNewDay();
        renderDate();
        renderHabits();
        updateProgress();
        updateStreaksUI();
        initScrollObservers();
    }

    // === Date & Streaks Logic ===
    function getTodayString() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    }

    function checkNewDay() {
        const todayStr = getTodayString();
        const lastDate = stats.lastCompletedDate;

        // If there's no stored data, initialize empty
        if (habits.length === 0) return;

        // Reset habit completions for a new day
        let anyCompletedToday = habits.some(h => h.completedDate === todayStr);
        let allUnchecked = !habits.some(h => h.completed);

        if (!anyCompletedToday && !allUnchecked) {
            // It's a new day, uncheck all habits
            habits.forEach(habit => {
                habit.completed = false;
            });
            saveHabits();
        }

        // Streak logic check
        if (lastDate && lastDate !== todayStr) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

            if (lastDate !== yesterdayStr) {
                // Streak broken
                stats.currentStreak = 0;
                saveStats();
            }
        }
    }

    function renderDate() {
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // === Habit Rendering ===
    function renderHabits() {
        if (habits.length === 0) {
            habitsList.innerHTML = `
                <div class="empty-state animate-fade-in">
                    <i class="ph-light ph-sparkle"></i>
                    <p>No habits added yet. Start your journey today!</p>
                </div>
            `;
            return;
        }

        habitsList.innerHTML = '';

        habits.forEach(habit => {
            const habitEl = document.createElement('div');
            habitEl.className = `habit-item ${habit.completed ? 'completed' : ''}`;
            habitEl.dataset.id = habit.id;

            habitEl.innerHTML = `
                <div class="habit-content">
                    <div class="custom-checkbox">
                        <i class="ph-bold ph-check"></i>
                    </div>
                    <span class="habit-text">${habit.text}</span>
                </div>
                <div class="habit-actions">
                    <div class="streak-pill" title="Habit Streak">
                        🔥 ${habit.streak || 0}
                    </div>
                    <button class="delete-btn" title="Delete Habit">
                        <i class="ph-fill ph-trash"></i>
                    </button>
                </div>
            `;

            // Event Listeners for habit
            const contentClick = habitEl.querySelector('.habit-content');
            contentClick.addEventListener('click', () => toggleHabit(habit.id));

            const deleteBtn = habitEl.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteHabit(habit.id);
            });

            habitsList.appendChild(habitEl);
        });
    }

    // === Actions ===
    function addHabit(text) {
        const newHabit = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            streak: 0,
            completedDate: null
        };

        habits.push(newHabit);
        saveHabits();
        renderHabits();
        updateProgress();
    }

    function toggleHabit(id) {
        const habit = habits.find(h => h.id === id);
        if (!habit) return;

        habit.completed = !habit.completed;
        const todayStr = getTodayString();

        if (habit.completed) {
            habit.completedDate = todayStr;
            habit.streak = (habit.streak || 0) + 1;
            fireConfetti();
        } else {
            habit.completedDate = null;
            habit.streak = Math.max(0, (habit.streak || 1) - 1);
        }

        saveHabits();
        renderHabits();
        updateOverallStreak();
        updateProgress();
    }

    function deleteHabit(id) {
        habits = habits.filter(h => h.id !== id);
        saveHabits();
        renderHabits();
        updateProgress();
    }

    // === Progress & Streaks ===
    function updateProgress() {
        if (habits.length === 0) {
            setProgressUI(0);
            return;
        }

        const completedCount = habits.filter(h => h.completed).length;
        const percentage = Math.round((completedCount / habits.length) * 100);

        setProgressUI(percentage);
    }

    function setProgressUI(percent) {
        // Update Text
        animateValue(dailyProgressText, parseInt(dailyProgressText.textContent) || 0, percent, 1000);

        // Update Circle
        const offset = circumference - percent / 100 * circumference;
        circularProgress.style.strokeDashoffset = offset;
    }

    function updateOverallStreak() {
        const allCompleted = habits.length > 0 && habits.every(h => h.completed);
        const todayStr = getTodayString();

        if (allCompleted) {
            if (stats.lastCompletedDate !== todayStr) {
                stats.currentStreak++;
                stats.lastCompletedDate = todayStr;

                if (stats.currentStreak > stats.bestStreak) {
                    stats.bestStreak = stats.currentStreak;
                }
                saveStats();
                updateStreaksUI();

                // Big celebration if all habits done
                setTimeout(fireBigConfetti, 500);
            }
        }
    }

    function updateStreaksUI() {
        animateValue(currentStreakEl, parseInt(currentStreakEl.textContent) || 0, stats.currentStreak, 800);
        animateValue(bestStreakEl, parseInt(bestStreakEl.textContent) || 0, stats.bestStreak, 800);
    }

    // === Helpers ===
    function saveHabits() {
        localStorage.setItem('aura-habits', JSON.stringify(habits));
    }

    function saveStats() {
        localStorage.setItem('aura-stats', JSON.stringify(stats));
    }

    // Number animation
    function animateValue(obj, start, end, duration) {
        if (start === end) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Easing Out
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            obj.innerHTML = Math.floor(easeOutQuart * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        };
        window.requestAnimationFrame(step);
    }

    // === Visual Effects ===
    function fireConfetti() {
        const duration = 2000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#8b5cf6', '#3b82f6', '#06b6d4']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#8b5cf6', '#3b82f6', '#06b6d4']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    function fireBigConfetti() {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }

    // === UI Interactions ===

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Form Submission
    addHabitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = habitInput.value.trim();
        if (text) {
            addHabit(text);
            habitInput.value = '';
        }
    });

    // Contact Form mock submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = `<i class="ph-bold ph-check"></i> <span>Sent Successfully</span>`;
            btn.style.background = 'var(--success)';

            setTimeout(() => {
                contactForm.reset();
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 3000);
        });
    }

    // Intersection Observer for scroll animations
    function initScrollObservers() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Stop observing once animated
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.scroll-reveal').forEach(el => {
            observer.observe(el);
        });
    }

    // Call init to start
    init();
});
