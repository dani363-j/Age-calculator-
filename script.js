(function() {
    // ========================= DOM REFERENCES =========================
    const dobInput = document.getElementById('dobInput');
    const calculateBtn = document.getElementById('calculateBtn');
    const inputError = document.getElementById('inputError');
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;

    // Result sections
    const resultsSection = document.getElementById('resultsSection');
    const extraInfoSection = document.getElementById('extraInfoSection');
    const countdownSection = document.getElementById('countdownSection');
    const funFactsSection = document.getElementById('funFactsSection');

    // Result card elements
    const resultYears = document.getElementById('resultYears');
    const resultMonths = document.getElementById('resultMonths');
    const resultDays = document.getElementById('resultDays');
    const resultHours = document.getElementById('resultHours');
    const resultMinutes = document.getElementById('resultMinutes');
    const resultSeconds = document.getElementById('resultSeconds');

    // Extra info elements
    const infoDayOfBirth = document.getElementById('infoDayOfBirth');
    const infoTotalMonths = document.getElementById('infoTotalMonths');
    const infoTotalWeeks = document.getElementById('infoTotalWeeks');
    const infoTotalDays = document.getElementById('infoTotalDays');
    const infoTotalHours = document.getElementById('infoTotalHours');
    const infoTotalMinutes = document.getElementById('infoTotalMinutes');
    const infoTotalSeconds = document.getElementById('infoTotalSeconds');

    // Countdown elements
    const countdownDateLabel = document.getElementById('countdownDateLabel');
    const cdMonths = document.getElementById('cdMonths');
    const cdDays = document.getElementById('cdDays');
    const cdHours = document.getElementById('cdHours');
    const cdMinutes = document.getElementById('cdMinutes');
    const cdSeconds = document.getElementById('cdSeconds');

    // Fun facts elements
    const funHeartbeats = document.getElementById('funHeartbeats');
    const funBreaths = document.getElementById('funBreaths');
    const funSleepHours = document.getElementById('funSleepHours');

    // Footer year
    const footerYear = document.getElementById('footerYear');

    // ========================= STATE =========================
    let userDOB = null;
    let liveIntervalId = null;

    // ========================= INITIALIZATION =========================
    function init() {
        const today = new Date();
        const todayStr = formatDateISO(today);
        dobInput.setAttribute('max', todayStr);
        footerYear.textContent = today.getFullYear();

        loadTheme();
        themeToggle.addEventListener('click', toggleTheme);
        calculateBtn.addEventListener('click', handleCalculate);
        
        // Mobile browsers par calendar open fallback trigger karne ke liye
        dobInput.addEventListener('click', function() {
            if (typeof this.showPicker === 'function') {
                this.showPicker();
            }
        });

        dobInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleCalculate();
            }
        });

        loadDOBFromStorage();
        if (userDOB) {
            triggerCalculation(false); // Page load par refresh hone par scroll nahi karega
        }

        hideAllSections();
        if (userDOB) {
            showAllSections();
        }

        // Page navigation
        setupPageNavigation();
    }

    // ========================= PAGE NAVIGATION (SINGLE PAGE APP) =========================
    function setupPageNavigation() {
        const navLinks = document.querySelectorAll('.nav-bar__link');
        const pages = document.querySelectorAll('.page-section');

        function showPage(pageId) {
            pages.forEach(page => {
                page.classList.remove('active');
            });
            const target = document.getElementById('page-' + pageId);
            if (target) {
                target.classList.add('active');
            }
            // Update active nav
            navLinks.forEach(link => {
                link.classList.remove('nav-bar__link--active');
                if (link.getAttribute('data-page') === pageId) {
                    link.classList.add('nav-bar__link--active');
                }
            });

            // If home page, keep calculator state; other pages just show content
            if (pageId === 'home' && userDOB) {
                // Ensure results are visible if already calculated
                showAllSections();
            }
        }

        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const pageId = this.getAttribute('data-page');
                showPage(pageId);
                // Update URL hash
                window.location.hash = pageId;
            });
        });

        // Handle initial hash
        function handleHash() {
            const hash = window.location.hash.substring(1);
            if (hash && document.getElementById('page-' + hash)) {
                showPage(hash);
            } else {
                showPage('home');
            }
        }
        window.addEventListener('hashchange', handleHash);
        handleHash();

        // Also handle links inside pages that reference other pages
        document.querySelectorAll('a[data-page]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const pageId = this.getAttribute('data-page');
                showPage(pageId);
                window.location.hash = pageId;
            });
        });
    }

    // ========================= THEME MANAGEMENT =========================
    function loadTheme() {
        const savedTheme = localStorage.getItem('age-calc-theme');
        if (savedTheme === 'light') {
            htmlElement.setAttribute('data-theme', 'light');
        } else if (savedTheme === 'dark') {
            htmlElement.setAttribute('data-theme', 'dark');
        } else {
            htmlElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('age-calc-theme', 'dark');
        }
    }

    function toggleTheme() {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('age-calc-theme', newTheme);
    }

    // ========================= LOCAL STORAGE FOR DOB =========================
    function saveDOBToStorage(dobDate) {
        try {
            localStorage.setItem('age-calc-dob', dobDate.toISOString());
        } catch (e) {}
    }

    function loadDOBFromStorage() {
        try {
            const saved = localStorage.getItem('age-calc-dob');
            if (saved) {
                const parsed = new Date(saved);
                if (!isNaN(parsed.getTime()) && parsed <= new Date()) {
                    userDOB = parsed;
                    dobInput.value = formatDateISO(parsed);
                } else {
                    localStorage.removeItem('age-calc-dob');
                }
            }
        } catch (e) {
            userDOB = null;
        }
    }

    // ========================= VALIDATION =========================
    function validateDOB(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) {
            return { valid: false, message: 'Please enter a valid date of birth.' };
        }
        const now = new Date();
        if (dateObj > now) {
            return { valid: false, message: 'Date of birth cannot be in the future.' };
        }
        const minDate = new Date('1900-01-01');
        if (dateObj < minDate) {
            return { valid: false, message: 'Please enter a date after January 1, 1900.' };
        }
        return { valid: true, message: '' };
    }

    function showError(message) {
        inputError.textContent = message;
        inputError.classList.add('input-group__error--visible');
    }

    function clearError() {
        inputError.textContent = '';
        inputError.classList.remove('input-group__error--visible');
    }

    // ========================= HANDLE CALCULATE =========================
    function handleCalculate() {
        clearError();
        const rawValue = dobInput.value;

        if (!rawValue) {
            showError('Please select your date of birth.');
            return;
        }

        const parsedDate = new Date(rawValue + 'T00:00:00');
        const validation = validateDOB(parsedDate);

        if (!validation.valid) {
            showError(validation.message);
            return;
        }

        userDOB = parsedDate;
        saveDOBToStorage(userDOB);
        triggerCalculation(true); // User click trigger karne par scroll true hoga
    }

    function triggerCalculation(shouldScroll = false) {
        clearError();
        if (liveIntervalId) {
            clearInterval(liveIntervalId);
            liveIntervalId = null;
        }

        updateAllDisplays();
        showAllSections();

        // Actual Age output section par automatic smooth scroll logic
        if (shouldScroll && resultsSection) {
            setTimeout(() => {
                resultsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }

        liveIntervalId = setInterval(() => {
            updateAllDisplays();
        }, 1000);
    }

    // ========================= CALCULATION ENGINE =========================
    function getAgeBreakdown(dob, now) {
        let years = now.getFullYear() - dob.getFullYear();
        let months = now.getMonth() - dob.getMonth();
        let days = now.getDate() - dob.getDate();
        let hours = now.getHours() - dob.getHours();
        let minutes = now.getMinutes() - dob.getMinutes();
        let seconds = now.getSeconds() - dob.getSeconds();

        if (seconds < 0) { seconds += 60;
            minutes -= 1; }
        if (minutes < 0) { minutes += 60;
            hours -= 1; }
        if (hours < 0) { hours += 24;
            days -= 1; }
        if (days < 0) {
            const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            days += prevMonth.getDate();
            months -= 1;
        }
        if (months < 0) { months += 12;
            years -= 1; }
        if (years < 0) { years = 0;
            months = 0;
            days = 0;
            hours = 0;
            minutes = 0;
            seconds = 0; }

        return { years, months, days, hours, minutes, seconds };
    }

    function getTotalUnits(dob, now) {
        const diffMs = now.getTime() - dob.getTime();
        if (diffMs < 0) return { totalMonths: 0, totalWeeks: 0, totalDays: 0, totalHours: 0, totalMinutes: 0,
            totalSeconds: 0 };

        const totalSeconds = Math.floor(diffMs / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);
        const totalWeeks = Math.floor(totalDays / 7);
        const totalMonths = Math.floor(totalDays / 30.436875);

        return { totalMonths, totalWeeks, totalDays, totalHours, totalMinutes, totalSeconds };
    }

    function getNextBirthday(dob, now) {
        const currentYear = now.getFullYear();
        let nextBirthday = new Date(currentYear, dob.getMonth(), dob.getDate(), 0, 0, 0);

        if (nextBirthday <= now) {
            nextBirthday = new Date(currentYear + 1, dob.getMonth(), dob.getDate(), 0, 0, 0);
        }

        const diffMs = nextBirthday.getTime() - now.getTime();
        if (diffMs <= 0) {
            return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, dateLabel: formatDateReadable(
                    nextBirthday) };
        }

        const totalSeconds = Math.floor(diffMs / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);
        const months = Math.floor(totalDays / 30.436875);
        const remainingDays = totalDays - Math.floor(months * 30.436875);
        const remainingHours = totalHours - (totalDays * 24);
        const remainingMinutes = totalMinutes - (totalHours * 60);
        const remainingSeconds = totalSeconds - (totalMinutes * 60);

        return {
            months: Math.max(0, months),
            days: Math.max(0, remainingDays),
            hours: Math.max(0, remainingHours),
            minutes: Math.max(0, remainingMinutes),
            seconds: Math.max(0, remainingSeconds),
            dateLabel: formatDateReadable(nextBirthday)
        };
    }

    function getDayOfBirthName(dob) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dob.getDay()];
    }

    // ========================= FORMATTING HELPERS =========================
    function formatDateISO(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function formatDateReadable(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    function formatLargeNumber(num) {
        if (num >= 1_000_000_000) {
            return (num / 1_000_000_000).toFixed(2) + ' billion';
        }
        if (num >= 1_000_000) {
            return (num / 1_000_000).toFixed(2) + ' million';
        }
        if (num >= 1_000) {
            return num.toLocaleString('en-US');
        }
        return num.toString();
    }

    // ========================= UPDATE ALL DISPLAYS =========================
    function updateAllDisplays() {
        if (!userDOB) return;

        const now = new Date();
        const breakdown = getAgeBreakdown(userDOB, now);
        const totals = getTotalUnits(userDOB, now);
        const nextBday = getNextBirthday(userDOB, now);
        const dayOfBirth = getDayOfBirthName(userDOB);

        resultYears.textContent = breakdown.years;
        resultMonths.textContent = breakdown.months;
        resultDays.textContent = breakdown.days;
        resultHours.textContent = breakdown.hours;
        resultMinutes.textContent = breakdown.minutes;
        resultSeconds.textContent = breakdown.seconds;

        infoDayOfBirth.textContent = dayOfBirth;
        infoTotalMonths.textContent = formatLargeNumber(totals.totalMonths);
        infoTotalWeeks.textContent = formatLargeNumber(totals.totalWeeks);
        infoTotalDays.textContent = formatLargeNumber(totals.totalDays);
        infoTotalHours.textContent = formatLargeNumber(totals.totalHours);
        infoTotalMinutes.textContent = formatLargeNumber(totals.totalMinutes);
        infoTotalSeconds.textContent = formatLargeNumber(totals.totalSeconds);

        countdownDateLabel.textContent = 'Until ' + nextBday.dateLabel;
        cdMonths.textContent = nextBday.months;
        cdDays.textContent = nextBday.days;
        cdHours.textContent = nextBday.hours;
        cdMinutes.textContent = nextBday.minutes;
        cdSeconds.textContent = nextBday.seconds;

        const totalMinutesLived = totals.totalMinutes;
        funHeartbeats.textContent = formatLargeNumber(Math.floor(totalMinutesLived * 72));
        funBreaths.textContent = formatLargeNumber(Math.floor(totalMinutesLived * 16));
        funSleepHours.textContent = formatLargeNumber(Math.floor(totals.totalDays * 8));
    }

    // ========================= SECTION VISIBILITY =========================
    function showAllSections() {
        resultsSection.classList.add('results--visible');
        resultsSection.setAttribute('aria-hidden', 'false');
        extraInfoSection.classList.add('extra-info--visible');
        extraInfoSection.setAttribute('aria-hidden', 'false');
        countdownSection.classList.add('countdown--visible');
        countdownSection.setAttribute('aria-hidden', 'false');
        funFactsSection.classList.add('fun-facts--visible');
        funFactsSection.setAttribute('aria-hidden', 'false');
    }

    // Fixed code block logic structure
    function hideAllSections() {
        resultsSection.classList.remove('results--visible');
        resultsSection.setAttribute('aria-hidden', 'true');
        extraInfoSection.classList.remove('extra-info--visible');
        extraInfoSection.setAttribute('aria-hidden', 'true');
        countdownSection.classList.remove('countdown--visible');
        countdownSection.setAttribute('aria-hidden', 'true');
        funFactsSection.classList.remove('fun-facts--visible');
        funFactsSection.setAttribute('aria-hidden', 'true');
    }

    // ========================= CLEANUP =========================
    window.addEventListener('beforeunload', function() {
        if (liveIntervalId) {
            clearInterval(liveIntervalId);
            liveIntervalId = null;
        }
    });

    // ========================= START =========================
    init();
})();
