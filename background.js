// ============================================================
//  Visa Premium Automator — background service worker
//  OTP Verification System v2.0
// ============================================================

const LICENSE_SERVER = "https://visa-license-server.bypassbd.workers.dev";

// ============================================================
//  OTP GENERATION & VERIFICATION SYSTEM
// ============================================================

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Create OTP with metadata
function createOTP() {
    const otp = generateOTP();
    const sessionId = generateSessionId();
    const createdAt = Date.now();
    const expiresAt = createdAt + (24 * 60 * 60 * 1000); // 24 hours validity
    const isUsed = false;
    const usedAt = null;

    const otpData = {
        otp,
        sessionId,
        createdAt,
        expiresAt,
        isUsed,
        usedAt,
        attempts: 0,
        maxAttempts: 5
    };

    // Store OTP in Chrome Storage
    chrome.storage.local.set({ 'currentOTP': otpData }, () => {
        console.log('[OTP System] OTP Generated:', otp);
    });

    return otpData;
}

// Verify OTP
function verifyOTP(enteredOTP, callback) {
    chrome.storage.local.get('currentOTP', (result) => {
        const otpData = result.currentOTP;

        if (!otpData) {
            callback({ valid: false, reason: 'no_otp', message: 'কোন OTP জেনারেট হয়নি' });
            return;
        }

        const now = Date.now();

        // Check if OTP is expired
        if (now > otpData.expiresAt) {
            callback({ valid: false, reason: 'expired', message: 'OTP সময়োপযোগী নয়' });
            return;
        }

        // Check if OTP is already used
        if (otpData.isUsed) {
            callback({ valid: false, reason: 'already_used', message: 'এই OTP ইতিমধ্যে ব্যবহার হয়েছে' });
            return;
        }

        // Check max attempts
        if (otpData.attempts >= otpData.maxAttempts) {
            callback({ valid: false, reason: 'max_attempts', message: 'অনেক চেষ্টা করেছেন, পুনরায় লগইন করুন' });
            return;
        }

        // Increment attempts
        otpData.attempts += 1;

        // Check if OTP matches
        if (enteredOTP === otpData.otp) {
            otpData.isUsed = true;
            otpData.usedAt = now;
            chrome.storage.local.set({ 'currentOTP': otpData });
            chrome.storage.local.set({ 'otpVerified': true });
            callback({ 
                valid: true, 
                message: 'OTP সঠিক! আপনি এখন ফাইল আপলোড করতে পারবেন।',
                sessionId: otpData.sessionId
            });
            return;
        }

        // OTP doesn't match
        chrome.storage.local.set({ 'currentOTP': otpData });
        const remaining = otpData.maxAttempts - otpData.attempts;
        callback({ 
            valid: false, 
            reason: 'invalid_otp', 
            message: `OTP ভুল। আরও ${remaining} চেষ্টা করতে পারবেন।`,
            attempts: otpData.attempts,
            remaining: remaining
        });
    });
}

// Check if user is OTP verified
function isOTPVerified(callback) {
    chrome.storage.local.get(['otpVerified', 'currentOTP'], (result) => {
        const verified = result.otpVerified || false;
        const otpData = result.currentOTP;

        if (!verified || !otpData) {
            callback(false);
            return;
        }

        // Check if OTP is expired
        if (Date.now() > otpData.expiresAt) {
            chrome.storage.local.remove('otpVerified');
            callback(false);
            return;
        }

        callback(true);
    });
}

// Clear OTP (logout)
function clearOTP() {
    chrome.storage.local.remove(['currentOTP', 'otpVerified']);
    console.log('[OTP System] OTP Cleared');
}

// Get remaining time for OTP
function getOTPTimeRemaining(callback) {
    chrome.storage.local.get('currentOTP', (result) => {
        const otpData = result.currentOTP;
        if (!otpData) {
            callback(null);
            return;
        }

        const remaining = otpData.expiresAt - Date.now();
        if (remaining <= 0) {
            callback(null);
            return;
        }

        callback(Math.ceil(remaining / 1000)); // seconds
    });
}

// ============================================================
//  LICENSE VERIFICATION (Original System)
// ============================================================

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_widget" }, () => {
        void chrome.runtime.lastError;
    });
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    // License verification
    if (request.action === "verify_license") {
        fetch(`${LICENSE_SERVER}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: request.key, deviceId: request.deviceId }),
        })
            .then((r) => r.json())
            .then((data) => sendResponse(data))
            .catch((err) => sendResponse({ valid: false, reason: "network_error", detail: String(err) }));
        return true;
    }

    // OTP Generation
    if (request.action === "generate_otp") {
        const otpData = createOTP();
        sendResponse({ success: true, otp: otpData.otp, message: 'OTP জেনারেট হয়েছে' });
        return true;
    }

    // OTP Verification
    if (request.action === "verify_otp") {
        verifyOTP(request.otp, (result) => {
            sendResponse(result);
        });
        return true;
    }

    // Check OTP Verification Status
    if (request.action === "check_otp_verified") {
        isOTPVerified((verified) => {
            sendResponse({ verified });
        });
        return true;
    }

    // Get OTP Time Remaining
    if (request.action === "get_otp_time") {
        getOTPTimeRemaining((remaining) => {
            sendResponse({ remaining });
        });
        return true;
    }

    // Clear OTP (Logout)
    if (request.action === "clear_otp") {
        clearOTP();
        sendResponse({ success: true, message: 'OTP ক্লিয়ার হয়েছে' });
        return true;
    }

    // Get Current OTP (for display)
    if (request.action === "get_current_otp") {
        chrome.storage.local.get('currentOTP', (result) => {
            sendResponse({ otp: result.currentOTP });
        });
        return true;
    }
});

console.log('[Visa Automator] Background Service Worker loaded with OTP System v2.0');
