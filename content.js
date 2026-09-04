// ============================================================
//  Visa Premium Automator — content script v2.0
//  OTP Verification System + Auto Login/Upload
// ============================================================

if (window.__visaQaLoaded) {
    console.warn('[Visa Automator] Already loaded — skipping re-initialization.');
} else {
    window.__visaQaLoaded = true;

    // Logging helpers
    const VQA_LOG = (...a) => console.log('%c[Visa Automator]', 'color:#3b82f6;font-weight:bold', ...a);
    const VQA_WARN = (...a) => console.warn('[Visa Automator]', ...a);
    const VQA_ERR = (...a) => console.error('[Visa Automator]', ...a);
    VQA_LOG('Content script loaded ✓');

    // Load Google Fonts
    if (!document.getElementById('visa-qa-font')) {
        const fontLink = document.createElement('link');
        fontLink.id = 'visa-qa-font';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
    }

    // SVG Logo
    const VISA_LOGO = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2L4 5v6c0 4.5 3.2 7.9 8 9 4.8-1.1 8-4.5 8-9V5l-8-3z"
            fill="url(#vg)" stroke="rgba(255,255,255,0.35)" stroke-width="0.6"/>
      <circle cx="12" cy="10" r="2.6" fill="#fff" opacity="0.95"/>
      <path d="M8 16.5c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5" stroke="#fff" stroke-width="1.3"
            stroke-linecap="round" fill="none" opacity="0.95"/>
      <defs>
        <linearGradient id="vg" x1="4" y1="2" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stop-color="#3b82f6"/><stop offset="1" stop-color="#6366f1"/>
        </linearGradient>
      </defs>
    </svg>`;

    // State variables
    let selectedPdfs = [];
    const MAX_PDFS = 4;
    const MAX_PDF_BYTES = 500 * 1024;
    let isDragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    let otpTimerInterval = null;

    // ============================================================
    //  DRAG FUNCTIONALITY
    // ============================================================
    function dragStart(e) {
        if (e.target.closest('input, button, label, .close-btn')) return;
        if (!e.target.closest('#visa-qa-header')) return;

        const widget = document.getElementById('visa-qa-widget');
        if (!widget) return;

        const rect = widget.getBoundingClientRect();
        widget.style.left = rect.left + 'px';
        widget.style.top = rect.top + 'px';
        widget.style.right = 'auto';
        widget.style.bottom = 'auto';
        widget.style.transform = 'none';
        widget.style.transition = 'none';
        widget.classList.add('dragging');

        startX = e.clientX; startY = e.clientY;
        startLeft = rect.left; startTop = rect.top;
        isDragging = true;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const widget = document.getElementById('visa-qa-widget');
        if (!widget) return;

        let newLeft = startLeft + (e.clientX - startX);
        let newTop = startTop + (e.clientY - startY);
        const maxLeft = window.innerWidth - widget.offsetWidth;
        const maxTop = window.innerHeight - widget.offsetHeight;
        newLeft = Math.min(Math.max(0, newLeft), Math.max(0, maxLeft));
        newTop = Math.min(Math.max(0, newTop), Math.max(0, maxTop));
        widget.style.left = newLeft + 'px';
        widget.style.top = newTop + 'px';
    }

    function dragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        const widget = document.getElementById('visa-qa-widget');
        if (widget) {
            widget.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            widget.classList.remove('dragging');
        }
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    // ============================================================
    //  WAIT HELPERS
    // ============================================================
    function resolveEl(selector) {
        return typeof selector === 'function' ? selector() : document.querySelector(selector);
    }

    function waitForElement(selector, cb, timeout = 20000, interval = 350) {
        const start = Date.now();
        const tick = () => {
            const el = resolveEl(selector);
            if (el) { cb(el); return; }
            if (Date.now() - start >= timeout) { cb(null); return; }
            setTimeout(tick, interval);
        };
        tick();
    }

    function waitForClickable(selector, cb, timeout = 20000, interval = 350) {
        const start = Date.now();
        const tick = () => {
            const el = resolveEl(selector);
            const visible = el && el.offsetParent !== null &&
                            getComputedStyle(el).visibility !== 'hidden';
            if (el && visible && !el.disabled && el.getAttribute('aria-disabled') !== 'true') {
                cb(el); return;
            }
            if (Date.now() - start >= timeout) { cb(null); return; }
            setTimeout(tick, interval);
        };
        tick();
    }

    function findButtonByText(text) {
        const needle = text.toLowerCase();
        const btns = document.querySelectorAll('button, [role="button"]');
        for (const b of btns) {
            if ((b.textContent || '').toLowerCase().includes(needle)) return b;
        }
        return null;
    }

    // ============================================================
    //  STATUS & STORAGE
    // ============================================================
    function setStatus(msg, type) {
        if (type === 'error') VQA_ERR(msg);
        else if (type === 'success') VQA_LOG(msg);
        else VQA_LOG(msg);

        const el = document.getElementById('visa-qa-status');
        if (!el) return;
        el.textContent = msg;
        el.className = 'visa-qa-status show ' + (type || 'info');
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.className = 'visa-qa-status'; }, 4500);
    }

    const STORE_KEY = 'visaQaCreds';

    function loadCreds(cb) {
        try {
            chrome.storage.local.get(STORE_KEY, (res) => cb((res && res[STORE_KEY]) || {}));
        } catch (e) { cb({}); }
    }

    function val(id) { return (document.getElementById(id) || {}).value || ''; }

    function saveCreds() {
        const data = { phone: val('visa-in-phone'), password: val('visa-in-pass'), date: val('visa-in-date') };
        try { chrome.storage.local.set({ [STORE_KEY]: data }); } catch (e) {}
        return data;
    }

    function getCreds() {
        return { phone: val('visa-in-phone'), password: val('visa-in-pass'), date: val('visa-in-date') };
    }

    // ============================================================
    //  OTP SYSTEM
    // ============================================================
    function generateOTPClick() {
        setStatus('OTP জেনারেট করছি...', 'info');
        chrome.runtime.sendMessage({ action: 'generate_otp' }, (resp) => {
            if (resp && resp.success) {
                setStatus('OTP তৈরি হয়েছে ✓', 'success');
                displayOTP();
                startOTPTimer();
            } else {
                setStatus('OTP তৈরিতে ত্রুটি।', 'error');
            }
        });
    }

    function displayOTP() {
        chrome.runtime.sendMessage({ action: 'get_current_otp' }, (resp) => {
            if (resp && resp.otp) {
                const otpCode = resp.otp.otp;
                const codeBox = document.getElementById('visa-otp-code');
                if (codeBox) {
                    codeBox.textContent = otpCode;
                }
            }
        });
    }

    function startOTPTimer() {
        if (otpTimerInterval) clearInterval(otpTimerInterval);
        
        otpTimerInterval = setInterval(() => {
            chrome.runtime.sendMessage({ action: 'get_otp_time' }, (resp) => {
                const timerEl = document.getElementById('visa-otp-timer');
                if (!timerEl) return;
                
                if (!resp || !resp.remaining || resp.remaining <= 0) {
                    timerEl.textContent = 'এক্সপায়ার হয়েছে';
                    timerEl.className = 'otp-timer';
                    clearInterval(otpTimerInterval);
                    const codeBox = document.getElementById('visa-otp-code');
                    if (codeBox) codeBox.textContent = '---';
                } else {
                    const hrs = Math.floor(resp.remaining / 3600);
                    const mins = Math.floor((resp.remaining % 3600) / 60);
                    const secs = resp.remaining % 60;
                    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m ${secs}s`;
                    timerEl.textContent = timeStr;
                    
                    if (resp.remaining < 300) {
                        timerEl.className = 'otp-timer warning';
                    }
                }
            });
        }, 1000);
    }

    function copyOTPToClipboard() {
        const codeBox = document.getElementById('visa-otp-code');
        if (!codeBox) return;
        
        const code = codeBox.textContent;
        if (code === '---' || !code) {
            setStatus('কোন বৈধ OTP নেই।', 'error');
            return;
        }
        
        navigator.clipboard.writeText(code).then(() => {
            setStatus('OTP কপি হয়েছে ✓', 'success');
            const btn = document.getElementById('visa-otp-copy');
            if (btn) {
                btn.classList.add('copied');
                btn.textContent = 'কপি হয়েছে!';
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.textContent = '📋 কপি';
                }, 2000);
            }
        });
    }

    function verifyOTPClick() {
        const enteredOTP = val('visa-in-otp-verify');
        if (!enteredOTP) {
            setStatus('OTP এন্টার করুন।', 'error');
            return;
        }
        
        setStatus('OTP যাচাই করছি...', 'info');
        chrome.runtime.sendMessage({ action: 'verify_otp', otp: enteredOTP }, (resp) => {
            if (resp && resp.valid) {
                setStatus(resp.message || 'OTP সঠিক ✓', 'success');
                
                // Update UI
                const section = document.getElementById('otp-section');
                if (section) section.classList.add('verified');
                
                const verifyBtn = document.getElementById('visa-verify-otp-btn');
                if (verifyBtn) verifyBtn.disabled = true;
                
                // Clear input
                document.getElementById('visa-in-otp-verify').value = '';
                
                // Enable other buttons
                enableAllButtons();
                
            } else {
                setStatus(resp.message || 'OTP ভুল ✗', 'error');
            }
        });
    }

    function enableAllButtons() {
        ['btn-step1', 'btn-step2', 'btn-step3', 'btn-step4'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });
    }

    function disableAllButtons() {
        ['btn-step1', 'btn-step2', 'btn-step3', 'btn-step4'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = true;
        });
    }

    // ============================================================
    //  PDF HANDLING
    // ============================================================
    function onPdfPicked(e) {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (!files.length) return;

        let errors = [];
        files.forEach((file) => {
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                errors.push(`${file.name}: PDF নয়`); return;
            }
            if (file.size > MAX_PDF_BYTES) {
                errors.push(`${file.name}: ${(file.size/1024).toFixed(0)} KB > 500 KB`); return;
            }
            if (selectedPdfs.length >= MAX_PDFS) {
                errors.push(`সর্বাধিক ${MAX_PDFS} ফাইল অনুমতি`); return;
            }
            if (!selectedPdfs.find((f) => f.name === file.name)) {
                selectedPdfs.push(file);
            }
        });

        if (errors.length) setStatus(errors[0], 'error');
        renderPdfList();
    }

    function renderPdfList() {
        const listEl = document.getElementById('visa-pdf-list');
        const drop = document.getElementById('visa-drop');
        const nameEl = document.getElementById('visa-pdf-name');
        if (!listEl) return;

        listEl.innerHTML = '';
        if (!selectedPdfs.length) {
            drop.classList.remove('has-file');
            nameEl.textContent = 'PDF ফাইল(গুলি) বাছুন';
            return;
        }

        drop.classList.add('has-file');
        nameEl.textContent = selectedPdfs.length === 1
            ? selectedPdfs[0].name
            : `${selectedPdfs.length} ফাইল নির্বাচিত`;

        selectedPdfs.forEach((file, i) => {
            const li = document.createElement('li');
            li.className = 'pdf-item';
            li.innerHTML = `
                <span class="pdf-badge">${i === 0 ? 'প্রাথমিক' : `অতিরিক্ত ${i}`}</span>
                <span class="pdf-fname" title="${file.name}">${file.name}</span>
                <span class="pdf-size">${(file.size/1024).toFixed(0)}KB</span>
                <button class="pdf-remove" data-idx="${i}" type="button" title="সরান">×</button>
            `;
            listEl.appendChild(li);
        });

        listEl.querySelectorAll('.pdf-remove').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx, 10);
                selectedPdfs.splice(idx, 1);
                renderPdfList();
                if (!selectedPdfs.length) setStatus('PDF সরানো হয়েছে।', 'info');
            });
        });
    }

    // ============================================================
    //  AUTO LOGIN
    // ============================================================
    function runLogin() {
        const { phone, password } = getCreds();
        saveCreds();

        if (!phone || !password) {
            setStatus('ফোন এবং পাসওয়ার্ড এন্টার করুন।', 'error');
            return;
        }

        const phoneInput = document.querySelector('input[name="phone"]');
        if (phoneInput) {
            phoneInput.value = phone;
            phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        const passInput = document.querySelector('input[name="password"]');
        if (passInput) {
            passInput.value = password;
            passInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        setStatus('লগইন ফর্ম পূরণ করা হয়েছে। সাইন ইন অপেক্ষা করছে...', 'info');
        waitForClickable('button[type="submit"]', (btn) => {
            if (btn) {
                btn.click();
                setStatus('সাইন ইন ক্লিক করা হয়েছে ✓', 'success');
                
                // Auto-generate OTP after login
                setTimeout(() => generateOTPClick(), 2000);
            } else {
                setStatus('সাইন ইন বোতাম ডিসেবল - ক্যাপচা সমাধান করুন।', 'error');
            }
        }, 30000);
    }

    // ============================================================
    //  AUTO OTP
    // ============================================================
    function runOTP() {
        const otpInput = document.querySelector('#otp-0');
        if (!otpInput) {
            setStatus('এই পৃষ্ঠায় OTP ক্ষেত্র নেই।', 'error');
            return;
        }

        const typed = (val('visa-in-otp')).replace(/\D/g, '');

        if (typed.length === 6) {
            fillPageOtp(typed);
            setStatus('OTP এন্টার করা হয়েছে। যাচাই করছি...', 'info');
            waitForClickable('button[type="submit"]', (btn) => {
                if (btn) btn.click();
                afterOtpVerify();
            }, 15000);
            return;
        }

        try { otpInput.focus(); } catch (e) {}
        setStatus('উপরে OTP টাইপ করুন বা পৃষ্ঠায় এন্টার করুন।', 'info');
    }

    function fillPageOtp(code) {
        const boxes = document.querySelectorAll('input[id^="otp-"]');
        if (boxes.length >= 2) {
            code.split('').forEach((digit, i) => {
                const box = document.getElementById('otp-' + i);
                if (box) {
                    box.value = digit;
                    box.dispatchEvent(new Event('input', { bubbles: true }));
                    box.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        } else {
            const single = document.querySelector('#otp-0');
            if (single) {
                single.value = code;
                single.dispatchEvent(new Event('input', { bubbles: true }));
                single.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    function afterOtpVerify() {
        setStatus('OTP যাচাই করা হয়েছে ✓ পরবর্তী পৃষ্ঠা অপেক্ষা করছে...', 'success');
        [1000, 2000, 3500].forEach((d) => setTimeout(() => autoCloseAnyBanner(), d));
    }

    // ============================================================
    //  UPLOAD FILES
    // ============================================================
    function runUploadConfirm() {
        if (!selectedPdfs.length) {
            setStatus('প্রথমে কমপক্ষে একটি PDF বেছে নিন।', 'error');
            return;
        }

        setStatus('আপলোড ক্ষেত্র খুঁজছি...', 'info');
        waitForElement('input[type="file"]', (firstInput) => {
            if (!firstInput) { setStatus('পৃষ্ঠায় আপলোড ক্ষেত্র নেই।', 'error'); return; }
            uploadFilesSequentially(0, () => confirmAndSave());
        });
    }

    function uploadFilesSequentially(i, done) {
        if (i >= selectedPdfs.length) { done(); return; }

        const file = selectedPdfs[i];
        const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
        const target = inputs.find((inp) => !inp.files || inp.files.length === 0) || inputs[inputs.length - 1];

        if (!target) { setStatus('ফাইল ' + (i + 1) + ' এর জন্য আপলোড ক্ষেত্র নেই।', 'error'); return; }

        try {
            const dt = new DataTransfer();
            dt.items.add(file);
            target.files = dt.files;
            target.dispatchEvent(new Event('input', { bubbles: true }));
            target.dispatchEvent(new Event('change', { bubbles: true }));
            const label = i === 0 ? 'প্রাথমিক' : 'অতিরিক্ত ' + i;
            setStatus(`${label} আপলোড হয়েছে (${i + 1}/${selectedPdfs.length}) ✓`, 'success');
        } catch (err) {
            setStatus('ব্রাউজার ফাইল ইনজেকশন ব্লক করেছে।', 'error');
            return;
        }

        const beforeCount = document.querySelectorAll('input[type="file"]').length;
        if (i + 1 < selectedPdfs.length) {
            let waited = 0;
            const poll = () => {
                const now = document.querySelectorAll('input[type="file"]').length;
                const hasEmpty = Array.from(document.querySelectorAll('input[type="file"]'))
                    .some((inp) => !inp.files || inp.files.length === 0);
                if (now > beforeCount || hasEmpty || waited >= 4000) {
                    uploadFilesSequentially(i + 1, done);
                } else {
                    waited += 400;
                    setTimeout(poll, 400);
                }
            };
            setTimeout(poll, 600);
        } else {
            done();
        }
    }

    function confirmAndSave() {
        setStatus('নিশ্চিতকরণ বোতাম অপেক্ষা করছি...', 'info');
        waitForClickable(
            () => findButtonByText('Confirm All Information') ||
                  findButtonByText('Confirm All') ||
                  document.querySelector('button.bg-\\[\\#FF671F\\]'),
            (btn) => {
                if (!btn) { setStatus('নিশ্চিতকরণ বোতাম ডিসেবল।', 'error'); return; }
                btn.click();
                setStatus('তথ্য নিশ্চিত করা হয়েছে ✓', 'success');

                waitForClickable(
                    () => findButtonByText('Save & Continue') ||
                          findButtonByText('Save And Continue') ||
                          findButtonByText('Save'),
                    (saveBtn) => {
                        if (saveBtn) { saveBtn.click(); setStatus('সেভ এবং চালিয়ে যান ক্লিক করা হয়েছে ✓', 'success'); }
                        else setStatus('সেভ এবং চালিয়ে যান খুঁজে পাওয়া যায়নি।', 'error');
                    },
                    30000
                );
            },
            40000
        );
    }

    // ============================================================
    //  SLOT BOOKING
    // ============================================================
    function runSlotBooking() {
        const { date } = getCreds();
        saveCreds();

        if (!date) {
            setStatus('প্রথমে নিয়োগের তারিখ বেছে নিন।', 'error');
            return;
        }

        setStatus('মিশন এবং IVAC সেন্টার নিশ্চিত করছি...', 'info');
        waitForClickable(
            () => findButtonByText('Confirm Mission') ||
                  findButtonByText('Confirm Mission & IVAC') ||
                  document.querySelector('button[type="submit"].bg-\\[\\#FF671F\\]'),
            (missionBtn) => {
                if (missionBtn) {
                    missionBtn.click();
                    setStatus('মিশন নিশ্চিত ✓ ক্যালেন্ডার খুলছি...', 'success');
                } else {
                    setStatus('মিশন নিশ্চিতকরণ বোতাম খুঁজে পাওয়া যায়নি।', 'error');
                }

                waitForElement(
                    () => document.querySelector('.grid.grid-cols-7'),
                    () => selectCalendarDate(date)
                );
            },
            30000
        );
    }

    function selectCalendarDate(dateStr) {
        const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10));
        const targetMonthName = new Date(year, month - 1, 1)
            .toLocaleString('en-US', { month: 'long' });

        let attempts = 0;

        const tryPick = () => {
            attempts++;
            const headerText = getCalendarHeaderText();
            const onTarget = headerText &&
                headerText.toLowerCase().includes(targetMonthName.toLowerCase()) &&
                headerText.includes(String(year));

            if (onTarget) {
                const dayBtn = findEnabledDayButton(day);
                if (dayBtn) {
                    dayBtn.click();
                    setStatus(`তারিখ ${dateStr} নির্বাচিত ✓`, 'success');
                    waitForClickable(
                        () => findButtonByText('Continue Booking'),
                        (contBtn) => {
                            if (contBtn) { contBtn.click(); setStatus('বুকিং চালিয়ে যান ক্লিক করা হয়েছে ✓', 'success'); }
                            else setStatus('বুকিং চালিয়ে যান সক্ষম নয়।', 'error');
                        },
                        30000
                    );
                } else {
                    setStatus(`তারিখ ${day} নির্বাচনের জন্য উপলব্ধ নয়।`, 'error');
                }
                return;
            }

            if (attempts > 24) { setStatus('ক্যালেন্ডারে সেই মাসে পৌঁছাতে পারেনি।', 'error'); return; }
            const nextBtn = document.querySelector('button[aria-label="Next month"]');
            if (nextBtn) { nextBtn.click(); setTimeout(tryPick, 300); }
            else { setStatus('ক্যালেন্ডার পরবর্তী-মাস বোতাম খুঁজে পাওয়া যায়নি।', 'error'); }
        };

        tryPick();
    }

    function getCalendarHeaderText() {
        const nextBtn = document.querySelector('button[aria-label="Next month"]');
        if (!nextBtn) return '';
        const bar = nextBtn.parentElement;
        return bar ? (bar.textContent || '').trim() : '';
    }

    function findEnabledDayButton(day) {
        const dayStr = String(day);
        const buttons = document.querySelectorAll('.grid.grid-cols-7 button[type="button"]');
        for (const b of buttons) {
            if ((b.textContent || '').trim() === dayStr && !b.disabled) return b;
        }
        return null;
    }

    // ============================================================
    //  UTILITIES
    // ============================================================
    function autoCloseAnyBanner() {
        const closeButtons = document.querySelectorAll(
            'button[aria-label="Close"], button[aria-label="close"], ' +
            '.modal-close, svg.lucide-x, [class*="close"], [class*="Close"]'
        );
        let closed = 0;
        closeButtons.forEach((btn) => {
            if (btn.closest('#visa-qa-widget')) return;
            if (btn.offsetParent === null) return;
            (btn.closest('button, a, [role="button"]') || btn).click();
            closed++;
        });
        if (closed) setStatus('ব্যানার বন্ধ করা হয়েছে ✓', 'info');
        return closed;
    }

    // ============================================================
    //  BUILD WIDGET
    // ============================================================
    function toggleWidget() {
        const existing = document.getElementById('visa-qa-widget');
        if (existing) {
            existing.id = '';
            existing.dataset.closing = 'true';
            existing.style.opacity = '0';
            existing.style.transform = (existing.style.transform || '') + ' scale(0.95)';
            setTimeout(() => existing.remove(), 200);
            return;
        }

        const widget = document.createElement('div');
        widget.id = 'visa-qa-widget';
        widget.innerHTML = `
            <div id="visa-qa-header">
                <span class="brand">
                    <span class="logo">${VISA_LOGO}</span>
                    <span class="brand-text">
                        <span class="brand-name">Visa Automator</span>
                        <span class="brand-sub">Enterprise</span>
                    </span>
                </span>
                <span class="close-btn" id="visa-qa-close" title="বন্ধ করুন">&times;</span>
            </div>
            <div id="visa-qa-body">
                <!-- OTP SECTION -->
                <div id="otp-section" class="field">
                    <label class="visa-qa-label">🔐 OTP ভেরিফিকেশন <span class="req">(প্রয়োজনীয়)</span></label>
                    <div class="otp-display">
                        <div class="otp-code-box" id="visa-otp-code">---</div>
                        <button class="otp-copy-btn" id="visa-otp-copy" type="button" title="কপি করুন">📋 কপি</button>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; text-align: center;">
                        <span id="visa-otp-timer">অপেক্ষা করছি...</span>
                    </div>
                    <div class="otp-verify-section">
                        <button class="eye" id="visa-gen-otp" type="button" title="জেনারেট করুন" style="width: 100%; background: linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(99, 102, 241, 0.4) 100%); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 6px; padding: 10px; font-weight: 600;">✨ OTP জেনারেট করুন</button>
                        <div class="otp-input-group">
                            <input class="visa-qa-input" id="visa-in-otp-verify" type="text" inputmode="numeric" maxlength="6" placeholder="OTP এন্টার করুন" autocomplete="off" />
                            <button class="verify-otp-btn" id="visa-verify-otp-btn" type="button">✓ যাচাই করুন</button>
                        </div>
                        <div class="otp-status" id="otp-status-msg"></div>
                    </div>
                </div>

                <!-- CREDENTIALS SECTION -->
                <div class="field">
                    <label class="visa-qa-label">লাইসেন্স কী <span class="req" id="visa-lic-badge">(1-দিনের বিনামূল্যে ট্রায়াল)</span></label>
                    <div class="pass-wrap">
                        <input class="visa-qa-input" id="visa-in-license" type="text"
                               placeholder="VISA-XXXX-XXXX-XXXX" autocomplete="off" />
                        <button class="eye" id="visa-lic-activate" type="button" title="সক্রিয় করুন">✓</button>
                    </div>
                </div>
                <div class="row">
                    <div class="field">
                        <label class="visa-qa-label">ফোন</label>
                        <input class="visa-qa-input" id="visa-in-phone" type="tel" inputmode="numeric"
                               placeholder="01300000000" autocomplete="off" />
                    </div>
                    <div class="field">
                        <label class="visa-qa-label">পাসওয়ার্ড</label>
                        <div class="pass-wrap">
                            <input class="visa-qa-input" id="visa-in-pass" type="password"
                                   placeholder="••••••••" autocomplete="off" />
                            <button class="eye" id="visa-toggle-pass" type="button" title="দেখান / লুকান">👁</button>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="field">
                        <label class="visa-qa-label">OTP কোড</label>
                        <input class="visa-qa-input" id="visa-in-otp" type="text" inputmode="numeric"
                               maxlength="6" placeholder="6-ডিজিট" autocomplete="off" />
                    </div>
                    <div class="field">
                        <label class="visa-qa-label">তারিখ</label>
                        <input class="visa-qa-input" id="visa-in-date" type="date" />
                    </div>
                </div>
                <div class="field">
                    <label class="visa-qa-label">আবেদনকারী PDFs <span class="req">(১ প্রাথমিক + ৩টি পর্যন্ত · ৫০০ KB সর্বাধিক)</span></label>
                    <label class="dropzone" id="visa-drop" for="visa-in-pdf">
                        <span class="dz-icon">⬆</span>
                        <span class="dz-text" id="visa-pdf-name">PDF ফাইল(গুলি) বাছুন</span>
                    </label>
                    <input id="visa-in-pdf" type="file" accept=".pdf,application/pdf" multiple hidden />
                    <ul class="pdf-list" id="visa-pdf-list"></ul>
                </div>

                <div class="actions">
                    <button class="visa-qa-btn step1" id="btn-step1" disabled>
                        <span class="ic">🚀</span><span class="lbl"><b>1</b> স্বয়ংক্রিয় লগইন</span>
                    </button>
                    <button class="visa-qa-btn step2" id="btn-step2" disabled>
                        <span class="ic">📱</span><span class="lbl"><b>2</b> OTP যাচাই করুন</span>
                    </button>
                    <button class="visa-qa-btn step3" id="btn-step3" disabled>
                        <span class="ic">📎</span><span class="lbl"><b>3</b> ফাইল আপলোড করুন</span>
                    </button>
                    <button class="visa-qa-btn step4" id="btn-step4" disabled>
                        <span class="ic">📅</span><span class="lbl"><b>4</b> স্লট বুকিং</span>
                    </button>
                </div>

                <div class="visa-qa-status" id="visa-qa-status"></div>
            </div>
        `;
        document.body.appendChild(widget);

        widget.style.opacity = '0';
        widget.style.transform = 'scale(0.95)';
        requestAnimationFrame(() => {
            widget.style.opacity = '1';
            widget.style.transform = 'scale(1)';
        });

        // Load saved data
        loadCreds((c) => {
            if (c.phone) document.getElementById('visa-in-phone').value = c.phone;
            if (c.password) document.getElementById('visa-in-pass').value = c.password;
            if (c.date) document.getElementById('visa-in-date').value = c.date;
        });
        renderPdfList();

        // Drag listeners
        const header = document.getElementById('visa-qa-header');
        header.addEventListener('pointerdown', dragStart);
        header.addEventListener('pointerup', dragEnd);
        if (!window.__visaDragBound) {
            document.addEventListener('pointermove', drag);
            document.addEventListener('pointerup', dragEnd);
            window.__visaDragBound = true;
        }

        // Save credentials on edit
        ['visa-in-phone', 'visa-in-pass', 'visa-in-date'].forEach((id) => {
            document.getElementById(id).addEventListener('change', saveCreds);
        });

        // Password toggle
        document.getElementById('visa-toggle-pass').addEventListener('click', () => {
            const inp = document.getElementById('visa-in-pass');
            inp.type = inp.type === 'password' ? 'text' : 'password';
        });

        // PDF input
        document.getElementById('visa-in-pdf').addEventListener('change', onPdfPicked);

        // Close button
        document.getElementById('visa-qa-close').addEventListener('click', toggleWidget);

        // OTP Buttons
        document.getElementById('visa-gen-otp').addEventListener('click', generateOTPClick);
        document.getElementById('visa-otp-copy').addEventListener('click', copyOTPToClipboard);
        document.getElementById('visa-verify-otp-btn').addEventListener('click', verifyOTPClick);

        // Auto buttons (disabled until OTP verified)
        document.getElementById('btn-step1').addEventListener('click', runLogin);
        document.getElementById('btn-step2').addEventListener('click', runOTP);
        document.getElementById('btn-step3').addEventListener('click', runUploadConfirm);
        document.getElementById('btn-step4').addEventListener('click', runSlotBooking);
    }

    // ============================================================
    //  MESSAGE LISTENER
    // ============================================================
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'toggle_widget') toggleWidget();
    });

} // end __visaQaLoaded guard
