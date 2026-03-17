/* ==============================================================
   SOCIAL INQUIRY FORM: Multi-step form engine
   DESCRIPTION: Typeform-style step navigation with branching
   logic, validation, keyboard support, and API submission.
   Adapted from inquiry-form.js for social/personal events.
   ============================================================== */

(function () {
    'use strict';

    // ---------------------------------------------------------------
    // 1. CONFIGURATION
    // ---------------------------------------------------------------

    // Total question count for progress (excluding welcome/thankyou)
    var TOTAL_QUESTIONS = 11; // max if venue path taken

    // Form data store
    var formData = {};

    // History stack for back navigation
    var history = [];

    // Current step name
    var currentStep = 'welcome';

    // DOM references
    var progressBar = document.getElementById('progressBar');
    var navPrev = document.getElementById('navPrev');
    var navNext = document.getElementById('navNext');

    // ---------------------------------------------------------------
    // 2. STEP NAVIGATION
    // ---------------------------------------------------------------

    function getStepEl(name) {
        return document.querySelector('[data-step="' + name + '"]');
    }

    function getActiveStep() {
        return document.querySelector('.tf-step.active');
    }

    function showStep(name, direction) {
        var current = getActiveStep();
        var next = getStepEl(name);

        if (!next || (current && current.dataset.step === name)) return;

        // Exit current
        if (current) {
            current.classList.remove('active');
            if (direction === 'forward') {
                current.classList.add('exit-up');
            }
            setTimeout(function () {
                current.classList.remove('exit-up');
            }, 500);
        }

        // Enter next
        next.classList.add('active');

        currentStep = name;

        // Update progress
        updateProgress();

        // Update nav buttons
        updateNav();

        // Update dynamic text
        updateDynamicText();

        // Focus input if present
        setTimeout(function () {
            var input = next.querySelector('.tf-input');
            if (input) input.focus();
        }, 300);
    }

    function updateProgress() {
        var stepIndex = getQuestionNumber(currentStep);
        if (currentStep === 'welcome') {
            progressBar.style.width = '0%';
        } else if (currentStep === 'thankyou') {
            progressBar.style.width = '100%';
        } else {
            var pct = Math.round((stepIndex / TOTAL_QUESTIONS) * 100);
            progressBar.style.width = pct + '%';
        }
    }

    function updateNav() {
        navPrev.disabled = (currentStep === 'welcome' || currentStep === 'thankyou');
        navNext.style.display = (currentStep === 'thankyou') ? 'none' : '';
        navPrev.style.display = (currentStep === 'thankyou') ? 'none' : '';
    }

    function getQuestionNumber(step) {
        var hasVenue = formData.hasVenue === 'Yes';
        var map = {
            'firstName': 1,
            'lastName': 2,
            'email': 3,
            'phone': 4,
            'eventType': 5,
            'eventDate': 6,
            'guestCount': 7,
            'hasVenue': 8,
            'venueName': 9,
            'budgetNoVenue': 9,
            'budgetWithVenue': 10,
            'specialRequests': hasVenue ? 11 : 10
        };
        return map[step] || 0;
    }

    // ---------------------------------------------------------------
    // 3. BRANCHING LOGIC
    // ---------------------------------------------------------------

    function getNextStep(from) {
        switch (from) {
            case 'welcome':      return 'firstName';
            case 'firstName':    return 'lastName';
            case 'lastName':     return 'email';
            case 'email':        return 'phone';
            case 'phone':        return 'eventType';
            case 'eventType':    return 'eventDate';
            case 'eventDate':    return 'guestCount';
            case 'guestCount':   return 'hasVenue';

            // BRANCHING: venue yes/no
            case 'hasVenue':
                return formData.hasVenue === 'Yes' ? 'venueName' : 'budgetNoVenue';

            case 'venueName':        return 'budgetWithVenue';
            case 'budgetWithVenue':  return 'specialRequests';
            case 'budgetNoVenue':    return 'specialRequests';

            case 'specialRequests':  return 'thankyou';
            default:                 return null;
        }
    }

    function getPrevStep() {
        if (history.length > 0) {
            return history[history.length - 1];
        }
        return null;
    }

    // ---------------------------------------------------------------
    // 4. VALIDATION
    // ---------------------------------------------------------------

    function validateStep(stepName) {
        switch (stepName) {
            case 'welcome':
                return true;

            case 'firstName':
                return validateRequired('fieldFirstName', 'valFirstName', 'Please enter your first name');

            case 'lastName':
                return validateRequired('fieldLastName', 'valLastName', 'Please enter your last name');

            case 'email':
                return validateEmail('fieldEmail', 'valEmail');

            case 'phone':
                return validateRequired('fieldPhone', 'valPhone', 'Please enter your phone number');

            case 'eventType':
                return !!formData.eventType;

            case 'eventDate':
                return validateRequired('fieldEventDate', 'valEventDate', 'Please select a date');

            case 'guestCount':
                return !!formData.guestCount;

            case 'hasVenue':
                return !!formData.hasVenue;

            case 'venueName':
                return validateRequired('fieldVenueName', 'valVenueName', 'Please enter the venue name');

            case 'budgetNoVenue':
                return validateRequired('fieldBudgetNoVenue', 'valBudgetNoVenue', 'Please enter your estimated budget');

            case 'budgetWithVenue':
                return validateRequired('fieldBudgetWithVenue', 'valBudgetWithVenue', 'Please enter your estimated budget');

            case 'specialRequests':
                // Optional field -- always valid
                return true;

            default:
                return true;
        }
    }

    function validateRequired(inputId, msgId, message) {
        var input = document.getElementById(inputId);
        var msg = document.getElementById(msgId);
        if (!input) return true;

        var val = input.value.trim();
        if (!val) {
            if (msg) msg.textContent = message;
            input.focus();
            return false;
        }
        if (msg) msg.textContent = '';
        return true;
    }

    function validateEmail(inputId, msgId) {
        var input = document.getElementById(inputId);
        var msg = document.getElementById(msgId);
        if (!input) return true;

        var val = input.value.trim();
        if (!val) {
            if (msg) msg.textContent = 'Please enter your email address';
            input.focus();
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            if (msg) msg.textContent = 'Hmm... that email doesn\'t look right';
            input.focus();
            return false;
        }
        if (msg) msg.textContent = '';
        return true;
    }

    // ---------------------------------------------------------------
    // 5. DATA COLLECTION
    // ---------------------------------------------------------------

    function collectStepData(stepName) {
        switch (stepName) {
            case 'firstName':
                formData.firstName = getValue('fieldFirstName');
                break;
            case 'lastName':
                formData.lastName = getValue('fieldLastName');
                break;
            case 'email':
                formData.email = getValue('fieldEmail');
                break;
            case 'phone':
                formData.phone = getValue('fieldPhone');
                break;
            case 'eventDate':
                formData.eventDate = getValue('fieldEventDate');
                break;
            case 'venueName':
                formData.venueName = getValue('fieldVenueName');
                break;
            case 'budgetNoVenue':
                formData.budget = getValue('fieldBudgetNoVenue');
                break;
            case 'budgetWithVenue':
                formData.budget = getValue('fieldBudgetWithVenue');
                break;
            case 'specialRequests':
                formData.specialRequests = getValue('fieldSpecialRequests');
                break;
        }
    }

    function getValue(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    // ---------------------------------------------------------------
    // 6. DYNAMIC TEXT
    // ---------------------------------------------------------------

    function updateDynamicText() {
        document.querySelectorAll('.tf-dynamic').forEach(function (el) {
            var field = el.dataset.field;
            if (field && formData[field]) {
                el.textContent = formData[field];
            }
        });

        document.querySelectorAll('.tf-dynamic-num').forEach(function (el) {
            var step = el.dataset.step;
            if (step) {
                el.textContent = getQuestionNumber(step);
            }
        });
    }

    // ---------------------------------------------------------------
    // 7. NAVIGATION HANDLERS
    // ---------------------------------------------------------------

    function goNext() {
        if (currentStep === 'thankyou') return;

        if (!validateStep(currentStep)) return;

        collectStepData(currentStep);

        var next = getNextStep(currentStep);
        if (!next) return;

        history.push(currentStep);

        if (next === 'thankyou') {
            submitForm();
        }

        showStep(next, 'forward');
    }

    function goPrev() {
        var prev = getPrevStep();
        if (!prev) return;

        history.pop();
        showStep(prev, 'backward');
    }

    // Nav buttons
    navPrev.addEventListener('click', goPrev);
    navNext.addEventListener('click', goNext);

    // ---------------------------------------------------------------
    // 8. BUTTON HANDLERS
    // ---------------------------------------------------------------

    // "OK", "Start", "Submit" buttons with data-next
    document.querySelectorAll('[data-next]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            goNext();
        });
    });

    // Multiple choice selections
    document.querySelectorAll('.tf-choices').forEach(function (container) {
        container.querySelectorAll('.tf-choice').forEach(function (btn) {
            btn.addEventListener('click', function () {
                container.querySelectorAll('.tf-choice').forEach(function (c) {
                    c.classList.remove('selected');
                });

                btn.classList.add('selected');

                var stepEl = btn.closest('.tf-step');
                var stepName = stepEl.dataset.step;
                formData[stepName] = btn.dataset.value;

                setTimeout(function () {
                    goNext();
                }, 350);
            });
        });
    });

    // ---------------------------------------------------------------
    // 9. KEYBOARD SUPPORT
    // ---------------------------------------------------------------

    document.addEventListener('keydown', function (e) {
        // Enter to advance (but not inside textarea unless Ctrl+Enter)
        if (e.key === 'Enter') {
            var active = document.activeElement;
            if (active && active.tagName === 'TEXTAREA' && !e.ctrlKey) {
                return; // Allow normal newline in textarea
            }
            e.preventDefault();
            goNext();
            return;
        }

        // Arrow keys for navigation
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            goPrev();
            return;
        }

        // Letter keys for multiple choice steps
        var choiceSteps = ['eventType', 'guestCount'];
        if (choiceSteps.indexOf(currentStep) !== -1) {
            var keyMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5 };
            var lower = e.key.toLowerCase();
            if (keyMap.hasOwnProperty(lower)) {
                var container = getStepEl(currentStep).querySelector('.tf-choices');
                var choices = container.querySelectorAll('.tf-choice');
                if (choices[keyMap[lower]]) {
                    choices[keyMap[lower]].click();
                }
            }
        }

        // Y/N for yes/no question
        if (currentStep === 'hasVenue') {
            var key = e.key.toLowerCase();
            if (key === 'y' || key === 'n') {
                var container = getStepEl('hasVenue').querySelector('.tf-choices');
                var choices = container.querySelectorAll('.tf-choice');
                var idx = key === 'y' ? 0 : 1;
                choices[idx].click();
            }
        }
    });

    // ---------------------------------------------------------------
    // 10. FORM SUBMISSION
    // ---------------------------------------------------------------

    function submitForm() {
        // Build submission payload
        // Maps to the same backend DTO; social-specific fields go into
        // company (as eventType) and nonprofit field is left empty.
        var payload = {
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            email: formData.email || '',
            phone: formData.phone || '',
            company: formData.eventType || '',      // Re-use company field for event type
            nonprofit: '',                           // Not applicable for social
            eventDate: formData.eventDate || '',
            hasVenue: formData.hasVenue || '',
            venueName: formData.venueName || '',
            budget: formData.budget || '',
            guestCount: formData.guestCount || '',
            submittedAt: new Date().toISOString(),
            source: 'executivecateringct.com/social',
            // Additional context sent as notes
            specialRequests: formData.specialRequests || ''
        };

        // Try to submit to backend API
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/inquiries', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(payload));
        } catch (e) {
            console.warn('Form submission failed:', e);
        }

        console.log('Social form submitted:', payload);
    }

    // ---------------------------------------------------------------
    // 11. INITIALIZATION
    // ---------------------------------------------------------------

    showStep('welcome', 'forward');

})();
