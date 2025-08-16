// js/main.js

// --- وارد کردن تنظیمات از فایل جداگانه ---
import { firebaseConfig, appId } from './firebase-config.js';

// --- وارد کردن ماژول‌های Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- بخش مدیریت صدا (بدون تغییر) ---
const audioManager = { /* ... کد شما ... */ };

// --- متغیرهای اصلی و وضعیت بازی (بدون تغییر) ---
let app;
let auth;
let db;
let currentUserId = null;
let isAuthReady = false;

const gameState = { /* ... کد شما ... */ };

// --- متغیرهای عناصر DOM (بدون تغییر) ---
let loadingScreen, mainScreen, gameScreen, /* ... و بقیه متغیرها ... */ ;

// --- تمام توابع شما (showScreen, showModal, saveUserData, callGeminiAPI و غیره) در اینجا قرار می‌گیرند (بدون تغییر) ---
// ...
// ... (کپی کردن تمام توابع از کد اصلی)
// ...

function setupEventListeners() {
    // ... (تمام event listener های شما در اینجا قرار می‌گیرد) ...
    // ... با این تفاوت‌های کلیدی:

    // تغییر ۱: دکمه شروع بازی به جای نمایش صفحه، کاربر را به صفحه جدید هدایت می‌کند
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            if (!isAuthReady || !gameState.displayName || !gameState.publicUserId) return;
            audioManager.play('startGame');
            showGameModePanel(); 
        });
    }

    // تغییر ۲: دکمه حالت بازی چندنفره به صفحه مربوطه هدایت می‌کند
    if (multiplayerBtn) {
        multiplayerBtn.addEventListener('click', () => {
            // Redirect to the multiplayer search page
            window.location.href = 'search-players.html'; // یا هر آدرسی که برای آن صفحه در نظر دارید
        });
    }
    
    // تغییر ۳: دکمه حالت بازی تک‌نفره به صفحه بازی هدایت می‌کند
    if (singlePlayerBtn) {
        singlePlayerBtn.addEventListener('click', () => {
            window.location.href = 'game.html';
        });
    }


    // تغییر ۴: دکمه بازگشت در صفحه بازی، کاربر را به صفحه اصلی برمی‌گرداند
    if(backToMainBtn) {
        backToMainBtn.addEventListener('click', async () => {
            await saveUserData(); // ذخیره پیشرفت قبل از خروج
            gameState.currentQuestionData = null;
            window.location.href = 'index.html'; // بازگشت به صفحه اصلی
        });
    }
    
    // بقیه event listener ها بدون تغییر باقی می‌مانند، چون قبل از استفاده، وجود عنصر را چک می‌کنند
    // ...
}

async function initializeAppLogic() {
    // --- کوئری گرفتن تمام عناصر DOM مثل قبل ---
    // این کار خطا نمی‌دهد چون قبل از استفاده از هر عنصر، وجود آن چک می‌شود
    loadingScreen = document.getElementById('loading-screen');
    mainScreen = document.getElementById('main-screen');
    gameScreen = document.getElementById('game-screen');
    // ... بقیه عناصر
    
    // --- راه‌اندازی منطق اصلی ---
    audioManager.init();
    if(userProfileArea) userProfileArea.classList.add('hidden');

    if (!navigator.onLine) {
        // ... کد مدیریت آفلاین بودن
        return;
    }

    try {
        setupEventListeners();
        await initFirebase(); // این تابع onAuthStateChanged را فعال می‌کند که وضعیت کاربر را می‌خواند
    } catch (error) {
        console.error("Error during initializeApp:", error);
        if(loadingMessage) loadingMessage.textContent = "خطا در راه اندازی بازی.";
    }

    // --- تغییر ۵: اجرای منطق مخصوص هر صفحه ---
    // با چک کردن وجود یک عنصر کلیدی، می‌فهمیم در کدام صفحه هستیم
    
    // اگر در صفحه اصلی (index.html) هستیم
    if (mainScreen) { 
        simulateLoading(); // انیمیشن لودینگ را فقط در صفحه اصلی اجرا کن
    }

    // اگر در صفحه بازی (game.html) هستیم
    if (gameScreen) {
        // صبر می‌کنیم تا وضعیت کاربر از Firebase خوانده شود
        const waitForAuth = new Promise(resolve => {
            const unsub = onAuthStateChanged(auth, user => {
                if(user) {
                    unsub();
                    resolve(user);
                }
            });
        });
        
        await waitForAuth;
        
        // اگر کاربر ثبت‌نام نکرده بود، او را به صفحه اصلی برگردان
        if (!gameState.displayName || !gameState.publicUserId) {
            console.log("User has no profile, redirecting to main page.");
            window.location.href = 'index.html';
            return;
        }

        // حالا بازی را شروع کن
        generateQuestion();
    }
}

// --- اجرای برنامه ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAppLogic);
} else {
    initializeAppLogic();
}
