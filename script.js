// ===========================================
// Particles.js Initialization
// ===========================================
particlesJS('particles-js', {
    "particles": {
        "number": {
            "value": 80,
            "density": { "enable": true, "value_area": 800 }
        },
        "color": { "value": ["#00f0ff", "#8a2be2"] },
        "shape": { "type": "circle" },
        "opacity": {
            "value": 0.5,
            "random": true,
            "anim": { "enable": true, "speed": 1, "opacity_min": 0.1, "sync": false }
        },
        "size": {
            "value": 3,
            "random": true,
            "anim": { "enable": true, "speed": 2, "size_min": 0.1, "sync": false }
        },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#8a2be2",
            "opacity": 0.2,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 1.5,
            "direction": "none",
            "random": true,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": { "enable": true, "mode": "grab" },
            "onclick": { "enable": true, "mode": "push" },
            "resize": true
        },
        "modes": {
            "grab": { "distance": 140, "line_linked": { "opacity": 0.5 } },
            "push": { "particles_nb": 3 }
        }
    },
    "retina_detect": true
});

// ===========================================
// Application State & DOM Elements
// ===========================================
let habits = JSON.parse(localStorage.getItem('habits')) || [];
const todayStr = new Date().toDateString();

// App State handles streaks and day tracking
let appState = JSON.parse(localStorage.getItem('appState')) || { lastDate: todayStr, currentStreak: 0, bestStreak: 0 };

if (appState.lastDate !== todayStr) {
    // New day login detected
    const allCompletedYesterday = habits.length > 0 && habits.every(h => h.completed);
    
    // Reset all habits for the new day
    habits.forEach(h => h.completed = false);
    
    // Streak logic
    if (allCompletedYesterday) {
        appState.currentStreak += 1;
        if (appState.currentStreak > appState.bestStreak) {
            appState.bestStreak = appState.currentStreak;
        }
    } else {
        // Streak broken
        appState.currentStreak = 0; 
    }
    
    appState.lastDate = todayStr;
    saveState();
}

const habitListEl = document.getElementById('habit-list');
const emptyStateEl = document.getElementById('empty-state');
const addHabitBtn = document.getElementById('add-habit-btn');
const addHabitForm = document.getElementById('add-habit-form');
const newHabitInput = document.getElementById('new-habit-input');
const submitHabitBtn = document.getElementById('submit-habit-btn');
const progressCircle = document.getElementById('progress-circle');
const progressValue = document.getElementById('progress-value');
const currentStreakEl = document.getElementById('current-streak');
const bestStreakEl = document.getElementById('best-streak');

// ===========================================
// Initialization
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    // Set current date string dynamically
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOptions);

    renderHabits();
    updateStats(false); // don't animate value excessively on simple load
    initScrollAnimations();
});

// ===========================================
// Core Functions
// ===========================================
function saveState() {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('appState', JSON.stringify(appState));
}

function renderHabits() {
    // Clear list to re-render properly
    habitListEl.innerHTML = '';
    
    if (habits.length === 0) {
        habitListEl.appendChild(emptyStateEl);
        emptyStateEl.classList.remove('hidden');
    } else {
        emptyStateEl.classList.add('hidden');
        habits.forEach((habit, index) => {
            const li = document.createElement('li');
            li.className = `habit-item ${habit.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="habit-info" onclick="toggleHabit(${index})">
                    <div class="custom-checkbox">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <span class="habit-title">${habit.title}</span>
                </div>
                <button class="delete-btn" onclick="deleteHabit(${index}, event)" title="Delete Habit">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            habitListEl.appendChild(li);
        });
    }
}

window.toggleHabit = function(index) {
    habits[index].completed = !habits[index].completed;
    saveState();
    renderHabits();
    updateStats(true);
    
    // Check if celebration warranted
    checkAllCompleted();
};

window.deleteHabit = function(index, event) {
    event.stopPropagation(); // prevent triggering toggle
    habits.splice(index, 1);
    saveState();
    renderHabits();
    updateStats(true);
};

// Toggle add form
addHabitBtn.addEventListener('click', () => {
    addHabitForm.classList.toggle('hidden');
    if (!addHabitForm.classList.contains('hidden')) {
        newHabitInput.focus();
    }
});

// Process new habit
function addNewHabit() {
    const title = newHabitInput.value.trim();
    if (title) {
        habits.push({ title, completed: false });
        saveState();
        newHabitInput.value = '';
        addHabitForm.classList.add('hidden');
        renderHabits();
        updateStats(true);
    }
}

submitHabitBtn.addEventListener('click', addNewHabit);
newHabitInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addNewHabit();
});

// ===========================================
// Stats & Progress Logic
// ===========================================
function updateStats(animate = true) {
    const total = habits.length;
    const completed = habits.filter(h => h.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    // Animate counter text
    if (animate) {
        animateValue(progressValue, parseInt(progressValue.textContent) || 0, percentage, 800, '%');
    } else {
        progressValue.textContent = percentage + '%';
    }
    
    // Update SVG Circle dynamically
    // Circle radius is 60, circumference = 2 * Math.PI * 60 ~= 377
    const circumference = 377;
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
    
    // Visual feedback color changes based on completion
    if (percentage === 100 && total > 0) {
        progressCircle.style.stroke = 'var(--success-color)';
        progressCircle.style.filter = 'drop-shadow(0 0 10px var(--success-glow))';
    } else {
        progressCircle.style.stroke = 'var(--neon-blue)';
        progressCircle.style.filter = 'none';
    }
    
    // Refine Streaks View
    currentStreakEl.textContent = appState.currentStreak;
    bestStreakEl.textContent = appState.bestStreak;
}

function animateValue(obj, start, end, duration, suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = Math.floor(progress * (end - start) + start);
        obj.innerHTML = currentVal + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ===========================================
// Confetti Celebration
// ===========================================
function checkAllCompleted() {
    const total = habits.length;
    const completed = habits.filter(h => h.completed).length;
    
    if (total > 0 && total === completed) {
        triggerConfetti();
    }
}

function triggerConfetti() {
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// ===========================================
// Scroll Animations (Intersection Observer)
// ===========================================
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-section').forEach(section => {
        observer.observe(section);
    });
}

// ===========================================
// Contact Form Mock Submit
// ===========================================
const contactForm = document.querySelector('.contact-form');
const formSuccessMsg = document.getElementById('form-success-msg');

if(contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('.submit-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        
        // Simulate API call delay
        setTimeout(() => {
            btn.innerHTML = 'Send Message <i class="fa-solid fa-paper-plane"></i>';
            formSuccessMsg.classList.remove('hidden');
            contactForm.reset();
            
            setTimeout(() => {
                formSuccessMsg.classList.add('hidden');
            }, 3000);
        }, 1500);
    });
}

