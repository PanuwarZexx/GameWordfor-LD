// User Management
let currentUser = null;
let currentUserData = null;
let selectedCharacterId = null;
let tempRegisterData = null;
// Track which levels are available to unlock manually (answered >=5)
let unlockAvailableLevels = {};
// Track unlock notification UI: pending level to notify and per-level shown flag
let pendingUnlockNotificationLevel = null;
let unlockNotificationShown = {};
// Load shown-notification flags from localStorage so user won't see the same notice after reload
try {
    const stored = localStorage.getItem('unlockNotificationShown');
    if (stored) unlockNotificationShown = JSON.parse(stored) || {};
} catch (e) {
    unlockNotificationShown = {};
}

// Character image mapping (ใช้ร่วมกัน)
const characterImages = {
    1: '01.jpg',
    2: '02.jpg',
    3: '03.jpg',
    4: '04.jpg',
    5: '05.jpg',
    6: '06.jpg'
};

// Check if user is logged in
window.onload = async () => {
    setupCharacterSelection();
    setupEditCharacterSelection();
    startBackgroundMusic(); // เริ่มเล่นเพลงพื้นหลังตั้งแต่โหลดหน้า
    
    // Check if user has token
    if (gameAPI.token) {
        try {
            const userData = await gameAPI.getUserProfile();
            currentUser = userData.username;
            currentUserData = userData;
            await loadUserData();
            init();
            showScreen('mainMenu');
        } catch (error) {
            console.error('Auto-login failed:', error);
            gameAPI.clearToken();
            showScreen('loginScreen');
        }
    } else {
        showScreen('loginScreen');
    }
};

function showLogin() {
    showScreen('loginScreen');
}

function showRegister() {
    showScreen('registerScreen');
}

async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (!username || !password) {
        showCustomAlert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', '⚠️');
        return;
    }

    if (password !== confirmPassword) {
        showCustomAlert('รหัสผ่านไม่ตรงกัน', '❌');
        return;
    }

    // Show character selection first (will register after character is selected)
    currentUser = username;
    tempRegisterData = { username, password };
    showScreen('characterScreen');
}

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showCustomAlert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', '⚠️');
        return;
    }

    try {
        const response = await gameAPI.login(username, password);
        currentUser = username;
        currentUserData = response.user;
        await loadUserData();
        init();
        showScreen('mainMenu');
    } catch (error) {
        showCustomAlert(error.message || 'เข้าสู่ระบบไม่สำเร็จ', '❌');
    }
}

function setupCharacterSelection() {
    document.querySelectorAll('.character-option').forEach(option => {
        option.addEventListener('click', function() {
            const characterId = parseInt(this.getAttribute('data-character'));
            selectedCharacterId = characterId;
            
            // Remove selected class from all
            document.querySelectorAll('.character-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked one
            this.classList.add('selected');
            
            // Enable confirm button
            const confirmBtn = document.getElementById('confirmCharacter');
            if (confirmBtn) confirmBtn.disabled = false;
        });
    });
}

async function confirmCharacter() {
    const playerName = document.getElementById('playerName').value.trim();
    
    if (!playerName) {
        showCustomAlert('กรุณาใส่ชื่อของคุณ', '⚠️');
        return;
    }

    if (!selectedCharacterId) {
        showCustomAlert('กรุณาเลือกตัวละคร', '⚠️');
        return;
    }

    try {
        // Register with API
        const response = await gameAPI.register(
            tempRegisterData.username,
            tempRegisterData.password,
            playerName,
            selectedCharacterId
        );
        
        currentUser = tempRegisterData.username;
        currentUserData = response.user;
        tempRegisterData = null;
        
        await loadUserData();
        init();
        showScreen('mainMenu');
    } catch (error) {
        showCustomAlert(error.message || 'สมัครสมาชิกไม่สำเร็จ', '❌');
    }
}

function logout() {
    showConfirm('คุณต้องการออกจากระบบหรือไม่?', () => {
        gameAPI.clearToken();
        currentUser = null;
        currentUserData = null;
        showScreen('loginScreen');
    });
}

function showEditProfile() {
    if (!currentUser || !currentUserData) return;
    
    document.getElementById('editPlayerName').value = currentUserData.displayName || '';
    selectedCharacterId = currentUserData.characterId;
    
    // Highlight selected character
    document.querySelectorAll('.edit-character').forEach(option => {
        const charId = parseInt(option.getAttribute('data-character'));
        if (charId === currentUserData.characterId) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    showScreen('editProfileScreen');
}

// Setup edit character selection (เรียกครั้งเดียวตอน load)
function setupEditCharacterSelection() {
    document.querySelectorAll('.edit-character').forEach(option => {
        option.addEventListener('click', function() {
            selectedCharacterId = parseInt(this.getAttribute('data-character'));
            document.querySelectorAll('.edit-character').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
        });
    });
}

async function updateProfile() {
    const newPlayerName = document.getElementById('editPlayerName').value.trim();
    
    if (!newPlayerName) {
        showCustomAlert('กรุณาใส่ชื่อของคุณ', '⚠️');
        return;
    }

    if (!selectedCharacterId) {
        showCustomAlert('กรุณาเลือกตัวละคร', '⚠️');
        return;
    }

    try {
        const response = await gameAPI.updateUserProfile(newPlayerName, selectedCharacterId);
        currentUserData = response.user;
        loadUserData();
        showCustomAlert('บันทึกข้อมูลเรียบร้อยแล้ว! ✨', '✅');
        setTimeout(() => {
            showScreen('mainMenu');
        }, 1500);
    } catch (error) {
        showCustomAlert(error.message || 'บันทึกข้อมูลไม่สำเร็จ', '❌');
    }
}

// Custom Alert Function
function showCustomAlert(message, icon = 'ℹ️') {
    const overlay = document.getElementById('customAlertOverlay');
    const messageEl = document.getElementById('customAlertMessage');
    const iconEl = document.getElementById('customAlertIcon');
    
    if (!overlay || !messageEl || !iconEl) {
        // Fallback to native alert if custom elements don't exist
        alert(message);
        return;
    }
    
    messageEl.textContent = message;
    iconEl.textContent = icon;
    overlay.classList.add('active');
}

function closeCustomAlert() {
    const overlay = document.getElementById('customAlertOverlay');
    if (overlay) overlay.classList.remove('active');
}

// Update game screen user info
function updateGameUserInfo() {
    if (currentUser && currentUserData) {
        const gameAvatarEl = document.getElementById('gameUserAvatar');
        const gameNameEl = document.getElementById('gameUserName');
        
        if (gameAvatarEl) {
            gameAvatarEl.src = `css/${characterImages[currentUserData.characterId]}`;
        }
        if (gameNameEl) {
            gameNameEl.textContent = currentUserData.displayName;
        }
    }
}

// Custom Confirm Function
let confirmCallback = null;
function showConfirm(message, callback) {
    confirmCallback = callback;
    const overlay = document.getElementById('customAlertOverlay');
    const messageEl = document.getElementById('customAlertMessage');
    const iconEl = document.getElementById('customAlertIcon');
    const buttonEl = overlay.querySelector('.custom-alert-button');
    
    messageEl.textContent = message;
    iconEl.textContent = '❓';
    buttonEl.textContent = 'ยืนยัน';
    buttonEl.onclick = function() {
        closeCustomAlert();
        if (confirmCallback) {
            confirmCallback();
            confirmCallback = null;
        }
        buttonEl.textContent = 'ตกลง';
        buttonEl.onclick = closeCustomAlert;
    };
    overlay.classList.add('active');
    
    // Add cancel button temporarily
    if (!overlay.querySelector('.cancel-button')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'custom-alert-button cancel-button';
        cancelBtn.textContent = 'ยกเลิก';
        cancelBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        cancelBtn.style.marginLeft = '10px';
        cancelBtn.onclick = function() {
            closeCustomAlert();
            confirmCallback = null;
            buttonEl.textContent = 'ตกลง';
            buttonEl.onclick = closeCustomAlert;
            this.remove();
        };
        buttonEl.parentNode.appendChild(cancelBtn);
    }
}

async function loadUserData() {
    if (!currentUser || !currentUserData) return;
    
    try {
        // Get progress from API
        const progress = await gameAPI.getProgress();
        
        // แสดงชื่อและ avatar (ตรวจสอบ element ก่อนใช้งาน)
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        
        if (userNameEl) userNameEl.textContent = currentUserData.displayName;
        const avatarSrc = `css/${characterImages[currentUserData.characterId]}`;
        if (userAvatarEl) userAvatarEl.src = avatarSrc;
        
        // อัพเดทใน level select screen ด้วย
        const levelUserAvatar = document.getElementById('levelUserAvatar');
        const levelUserName = document.getElementById('levelUserName');
        const levelUserScore = document.getElementById('levelUserScore');
        
        if (levelUserAvatar) levelUserAvatar.src = avatarSrc;
        if (levelUserName) levelUserName.textContent = currentUserData.displayName;

        // โหลดความคืบหน้า - MongoDB returns Objects, not Maps
        levelScores = progress.levelScores || {};
        
        // Normalize answeredWords: convert keys to strings and values to numbers
        const rawAnsweredWords = progress.answeredWords || {};
        answeredWords = {};
        for (let key in rawAnsweredWords) {
            const levelKey = String(key);
            // Convert all values to numbers (in case they're strings)
            answeredWords[levelKey] = Array.isArray(rawAnsweredWords[key]) 
                ? rawAnsweredWords[key].map(v => typeof v === 'string' ? parseInt(v) : v)
                : [];
        }
        
        unlockedLevels = Array.isArray(progress.unlockedLevels) && progress.unlockedLevels.length > 0 
            ? progress.unlockedLevels[progress.unlockedLevels.length - 1] 
            : 1;
        // If the current highest unlocked level has >=5 answered, mark next level as available to unlock
        try {
            const curKey = String(unlockedLevels);
            if (answeredWords[curKey] && answeredWords[curKey].length >= 5 && unlockedLevels < 10) {
                unlockAvailableLevels[unlockedLevels] = true;
                const nextLevel = unlockedLevels + 1;
                if (!unlockNotificationShown[nextLevel]) {
                    pendingUnlockNotificationLevel = nextLevel;
                }
            }
        } catch (e) {
            console.warn('Error computing pending unlock from loaded progress', e);
        }
        
        console.log('Loaded from MongoDB (after normalize):');
        console.log('answeredWords:', answeredWords);
        
        // คำนวณคะแนนรวม
        score = 0;
        for (let level in levelScores) {
            score += levelScores[level] || 0;
        }
        
        // อัพเดทคะแนนใน level select
        if (levelUserScore) levelUserScore.textContent = score;
    } catch (error) {
        console.error('Load user data error:', error);
        // Use default values if API fails
        levelScores = {};
        answeredWords = {};
        unlockedLevels = 1;
        score = 0;
    }
}

async function saveUserData() {
    if (!currentUser) return;
    
    try {
        // Get all unlocked levels as array
        const unlockedLevelsArray = [];
        for (let i = 1; i <= unlockedLevels; i++) {
            unlockedLevelsArray.push(i);
        }
        
        await gameAPI.updateProgress({
            unlockedLevels: unlockedLevelsArray,
            levelScores: levelScores,
            answeredWords: answeredWords,
            currentLevel: currentLevel || 1,
            totalStars: 0 // Calculate if needed
        });
    } catch (error) {
        console.error('Save user data error:', error);
    }
}

// Game Data
const gameData = {
    1: {
        name: "หมวดสัตว์",
        folder: "เสียงคำตอบ/สัตว์",
        words: [
            { word: "กา", image: "ภาพประกอบ คำศัพท์/2.png", spelling: "กอ อา กา" },
            { word: "งู", image: "ภาพประกอบ คำศัพท์/3.png", spelling: "งอ อู งู" },
            { word: "ม้า", image: "ภาพประกอบ คำศัพท์/4.png", spelling: "มอ อา ม้า" },
            { word: "ปลา", image: "ภาพประกอบ คำศัพท์/5.png", spelling: "ปอ ลอ อา ปลา" },
            { word: "หมา", image: "ภาพประกอบ คำศัพท์/6.png", spelling: "หอ มอ อา หมา" },
            { word: "แมว", image: "ภาพประกอบ คำศัพท์/7.png", spelling: "มอ แอ วอ แมว" },
            { word: "กบ", image: "ภาพประกอบ คำศัพท์/8.png", spelling: "กอ บอ กบ" },
            { word: "เต่า", image: "ภาพประกอบ คำศัพท์/9.png", spelling: "ตอ เอ อา เต่า" },
            { word: "นก", image: "ภาพประกอบ คำศัพท์/10.png", spelling: "นอ กอ นก" },
            { word: "มด", image: "ภาพประกอบ คำศัพท์/11.png", spelling: "มอ ดอ มด" }
        ]
    },
    2: {
        name: "หมวดสิ่งของ",
        folder: "เสียงคำตอบ/สิ่งของ",
        words: [
            { word: "รถ", image: "ภาพประกอบ คำศัพท์/13.png", spelling: "รอ ถอ รถ" },
            { word: "ถัง", image: "ภาพประกอบ คำศัพท์/14.png", spelling: "ถอ อั งอ ถัง" },
            { word: "ไม้", image: "ภาพประกอบ คำศัพท์/15.png", spelling: "มอ ไอ ไม้" },
            { word: "ตู้", image: "ภาพประกอบ คำศัพท์/16.png", spelling: "ตอ อู ตู้" },
            { word: "โต๊ะ", image: "ภาพประกอบ คำศัพท์/17.png", spelling: "ตอ โอ อะ โต๊ะ" },
            { word: "ถ้วย", image: "ภาพประกอบ คำศัพท์/18.png", spelling: "ถอ อั วอ ยอ ถ้วย" },
            { word: "ส้อม", image: "ภาพประกอบ คำศัพท์/19.png", spelling: "สอ ออ มอ ส้อม" },
            { word: "หม้อ", image: "ภาพประกอบ คำศัพท์/20.png", spelling: "หอ มอ ออ หม้อ" },
            { word: "ช้อน", image: "ภาพประกอบ คำศัพท์/21.png", spelling: "ชอ ออ นอ ช้อน" },
            { word: "แก้ว", image: "ภาพประกอบ คำศัพท์/22.png", spelling: "กอ แอ วอ แก้ว" }
        ]
    },
    3: {
        name: "หมวดร่างกาย",
        folder: "เสียงคำตอบ/ร่างกาย",
        words: [
            { word: "ตา", image: "ภาพประกอบ คำศัพท์/24.png", spelling: "ตอ อา ตา" },
            { word: "หู", image: "ภาพประกอบ คำศัพท์/25.png", spelling: "หอ อู หู" },
            { word: "ปาก", image: "ภาพประกอบ คำศัพท์/26.png", spelling: "ปอ อา กอ ปาก" },
            { word: "มือ", image: "ภาพประกอบ คำศัพท์/27.png", spelling: "มอ อือ มือ" },
            { word: "เท้า", image: "ภาพประกอบ คำศัพท์/28.png", spelling: "ทอ เอ อา เท้า" },
            { word: "ขา", image: "ภาพประกอบ คำศัพท์/29.png", spelling: "ขอ อา ขา" },
            { word: "ผม", image: "ภาพประกอบ คำศัพท์/30.png", spelling: "ผอ มอ ผม" },
            { word: "ฟัน", image: "ภาพประกอบ คำศัพท์/31.png", spelling: "ฟอ อั นอ ฟัน" },
            { word: "คอ", image: "ภาพประกอบ คำศัพท์/32.png", spelling: "คอ ออ คอ" },
            { word: "จมูก", image: "ภาพประกอบ คำศัพท์/33.png", spelling: "จอ มอ อู กอ จมูก" }
        ]
    },
    4: {
        name: "หมวดธรรมชาติ",
        folder: "เสียงคำตอบ/ธรรมชาติ",
        words: [
            { word: "ฟ้า", image: "ภาพประกอบ คำศัพท์/35.png", spelling: "ฟอ อา ฟ้า" },
            { word: "ดิน", image: "ภาพประกอบ คำศัพท์/36.png", spelling: "ดอ อิ นอ ดิน" },
            { word: "น้ำ", image: "ภาพประกอบ คำศัพท์/37.png", spelling: "นอ อำ น้ำ" },
            { word: "ไฟ", image: "ภาพประกอบ คำศัพท์/38.png", spelling: "ฟอ ไอ ไฟ" },
            { word: "ลม", image: "ภาพประกอบ คำศัพท์/39.png", spelling: "ลอ มอ ลม" },
            { word: "เมฆ", image: "ภาพประกอบ คำศัพท์/40.png", spelling: "มอ เอ ขอ เมฆ" },
            { word: "ดาว", image: "ภาพประกอบ คำศัพท์/41.png", spelling: "ดอ อา วอ ดาว" },
            { word: "ภูเขา", image: "ภาพประกอบ คำศัพท์/42.png", spelling: "ภอ อู เอ ขอ อา ภูเขา" },
            { word: "หนาว", image: "ภาพประกอบ คำศัพท์/43.png", spelling: "หอ นอ อา วอ หนาว" },
            { word: "ร้อน", image: "ภาพประกอบ คำศัพท์/44.png", spelling: "รอ ออ นอ ร้อน" }
        ]
    },
    5: {
        name: "หมวดคนรอบตัว",
        folder: "เสียงคำตอบ/คนรอบตัว",
        words: [
            { word: "พ่อ", image: "ภาพประกอบ คำศัพท์/46.png", spelling: "พอ ออ พ่อ" },
            { word: "แม่", image: "ภาพประกอบ คำศัพท์/47.png", spelling: "มอ แอ แม่" },
            { word: "ป้า", image: "ภาพประกอบ คำศัพท์/48.png", spelling: "ปอ อา ป้า" },
            { word: "ลุง", image: "ภาพประกอบ คำศัพท์/49.png", spelling: "ลอ อุ งอ ลุง" },
            { word: "น้า", image: "ภาพประกอบ คำศัพท์/50.png", spelling: "นอ อา น้า" },
            { word: "พี่", image: "ภาพประกอบ คำศัพท์/51.png", spelling: "พอ อี พี่" },
            { word: "น้อง", image: "ภาพประกอบ คำศัพท์/52.png", spelling: "นอ ออ งอ น้อง" },
            { word: "ครู", image: "ภาพประกอบ คำศัพท์/53.png", spelling: "คอ รอ อู ครู" },
            { word: "เพื่อน", image: "ภาพประกอบ คำศัพท์/54.png", spelling: "พอ เอ อือ ออ นอ เพื่อน" },
            { word: "ยาย", image: "ภาพประกอบ คำศัพท์/55.png", spelling: "ยอ อา ยอ ยาย" }
        ]
    },
    6: {
        name: "คำ 2 พยางค์",
        folder: "เสียงคำตอบ/คำ 2 พยางค์",
        words: [
            { word: "ดอกไม้", image: "ภาพประกอบ คำศัพท์/57.png", spelling: "ดอ ออ กอ ไอ มอ ดอกไม้" },
            { word: "ต้นไม้", image: "ภาพประกอบ คำศัพท์/58.png", spelling: "ตอ นอ ไอ มอ ต้นไม้" },
            { word: "กระเป๋า", image: "ภาพประกอบ คำศัพท์/59.png", spelling: "กอ รอ อะ เอ ปอ อา กระเป๋า" },
            { word: "ดินสอ", image: "ภาพประกอบ คำศัพท์/60.png", spelling: "ดอ อิ นอ สอ ออ ดินสอ" },
            { word: "ยางลบ", image: "ภาพประกอบ คำศัพท์/61.png", spelling: "ยอ อา งอ ลอ บอ ยางลบ" },
            { word: "รถไฟ", image: "ภาพประกอบ คำศัพท์/62.png", spelling: "รอ ถอ ไอ ฟอ รถไฟ" },
            { word: "ลำโพง", image: "ภาพประกอบ คำศัพท์/63.png", spelling: "ลอ อำ โอ พอ งอ ลำโพง" },
            { word: "เต้นรำ", image: "ภาพประกอบ คำศัพท์/64.png", spelling: "ตอ เอ นอ รอ อำ เต้นรำ" },
            { word: "แต่งงาน", image: "ภาพประกอบ คำศัพท์/65.png", spelling: "ตอ แอ งอ งอ อา นอ แต่งงาน" },
            { word: "ปลูกผัก", image: "ภาพประกอบ คำศัพท์/66.png", spelling: "ปอ ลอ อู กอ ผอ อั กอ ปลูกผัก" }
        ]
    },
    7: {
        name: "คำอาหารและผลไม้",
        folder: "เสียงคำตอบ/คำอาหารและผลไม้ + คำทั่วไป",
        words: [
            { word: "มะนาว", image: "ภาพประกอบ คำศัพท์/68.png", spelling: "มอ อะ นอ อา วอ มะนาว" },
            { word: "มะม่วง", image: "ภาพประกอบ คำศัพท์/69.png", spelling: "มอ อะ มอ วอ งอ มะม่วง" },
            { word: "มะเขือ", image: "ภาพประกอบ คำศัพท์/70.png", spelling: "มอ อะ เอ ขอ อือ ออ มะเขือ" },
            { word: "กล้วย", image: "ภาพประกอบ คำศัพท์/71.png", spelling: "กอ ลอ วอ ยอ กล้วย" },
            { word: "ขนมปัง", image: "ภาพประกอบ คำศัพท์/72.png", spelling: "ขอ นอ มอ ปอ อั งอ ขนมปัง" },
            { word: "ไก่ทอด", image: "ภาพประกอบ คำศัพท์/73.png", spelling: "ไอ กอ ทอ ออ ดอ ไก่ทอด" },
            { word: "บ้านเล็ก", image: "ภาพประกอบ คำศัพท์/74.png", spelling: "บอ อา นอ เอ ลอ กอ บ้านเล็ก" },
            { word: "แมวน้อย", image: "ภาพประกอบ คำศัพท์/75.png", spelling: "มอ แอ วอ นอ ออ ยอ แมวน้อย" },
            { word: "หมาใหญ่", image: "ภาพประกอบ คำศัพท์/76.png", spelling: "หอ มอ อา ใอ หอ ยอ หมาใหญ่" },
            { word: "น้ำหวาน", image: "ภาพประกอบ คำศัพท์/77.png", spelling: "นอ อำ หอ วอ อา นอ น้ำหวาน" }
        ]
    },
    8: {
        name: "หมวดผสม",
        folder: "เสียงคำตอบ/หมวดธรรมชาติ + สิ่งของ + สัตว์ผสม",
        words: [
            { word: "ผีเสื้อ", image: "ภาพประกอบ คำศัพท์/79.png", spelling: "ผอ อี เอ สอ อือ ออ ผีเสื้อ" },
            { word: "แมงมุม", image: "ภาพประกอบ คำศัพท์/80.png", spelling: "มอ แอ งอ มอ อุ มอ แมงมุม" },
            { word: "เต่าทอง", image: "ภาพประกอบ คำศัพท์/81.png", spelling: "ตอ เอ อา ทอ ออ งอ เต่าทอง" },
            { word: "หลอดไฟ", image: "ภาพประกอบ คำศัพท์/82.png", spelling: "หอ ลอ ออ ดอ ไอ ฟอ หลอดไฟ" },
            { word: "ดวงจันทร์", image: "ภาพประกอบ คำศัพท์/83.png", spelling: "ดอ วอ งอ จอ อั นอ ทอ รอ ดวงจันทร์" },
            { word: "ทะเล", image: "ภาพประกอบ คำศัพท์/84.png", spelling: "ทอ อะ เอ ลอ ทะเล" },
            { word: "ภูเขาไฟ", image: "ภาพประกอบ คำศัพท์/85.png", spelling: "ภอ อู เอ ขอ อา ไอ ฟอ ภูเขาไฟ" },
            { word: "หนังสือ", image: "ภาพประกอบ คำศัพท์/86.png", spelling: "หอ นอ อั งอ สอ อือ ออ หนังสือ" },
            { word: "กล่อง", image: "ภาพประกอบ คำศัพท์/87.png", spelling: "กอ ลอ ออ งอ กล่อง" },
            { word: "เสื้อกันฝน", image: "ภาพประกอบ คำศัพท์/88.png", spelling: "สอ เอ อือ ออ กอ อั นอ ฝอ นอ เสื้อกันฝน" }
        ]
    },
    9: {
        name: "หมวดโรงเรียน",
        folder: "เสียงคำตอบ/หมวดโรงเรียน + ชีวิตประจำวัน",
        words: [
            { word: "สมุด", image: "ภาพประกอบ คำศัพท์/90.png", spelling: "สอ มอ อุ ดอ สมุด" },
            { word: "โต๊ะเรียน", image: "ภาพประกอบ คำศัพท์/91.png", spelling: "ตอ โอ อะ เอ รอ อี ยอ นอ โต๊ะเรียน" },
            { word: "กระดานดำ", image: "ภาพประกอบ คำศัพท์/92.png", spelling: "กอ รอ อะ ดอ อา นอ ดอ อำ กระดานดำ" },
            { word: "ปากกาแดง", image: "ภาพประกอบ คำศัพท์/93.png", spelling: "ปอ อา กอ กอ อา แอ ดอ งอ ปากกาแดง" },
            { word: "ขวดน้ำ", image: "ภาพประกอบ คำศัพท์/94.png", spelling: "ขอ วอ ดอ นอ อำ ขวดน้ำ" },
            { word: "กล่องข้าว", image: "ภาพประกอบ คำศัพท์/95.png", spelling: "กอ ลอ ออ งอ ขอ อา วอ กล่องข้าว" },
            { word: "รองเท้า", image: "ภาพประกอบ คำศัพท์/96.png", spelling: "รอ ออ งอ เอ ทอ อา รองเท้า" },
            { word: "กระถาง", image: "ภาพประกอบ คำศัพท์/97.png", spelling: "กอ รอ อะ ถอ อา งอ กระถาง" },
            { word: "รถบัส", image: "ภาพประกอบ คำศัพท์/98.png", spelling: "รอ ถอ บอ อั สอ รถบัส" },
            { word: "รถถัง", image: "ภาพประกอบ คำศัพท์/99.png", spelling: "รอ ถอ ถอ อั งอ รถถัง" }
        ]
    },
    10: {
        name: "คำยาวขึ้น",
        folder: "เสียงคำตอบ/คำยาวขึ้นเล็กน้อย แต่ความหมายชัด",
        words: [
            { word: "หุ่นยนต์", image: "ภาพประกอบ คำศัพท์/101.png", spelling: "หอ อุ นอ ยอ นอ ตอ หุ่นยนต์" },
            { word: "เครื่องบิน", image: "ภาพประกอบ คำศัพท์/102.png", spelling: "คอ เอ รอ อือ ออ งอ บอ อิ นอ เครื่องบิน" },
            { word: "จักรยาน", image: "ภาพประกอบ คำศัพท์/103.png", spelling: "จอ อั กอ รอ ยอ อา นอ จักรยาน" },
            { word: "มอเตอร์ไซค์", image: "ภาพประกอบ คำศัพท์/104.png", spelling: "มอ ออ เอ ตอ ออ รอ ไอ ซอ คอ มอเตอร์ไซค์" },
            { word: "ดอกทานตะวัน", image: "ภาพประกอบ คำศัพท์/105.png", spelling: "ดอ ออ กอ ทอ อา นอ ตอ อะ วอ อั นอ ดอกทานตะวัน" },
            { word: "บ้านสองชั้น", image: "ภาพประกอบ คำศัพท์/106.png", spelling: "บอ อา นอ สอ ออ งอ ชอ อั นอ บ้านสองชั้น" },
            { word: "เรือดำน้ำ", image: "ภาพประกอบ คำศัพท์/107.png", spelling: "เอ รอ อือ ออ ดอ อำ นอ อำ เรือดำน้ำ" },
            { word: "หมีขั้วโลก", image: "ภาพประกอบ คำศัพท์/108.png", spelling: "หอ มอ อี ขอ อั วอ โอ ลอ กอ หมีขั้วโลก" },
            { word: "แม่น้ำ", image: "ภาพประกอบ คำศัพท์/109.png", spelling: "มอ แอ นอ อำ แม่น้ำ" },
            { word: "พระอาทิตย์", image: "ภาพประกอบ คำศัพท์/110.png", spelling: "พอ รอ อะ ออ อา ทอ อิ ตอ ยอ พระอาทิตย์" }
        ]
    }
};

// Thai characters for keyboard
const thaiConsonants = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ', 'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ณ', 'ด', 'ต', 'ถ', 'ท', 'ธ', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ', 'ฟ', 'ภ', 'ม', 'ย', 'ร', 'ล', 'ว', 'ศ', 'ษ', 'ส', 'ห', 'ฬ', 'อ', 'ฮ'];
// รวมสระและวรรณยุกต์ทั้งหมดที่ใช้ในเกม (เฉพาะที่ปรากฏในคำ)
const thaiVowels = ['ะ', 'า', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 'เ', 'แ', 'โ', 'ใ', 'ไ', 'ำ', 'ั', '่', '้', '๊', '๋'];

let currentLevel = 1;
let currentWordIndex = 0;
let currentAnswer = [];
let score = 0;
let soundEnabled = true; // ควบคุมเสียงคำและปุ่ม
let backgroundMusicEnabled = true; // ควบคุมเสียงเพลงพื้นหลังแยกต่างหาก
let levelScores = {};
let answeredWords = {};
let unlockedLevels = 1;
let currentAudio = null; // เก็บ audio object ทึ่กำลังเล่นอยู่
let backgroundMusic = null; // เก็บเสียงเพลงพื้นหลัง

// Initialize the game
function init() {
    updateLevelDisplay();
    startBackgroundMusic();
}

// เริ่มเล่นเพลงพื้นหลัง
function startBackgroundMusic() {
    if (!backgroundMusic) {
        backgroundMusic = new Audio('เสียงคำตอบ/เพลง.mp3');
        backgroundMusic.volume = 0.08; // ปรับความดังให้เบา (8%)
        backgroundMusic.loop = true; // เล่นวนลูป
        
        if (backgroundMusicEnabled) {
            backgroundMusic.play().catch(error => {
                console.log('Background music playback failed:', error);
            });
        }
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showMainMenu() {
    showScreen('mainMenu');
}

function showLevelSelect() {
    updateLevelDisplay();
    showScreen('levelSelect');
}

function updateLevelDisplay() {
    // Update level cards with word preview
    for (let level = 1; level <= 10; level++) {
        const wordsContainer = document.getElementById(`level${level}Words`);
        const levelCard = wordsContainer?.closest('.level-card');
        const startButton = document.getElementById(`startLevel${level}`);
        
        // Determine if this level can be manually unlocked (previous level answered >=5)
        const canUnlockThisLevel = (unlockAvailableLevels[level - 1] === true) && (level === unlockedLevels + 1);

        // ล็อคด่านที่ยังไม่ได้ปลดล็อค
        if (level > unlockedLevels) {
            if (canUnlockThisLevel) {
                // Keep the level card faded like locked, but make the start button an active unlock action
                if (levelCard) levelCard.classList.add('unlockable');
                if (startButton) {
                    startButton.disabled = false;
                    startButton.style.opacity = '1';
                    startButton.style.cursor = 'pointer';
                    startButton.classList.add('unlock-action');
                    startButton.innerHTML = 'ปลดล็อค';
                    startButton.onclick = async (e) => {
                        e.preventDefault();
                        unlockedLevels = level;
                        // clear availability for this unlock
                        if (unlockAvailableLevels[level - 1]) delete unlockAvailableLevels[level - 1];
                        // remove visual flags
                        if (levelCard) levelCard.classList.remove('unlockable');
                        startButton.classList.remove('unlock-action');
                        await saveUserData();
                        updateLevelDisplay();
                        showCustomAlert('ปลดล็อคด่านเรียบร้อย', '✅');
                    };
                }
            } else {
                if (levelCard) {
                    levelCard.classList.remove('unlockable');
                    levelCard.classList.add('locked');
                }
                if (startButton) {
                    startButton.disabled = true;
                    startButton.style.opacity = '0.5';
                    startButton.style.cursor = 'not-allowed';
                    startButton.innerHTML = '🔒 ล็อค';
                    startButton.onclick = null;
                    startButton.classList.remove('unlock-action');
                }
            }
        } else {
            if (levelCard) {
                levelCard.classList.remove('unlockable');
                levelCard.classList.remove('locked');
            }
            if (startButton) {
                startButton.disabled = false;
                startButton.style.opacity = '1';
                startButton.style.cursor = 'pointer';
                startButton.innerHTML = `เล่นด่าน ${level}`;
                startButton.onclick = () => startLevel(level);
                startButton.classList.remove('unlock-action');
            }
        }
        
        if (wordsContainer && gameData[level]) {
            wordsContainer.innerHTML = '';
            const displayWords = gameData[level].words.slice(0, 10);
            const levelAnswered = answeredWords[String(level)] || [];
            
            displayWords.forEach((item, index) => {
                const wordDiv = document.createElement('div');
                wordDiv.className = 'word-item';
                
                // เปลี่ยนสีตามสถานะ
                if (levelAnswered.includes(index)) {
                    wordDiv.classList.add('answered'); // ตอบแล้ว - เขียว
                } else {
                    wordDiv.classList.add('unanswered'); // ยังไม่ตอบ - แดง
                }
                
                wordDiv.innerHTML = `
                    <span class="word-text">${index + 1}. ${item.word}</span>
                    <span class="sound-icon-word" style="font-size: 0.9em; opacity: 0.8; cursor: pointer; padding: 4px; margin-left: 8px;">🔊</span>
                `;
                wordDiv.style.display = 'flex';
                wordDiv.style.alignItems = 'center';
                wordDiv.style.justifyContent = 'space-between';
                
                // กดที่คำเพื่อเข้าด่าน
                const wordText = wordDiv.querySelector('.word-text');
                wordText.style.flex = '1';
                wordText.style.cursor = 'pointer';
                wordText.onclick = () => {
                    startLevelAtWord(level, index);
                };
                
                // กดที่ไอคอนลำโพงเพื่อฟังเสียงอย่างเดียว
                const soundIcon = wordDiv.querySelector('.sound-icon-word');
                soundIcon.onclick = (e) => {
                    e.stopPropagation();
                    playWordSoundDirect(level, index);
                };
                
                wordsContainer.appendChild(wordDiv);
            });
        }

        // Update scores
        const scoreElement = document.getElementById(`level${level}Score`);
        if (scoreElement) {
            const answered = answeredWords[level] ? answeredWords[level].length : 0;
            scoreElement.textContent = `${answered}/10`;
        }
        
    }
    
    // หากมีการแจ้งเตือนการปลดล็อคค้างอยู่ ให้แสดงเฉพาะเมื่ออยู่ในหน้ารายการด่าน และแสดงครั้งเดียว
    const pending = pendingUnlockNotificationLevel;
    if (pending && !unlockNotificationShown[pending]) {
        const activeScreenId = document.querySelector('.screen.active')?.id;
        // ไม่แสดงขณะเล่นด่านเดียวกัน — แสดงเฉพาะในหน้ารายการด่าน
        if (activeScreenId === 'levelSelect') {
            // แสดงข้อความแจ้งเตือน (ผู้เล่นต้องกดตกลงเพื่อยืนยัน)
            showCustomAlert('คุณสามารถปลดล็อคด่านถัดไปได้แล้ว ไปที่หน้ารายการด่านเพื่อปลดล็อค', '✅');
            const overlay = document.getElementById('customAlertOverlay');
            if (overlay) {
                const btn = overlay.querySelector('.custom-alert-button');
                if (btn) {
                    // ตั้งค่า handler ชั่วคราว: เมื่อกดจะบันทึกว่าแสดงแล้วและปิด dialog
                    btn.onclick = function() {
                        unlockNotificationShown[pending] = true;
                        try { localStorage.setItem('unlockNotificationShown', JSON.stringify(unlockNotificationShown)); } catch (e) {}
                        pendingUnlockNotificationLevel = null;
                        closeCustomAlert();
                    };
                }
            }
        }
    }

    // คำนวณคะแนนรวมและระดับ
    updateTotalScore();
}

function updateTotalScore() {
    // อัพเดทข้อมูลผู้เล่นในหน้าสรุปผล
    if (currentUser && currentUserData) {
        const summaryAvatar = document.getElementById('summaryPlayerAvatar');
        const summaryName = document.getElementById('summaryPlayerName');
        const summaryId = document.getElementById('summaryPlayerId');
        
        if (summaryAvatar) {
            summaryAvatar.src = `css/${characterImages[currentUserData.characterId]}`;
        }
        if (summaryName) {
            summaryName.textContent = currentUserData.displayName;
        }
        if (summaryId) {
            summaryId.textContent = currentUser;
        }
    }

    let totalAnswered = 0;
    let totalPossible = 0;
    
    // นับเฉพาะด่านที่ปลดล็อคแล้ว
    for (let level = 1; level <= unlockedLevels; level++) {
        const answered = answeredWords[String(level)] ? answeredWords[String(level)].length : 0;
        totalAnswered += answered;
        totalPossible += 10; // แต่ละด่านมี 10 คำ
    }
    
    // คำนวณเปอร์เซ็นต์
    const percentage = totalPossible > 0 ? Math.round((totalAnswered / totalPossible) * 100) : 0;
    
    // แสดงเปอร์เซ็นต์
    const totalScoreElement = document.getElementById('totalScore');
    if (totalScoreElement) {
        totalScoreElement.textContent = `${percentage}%`;
    }

    // แสดงจำนวนด่านที่ปลดล็อค (เช่น 5/10)
    const unlockedEl = document.getElementById('unlockedCount');
    if (unlockedEl) {
        const maxLevels = Object.keys(gameData).length || 10;
        unlockedEl.textContent = `${unlockedLevels}/${maxLevels}`;
    }

    // แสดงจำนวนข้อที่ตอบได้เทียบกับจำนวนข้อรวมตามด่านที่ปลดล็อค (เช่น 25/50)
    const answeredEl = document.getElementById('answeredFraction');
    if (answeredEl) {
        // totalPossible already computed based on unlockedLevels
        answeredEl.textContent = `${totalAnswered}/${totalPossible}`;
    }
    
    // กำหนดระดับและสี
    let grade = '';
    let gradeColor = '';
    
    if (percentage >= 80) {
        grade = 'ดีมาก 🌟';
        gradeColor = '#4fb848'; // เขียว
    } else if (percentage >= 50) {
        grade = 'ดี 👍';
        gradeColor = '#f4b235'; // ส้ม
    } else if (totalAnswered > 0) {
        grade = 'ปรับปรุง 💪';
        gradeColor = '#e85d9e'; // ชมพู
    } else {
        grade = '-';
        gradeColor = '#999';
    }
    
    // แสดงระดับ
    const gradeLevelElement = document.getElementById('gradeLevel');
    if (gradeLevelElement) {
        gradeLevelElement.textContent = grade;
        gradeLevelElement.style.color = gradeColor;
    }
}

function startLevel(level) {
    // ตรวจสอบว่าด่านปลดล็อคหรือยัง
    if (level > unlockedLevels) {
        showCustomAlert(`กรุณาผ่านด่าน ${unlockedLevels} ให้ได้อย่างน้อย 5 ข้อก่อน`, '🔒');
        return;
    }
    
    currentLevel = level;
    score = levelScores[level] || 0;
    
    // หาข้อที่ยังไม่ได้ทำ
    const levelWords = gameData[level].words;
    const answeredInLevel = answeredWords[String(level)] || [];
    
    let foundUnanswered = false;
    for (let i = 0; i < levelWords.length; i++) {
        const word = levelWords[i].word;
        // เช็คทั้งคำและ index (เพราะ answeredWords อาจเก็บทั้ง 2 แบบ)
        if (!answeredInLevel.includes(word) && !answeredInLevel.includes(i) && !answeredInLevel.includes(String(i))) {
            currentWordIndex = i;
            foundUnanswered = true;
            break;
        }
    }
    
    // ถ้าทำครบหมดแล้ว เริ่มใหม่ที่ข้อ 0
    if (!foundUnanswered) {
        currentWordIndex = 0;
    }
    
    // Update game screen user info
    updateGameUserInfo();
    
    loadWord();
    showScreen('gameScreen');
}

function startLevelAtWord(level, wordIndex) {
    // ตรวจสอบว่าด่านปลดล็อคหรือยัง
    if (level > unlockedLevels) {
        showCustomAlert(`กรุณาผ่านด่าน ${unlockedLevels} ให้ได้อย่างน้อย 5 ข้อก่อน`, '🔒');
        return;
    }
    

    currentLevel = level;
    currentWordIndex = wordIndex;
    score = levelScores[level] || 0;
    
    // Update game screen user info
    updateGameUserInfo();
    
    loadWordDirect();
    showScreen('gameScreen');
}

function loadWord() {
    const levelData = gameData[currentLevel];
    
    if (!levelData || currentWordIndex >= levelData.words.length) {
        // Level completed
        const levelAnswered = answeredWords[currentLevel] || [];
        const answered = levelAnswered.length;
        showCustomAlert(`ยินดีด้วย! คุณตอบถูก ${answered}/${levelData.words.length} ข้อ`, '🎉');
        levelScores[currentLevel] = answered;
        saveUserData();
        currentWordIndex = 0;
        showLevelSelect();
        return;
    }

    const wordData = levelData.words[currentWordIndex];
    setupWordDisplay(wordData);
}

function loadWordDirect() {
    const levelData = gameData[currentLevel];
    if (!levelData || currentWordIndex >= levelData.words.length) {
        showLevelSelect();
        return;
    }

    const wordData = levelData.words[currentWordIndex];
    setupWordDisplay(wordData);
}

function setupWordDisplay(wordData) {
    const levelData = gameData[currentLevel];
    document.getElementById('currentWord').textContent = levelData.name;
    
    // Set image
    const imgElement = document.getElementById('wordImage');
    imgElement.src = wordData.image;
    imgElement.onerror = function() {
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="200" y="150" font-size="24" text-anchor="middle" fill="%23999"%3E' + encodeURIComponent(wordData.word) + '%3C/text%3E%3C/svg%3E';
    };

    // Generate answer slots - จัดกลุ่มพยัญชนะกับสระ/วรรณยุกต์
    const slotsContainer = document.getElementById('answerSlots');
    slotsContainer.innerHTML = '';
    currentAnswer = [];
    
    // Logic จัดกลุ่มคำไทย (Cluster)
    const wordStr = wordData.word;
    window.currentWordClusters = []; // เก็บโครงสร้างว่าแต่ละ slot รับตัวอักษรไหนบ้าง
    
    // โค้ดสำหรับตรวจสอบว่าเป็นสระบน/ล่าง หรือวรรณยุกต์ หรือทัณฑฆาต (ตัวการันต์) หรือพินทุ หรือนิคหิต
    const isUpperLowerVowelOrTone = (char) => {
        const code = char.charCodeAt(0);
        return code === 0x0E31 ||                      // ไม้หันอากาศ
               (code >= 0x0E34 && code <= 0x0E3A) ||   // สระอิ ถึง พินทุ (สระบน/ล่าง)
               (code >= 0x0E47 && code <= 0x0E4E);     // ไม้ไต่คู้ ถึง ยามักการ (วรรณยุกต์/เครื่องหมาย)
    };

    let clusterIndex = -1;
    let charToClusterMap = []; // map ว่า ตัวอักษร index นี้ อยู่ใน cluster หน้าจอไหน

    for (let i = 0; i < wordStr.length; i++) {
        const char = wordStr[i];
        if (i === 0 || !isUpperLowerVowelOrTone(char)) {
            // เริ่มบล็อคใหม่ (พยัญชนะ หรือ สระหน้า/หลัง)
            clusterIndex++;
            window.currentWordClusters.push({ chars: [char], maxLen: 1 });
        } else {
            // เอาไปเกาะกับบล็อคก่อนหน้า
            if(clusterIndex >= 0) {
                window.currentWordClusters[clusterIndex].chars.push(char);
                window.currentWordClusters[clusterIndex].maxLen++;
            }
        }
        charToClusterMap.push(clusterIndex);
    }
    
    window.charToClusterMap = charToClusterMap; // บันทึกไว้ใช้ตอนพิมพ์

    // สร้างกล่องตามจำนวน cluster
    for (let i = 0; i < window.currentWordClusters.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'answer-slot answer-slot-char combined-slot';
        slot.id = `slot-cluster-${i}`;
        slotsContainer.appendChild(slot);
    }

    // Generate keyboard with relevant characters
    generateKeyboard(wordData.word);
    
    // Hide next button, hide spelling display
    document.getElementById('nextButton').style.display = 'none';
    document.querySelector('.check-button').style.display = 'inline-block';
    hideSpelling();
    
    // อัพเดทตัวนับข้อ
    updateWordCounter();
    
    // อัพเดทคะแนนรวมสะสม
    updateGameTotalScore();
    
    // เล่นเสียงคำอัตโนมัติ
    setTimeout(() => {
        playWordSound();
    }, 300);
}

// แสดงคำสะกด/คำอ่าน + เล่นเสียงสะกดคำ
function showSpelling() {
    // ซ่อนคำอ่านตามที่ User ร้องขอ (ได้ยินแค่เสียง)
    const spellingDisplay = document.getElementById('spellingDisplay');
    if (spellingDisplay) {
        spellingDisplay.style.display = 'none';
    }
    
    // เล่นเสียงสะกดคำจากโฟลเดอร์ เสียงสะกดคำ/ด่านที่X/N_คำ.mp3
    playSpellingSound();
}

// เล่นเสียงสะกดคำ
function playSpellingSound() {
    if (!soundEnabled) return;
    const wordIndex = currentWordIndex + 1; // ไฟล์เรียงเป็น 1-based
    const levelData = gameData[currentLevel];
    const wordData = levelData.words[currentWordIndex];
    const audioPath = `เสียงสะกดคำ/ด่านที่${currentLevel}/${wordIndex}_${wordData.word}.mp3`;
    playAudio(audioPath);
}

function hideSpelling() {
    const spellingDisplay = document.getElementById('spellingDisplay');
    if (spellingDisplay) {
        spellingDisplay.style.display = 'none';
        spellingDisplay.textContent = '';
    }
}

// อัพเดทตัวนับข้อ (ข้อ X/10)
function updateWordCounter() {
    const counterEl = document.getElementById('wordCounter');
    if (counterEl) {
        const totalWords = gameData[currentLevel].words.length;
        counterEl.textContent = `${currentWordIndex + 1}/${totalWords}`;
    }
}

// อัพเดทคะแนนรวมสะสมขณะเล่น
function updateGameTotalScore() {
    let totalScore = 0;
    for (let level in answeredWords) {
        totalScore += (answeredWords[level] ? answeredWords[level].length : 0);
    }
    
    const totalScoreEl = document.getElementById('gameTotalScore');
    if (totalScoreEl) {
        totalScoreEl.textContent = totalScore;
    }
    
    // อัพเดทคะแนนด่านปัจจุบัน
    const levelKey = String(currentLevel);
    const levelAnswered = answeredWords[levelKey] ? answeredWords[levelKey].length : 0;
    const currentScoreEl = document.getElementById('currentScore');
    if (currentScoreEl) {
        currentScoreEl.textContent = levelAnswered;
    }
}

// ฟังก์ชันแสดงสรุปผลการเล่นรวม 30 คนล่าสุด
async function showUsersSummary() {
    const modal = document.getElementById('usersSummaryModal');
    const tableBody = document.getElementById('summaryTableBody');
    const loadingEl = document.getElementById('summaryLoading');
    
    if (!modal) return;
    
    modal.classList.add('active');
    if (loadingEl) loadingEl.style.display = 'block';
    if (tableBody) tableBody.innerHTML = '';
    
    try {
        const summaryData = await gameAPI.getUsersSummary(30);
        
        if (loadingEl) loadingEl.style.display = 'none';
        
        if (!summaryData || summaryData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">ยังไม่มีข้อมูลผู้เล่น</td></tr>';
            return;
        }
        
        summaryData.forEach((user, index) => {
            const totalPossible = user.maxUnlocked * 10;
            const percentage = totalPossible > 0 ? Math.round((user.totalAnswered / totalPossible) * 100) : 0;
            
            let grade = '';
            let gradeClass = '';
            if (percentage >= 80) {
                grade = 'ดีมาก 🌟';
                gradeClass = 'grade-excellent';
            } else if (percentage >= 50) {
                grade = 'ดี 👍';
                gradeClass = 'grade-good';
            } else if (user.totalAnswered > 0) {
                grade = 'ปรับปรุง 💪';
                gradeClass = 'grade-improve';
            } else {
                grade = '-';
                gradeClass = '';
            }
            
            // สร้างรายละเอียดแต่ละด่าน
            let levelDetailsHtml = '';
            for (let l = 1; l <= 10; l++) {
                const ans = user.levelDetails[String(l)] || 0;
                const statusClass = ans >= 10 ? 'level-complete' : (ans > 0 ? 'level-progress' : 'level-none');
                levelDetailsHtml += `<span class="level-badge ${statusClass}">${l}:${ans}</span>`;
            }
            
            const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '-';
            
            const avatarSrc = `css/${characterImages[user.characterId] || '01.jpg'}`;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <div class="summary-user-info">
                        <img src="${avatarSrc}" alt="" class="summary-user-avatar">
                        <div>
                            <div class="summary-user-name">${user.displayName}</div>
                            <div class="summary-user-id">${user.username}</div>
                        </div>
                    </div>
                </td>
                <td>${user.totalAnswered}/100</td>
                <td>${user.maxUnlocked}/10</td>
                <td class="${gradeClass}">${grade}</td>
                <td class="level-details-cell">${levelDetailsHtml}</td>
            `;
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error fetching users summary:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#e85d9e;">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่</td></tr>';
        }
    }
}

function closeUsersSummary() {
    const modal = document.getElementById('usersSummaryModal');
    if (modal) modal.classList.remove('active');
}

function generateKeyboard(word) {
    const keyboardContainer = document.getElementById('thaiKeyboard');
    
    // Reset ปุ่มทั้งหมดก่อนล้าง (ลบ class selected ออก)
    document.querySelectorAll('.thai-key').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // ล้างปุ่มเก่าออก
    keyboardContainer.innerHTML = '';

    // Mapping ตัวอักษรกับหมายเลขรูปภาพ
    const consonantImageMap = {
        'ก': 1, 'ข': 2, 'ฃ': 3, 'ค': 4, 'ฅ': 5, 'ฆ': 6, 'ง': 7, 'จ': 8, 'ฉ': 9,
        'ช': 10, 'ซ': 11, 'ฌ': 12, 'ญ': 13, 'ฎ': 14, 'ฏ': 15, 'ฐ': 16, 'ฑ': 17, 'ฒ': 18,
        'ณ': 19, 'ด': 20, 'ต': 21, 'ถ': 22, 'ท': 23, 'ธ': 24, 'น': 25, 'บ': 26, 'ป': 27,
        'ผ': 28, 'ฝ': 29, 'พ': 30, 'ฟ': 31, 'ภ': 32, 'ม': 33, 'ย': 34, 'ร': 35, 'ล': 36,
        'ว': 37, 'ศ': 38, 'ษ': 39, 'ส': 40, 'ห': 41, 'ฬ': 42, 'อ': 43, 'ฮ': 44
    };
    
    // Compound vowels mapping (สระผสม)
    const compoundVowelMap = {
        'เอะ': { image: 9, parts: ['เ', 'ะ'] },
        'เอ': { image: 11, parts: ['เ'] },
        'แอะ': { image: 11, parts: ['แ', 'ะ'] },
        'แอ': { image: 13, parts: ['แ'] },
        'โอะ': { image: 13, parts: ['โ', 'ะ'] },
        'โอ': { image: 15, parts: ['โ'] },
        'เอาะ': { image: 15, parts: ['เ', 'า', 'ะ'] },
        'ออ': { image: 17, parts: ['อ'] },
        'ฮอ': { image: 18, parts: ['ฮ', 'อ'] },
        'เอียะ': { image: 19, parts: ['เ', 'ี', 'ย', 'ะ'] },
        'เอีย': { image: 20, parts: ['เ', 'ี', 'ย'] },
        'เอือะ': { image: 21, parts: ['เ', 'ื', 'อ', 'ะ'] },
        'เอือ': { image: 22, parts: ['เ', 'ื', 'อ'] },
        'อัวะ': { image: 23, parts: ['ั', 'ว', 'ะ'] },
        'อัว': { image: 24, parts: ['ั', 'ว'] },
        'เอา': { image: 28, parts: ['เ', 'า'] }
    };
    
    const vowelImageMap = {
        'ะ': 1,
        'า': 2,
        'ิ': 3,
        'ี': 4,
        'ึ': 5,
        'ื': 6,
        'ุ': 7,
        'ู': 8,
        'เ': 10,
        'แ': 12,
        'โ': 14,
        'อ': 16,
        'ฤ': 29,
        'ฦ': 31,
        'ำ': 25,
        'ใ': 26,
        'ไ': 27,
        'ั': 'ไม้หันกาศ',  // ไม้หันกาศ (mai han akat)
        '่': 32,
        '้': 33,
        '๊': 34,
        '๋': 35
    };

    // Get unique characters from the word
    const wordChars = [...new Set(word.split(''))];
    
    // แยกพยัญชนะและสระ/วรรณยุกต์ (นับจำนวนที่ปรากฏในคำ รวมตัวซ้ำ)
    const consonantsInWord = [];
    const vowelsInWord = [];
    
    for (const char of word) {
        if (consonantImageMap[char]) {
            consonantsInWord.push(char);
        } else if (char !== '') {
            vowelsInWord.push(char);
        }
    }
    
    // Add some extra random characters to make it challenging
    const randomConsonants = [];
    const randomVowels = [];
    
    // เพิ่มพยัญชนะสุ่ม (3 แถว x 4 คอลัมน์ = 12 ปุ่ม)
    while (randomConsonants.length + consonantsInWord.length < 12) {
        const randomChar = thaiConsonants[Math.floor(Math.random() * thaiConsonants.length)];
        if (!consonantsInWord.includes(randomChar) && !randomConsonants.includes(randomChar)) {
            randomConsonants.push(randomChar);
        }
    }
    
    // เพิ่มสระ/วรรณยุกต์สุ่ม (1 แถว x 4 คอลัมน์ = 4 ปุ่ม)
    while (randomVowels.length + vowelsInWord.length < 4) {
        const randomChar = thaiVowels[Math.floor(Math.random() * thaiVowels.length)];
        if (!vowelsInWord.includes(randomChar) && !randomVowels.includes(randomChar)) {
            randomVowels.push(randomChar);
        }
    }

    // รวมและสับเปลี่ยนแยกกัน
    const consonantChars = [...consonantsInWord, ...randomConsonants].sort(() => Math.random() - 0.5);
    const vowelChars = [...vowelsInWord, ...randomVowels].sort(() => Math.random() - 0.5);
    
    // รวมพยัญชนะก่อน แล้วตามด้วยสระ
    const keyboardChars = [...consonantChars, ...vowelChars];

    // Create buttons
    keyboardChars.forEach(char => {
        const button = document.createElement('button');
        button.className = 'thai-key';
        
        // หาหมายเลขรูปภาพ
        let imageNumber = null;
        let folderName = '';
        
        // หาหมายเลขรูปภาพ
        if (consonantImageMap[char]) {
            imageNumber = consonantImageMap[char];
            folderName = 'พยัญชนะ ก-ฮ';
        } else if (vowelImageMap[char]) {
            imageNumber = vowelImageMap[char];
            folderName = 'สระ และ วรรณยุกต์';
            button.classList.add('vowel-tone-keys');
        }
        
        // ถ้าไม่พบในสระ ให้ลองหาในพยัญชนะ (สำหรับ ย ว อ)
        if (!imageNumber && consonantImageMap[char]) {
            imageNumber = consonantImageMap[char];
            folderName = 'พยัญชนะ ก-ฮ';
        }
        
        if (imageNumber && folderName) {
            // สร้าง container สำหรับรูปภาพและปุ่มลำโพง
            button.innerHTML = `
                <img src="${folderName}/${imageNumber}.png" alt="${char}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">
                <span class="sound-btn-char" style="position: absolute; bottom: 2px; right: 2px; font-size: 0.7em; opacity: 0.8; cursor: pointer; z-index: 10; background: rgba(255,255,255,0.7); border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">🔊</span>
            `;
        } else {
            // ใช้ข้อความถ้าไม่มีรูป
            button.innerHTML = `
                <span style="pointer-events: none;">${char}</span>
                <span class="sound-btn-char" style="position: absolute; bottom: 2px; right: 2px; font-size: 0.6em; opacity: 0.8; cursor: pointer; z-index: 10; background: rgba(255,255,255,0.7); border-radius: 50%; padding: 2px;">🔊</span>
            `;
        }
        
        button.style.position = 'relative';
        button.onclick = () => selectCharacter(char, button);
        
        // เพิ่มการเล่นเสียงเมื่อคลิกที่ไอคอนลำโพงเท่านั้น
        const soundBtn = button.querySelector('.sound-btn-char');
        if (soundBtn) {
            soundBtn.onclick = (e) => {
                e.stopPropagation(); // ป้องกันไม่ให้เลือกอักษร
                playCharacterSound(char);
            };
        }
        
        keyboardContainer.appendChild(button);
    });
}

function selectCharacter(char, button) {
    // ถ้ากดซ้ำตัวเดิมที่ถูกเลือกแล้ว ให้ยกเลิกการเลือก
    if (button.classList.contains('selected')) {
        // ลบตัวอักษรนี้ออกจาก currentAnswer (หาตัวสุดท้ายที่ตรงกัน)
        let charIndex = -1;
        for (let i = currentAnswer.length - 1; i >= 0; i--) {
            if (currentAnswer[i] === char) {
                charIndex = i;
                break;
            }
        }
        
        if (charIndex !== -1) {
            currentAnswer.splice(charIndex, 1);
            // อัปเดตช่องแสดงผลทั้งหมด
            updateAnswerSlots();
        }
        
        // ยกเลิกการเลือกปุ่ม
        button.classList.remove('selected');
        return;
    }
    
    // เพิ่มตัวอักษรลงใน currentAnswer
    currentAnswer.push(char);
    updateAnswerSlots();
    button.classList.add('selected');
    
    // Play character sound if available
    playCharacterSound(char);
}

// อัปเดตช่องแสดงผลแต่ละช่อง เป็นแบบ Cluster (ตัวซ้อน)
function updateAnswerSlots() {
    // ล้างกล่องทั้งหมดก่อน
    if (!window.currentWordClusters) return;
    
    for (let i = 0; i < window.currentWordClusters.length; i++) {
        const slot = document.getElementById(`slot-cluster-${i}`);
        if (slot) {
            slot.innerHTML = ''; // Clear prior spans
        }
    }
    
    // วาดตัวอักษรที่พิมพ์ลงไปในกล่องที่มันควรอยู่
    for (let i = 0; i < currentAnswer.length; i++) {
        const char = currentAnswer[i];
        const targetClusterIndex = window.charToClusterMap[i];
        
        if (targetClusterIndex !== undefined) {
            const slot = document.getElementById(`slot-cluster-${targetClusterIndex}`);
            if (slot) {
                // ใส่ตัวอักษรลงในกล่อง เรียงต่อกันไป (CSS จะจัดการซ้อนให้เองถ้าตั้งค่าไว้)
                const charSpan = document.createElement('span');
                charSpan.className = 'stacked-char';
                charSpan.textContent = char;
                slot.appendChild(charSpan);
            }
        }
    }
}

function deleteLastChar() {
    if (currentAnswer.length > 0) {
        // ลบตัวอักษรตัวสุดท้าย
        const removedChar = currentAnswer.pop();
        
        // อัปเดตการแสดงผล
        updateAnswerSlots();
        
        // ยกเลิกการเลือกปุ่มตัวอักษรที่ถูกลบ
        const keyboardButtons = document.querySelectorAll('.thai-key');
        keyboardButtons.forEach(button => {
            // ตรวจสอบตัวอักษรจาก alt ของ img หรือ text ของ span แรก
            let buttonChar = '';
            const img = button.querySelector('img');
            if (img) {
                buttonChar = img.alt;
            } else {
                const span = button.querySelector('span');
                if (span) {
                    buttonChar = span.textContent;
                }
            }
            
            if (buttonChar === removedChar && button.classList.contains('selected')) {
                button.classList.remove('selected');
                return;
            }
        });
    }
}

function checkAnswer() {
    const levelData = gameData[currentLevel];
    const wordData = levelData.words[currentWordIndex];
    const userAnswer = currentAnswer.join('');
    const correctAnswer = wordData.word;

    if (userAnswer === correctAnswer) {
        showResultModal(true);
        
        // บันทึกคำที่ตอบถูก และเพิ่มคะแนนเฉพาะครั้งแรกที่ตอบถูก
        const levelKey = String(currentLevel);
        if (!answeredWords[levelKey]) {
            answeredWords[levelKey] = [];
        }
        
        // เช็คว่าเคยตอบถูกหรือยัง ถ้ายังให้เพิ่มคะแนน
        const isFirstTime = !answeredWords[levelKey].includes(currentWordIndex);
        
        if (isFirstTime) {
            score++;
            answeredWords[levelKey].push(currentWordIndex);
            saveUserData();
        }
        
        // อัพเดทคะแนนรวม
        updateGameTotalScore();
        
        document.getElementById('nextButton').style.display = 'inline-block';
        document.querySelector('.check-button').style.display = 'none';
        
        // ตรวจสอบว่าตอบได้ 5 ข้อหรือยัง — ถ้าครบแล้ว ให้แสดงปุ่มให้ผู้เล่นปลดล็อคเอง
        if (answeredWords[levelKey].length >= 5 && currentLevel === unlockedLevels && currentLevel < 10) {
            // Mark next level as available to unlock (will show unlock UI in level select)
            unlockAvailableLevels[currentLevel] = true;
            // Remember to notify the player (but don't show immediately while they're playing)
            pendingUnlockNotificationLevel = currentLevel + 1;
            // update UI so the unlock button/status appears in level select
            updateLevelDisplay();
        }
        
        createConfetti();
        // Auto-advance to next word after a short delay when answer is correct
        setTimeout(() => {
            // Close the result modal then advance
            try { closeModal(); } catch (e) {}
            // Advance to next word (will handle end-of-level inside loadWord)
            nextWord();
        }, 1200);
    } else {
        showResultModal(false);
        // Reset answer
        setTimeout(() => {
            resetAnswer();
        }, 1500);
    }
}

function resetAnswer() {
    currentAnswer = [];
    document.querySelectorAll('.answer-slot').forEach(slot => {
        slot.textContent = '';
    });
    document.querySelectorAll('.thai-key').forEach(button => {
        button.classList.remove('selected');
    });
}

function nextWord() {
    currentWordIndex++;
    loadWord();
}

function skipWord() {
    // ข้ามไปคำถัดไป
    currentWordIndex++;
    if (currentWordIndex >= gameData[currentLevel].words.length) {
        // ถ้าข้อสุดท้ายแล้ว กลับไปเลือกด่าน
        showLevelSelect();
    } else {
        loadWord();
    }
}

function showResultModal(isCorrect) {
    const modal = document.getElementById('resultModal');
    const modalContent = modal.querySelector('.modal-content');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');

    if (isCorrect) {
        modalContent.className = 'modal-content modal-correct';
        modalIcon.textContent = '✓';
        modalTitle.textContent = 'คำตอบถูกต้อง';
        playCorrectSound();
    } else {
        modalContent.className = 'modal-content modal-wrong';
        modalIcon.textContent = '✕';
        modalTitle.textContent = 'คำตอบไม่ถูกต้อง';
        playWrongSound();
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('resultModal').classList.remove('active');
}

function playWordSound() {
    const levelData = gameData[currentLevel];
    const wordData = levelData.words[currentWordIndex];
    const audioPath = `${levelData.folder}/${wordData.word}.mp3`;
    playAudio(audioPath);
}

function playWordSoundDirect(level, index) {
    if (!soundEnabled) return;
    const levelData = gameData[level];
    const wordData = levelData.words[index];
    const audioPath = `${levelData.folder}/${wordData.word}.mp3`;
    playAudio(audioPath);
}

function playCharacterSound(char) {
    if (!soundEnabled) return;
    
    // เล่นเสียงพยัญชนะ
    if (thaiConsonants.includes(char)) {
        const audioPath = `เสียงพยัญชนะ/${char}.mp3`;
        playAudio(audioPath);
    } 
    // เล่นเสียงสระและวรรณยุกต์
    else if (thaiVowels.includes(char)) {
        // แปลงตัวอักษรเป็นชื่อไฟล์เสียง
        const vowelSoundMap = {
            'ะ': 'อะ',
            'า': 'อา',
            'ิ': 'อิ',
            'ี': 'อี',
            'ึ': 'อึ',
            'ื': 'อือ',
            'ุ': 'อุ',
            'ู': 'อู',
            'เ': 'เอ',
            'แ': 'แอ',
            'โ': 'โอ',
            'ใ': 'ไอไม้ม้วน',
            'ไ': 'ไอไม้มลาย',
            'ำ': 'อำ',
            'ั': 'หันอากาศ',
            '็': 'ไต่คู้',
            '์': 'ไม้ทัณฑฆาต',
            '่': 'ไม้เอก',
            '้': 'ไม้โท',
            '๊': 'ไม้ตรี',
            '๋': 'ไม้จัตวา'
        };
        
        const soundName = vowelSoundMap[char];
        if (soundName) {
            const audioPath = `วรรณยุกต์สระ/${soundName}.mp3`;
            playAudio(audioPath);
        }
    }
}

function playCorrectSound() {
    if (!soundEnabled) return;
    // You can add a correct answer sound effect here
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVKvn77BbGAg+ltzy0H4qBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4oBSV7yfHajjwJF2K37OmkUxEKSqPh8bllHAU2kNXzzn4o';
    audio.play().catch(() => {});
}

function playCorrectSound() {
    if (!soundEnabled) return;
    
    // สร้างเสียงพลุ (celebration sound) ดังขึ้น
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // เล่นเสียงหลายชุดเพื่อเลียนแบบเสียงพลุ
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // ความถี่แบบสุ่มเพื่อเสียงพลุ
            oscillator.frequency.setValueAtTime(800 + Math.random() * 1000, audioContext.currentTime);
            oscillator.type = 'sine';
            
            // ลดเสียงค่อยๆ
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }, i * 100);
    }
}

function playWrongSound() {
    if (!soundEnabled) return;
    
    // สร้างเสียงแตร (buzzer sound)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // เสียงแตรความถี่ต่ำ
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playAudio(src) {
    if (!soundEnabled) return;
    
    // หยุดเสียงเก่าถ้ามี
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    
    currentAudio = new Audio(src);
    currentAudio.volume = 0.8; // ปรับระดับเสียงปุ่มให้ดังพอ
    currentAudio.play().catch(error => {
        console.log('Audio playback failed:', error);
    });
}

function toggleSound() {
    backgroundMusicEnabled = !backgroundMusicEnabled;
    const soundIcon = document.querySelector('.sound-icon');
    soundIcon.textContent = backgroundMusicEnabled ? '🔊' : '🔇';
    
    // ควบคุมเพลงพื้นหลังเท่านั้น (ไม่ปิดเสียงคำและปุ่ม)
    if (backgroundMusic) {
        if (backgroundMusicEnabled) {
            backgroundMusic.play().catch(error => {
                console.log('Background music playback failed:', error);
            });
        } else {
            backgroundMusic.pause();
        }
    }
    
    // เล่นเสียงเมื่อปิด/เปิดเสียง
    playButtonClickSound();
}

function playButtonClickSound() {
    if (!soundEnabled) return;
    // เล่นเสียง click ของปุ่ม
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function createConfetti() {
    const colors = ['#f4b235', '#4fb848', '#e85d9e', '#2563a8', '#ff8247'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}

