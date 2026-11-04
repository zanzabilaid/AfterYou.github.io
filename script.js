const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const topScoreText = document.getElementById("topScore");
const warningText = document.getElementById("warning");
const dashText = document.getElementById("dashStatus");

const message = document.getElementById("message");
const title = document.getElementById("title");
const description = document.getElementById("description");
const startButton = document.getElementById("start");

const pauseBtn = document.getElementById("pauseBtn");
const pauseOverlay = document.getElementById("pauseOverlay");
const resumeBtn = document.getElementById("resumeBtn");

const bossBarContainer = document.getElementById("bossBarContainer");
const bossBarTrack = document.getElementById("bossBarTrack");
const bossBarFill = document.getElementById("bossBarFill");
const bossMultiplier = document.getElementById("bossMultiplier");

const choiceOverlay = document.createElement("div");
choiceOverlay.id = "choiceOverlay";
choiceOverlay.className = "hidden";
choiceOverlay.style.position = "fixed";
choiceOverlay.style.top = "0";
choiceOverlay.style.left = "0";
choiceOverlay.style.width = "100vw";
choiceOverlay.style.height = "100vh";
choiceOverlay.style.display = "flex";
choiceOverlay.style.alignItems = "center";
choiceOverlay.style.justifyContent = "center";
choiceOverlay.style.background = "rgba(10, 10, 15, 0.88)";
choiceOverlay.style.zIndex = "99999";
choiceOverlay.innerHTML = `
  <div style="background: #121824; border: 2px solid #ef4444; padding: 25px 35px; border-radius: 12px; text-align: center; box-shadow: 0 0 30px rgba(239, 68, 68, 0.5); max-width: 360px; width: 90%;">
    <h2 style="color: #ef4444; text-shadow: 0 0 10px #ef4444; margin: 0 0 8px 0; font-family: monospace; font-size: 20px;">TIME COLLAPSED</h2>
    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 15px 0; font-family: monospace;">A DIMENSIONAL RIFT HAS OPENED!</p>
    <div id="choiceTimer" style="font-size: 42px; font-weight: bold; color: #f87171; margin: 10px 0; font-family: monospace;">5</div>
    <p style="color: #cbd5e1; font-size: 12px; margin: 0 0 20px 0; font-family: monospace;">Choose your fate before time runs out:</p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="giveUpBtn" style="background: #ef4444; color: #fff; border: 1px solid #f87171; padding: 10px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; font-family: monospace;">GIVE UP</button>
      <button id="enterVoidBtn" style="background: #f8fafc; color: #0f172a; border: 1px solid #ffffff; padding: 10px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; font-family: monospace; box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);">ENTER THE VOID</button>
    </div>
  </div>
`;
document.body.appendChild(choiceOverlay);

const choiceTimerText = document.getElementById("choiceTimer");
const giveUpBtn = document.getElementById("giveUpBtn");
const enterVoidBtn = document.getElementById("enterVoidBtn");

const TAU = Math.PI * 2;

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function hexToRgb(hex) {
    const value = hex.replace("#", "");
    return {
        r: parseInt(value.substring(0, 2), 16),
        g: parseInt(value.substring(2, 4), 16),
        b: parseInt(value.substring(4, 6), 16)
    };
}

function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) };
}

function rgbToHue(rgb) {
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) return 0;
    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
}

function hueDistance(a, b) {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

function mixRgb(a, b, amount) {
    return {
        r: Math.round(a.r + (b.r - a.r) * amount),
        g: Math.round(a.g + (b.g - a.g) * amount),
        b: Math.round(a.b + (b.b - a.b) * amount)
    };
}

function rgbStr(rgb) { return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`; }
function rgba(rgb, alpha) { return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`; }

const GOLD = hexToRgb("#d6c58a");
const PURPLE_2X = hexToRgb("#a855f7");
const PINK_3X = hexToRgb("#ec4899");
const RED_CRIT = hexToRgb("#ef4444");
const CYAN = hexToRgb("#70e1e5");
const WHITE = hexToRgb("#ffffff");
const MONO_WHITE = hexToRgb("#f8fafc");
const DEBRIS_COLOR = hexToRgb("#ff5555");
const SHIELD_BLUE = hexToRgb("#3b82f6");
const BOSS_RED = hexToRgb("#ef4444");

let width = 0, height = 0;
let camera = { x: 0, y: 0 };

let player = null;
let history = [];
let shadows = [];
let target = null;
let healthBalls = [];
let spaceDebris = [];

let particles = [];
let rings = [];
let floatingTexts = [];

let score = 0;
let topScore = Number(localStorage.getItem("afteryou_topscore")) || 0;
let bestAtRunStart = topScore;
topScoreText.textContent = "BEST: " + topScore;

let health = 3;
let maxHealth = 3;
let hasShield = false;
let shieldAnimProgress = 0;

let running = false;
let isPaused = false;
let isChoiceActive = false;
let isSlowMo = false;
let slowMoTimer = 0;
let isVoidMode = false;
let dead = false;
let lastTime = 0;
let rafId = 0;
let deathUntil = 0;

let canvasFadeState = "IDLE"; 
let canvasFadeAlpha = 0;
let canvasFadeCallback = null;
let canvasFadeSpeed = 2.5;
let canvasFadeHold = 0;

let pauseStartTime = 0;
let totalPausedTime = 0;

let shadowNextAt = 0;
let shadowSerial = 0;
let recentTypes = [];

let dashUntil = 0;
let dashReadyAt = 0;
let iFrameUntil = 0;

let bossActive = false;
let activeBosses = [];
let bossBullets = [];
let voidFullCount = 0; 

let gameOverReason = "";
let choiceTimer = 5;
let choiceIntervalId = null;

const VOID_BOX = { width: 680, height: 750, x: 0, y: 0 };

const ROASTING_TEXTS = [
    "Are you afraid to choose?",
    "Hesitation is defeat! Points deducted.",
    "Did you fall asleep at the wheel?",
    "Indecision was your downfall.",
    "Scared of the Void, aren't you?",
    "Procrastinating even in video games?",
    "Your indecisiveness cost you score!"
];

const ARENA_STAGES = [0, 20, 30, 35, 40, 50, 60, 70, 80, 90, 100, 150];
const START_COLOR = "#8fbfc0";
const ARENA_TRANSITION = 1000;
const IMPACT_DURATION = 450;

let arenaStageIndex = 0;
let arenaFromRgb = hexToRgb(START_COLOR);
let arenaToRgb = hexToRgb(START_COLOR);
let arenaTransitionStart = 0;
let impactStart = -Infinity;
let impactIntensity = 1;
let lastCssColor = "";

const SHADOW_DELAY = 5000;
const SHADOW_FADE_IN = 700;
const SHADOW_FADE_OUT = 800;
const SHADOW_TRAIL_POINTS = 10;
const SHADOW_TRAIL_STEP = 38;

const DASH_DURATION = 200;
const DASH_COOLDOWN = 1000;

const BASE_SPEED = 220;
const DASH_SPEED = 680;
const ACCELERATION = 900;
const FRICTION = 1.8;

const SHADOW_COLORS = {
    "NORMAL": "#8fbfc0", "FLIP X": "#a78bfa", "FLIP Y": "#64b5f6",
    "FLIP X + Y": "#e879b9", "MIRROR C": "#f0abfc", "PULSE": "#fcd34d",
    "ROT 90": "#5eead4", "ROT -90": "#7dd3fc", "ORBIT": "#fb923c", "SWAY": "#f87171"
};

const keys = {};
let bossMilestonesTriggered = new Set();

function resize() {
    const dpr = window.devicePixelRatio || 1;
    const newWidth = canvas.clientWidth || window.innerWidth;
    const newHeight = canvas.clientHeight || window.innerHeight;
    if (!newWidth || !newHeight) return;

    width = newWidth;
    height = newHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    VOID_BOX.height = Math.min(height * 0.82, 850);
    VOID_BOX.width = Math.min(width * 0.65, VOID_BOX.height * 0.85);
    VOID_BOX.x = width / 2 - VOID_BOX.width / 2;
    VOID_BOX.y = height / 2 - VOID_BOX.height / 2;

    if (!running && player) draw();
}

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);
if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);
resize();

window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (e.code === "Space" || key.startsWith("arrow")) e.preventDefault();
    keys[key] = true;

    if (running && !isPaused && !isChoiceActive && canvasFadeState === "IDLE" && !e.repeat && (e.code === "Space" || key === "shift")) {
        activateDash();
    }

    if (running && !dead && !isChoiceActive && canvasFadeState === "IDLE" && !e.repeat && (key === "p" || e.code === "Escape")) {
        togglePause();
    }
});

window.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener("blur", () => {
    for (const key in keys) keys[key] = false;
    resetTouch();
    if (running && !isPaused && !isChoiceActive) togglePause();
});

const TOUCH_RADIUS = 56;
const TOUCH_DEADZONE = 10;
const touchState = { ids: [], originX: 0, originY: 0, curX: 0, curY: 0, dx: 0, dy: 0, active: false };

function resetTouch() {
    touchState.ids.length = 0;
    touchState.active = false;
    touchState.dx = 0;
    touchState.dy = 0;
}

function touchPoint(t) {
    const rect = canvas.getBoundingClientRect();
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

function findTouch(list, id) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].identifier === id) return list[i];
    }
    return null;
}

function setTouchOrigin(t) {
    const p = touchPoint(t);
    touchState.originX = touchState.curX = p.x;
    touchState.originY = touchState.curY = p.y;
    touchState.dx = 0;
    touchState.dy = 0;
    touchState.active = true;
}

function updateTouchVector() {
    let vx = touchState.curX - touchState.originX;
    let vy = touchState.curY - touchState.originY;
    let dist = Math.hypot(vx, vy);

    if (dist > TOUCH_RADIUS) {
        const pull = (dist - TOUCH_RADIUS) / dist;
        touchState.originX += vx * pull;
        touchState.originY += vy * pull;
        vx = touchState.curX - touchState.originX;
        vy = touchState.curY - touchState.originY;
        dist = TOUCH_RADIUS;
    }

    if (dist >= TOUCH_DEADZONE) {
        touchState.dx = vx / dist;
        touchState.dy = vy / dist;
    } else {
        touchState.dx = 0;
        touchState.dy = 0;
    }
}

function onTouchStart(e) {
    e.preventDefault();
    if (!running || isPaused || isChoiceActive || canvasFadeState !== "IDLE") { resetTouch(); return; }

    let wantsDash = false;
    for (const t of e.changedTouches) {
        if (touchState.ids.length === 0) {
            touchState.ids.push(t.identifier);
            setTouchOrigin(t);
        } else {
            touchState.ids.push(t.identifier);
            wantsDash = true;
        }
    }
    if (wantsDash) activateDash();
}

function onTouchMove(e) {
    e.preventDefault();
    if (!touchState.active) return;
    const lead = findTouch(e.touches, touchState.ids[0]);
    if (!lead) return;
    const p = touchPoint(lead);
    touchState.curX = p.x;
    touchState.curY = p.y;
    updateTouchVector();
}

function onTouchEnd(e) {
    e.preventDefault();
    const leadBefore = touchState.ids[0];
    touchState.ids = touchState.ids.filter(id => findTouch(e.touches, id));

    if (touchState.ids.length === 0) {
        touchState.active = false;
        touchState.dx = 0;
        touchState.dy = 0;
    } else if (touchState.ids[0] !== leadBefore) {
        setTouchOrigin(findTouch(e.touches, touchState.ids[0]));
    }
}

canvas.addEventListener("touchstart", onTouchStart, { passive: false });
canvas.addEventListener("touchmove", onTouchMove, { passive: false });
canvas.addEventListener("touchend", onTouchEnd, { passive: false });
canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });
canvas.addEventListener("contextmenu", e => e.preventDefault());

function togglePause() {
    if (!running || dead || isChoiceActive || canvasFadeState !== "IDLE") return;
    isPaused = !isPaused;
    const now = performance.now();
    if (isPaused) {
        resetTouch();
        pauseStartTime = now;
        pauseOverlay.classList.remove("hidden");
    } else {
        pauseOverlay.classList.add("hidden");
        const pausedDuration = now - pauseStartTime;
        totalPausedTime += pausedDuration;
        shadowNextAt += pausedDuration;
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
    }
}

pauseBtn.addEventListener("click", togglePause);
resumeBtn.addEventListener("click", togglePause);

function getDifficultyTier() {
    if (score >= 150) return 4;
    if (score >= 100) return 3;
    if (score >= 70) return 2;
    if (score >= 50) return 1;
    return 0;
}

function getShadowInterval() {
    if (score >= 150) return 3000;
    if (score >= 100) return 5000;
    if (score >= 70) return 10000;
    if (score >= 50) return 20000;
    return 30000;
}

function getMaxShadows() {
    if (score >= 100) return 15;
    if (score >= 90) return 14;
    if (score >= 80) return 12;
    if (score >= 70) return 10;
    if (score >= 60) return 8;
    if (score >= 50) return 7;
    if (score >= 40) return 6;
    if (score >= 30) return 5;
    if (score >= 20) return 4;
    if (score >= 10) return 3;
    return 2;
}

function scheduleShadow(now) { shadowNextAt = now + getShadowInterval(); }
function checkDifficulty(oldTier, now) {
    if (getDifficultyTier() !== oldTier) scheduleShadow(now);
}

function burst(now, x, y, rgb, count, minSpeed, maxSpeed, life, size) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * TAU;
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        particles.push({
            x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            born: now, life: life * (0.6 + Math.random() * 0.8),
            size: size * (0.6 + Math.random() * 0.9), rgb
        });
    }
    if (particles.length > 400) particles.splice(0, particles.length - 400);
}

function addRing(now, x, y, rgb, maxRadius, duration, lineWidth, alpha) {
    rings.push({ x, y, rgb, maxRadius, start: now, duration, lineWidth, alpha });
}

function addFloatingText(text, x, y, color) {
    floatingTexts.push({ text, x, y, born: performance.now(), color });
}

function updateEffects(dt, now) {
    const drag = Math.exp(-3.2 * dt);
    for (const p of particles) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= drag; p.vy *= drag;
    }
    particles = particles.filter(p => now - p.born < p.life);
    rings = rings.filter(r => now - r.start < r.duration);
    
    for (const ft of floatingTexts) {
        ft.y -= 30 * dt;
    }
    floatingTexts = floatingTexts.filter(ft => now - ft.born < 800);
}

function getStageIndex(value) {
    let index = 0;
    for (let i = 0; i < ARENA_STAGES.length; i++) {
        if (value >= ARENA_STAGES[i]) index = i;
    }
    return index;
}

function randomStageColor(stageScore, previous) {
    if (isVoidMode) return hexToRgb("#000000");

    if (stageScore >= 100) {
        const intense = stageScore >= 150;
        const hue = (350 + Math.random() * 20) % 360;
        return hslToRgb(hue, intense ? 100 : 88, intense ? 55 : 58);
    }
    const previousHue = rgbToHue(previous);
    let hue;
    do { hue = Math.random() * 360; }
    while (hueDistance(hue, previousHue) < 70 || hue > 340 || hue < 15);
    return hslToRgb(hue, 62 + Math.random() * 22, 60 + Math.random() * 8);
}

function getArenaRgb(now) {
    if (isVoidMode) return hexToRgb("#000000");
    if (!arenaTransitionStart) return arenaToRgb;
    const progress = clamp((now - arenaTransitionStart) / ARENA_TRANSITION, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    return mixRgb(arenaFromRgb, arenaToRgb, eased);
}

function getArenaColor(now) { return rgbStr(getArenaRgb(now)); }

function checkArenaStage(now) {
    if (isVoidMode) return;
    const newIndex = getStageIndex(score);
    if (newIndex === arenaStageIndex) return;

    const current = getArenaRgb(now);
    arenaFromRgb = current;
    arenaToRgb = randomStageColor(ARENA_STAGES[newIndex], current);
    arenaStageIndex = newIndex;
    arenaTransitionStart = now;

    impactStart = now;
    impactIntensity = score >= 150 ? 1.6 : score >= 100 ? 1.4 : 1;

    const reach = Math.hypot(width, height);
    addRing(now, player.x, player.y, arenaToRgb, reach, 1100, 3, 0.9);
    addRing(now, player.x, player.y, arenaToRgb, reach * 0.6, 800, 2, 0.7);
    addRing(now, player.x, player.y, WHITE, reach * 0.35, 600, 1.5, 0.5);

    burst(now, player.x, player.y, arenaToRgb, score >= 100 ? 60 : 40, 80, 380, 800, 2.6);
}

function randomTarget() {
    let point;
    if (isVoidMode) {
        // jatuh dari atas (dekat boss) ke bawah, ala bullet hell
        point = {
            x: VOID_BOX.x + 40 + Math.random() * (VOID_BOX.width - 80),
            y: VOID_BOX.y + 60
        };
    } else {
        const minDistance = 250, maxDistance = 650;
        do {
            const angle = Math.random() * TAU;
            const dist = minDistance + Math.random() * (maxDistance - minDistance);
            point = {
                x: (player ? player.x : 0) + Math.cos(angle) * dist,
                y: (player ? player.y : 0) + Math.sin(angle) * dist
            };
        } while (player && Math.hypot(point.x - player.x, point.y - player.y) < 180);
    }

    const rand = Math.random();
    if (bossActive && rand < 0.25) {
        point.value = 3;
        point.type = "CRIT";
    } else if (rand < 0.15) {
        point.value = 3;
        point.type = "TRIPLE";
    } else if (rand < 0.40) {
        point.value = 2;
        point.type = "DOUBLE";
    } else {
        point.value = 1;
        point.type = "NORMAL";
    }
    point.bornAt = performance.now();
    if (isVoidMode) point.vy = 95 + Math.random() * 45;
    return point;
}

function checkHealthBallSpawn(now) {
    let targetHealthCount = isVoidMode ? 3 : 1;
    if (!isVoidMode) {
        if (health === 3 && hasShield) targetHealthCount = 2;
        else if (health === 2) targetHealthCount = 3;
        else if (health <= 1) targetHealthCount = 4;
    }

    if (healthBalls.length < targetHealthCount && Math.random() < 0.6) {
        let hx, hy;
        const lifeDuration = 15000 + Math.random() * 2000;
        
        if (isVoidMode) {
            hx = VOID_BOX.x + 40 + Math.random() * (VOID_BOX.width - 80);
            hy = VOID_BOX.y + 60;
        } else {
            const angle = Math.random() * TAU;
            const dist = 280 + Math.random() * 320;
            hx = player.x + Math.cos(angle) * dist;
            hy = player.y + Math.sin(angle) * dist;
        }

        let type = "1X";
        const rand = Math.random();

        if (isVoidMode) {
            if (rand < 0.10 && voidFullCount < 3) {
                type = "FULL+"; 
                voidFullCount++;
            } else if (rand < 0.50) {
                type = "2X"; 
            }
        }

        healthBalls.push({
            x: hx, y: hy,
            vy: isVoidMode ? 80 + Math.random() * 40 : 0,
            bornAt: now,
            life: lifeDuration,
            type: type,
            fadeStart: now + lifeDuration - 800,
            fadeEnd: now + lifeDuration
        });
    }
}

function updateHealthBalls(now, dt) {
    for (let i = healthBalls.length - 1; i >= 0; i--) {
        const hb = healthBalls[i];
        if (isVoidMode && hb.vy) hb.y += hb.vy * dt;
        const fellOut = isVoidMode && hb.y > VOID_BOX.y + VOID_BOX.height + 20;
        if (fellOut || now >= hb.fadeEnd) {
            healthBalls.splice(i, 1);
            checkHealthBallSpawn(now);
        }
    }
}

function updateSpaceDebrisCount() {
    if (isVoidMode) return; 
    const targetDebrisCount = Math.min(15, 3 + Math.floor(score / 8));
    while (spaceDebris.length < targetDebrisCount) {
        spawnSpaceDebris();
    }
}

function spawnSpaceDebris() {
    const shapes = ["TRIANGLE", "SQUARE", "TRAPEZOID"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const angle = Math.random() * TAU;
    const spawnDist = Math.hypot(width, height) / 2 + 180;

    const x = (player ? player.x : 0) + Math.cos(angle) * spawnDist;
    const y = (player ? player.y : 0) + Math.sin(angle) * spawnDist;
    const targetAngle = Math.atan2((player ? player.y : 0) - y, (player ? player.x : 0) - x) + (Math.random() - 0.5) * 0.6;
    const speed = 70 + Math.random() * 110;

    const now = performance.now();
    spaceDebris.push({
        x, y, vx: Math.cos(targetAngle) * speed, vy: Math.sin(targetAngle) * speed,
        shape, size: 10 + Math.random() * 8, rotation: Math.random() * TAU,
        vRot: (Math.random() - 0.5) * 2, rgb: DEBRIS_COLOR, bornAt: now,
        fadeInUntil: now + 600, fadeOutStart: null
    });
}

function updateDebris(dt, now) {
    const screenHalfDiag = Math.hypot(width, height) / 2 + 250;

    for (let i = spaceDebris.length - 1; i >= 0; i--) {
        const d = spaceDebris[i];
        d.x += d.vx * dt; d.y += d.vy * dt;
        d.rotation += d.vRot * dt;

        const distFromPlayer = Math.hypot(d.x - player.x, d.y - player.y);

        if (distFromPlayer > screenHalfDiag) {
            if (!d.fadeOutStart) d.fadeOutStart = now;
            if (now - d.fadeOutStart > 600) {
                spaceDebris.splice(i, 1);
                spawnSpaceDebris();
            }
        } else {
            d.fadeOutStart = null;
        }
    }
}

function drawDebris(d, now) {
    let alpha = 1;

    if (now < d.fadeInUntil) {
        alpha = (now - d.bornAt) / 600;
    }
    if (d.fadeOutStart) {
        alpha = Math.max(0, 1 - (now - d.fadeOutStart) / 600);
    }

    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rotation);

    ctx.strokeStyle = rgbStr(d.rgb);
    ctx.shadowColor = rgbStr(d.rgb);
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.8;
    ctx.fillStyle = rgba(d.rgb, 0.2);

    ctx.beginPath();
    if (d.shape === "TRIANGLE") {
        ctx.moveTo(0, -d.size); ctx.lineTo(d.size, d.size); ctx.lineTo(-d.size, d.size);
    } else if (d.shape === "SQUARE") {
        ctx.rect(-d.size / 1.2, -d.size / 1.2, (d.size * 2) / 1.2, (d.size * 2) / 1.2);
    } else if (d.shape === "TRAPEZOID") {
        ctx.moveTo(-d.size * 0.6, -d.size); ctx.lineTo(d.size * 0.6, -d.size);
        ctx.lineTo(d.size, d.size); ctx.lineTo(-d.size, d.size);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function checkBossTrigger(currentScore, now) {
    if (isVoidMode) return; 

    for (let milestone = 25; milestone <= currentScore; milestone += 25) {
        if (!bossMilestonesTriggered.has(milestone)) {
            bossMilestonesTriggered.add(milestone);

            const extraLaps = Math.floor((milestone - 25) / 25);
            const totalTime = 30000 + (extraLaps * 15000); 

            let angle;
            if (activeBosses.length > 0) {
                const firstBoss = activeBosses[0];
                const angleToPlayer = Math.atan2(player.y - firstBoss.y, player.x - firstBoss.x);
                angle = angleToPlayer + Math.PI; 
            } else {
                angle = Math.random() * TAU;
            }

            const bx = player.x + Math.cos(angle) * 350;
            const by = player.y + Math.sin(angle) * 350;

            activeBosses.push({
                x: bx,
                y: by,
                timeLeft: totalTime,
                totalTime: totalTime,
                nextBulletAt: now + 1800,
                milestone: milestone
            });

            bossActive = true;
            bossBarContainer.classList.remove("hidden");
            
            const themeColor = milestone >= 100 ? hexToRgb("#d946ef") : BOSS_RED;
            addRing(now, bx, by, themeColor, 220, 1000, 4, 0.9);
            burst(now, bx, by, themeColor, 50, 100, 400, 800, 3);
        }
    }
}

function damageBossWithPointball(now, pointValue, type) {
    if (!bossActive || activeBosses.length === 0) return;

    let secondsDamage = 0;
    let hitColor = GOLD;
    let labelText = "";

    if (type === "CRIT") {
        secondsDamage = Math.floor(5 + Math.random() * 3);
        hitColor = RED_CRIT;
        labelText = `-${secondsDamage}s CRIT!`;
    } else if (pointValue === 3) {
        secondsDamage = Math.floor(4 + Math.random() * 2);
        hitColor = PINK_3X;
        labelText = `-${secondsDamage}s`;
    } else if (pointValue === 2) {
        secondsDamage = Math.floor(3 + Math.random() * 2);
        hitColor = PURPLE_2X;
        labelText = `-${secondsDamage}s`;
    } else {
        secondsDamage = Math.floor(2 + Math.random() * 2);
        hitColor = GOLD;
        labelText = `-${secondsDamage}s`;
    }

    const damageMs = secondsDamage * 1000;

    activeBosses.forEach(boss => {
        boss.timeLeft -= damageMs;
        burst(now, boss.x, boss.y, hitColor, 35, 80, 350, 600, 2.5);
        addRing(now, boss.x, boss.y, hitColor, 120, 500, 3, 0.9);
        addFloatingText(labelText, boss.x, boss.y - 20, rgbStr(hitColor));
    });
}

// ===== VOID BOSS: POLA DANMAKU ALA TOUHOU =====
const VOID_REST = [1500, 1250, 1000, 800];

function voidBullet(boss, ang, spd, o) {
    o = o || {};
    if (bossBullets.length > 750) return;
    bossBullets.push({
        x: boss.x, y: boss.y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        radius: o.r || 4.2, distanceTraveled: 0, maxDistance: 3000, alpha: 1,
        rgb: o.rgb || MONO_WHITE,
        turn: o.turn || 0, turnTime: o.turnTime || 0,
        accel: o.accel || 0, minSpd: o.minSpd, maxSpd: o.maxSpd,
        retargetAt: o.retargetAt, retargetMode: o.retargetMode,
        retargetSpeed: o.retargetSpeed, retargetOffset: o.retargetOffset || 0,
        dir: ang, age: 0
    });
}

const VOID_PATTERNS = {
    // kipas bidikan ke player, dua lapis dengan celah selang-seling
    fan: {
        dur: 3800,
        interval: p => 720 - p * 60,
        fire(boss, st, p) {
            const aim = Math.atan2(player.y - boss.y, player.x - boss.x);
            const count = 5 + p * 2;
            const spread = 0.85 + p * 0.12;
            for (let i = 0; i < count; i++) {
                const off = (i / (count - 1) - 0.5) * spread;
                voidBullet(boss, aim + off, 125, { rgb: CYAN });
            }
            if (p >= 1) {
                for (let i = 0; i < count - 1; i++) {
                    const off = ((i + 0.5) / (count - 1) - 0.5) * spread;
                    voidBullet(boss, aim + off, 92, { rgb: MONO_WHITE, r: 3.6 });
                }
            }
        }
    },
    // cincin peluru, celahnya bergeser tiap tembakan
    ring: {
        dur: 4400,
        interval: p => 1000 - p * 80,
        fire(boss, st, p) {
            const n = 18 + p * 3, step = TAU / n;
            const off = (st.n % 2) * step / 2 + st.n * 0.07;
            for (let i = 0; i < n; i++) voidBullet(boss, off + i * step, 88, { rgb: PINK_3X, r: 4.6 });
            if (p >= 2) {
                for (let i = 0; i < n; i++) voidBullet(boss, off + step / 2 + i * step, 62, { rgb: PURPLE_2X, r: 3.8 });
            }
        }
    },
    // spiral berputar (2 atau 3 lengan), arah putar ganti tiap pola
    spiral: {
        dur: 5200,
        interval: p => 100 - p * 10,
        fire(boss, st, p) {
            const arms = p >= 2 ? 3 : 2;
            const base = st.n * 0.19 * st.spin;
            for (let a = 0; a < arms; a++) {
                voidBullet(boss, base + a * TAU / arms, 96, { rgb: a % 2 ? PURPLE_2X : MONO_WHITE, r: 3.8 });
            }
        }
    },
    // peluru melengkung berlawanan arah -> membentuk kelopak bunga
    flower: {
        dur: 5000,
        interval: p => 1150 - p * 90,
        fire(boss, st, p) {
            const n = 10 + p * 2, rot = st.n * 0.35 * st.spin;
            for (let i = 0; i < n; i++) {
                const dirSign = i % 2 ? 1 : -1;
                voidBullet(boss, rot + i * TAU / n, 118, {
                    rgb: i % 2 ? CYAN : PINK_3X, r: 4, turn: dirSign * 1.25, turnTime: 1100
                });
            }
        }
    },
    // cincin melambat sampai berhenti, lalu separuhnya diarahkan ke player
    stopgo: {
        dur: 5200,
        interval: p => 1500 - p * 100,
        fire(boss, st, p) {
            const n = 14 + p * 2, step = TAU / n, off = st.n * 0.13;
            for (let i = 0; i < n; i++) {
                const aim = i % 2 === 0;
                voidBullet(boss, off + i * step, 330, {
                    rgb: aim ? GOLD : MONO_WHITE, r: 4.4,
                    accel: -2.2, minSpd: 6,
                    retargetAt: 1100, retargetMode: aim ? "aim" : "keep",
                    retargetSpeed: aim ? 128 : 80,
                    retargetOffset: (Math.random() - 0.5) * 0.18
                });
            }
        }
    }
};

// urutan pola tiap fase (fase naik seiring waktu boss berkurang)
const VOID_PHASES = [
    ["fan", "ring", "fan", "ring"],
    ["spiral", "fan", "ring"],
    ["flower", "spiral", "stopgo", "fan"],
    ["stopgo", "spiral", "flower", "ring", "fan"]
];

function updateVoidPattern(boss, now) {
    if (!boss.vs) {
        boss.vs = { pat: null, restUntil: boss.nextBulletAt || now, n: 0, li: Math.floor(Math.random() * 4), spin: 1, start: 0, nextFire: 0 };
    }
    const st = boss.vs;
    const f = 1 - boss.timeLeft / boss.totalTime;
    const phase = f < 0.25 ? 0 : f < 0.5 ? 1 : f < 0.75 ? 2 : 3;

    if (!st.pat) {
        if (now < st.restUntil) return;
        const list = VOID_PHASES[phase];
        st.li = (st.li + 1) % list.length;
        st.pat = VOID_PATTERNS[list[st.li]];
        st.start = now;
        st.nextFire = now;
        st.n = 0;
        st.spin *= -1;
    }

    if (now - st.start >= st.pat.dur) {
        st.pat = null;
        st.restUntil = now + VOID_REST[phase];
        return;
    }
    if (now >= st.nextFire) {
        st.pat.fire(boss, st, phase);
        st.n++;
        st.nextFire = now + st.pat.interval(phase);
    }
}

function updateBoss(dt, now) {
    if (activeBosses.length === 0) {
        bossActive = false;
        bossBullets = [];
        bossBarContainer.classList.add("hidden");
        if (isVoidMode) {
            exitVoidVictory(now);
        }
        return;
    }

    bossActive = true;
    bossBarContainer.classList.remove("hidden");

    for (let i = activeBosses.length - 1; i >= 0; i--) {
        const boss = activeBosses[i];
        boss.timeLeft -= dt * 1000;

        if (isVoidMode) {
            // POSISI BOSS TEPAT DI TENGAH-ATAS VOID BOX
            boss.x = VOID_BOX.x + VOID_BOX.width / 2 + Math.sin(now * 0.0006) * VOID_BOX.width * 0.12;
            boss.y = VOID_BOX.y + 110;
        } else {
            let bossSpeed = 70 + (score * 1.5);
            const angleToPlayer = Math.atan2(player.y - boss.y, player.x - boss.x);
            boss.x += Math.cos(angleToPlayer) * bossSpeed * dt;
            boss.y += Math.sin(angleToPlayer) * bossSpeed * dt;

            const distToPlayer = Math.hypot(player.x - boss.x, player.y - boss.y);
            const ringBoundaryRadius = 390; 
            if (distToPlayer > ringBoundaryRadius) {
                const pushAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
                player.x = boss.x + Math.cos(pushAngle) * ringBoundaryRadius;
                player.y = boss.y + Math.sin(pushAngle) * ringBoundaryRadius;
                const pushColor = boss.milestone >= 100 ? hexToRgb("#d946ef") : BOSS_RED;
                burst(now, player.x, player.y, pushColor, 8, 50, 150, 300, 1.5);
            }
        }

        if (isVoidMode) {
            updateVoidPattern(boss, now);
        } else {
        const bulletInterval = isVoidMode ? 520 : Math.max(240, 700 - (score * 3.5)); 
        if (now >= boss.nextBulletAt) {
            boss.nextBulletAt = now + bulletInterval;
            
            const aimedAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
            const aimCount = isVoidMode ? 5 : 3 + Math.floor(score / 15); 
            const spreadWidth = 0.75; 

            for (let a = 0; a < aimCount; a++) {
                const offset = aimCount > 1 ? (a / (aimCount - 1) - 0.5) * spreadWidth : 0;
                const finalAngle = aimedAngle + offset;
                const speed = isVoidMode ? 105 : 100 + (score * 0.7);

                bossBullets.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(finalAngle) * speed,
                    vy: Math.sin(finalAngle) * speed,
                    radius: 4.5,
                    distanceTraveled: 0,
                    maxDistance: 2400,
                    alpha: 1
                });
            }

            const ringCount = isVoidMode ? 7 : 5 + Math.floor(score / 20);
            const baseSpiral = now * 0.0028;
            for (let r = 0; r < ringCount; r++) {
                const sAngle = baseSpiral + (r * (TAU / ringCount));
                const sSpeed = isVoidMode ? 78 : 75 + (score * 0.45);
                bossBullets.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(sAngle) * sSpeed,
                    vy: Math.sin(sAngle) * sSpeed,
                    radius: 3.8,
                    distanceTraveled: 0,
                    maxDistance: 2100,
                    alpha: 1
                });
            }
        }

        }

        if (Math.hypot(player.x - boss.x, player.y - boss.y) < 30) {
            applyDamage(now); 
            return;
        }

        if (boss.timeLeft <= 0) {
            const explodeColor = boss.milestone >= 100 ? hexToRgb("#d946ef") : GOLD;
            burst(now, boss.x, boss.y, explodeColor, 60, 80, 450, 900, 3.2);
            addRing(now, boss.x, boss.y, explodeColor, 300, 1000, 5, 1);

            bossBullets = [];

            if (!isVoidMode) {
                for (let k = 0; k < 4; k++) spawnShadow(now);
            }
            activeBosses.splice(i, 1);
        }
    }

    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const b = bossBullets[i];
        b.age = (b.age || 0) + dt * 1000;
        if (b.turn && b.turnTime > 0) {
            const a = b.turn * dt, c = Math.cos(a), s = Math.sin(a);
            const nvx = b.vx * c - b.vy * s;
            b.vy = b.vx * s + b.vy * c;
            b.vx = nvx;
            b.turnTime -= dt * 1000;
        }
        if (b.accel) {
            const sp = Math.hypot(b.vx, b.vy);
            if (sp > 0.01) {
                const ns = clamp(sp * Math.exp(b.accel * dt), b.minSpd !== undefined ? b.minSpd : 0, b.maxSpd !== undefined ? b.maxSpd : 9999);
                const k = ns / sp;
                b.vx *= k; b.vy *= k;
            }
        }
        if (b.retargetAt !== undefined && b.age >= b.retargetAt) {
            const ang = b.retargetMode === "aim"
                ? Math.atan2(player.y - b.y, player.x - b.x) + (b.retargetOffset || 0)
                : b.dir;
            b.vx = Math.cos(ang) * b.retargetSpeed;
            b.vy = Math.sin(ang) * b.retargetSpeed;
            b.accel = 0;
            b.retargetAt = undefined;
        }
        const stepDist = Math.hypot(b.vx * dt, b.vy * dt);
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.distanceTraveled += stepDist;

        if (isVoidMode && (b.x < VOID_BOX.x - 30 || b.x > VOID_BOX.x + VOID_BOX.width + 30 ||
                           b.y < VOID_BOX.y - 30 || b.y > VOID_BOX.y + VOID_BOX.height + 30)) {
            bossBullets.splice(i, 1);
            continue;
        }

        let remainingRatio = (b.maxDistance - b.distanceTraveled) / b.maxDistance;
        if (remainingRatio <= 0) {
            bossBullets.splice(i, 1);
            continue;
        }
        b.alpha = remainingRatio < 0.25 ? remainingRatio * 4 : 1;

        if (Math.hypot(player.x - b.x, player.y - b.y) < player.radius * (isVoidMode ? 0.6 : 1) + b.radius) {
            applyDamage(now); 
            return;
        }
    }

    if (activeBosses.length > 0) {
        const mainBoss = activeBosses[0];
        const sliceTime = 30000; 
        const currentLapTime = mainBoss.timeLeft % sliceTime;
        const percentage = Math.max(0, (currentLapTime / sliceTime) * 100);
        bossBarFill.style.width = percentage + "%";

        if (isVoidMode) {
            bossBarFill.style.background = "#ffffff";
            bossBarFill.style.boxShadow = "0 0 12px #ffffff";
            bossBarTrack.style.borderColor = "#ffffff";
        } else if (mainBoss.milestone >= 100) {
            bossBarFill.style.background = "#d946ef";
            bossBarFill.style.boxShadow = "0 0 12px #d946ef";
            bossBarTrack.style.borderColor = "#d946ef";
        } else {
            bossBarFill.style.background = "#ef4444";
            bossBarFill.style.boxShadow = "0 0 12px #ef4444";
            bossBarTrack.style.borderColor = "#ef4444";
        }

        const currentLapsRemaining = Math.ceil(mainBoss.timeLeft / sliceTime);
        bossMultiplier.textContent = isVoidMode ? `VOID RAGE MODE (2x HP) - ${currentLapsRemaining}x` : (activeBosses.length > 1 ? `SANDWICH (${activeBosses.length}x)` : (currentLapsRemaining <= 1 ? "" : (currentLapsRemaining - 1) + "x"));
    }
}

function applyDamage(now) {
    if (now < iFrameUntil || now < dashUntil || isChoiceActive || isSlowMo) return;

    iFrameUntil = now + 800;

    if (hasShield) {
        hasShield = false;
        shieldAnimProgress = 1;
        burst(now, player.x, player.y, isVoidMode ? MONO_WHITE : SHIELD_BLUE, 35, 90, 350, 700, 2.8);
        addRing(now, player.x, player.y, isVoidMode ? MONO_WHITE : SHIELD_BLUE, 90, 550, 3.5, 0.95);
        return;
    }

    health--;
    burst(now, player.x, player.y, DEBRIS_COLOR, 30, 60, 280, 600, 2.5);
    addRing(now, player.x, player.y, DEBRIS_COLOR, 75, 450, 2.5, 0.9);

    if (health <= 0) {
        if (!isVoidMode && bossActive) {
            startSlowMoAndTriggerChoice(now); 
        } else {
            gameOver(now); 
        }
    }
}

function startSlowMoAndTriggerChoice(now) {
    isSlowMo = true;
    slowMoTimer = now + 900; 
    
    burst(now, player.x, player.y, CYAN, 30, 50, 300, 800, 2.5);
    addRing(now, player.x, player.y, CYAN, 100, 700, 3, 0.9);
}

function triggerChoiceMenu(now) {
    isChoiceActive = true;
    choiceTimer = 5;
    choiceTimerText.textContent = choiceTimer;
    choiceOverlay.classList.remove("hidden");

    choiceIntervalId = setInterval(() => {
        choiceTimer--;
        choiceTimerText.textContent = choiceTimer;
        if (choiceTimer <= 0) {
            clearInterval(choiceIntervalId);
            timeoutChoicePenalty(now); 
        }
    }, 1000);
}

function timeoutChoicePenalty(now) {
    choiceOverlay.classList.add("hidden");
    isChoiceActive = false;
    
    const penalty = 10 + Math.floor(Math.random() * 11);
    score = Math.max(0, score - penalty);
    if (topScore > bestAtRunStart) {
        topScore = Math.max(bestAtRunStart, score);
        try { localStorage.setItem("afteryou_topscore", topScore); } catch (e) {}
        topScoreText.textContent = "BEST: " + topScore;
    }
    
    const roastMessage = ROASTING_TEXTS[Math.floor(Math.random() * ROASTING_TEXTS.length)];
    gameOverReason = roastMessage + ` (Lost ${penalty} pts)`;
    
    gameOver(now);
}

giveUpBtn.addEventListener("click", () => {
    if (choiceIntervalId) clearInterval(choiceIntervalId);
    choiceOverlay.classList.add("hidden");
    isChoiceActive = false;
    gameOver(performance.now());
});

enterVoidBtn.addEventListener("click", () => {
    if (choiceIntervalId) clearInterval(choiceIntervalId);
    choiceOverlay.classList.add("hidden");
    isChoiceActive = false;

    lastTime = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);

    // mulai dari gelap yang sama dengan overlay pilihan, biar transisinya mulus
    canvasFadeState = "FADING_OUT";
    canvasFadeAlpha = 0.85;
    canvasFadeSpeed = 1.1;
    canvasFadeHold = 450;
    canvasFadeCallback = () => {
        enterVoidMode(performance.now());
        canvasFadeSpeed = 0.9;
        canvasFadeState = "FADING_IN";
    };
});

function enterVoidMode(now) {
    ringSpring.init = false;
    isVoidMode = true;
    health = 3;
    hasShield = false;
    voidFullCount = 0;
    shadows = []; 
    spaceDebris = [];
    healthBalls = [];
    bossBullets = []; // BERSIHKAN SEMUA PELURU LAMA DARI ARENA UTAMA!

    // KAMERA LANGSUNG DI-LOCK KE TENGAH VOID BOX
    camera.x = VOID_BOX.x + VOID_BOX.width / 2 - width / 2;
    camera.y = VOID_BOX.y + VOID_BOX.height / 2 - height / 2;

    if (activeBosses.length > 0) {
        // boss yang bikin player mati = boss dengan total HP (waktu) terbesar
        const b = activeBosses.reduce((m, c) => c.totalTime > m.totalTime ? c : m, activeBosses[0]);
        activeBosses = [b]; // di void cukup 1 boss, HP-nya digandakan
        b.x = VOID_BOX.x + VOID_BOX.width / 2;
        b.y = VOID_BOX.y + 110;
        
        player.x = VOID_BOX.x + VOID_BOX.width / 2;
        player.y = VOID_BOX.y + VOID_BOX.height - 90;
        player.vx = 0;
        player.vy = 0;
        
        b.totalTime = b.totalTime * 2; // 2x HP boss asal
        b.timeLeft = b.totalTime;
        b.nextBulletAt = now + 3000;
        b.vs = null; // JEDA AMAN 3 DETIK SEBELUM BOSS MENEMBAK DI VOID
    }

    target = randomTarget();
    addRing(now, player.x, player.y, MONO_WHITE, 400, 1200, 5, 1);
    burst(now, player.x, player.y, MONO_WHITE, 80, 100, 500, 1000, 3);
}

function exitVoidVictory(now) {
    canvasFadeState = "FADING_OUT";
    canvasFadeAlpha = 0;
    canvasFadeSpeed = 1.1;
    canvasFadeHold = 300;
    canvasFadeCallback = () => {
        isVoidMode = false;
        bossBullets = [];
        healthBalls = [];
        target = randomTarget();
        addRing(now, player.x, player.y, GOLD, 500, 1500, 6, 1);
        burst(now, player.x, player.y, GOLD, 100, 100, 600, 1200, 3.5);
        canvasFadeSpeed = 0.9;
        canvasFadeState = "FADING_IN";
    };
}

function activateDash() {
    const now = performance.now();
    if (now < dashReadyAt) return;
    dashUntil = now + DASH_DURATION;
    dashReadyAt = now + DASH_COOLDOWN;
}

function getHistoryPosition(targetTime) {
    if (!history.length) return null;
    if (history[0].time > targetTime) return history[0];

    let low = 0, high = history.length - 1, found = 0;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (history[mid].time <= targetTime) {
            found = mid; low = mid + 1;
        } else high = mid - 1;
    }
    return history[found];
}

function getShadowPosition(shadow, now, back = 0) {
    const t = now - back;
    let delay = shadow.delay;
    if (shadow.type === "PULSE") delay += 500 + Math.sin(t * 0.0022 + shadow.phase) * 500;

    const ghost = getHistoryPosition(t - delay);
    if (!ghost) return null;

    let x = ghost.x, y = ghost.y;
    switch (shadow.type) {
        case "FLIP X": case "FLIP Y": case "FLIP X + Y":
            x = shadow.anchorX + (ghost.x - shadow.anchorX) * shadow.flipX;
            y = shadow.anchorY + (ghost.y - shadow.anchorY) * shadow.flipY; break;
        case "MIRROR C":
            x = shadow.anchorX * 2 - ghost.x; y = shadow.anchorY * 2 - ghost.y; break;
        case "ROT 90": {
            const relX = ghost.x - shadow.anchorX, relY = ghost.y - shadow.anchorY;
            x = shadow.anchorX - relY; y = shadow.anchorY + relX; break;
        }
        case "ROT -90": {
            const relX = ghost.x - shadow.anchorX, relY = ghost.y - shadow.anchorY;
            x = shadow.anchorX + relY; y = shadow.anchorY - relX; break;
        }
        case "ORBIT":
            x += Math.cos(t * shadow.spin + shadow.phase) * shadow.radius;
            y += Math.sin(t * shadow.spin + shadow.phase) * shadow.radius; break;
        case "SWAY":
            x += Math.sin(t * 0.0007 + shadow.phase) * shadow.amp;
            y += Math.cos(t * 0.0009 + shadow.phase * 1.7) * shadow.amp; break;
    }
    return { x, y };
}

function pickShadowType() {
    const pool = ["NORMAL", "FLIP X", "FLIP Y", "FLIP X + Y"];
    if (score >= 10) pool.push("MIRROR C", "PULSE");
    if (score >= 20) pool.push("ROT 90", "ROT -90");
    if (score >= 35) pool.push("ORBIT");
    if (score >= 50) pool.push("SWAY");

    const candidates = pool.filter(type => !recentTypes.includes(type));
    const list = candidates.length ? candidates : pool;
    const type = list[Math.floor(Math.random() * list.length)];
    recentTypes.push(type);
    if (recentTypes.length > 2) recentTypes.shift();
    return type;
}

function spawnShadow(now) {
    if (isVoidMode) return;
    const activeShadows = shadows.filter(s => s.fadeStart === null);
    if (activeShadows.length >= getMaxShadows()) {
        const oldest = activeShadows.reduce((o, c) => c.bornAt < o.bornAt ? c : o);
        oldest.fadeStart = now; oldest.fadeEnd = now + SHADOW_FADE_OUT;
    }

    shadowSerial++;
    const delay = SHADOW_DELAY + ((shadowSerial - 1) % 15) * 250;
    const anchor = getHistoryPosition(now - delay) || { x: player.x, y: player.y };
    const type = pickShadowType();

    let flipX = 1, flipY = 1;
    if (type === "FLIP X" || type === "FLIP X + Y") flipX = -1;
    if (type === "FLIP Y" || type === "FLIP X + Y") flipY = -1;

    shadows.push({
        id: shadowSerial, bornAt: now, fadeInStart: now, fadeInEnd: now + SHADOW_FADE_IN,
        fadeStart: null, fadeEnd: null, delay, anchorX: anchor.x, anchorY: anchor.y,
        type, flipX, flipY, phase: Math.random() * TAU, radius: 26 + Math.random() * 22,
        spin: (Math.random() < 0.5 ? -1 : 1) * (0.003 + Math.random() * 0.002), amp: 50 + Math.random() * 50,
        rgb: hexToRgb(SHADOW_COLORS[type])
    });

    if (!bossActive) {
        checkHealthBallSpawn(now);
    }
}

function updateShadows(now) {
    if (isVoidMode) return;
    const adjustedNow = now - totalPausedTime;
    if (adjustedNow >= shadowNextAt && !bossActive) {
        spawnShadow(adjustedNow); 
        scheduleShadow(adjustedNow);
    }
    shadows = shadows.filter(s => s.fadeEnd === null || adjustedNow < s.fadeEnd);
}

function getShadowAlpha(shadow, now) {
    const adjustedNow = now - totalPausedTime;
    const fadeIn = clamp((adjustedNow - shadow.fadeInStart) / SHADOW_FADE_IN, 0, 1);
    let fadeOut = 1;
    if (shadow.fadeStart !== null) fadeOut = Math.max(0, 1 - (adjustedNow - shadow.fadeStart) / SHADOW_FADE_OUT);
    return fadeIn * fadeOut;
}

function startGame() {
    if (running) return;

    resize(); startButton.blur(); cancelAnimationFrame(rafId);
    player = { x: 0, y: 0, radius: 7, dx: 1, dy: 0, vx: 0, vy: 0 };
    ringSpring.init = false;
    camera.x = player.x - width / 2; camera.y = player.y - height / 2;

    history = []; shadows = []; spaceDebris = []; particles = []; rings = []; floatingTexts = [];
    recentTypes = []; bossMilestonesTriggered.clear(); activeBosses = []; bossBullets = []; shadowSerial = 0;
    score = 0; health = 3; hasShield = false; dead = false; isPaused = false; isChoiceActive = false; isSlowMo = false; isVoidMode = false; bossActive = false; healthBalls = [];
    totalPausedTime = 0; iFrameUntil = 0; voidFullCount = 0;
    canvasFadeState = "IDLE";
    canvasFadeAlpha = 0;
    canvasFadeSpeed = 2.5;
    canvasFadeCallback = null;
    if (choiceIntervalId) { clearInterval(choiceIntervalId); choiceIntervalId = null; }
    gameOverReason = "";
    bestAtRunStart = Number(topScore) || 0;

    const now = performance.now();
    target = randomTarget();
    dashUntil = 0; dashReadyAt = 0; scheduleShadow(now);

    arenaStageIndex = 0; arenaFromRgb = hexToRgb(START_COLOR); arenaToRgb = hexToRgb(START_COLOR);
    arenaTransitionStart = 0; impactStart = -Infinity; impactIntensity = 1;

    running = true; lastTime = 0;
    for (const key in keys) keys[key] = false;
    resetTouch();

    scoreText.textContent = "SCORE: 0";
    message.classList.add("hidden");
    pauseOverlay.classList.add("hidden");
    choiceOverlay.classList.add("hidden");
    bossBarContainer.classList.add("hidden");
    pauseBtn.classList.remove("hidden");

    rafId = requestAnimationFrame(loop);
}

function update(dt, now) {
    if (isChoiceActive) return;

    if (canvasFadeState === "FADING_OUT") {
        updateEffects(dt, now);
        if (canvasFadeAlpha < 1) {
            canvasFadeAlpha = Math.min(1, canvasFadeAlpha + dt * canvasFadeSpeed);
        } else {
            // tahan layar hitam sebentar sebelum pindah scene
            canvasFadeHold -= dt * 1000;
            if (canvasFadeHold <= 0) {
                if (canvasFadeCallback) { const cb = canvasFadeCallback; canvasFadeCallback = null; cb(); }
            }
        }
        return;
    } else if (canvasFadeState === "FADING_IN") {
        updateEffects(dt, now);
        canvasFadeAlpha -= dt * canvasFadeSpeed;
        if (canvasFadeAlpha <= 0) {
            canvasFadeAlpha = 0;
            canvasFadeState = "IDLE";
            canvasFadeSpeed = 2.5;
        }
        return;
    }

    if (isSlowMo) {
        dt *= 0.2; 
        if (now >= slowMoTimer) {
            isSlowMo = false;
            triggerChoiceMenu(now);
            return;
        }
    }

    let dx = 0, dy = 0;
    if (keys["w"] || keys["arrowup"]) dy--;
    if (keys["s"] || keys["arrowdown"]) dy++;
    if (keys["a"] || keys["arrowleft"]) dx--;
    if (keys["d"] || keys["arrowright"]) dx++;

    if (touchState.active && (touchState.dx !== 0 || touchState.dy !== 0)) {
        dx = touchState.dx;
        dy = touchState.dy;
    }

    const inputLength = Math.hypot(dx, dy);
    if (inputLength > 0) {
        dx /= inputLength; dy /= inputLength;
        player.dx = dx; player.dy = dy;
        player.vx += dx * ACCELERATION * dt; player.vy += dy * ACCELERATION * dt;
    } else {
        const friction = Math.exp(-FRICTION * dt);
        player.vx *= friction; player.vy *= friction;
    }

    const isDashing = now < dashUntil;
    if (isDashing) {
        player.vx = player.dx * DASH_SPEED; player.vy = player.dy * DASH_SPEED;
    } else {
        const currentSpeed = Math.hypot(player.vx, player.vy);
        if (currentSpeed > BASE_SPEED) {
            const scale = BASE_SPEED / currentSpeed;
            player.vx *= scale; player.vy *= scale;
        }
    }

    player.x += player.vx * dt; player.y += player.vy * dt;
    stepRingSprings(dt);

    if (isVoidMode) {
        const pad = player.radius + 6;
        player.x = clamp(player.x, VOID_BOX.x + pad, VOID_BOX.x + VOID_BOX.width - pad);
        player.y = clamp(player.y, VOID_BOX.y + pad, VOID_BOX.y + VOID_BOX.height - pad);
        
        // kamera dikunci tepat di tengah void box (clamp lama bikin box geser ke kiri)
        camera.x = VOID_BOX.x + VOID_BOX.width / 2 - width / 2;
        camera.y = VOID_BOX.y + VOID_BOX.height / 2 - height / 2;
    } else {
        const targetCamX = player.x - width / 2;
        const targetCamY = player.y - height / 2;
        const cameraSpeed = isDashing ? 2.5 : 6.0;
        const lerpFactor = 1 - Math.exp(-cameraSpeed * dt);
        camera.x += (targetCamX - camera.x) * lerpFactor;
        camera.y += (targetCamY - camera.y) * lerpFactor;
    }

    const speed = Math.hypot(player.vx, player.vy);
    if (isDashing) burst(now, player.x, player.y, isVoidMode ? MONO_WHITE : WHITE, 3, 10, 60, 420, 2.2);
    else if (speed > 40 && Math.random() < 0.55) burst(now, player.x, player.y, isVoidMode ? MONO_WHITE : CYAN, 1, 6, 28, 480, 1.8);

    history.push({ x: player.x, y: player.y, time: now });
    while (history.length > 0 && history[0].time < now - 10000) history.shift();

    if (isVoidMode && target.vy) {
        target.y += target.vy * dt;
        if (target.y > VOID_BOX.y + VOID_BOX.height + 20) target = randomTarget();
    }

    const distance = Math.hypot(player.x - target.x, player.y - target.y);
    if (distance < 18) {
        const oldTier = getDifficultyTier();
        const gx = target.x, gy = target.y;
        const val = target.value || 1;
        score += val;

        scoreText.textContent = "SCORE: " + score;
        scoreText.classList.remove("bump");
        void scoreText.offsetWidth;
        scoreText.classList.add("bump");

        if (score > topScore) {
            topScore = score;
            localStorage.setItem("afteryou_topscore", topScore);
            topScoreText.textContent = "BEST: " + topScore;
        }

        const themeRgb = isVoidMode ? MONO_WHITE : (target.type === "CRIT" ? RED_CRIT : (target.type === "TRIPLE" ? PINK_3X : (target.type === "DOUBLE" ? PURPLE_2X : GOLD)));
        burst(now, gx, gy, themeRgb, 25, 70, 360, 600, 2.5);
        burst(now, gx, gy, WHITE, 8, 30, 180, 400, 1.8);
        addRing(now, gx, gy, themeRgb, 60, 520, 2.8, 0.9);
        addRing(now, gx, gy, WHITE, 35, 330, 1.5, 0.7);

        damageBossWithPointball(now, val, target.type);

        target = randomTarget();

        checkDifficulty(oldTier, now);
        checkArenaStage(now);
        checkBossTrigger(score, now);
        checkHealthBallSpawn(now);
    }

    for (let i = healthBalls.length - 1; i >= 0; i--) {
        const hb = healthBalls[i];
        const healthDist = Math.hypot(player.x - hb.x, player.y - hb.y);
        if (healthDist < 18) {
            if (hb.type === "FULL+") {
                health = maxHealth;
                if (!hasShield) { hasShield = true; shieldAnimProgress = 0.001; }
            } else if (hb.type === "2X") {
                health = Math.min(maxHealth, health + 2);
            } else {
                if (health < maxHealth) health++;
                else if (!hasShield) { hasShield = true; shieldAnimProgress = 0.001; }
            }
            
            const effectColor = isVoidMode ? MONO_WHITE : (hasShield && health === maxHealth ? SHIELD_BLUE : CYAN);
            burst(now, hb.x, hb.y, effectColor, 25, 60, 300, 500, 2.2);
            addRing(now, hb.x, hb.y, effectColor, 50, 400, 2, 0.9);
            healthBalls.splice(i, 1);
        }
    }

    updateHealthBalls(now, dt);
    updateSpaceDebrisCount();
    updateShadows(now);
    updateDebris(dt, now);
    updateBoss(dt, now);
    updateEffects(dt, now);

    for (const shadow of shadows) {
        if (shadow.fadeStart !== null || now < shadow.fadeInEnd) continue;
        const ghost = getShadowPosition(shadow, now);
        if (!ghost) continue;

        if (Math.hypot(player.x - ghost.x, player.y - ghost.y) < 16) {
            applyDamage(now); return;
        }
    }

    for (const d of spaceDebris) {
        if (Math.hypot(player.x - d.x, player.y - d.y) < d.size + 4) {
            applyDamage(now); return;
        }
    }

    updateHUD(now);
}

function updateHUD(now) {
    if (now < dashUntil) dashText.textContent = "DASH: ACTIVE";
    else if (now >= dashReadyAt) dashText.textContent = "DASH: READY";
    else dashText.textContent = "DASH: " + ((dashReadyAt - now) / 1000).toFixed(1) + "s";

    const activeCount = shadows.filter(s => s.fadeStart === null).length;

    if (isVoidMode) {
        warningText.textContent = "🌌 VOID ACTIVE";
        warningText.style.color = "#ffffff";
    } else if (bossActive) {
        warningText.textContent = activeBosses.length > 1 ? "⚠️ MULTI BOSS" : "⚠️ BOSS BATTLE";
        warningText.style.color = score >= 100 ? "#d946ef" : "#ef4444";
    } else if (activeCount > 0) {
        warningText.textContent = "SHADOWS: " + activeCount + " / " + getMaxShadows();
        warningText.style.color = getArenaColor(now);
    } else {
        const adjustedNow = now - totalPausedTime;
        const remaining = shadowNextAt - adjustedNow;
        if (remaining <= 5000) {
            warningText.textContent = "SHADOW IN " + Math.ceil(remaining / 1000);
            warningText.style.color = "#d6c58a";
        } else {
            warningText.textContent = "SHADOW: DORMANT";
            warningText.style.color = "#60757d";
        }
    }
}

function drawDot(x, y, color, radius) {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU);
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 18;
    ctx.fill(); ctx.shadowBlur = 0;
}

function drawRibbon(points, rgb, maxWidth, maxAlpha) {
    ctx.lineCap = "round";
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        if (!a || !b) continue;
        const length = Math.hypot(a.x - b.x, a.y - b.y);
        if (length < 0.4 || length > 160) continue;

        const t = 1 - i / points.length;
        ctx.strokeStyle = rgba(rgb, maxAlpha * t * t);
        ctx.lineWidth = Math.max(0.6, maxWidth * t);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
}

function getShadowTrail(shadow, now) {
    const points = [];
    for (let k = 0; k < SHADOW_TRAIL_POINTS; k++) {
        const p = getShadowPosition(shadow, now, k * SHADOW_TRAIL_STEP);
        if (!p) break;
        points.push(p);
    }
    return points;
}

function getPlayerTrail(now, isDashing) {
    const count = isDashing ? 16 : 11, step = isDashing ? 26 : 34;
    const points = [{ x: player.x, y: player.y }];
    for (let k = 1; k < count; k++) {
        const p = getHistoryPosition(now - k * step);
        if (!p) break;
        points.push(p);
    }
    return points;
}

function drawTarget(now) {
    const age = now - target.bornAt;
    const pop = clamp(age / 350, 0, 1);
    const ease = 1 - Math.pow(1 - pop, 3);
    const pulse = 1 + Math.sin(now * 0.006) * 0.18;

    let targetColor = isVoidMode ? "#ffffff" : "#d6c58a";
    let targetRgb = isVoidMode ? MONO_WHITE : GOLD;

    if (!isVoidMode) {
        if (target.type === "CRIT") {
            targetColor = "#ef4444";
            targetRgb = RED_CRIT;
        } else if (target.type === "TRIPLE") {
            targetColor = "#ec4899";
            targetRgb = PINK_3X;
        } else if (target.type === "DOUBLE") {
            targetColor = "#a855f7";
            targetRgb = PURPLE_2X;
        }
    }

    ctx.beginPath();
    ctx.arc(target.x, target.y, (14 + Math.sin(now * 0.004) * 2) * ease, 0, TAU);
    ctx.strokeStyle = rgba(target.type === "CRIT" && !isVoidMode ? hexToRgb("#d946ef") : targetRgb, 0.4 * ease);
    ctx.lineWidth = target.type === "CRIT" ? 2.5 : 1.5; ctx.stroke();

    const dotsCount = target.type === "CRIT" ? 5 : (target.value === 3 ? 4 : (target.value === 2 ? 3 : 2));
    for (let i = 0; i < dotsCount; i++) {
        const angle = now * 0.005 + i * (TAU / dotsCount);
        ctx.beginPath();
        ctx.arc(target.x + Math.cos(angle) * 14 * ease, target.y + Math.sin(angle) * 14 * ease, target.value > 1 ? 2.2 : 1.6, 0, TAU);
        ctx.fillStyle = rgba(targetRgb, 0.9 * ease); ctx.fill();
    }

    drawDot(target.x, target.y, targetColor, (target.value > 1 ? 7 : 5) * ease * pulse);

    if (target.value > 1 || target.type === "CRIT") {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(target.type === "CRIT" ? "CRIT!" : "+" + target.value + "x", target.x, target.y - 14);
    }
}

function drawHealthBall(now) {
    for (const hb of healthBalls) {
        let alpha = 1;

        if (now - hb.bornAt < 600) {
            alpha = (now - hb.bornAt) / 600;
        }
        if (now >= hb.fadeStart) {
            alpha = Math.max(0, (hb.fadeEnd - now) / 800);
        }

        ctx.save();
        ctx.globalAlpha = clamp(alpha, 0, 1);

        const pulse = 1 + Math.sin(now * 0.008) * 0.2;
        const colorHex = isVoidMode ? "#ffffff" : (hb.type === "FULL+" ? "#3b82f6" : "#70e1e5");

        ctx.beginPath();
        ctx.arc(hb.x, hb.y, 12 * pulse, 0, TAU);
        ctx.strokeStyle = rgba(hexToRgb(colorHex), 0.4);
        ctx.lineWidth = 1.5; ctx.stroke();

        drawDot(hb.x, hb.y, colorHex, 5 * pulse);

        if (hb.type !== "1X") {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "center";
            ctx.fillText("+" + hb.type, hb.x, hb.y - 12);
        }

        ctx.restore();
    }
}

// ===== RING PLAYER DINAMIS (spring, bukan nempel kaku) =====
const ringSpring = { x: 0, y: 0, vx: 0, vy: 0, sx: 0, sy: 0, svx: 0, svy: 0, spin: 0, init: false };

function stepRingSprings(dt) {
    if (!player) return;
    const r = ringSpring;
    if (!r.init || Math.hypot(player.x - r.x, player.y - r.y) > 150) {
        r.x = r.sx = player.x; r.y = r.sy = player.y;
        r.vx = r.vy = r.svx = r.svy = 0;
        r.init = true;
    }
    const sub = 3;
    const h = Math.min(dt, 0.033) / sub;
    for (let i = 0; i < sub; i++) {
        // ring kesehatan: cukup responsif
        r.vx += ((player.x - r.x) * 150 - r.vx * 12) * h;
        r.vy += ((player.y - r.y) * 150 - r.vy * 12) * h;
        r.x += r.vx * h; r.y += r.vy * h;
        // shield: lebih lambat/lembek, jadi terasa berlapis
        r.svx += ((player.x - r.sx) * 85 - r.svx * 10) * h;
        r.svy += ((player.y - r.sy) * 85 - r.svy * 10) * h;
        r.sx += r.svx * h; r.sy += r.svy * h;
    }
    const speed = Math.hypot(player.vx, player.vy);
    r.spin += Math.min(dt, 0.05) * (3 + speed * 0.012);
}

function ringShape(lagX, lagY, baseR, maxOffset, stretch) {
    const L = Math.hypot(lagX, lagY);
    const ang = L > 0.001 ? Math.atan2(lagY, lagX) : 0;
    const k = L > maxOffset ? maxOffset / L : 1;
    return {
        ox: lagX * k, oy: lagY * k, ang,
        rx: baseR + Math.min(L * stretch, baseR * 0.75),
        ry: baseR - Math.min(L * stretch * 0.35, baseR * 0.28)
    };
}

function drawPlayerHealthRingAndOrbit(now, dt) {
    if (!player || dead) return;
    dt = dt || 0;
    const r = ringSpring;
    if (!r.init) stepRingSprings(0);

    ctx.save();
    const px = player.x, py = player.y;
    const playerColor = isVoidMode ? "#ffffff" : "#70e1e5";
    const breathe = 1 + Math.sin(now * 0.006) * 0.04;

    const ring = ringShape(r.x - px, r.y - py, 20 * breathe, 9, 0.30);
    const cx = px + ring.ox, cy = py + ring.oy;

    ctx.beginPath();
    ctx.ellipse(cx, cy, ring.rx, ring.ry, ring.ang, 0, TAU);
    ctx.strokeStyle = isVoidMode ? "rgba(255, 255, 255, 0.3)" : "rgba(112, 225, 229, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const cosA = Math.cos(ring.ang), sinA = Math.sin(ring.ang);
    for (let i = 0; i < maxHealth; i++) {
        if (i < health) {
            const a = r.spin + i * (TAU / maxHealth);
            const lx = Math.cos(a) * ring.rx, ly = Math.sin(a) * ring.ry;
            const ox = cx + lx * cosA - ly * sinA;
            const oy = cy + lx * sinA + ly * cosA;

            ctx.beginPath();
            ctx.arc(ox, oy, 4, 0, TAU);
            ctx.fillStyle = playerColor;
            ctx.shadowColor = playerColor;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    if (hasShield) {
        if (shieldAnimProgress > 0 && shieldAnimProgress < 1) {
            shieldAnimProgress += dt * 2.5;
        }
        const shieldScale = 1 + Math.sin(shieldAnimProgress * Math.PI) * 0.3;
        const sh = ringShape(r.sx - px, r.sy - py, 26 * shieldScale * breathe, 8, 0.38);

        ctx.beginPath();
        ctx.ellipse(px + sh.ox, py + sh.oy, sh.rx, sh.ry, sh.ang, 0, TAU);
        ctx.strokeStyle = isVoidMode ? "rgba(255, 255, 255, 0.9)" : "rgba(59, 130, 246, 0.85)";
        ctx.lineWidth = 2;
        ctx.shadowColor = isVoidMode ? "#ffffff" : "#3b82f6";
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

// ===== BACKGROUND VOID: INSTALASI BINTANG LUAR ANGKASA =====
let voidStars = [];
let voidConstellations = [];

function initVoidSpace() {
    voidStars = [];
    const tints = ["255,255,255", "190,215,255", "255,235,200", "210,190,255"];
    for (let i = 0; i < 160; i++) {
        voidStars.push({
            nx: Math.random(), ny: Math.random(),
            r: 0.4 + Math.random() * 1.5,
            layer: 0.3 + Math.random() * 0.7,
            tw: Math.random() * TAU, ts: 0.8 + Math.random() * 2.2,
            tint: tints[Math.floor(Math.random() * tints.length)]
        });
    }
    voidConstellations = [];
    for (let c = 0; c < 6; c++) {
        const cx = 0.12 + Math.random() * 0.76, cy = 0.12 + Math.random() * 0.76;
        const count = 4 + Math.floor(Math.random() * 3);
        const pts = [];
        let x = cx, y = cy;
        for (let i = 0; i < count; i++) {
            x = clamp(x + (Math.random() - 0.5) * 0.2, 0.04, 0.96);
            y = clamp(y + (Math.random() - 0.5) * 0.14, 0.04, 0.96);
            pts.push({ nx: x, ny: y, r: 1.4 + Math.random() * 1.4, tw: Math.random() * TAU });
        }
        voidConstellations.push(pts);
    }
}
initVoidSpace();

function drawVoidSpace(now) {
    const bx = VOID_BOX.x, by = VOID_BOX.y, bw = VOID_BOX.width, bh = VOID_BOX.height;
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.clip();

    const sky = ctx.createLinearGradient(0, by, 0, by + bh);
    sky.addColorStop(0, "#02030a");
    sky.addColorStop(0.5, "#070a1f");
    sky.addColorStop(1, "#0f0a26");
    ctx.fillStyle = sky;
    ctx.fillRect(bx, by, bw, bh);

    // nebula
    const t = now * 0.00005;
    const nebulae = [
        { nx: 0.25 + Math.sin(t * 3) * 0.08, ny: 0.30, r: 0.55, c: "90,70,200", a: 0.22 },
        { nx: 0.78 + Math.cos(t * 2.4) * 0.07, ny: 0.55 + Math.sin(t * 2) * 0.05, r: 0.5, c: "30,130,210", a: 0.17 },
        { nx: 0.45, ny: 0.88 + Math.sin(t * 2.8) * 0.04, r: 0.6, c: "190,60,150", a: 0.15 }
    ];
    for (const n of nebulae) {
        const nx = bx + n.nx * bw, ny = by + n.ny * bh, nr = n.r * Math.max(bw, bh);
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        g.addColorStop(0, `rgba(${n.c},${n.a})`);
        g.addColorStop(1, `rgba(${n.c},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(bx, by, bw, bh);
    }

    // rasi bintang (garis tipis + titik terang)
    for (const pts of voidConstellations) {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
            const x = bx + pts[i].nx * bw, y = by + pts[i].ny * bh;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(170, 200, 255, 0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
        for (const p of pts) {
            const tw = 0.65 + 0.35 * Math.sin(now * 0.002 + p.tw);
            ctx.beginPath();
            ctx.arc(bx + p.nx * bw, by + p.ny * bh, p.r, 0, TAU);
            ctx.fillStyle = `rgba(235, 244, 255, ${0.85 * tw})`;
            ctx.shadowColor = "#cfe3ff";
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // bintang biasa, turun pelan (paralaks) biar nyambung sama efek jatuh
    for (const s of voidStars) {
        const ny = (s.ny + now * 0.000012 * s.layer) % 1;
        const tw = 0.5 + 0.5 * Math.sin(now * 0.001 * s.ts + s.tw);
        ctx.fillStyle = `rgba(${s.tint}, ${(0.25 + 0.65 * tw) * s.layer})`;
        const size = s.r * (0.8 + s.layer * 0.4);
        ctx.fillRect(bx + s.nx * bw, by + ny * bh, size, size);
    }

    // vignette tepi box
    const vg = ctx.createRadialGradient(bx + bw / 2, by + bh / 2, Math.min(bw, bh) * 0.35, bx + bw / 2, by + bh / 2, Math.max(bw, bh) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vg;
    ctx.fillRect(bx, by, bw, bh);

    ctx.restore();
}

function drawOffScreenIndicator() {
    if (isVoidMode) return;

    const margin = 35;
    const centerX = width / 2, centerY = height / 2;

    if (target) {
        const screenX = target.x - camera.x, screenY = target.y - camera.y;
        if (screenX < 0 || screenX > width || screenY < 0 || screenY > height) {
            const angle = Math.atan2(screenY - centerY, screenX - centerX);
            let edgeX = clamp(centerX + Math.cos(angle) * (width / 2 - margin), margin, width - margin);
            let edgeY = clamp(centerY + Math.sin(angle) * (height / 2 - margin), margin, height - margin);

            ctx.save();
            ctx.translate(edgeX, edgeY);
            ctx.rotate(angle);

            const color = target.type === "CRIT" ? "#ef4444" : (target.type === "TRIPLE" ? "#ec4899" : (target.type === "DOUBLE" ? "#a855f7" : "#d6c58a"));
            ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12;

            ctx.beginPath();
            ctx.moveTo(10, 0); ctx.lineTo(-8, -7); ctx.lineTo(-4, 0); ctx.lineTo(-8, 7);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }
}

function drawBackground(rgb) {
    const cx = width / 2, cy = height / 2;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(cx, cy));
    gradient.addColorStop(0, rgba(rgb, isVoidMode ? 0.35 : 0.18));
    gradient.addColorStop(0.65, rgba(rgb, isVoidMode ? 0.15 : 0.06));
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.45)");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);

    if (isVoidMode) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        for (let i = 0; i < 75; i++) {
            const sx = (Math.sin(i * 99 + performance.now() * 0.0002) * 0.5 + 0.5) * width;
            const sy = (Math.cos(i * 33 + performance.now() * 0.0003) * 0.5 + 0.5) * height;
            ctx.fillRect(sx, sy, 2, 2);
        }
    }
}

function drawBoss(now) {
    if (!bossActive || activeBosses.length === 0) return;

    for (const boss of activeBosses) {
        const isEvilMagenta = boss.milestone >= 100;
        const mainColor = isEvilMagenta ? "#d946ef" : "#ef4444";
        const darkColor = isEvilMagenta ? "#86198f" : "#b91c1c";
        const strokeColor = isEvilMagenta ? "rgba(217, 70, 239, 0.4)" : "rgba(239, 68, 68, 0.4)";
        const highlightColor = isEvilMagenta ? "#f5d0fe" : "#fca5a5";

        if (!isVoidMode) {
            const ringRadius = 390;
            ctx.save();
            ctx.translate(boss.x, boss.y);
            
            ctx.beginPath();
            ctx.ellipse(0, 0, ringRadius, ringRadius * 0.4, Math.PI / 6, 0, TAU);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            let ringShadowCount = 2 + Math.floor(Math.max(0, boss.milestone - 25) / 25);
            if (ringShadowCount > 7) ringShadowCount = 7;

            const ringSpeed = now * 0.0015;

            for (let i = 0; i < ringShadowCount; i++) {
                const angle = ringSpeed + (i * (TAU / ringShadowCount));
                const ox = Math.cos(angle) * ringRadius;
                const oy = Math.sin(angle) * (ringRadius * 0.4);

                ctx.beginPath();
                ctx.arc(ox, oy, 6, 0, TAU);
                ctx.fillStyle = highlightColor;
                ctx.shadowColor = mainColor;
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.shadowBlur = 0;

                const worldOx = boss.x + ox;
                const worldOy = boss.y + oy;
                if (Math.hypot(player.x - worldOx, player.y - worldOy) < 14) {
                    applyDamage(now);
                }
            }
            ctx.restore();
        }

        ctx.beginPath(); ctx.arc(boss.x, boss.y, 26, 0, TAU);
        ctx.fillStyle = darkColor; ctx.shadowColor = mainColor; ctx.shadowBlur = 35;
        ctx.fill(); ctx.shadowBlur = 0;

        ctx.save();
        ctx.translate(boss.x, boss.y);
        ctx.rotate(now * 0.002);
        ctx.strokeStyle = highlightColor; ctx.lineWidth = 1.8;
        ctx.strokeRect(-32, -32, 64, 64);
        ctx.restore();
    }

    for (const b of bossBullets) {
        const col = b.rgb || BOSS_RED;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.2, 0, TAU);
        ctx.fillStyle = rgba(col, 0.22 * b.alpha); ctx.fill();
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, TAU);
        ctx.fillStyle = rgba(col, b.alpha); ctx.fill();
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 0.45, 0, TAU);
        ctx.fillStyle = "rgba(255, 255, 255, " + (0.9 * b.alpha) + ")"; ctx.fill();
    }
}

// ===== KONSTELASI DI ARENA NORMAL (tile di dunia game + paralaks) =====
const CONST_TILE = 760;
const CONST_PAR = 0.55;
const constTileCache = new Map();

function hash2(ix, iy) {
    let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
}

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function getConstTile(ix, iy) {
    const key = ix + "," + iy;
    let tile = constTileCache.get(key);
    if (tile) return tile;

    const rnd = mulberry32(hash2(ix, iy));
    tile = { groups: [], loose: [] };
    const groups = 2 + (rnd() < 0.5 ? 1 : 0);
    for (let g = 0; g < groups; g++) {
        let x = rnd() * CONST_TILE, y = rnd() * CONST_TILE;
        const count = 4 + Math.floor(rnd() * 3);
        const pts = [];
        for (let i = 0; i < count; i++) {
            x += (rnd() - 0.5) * CONST_TILE * 0.28;
            y += (rnd() - 0.5) * CONST_TILE * 0.28;
            pts.push({ x, y, r: 1.3 + rnd() * 1.5, tw: rnd() * TAU });
        }
        tile.groups.push(pts);
    }
    for (let i = 0; i < 10; i++) {
        tile.loose.push({ x: rnd() * CONST_TILE, y: rnd() * CONST_TILE, r: 0.5 + rnd() * 0.9, tw: rnd() * TAU });
    }

    if (constTileCache.size > 240) constTileCache.clear();
    constTileCache.set(key, tile);
    return tile;
}

function drawWorldConstellations(now, arenaRgb) {
    const vx = camera.x * CONST_PAR, vy = camera.y * CONST_PAR;
    const x0 = Math.floor(vx / CONST_TILE) - 1, x1 = Math.floor((vx + width) / CONST_TILE) + 1;
    const y0 = Math.floor(vy / CONST_TILE) - 1, y1 = Math.floor((vy + height) / CONST_TILE) + 1;
    const col = mixRgb(arenaRgb, WHITE, 0.6);

    ctx.save();
    ctx.translate(camera.x * (1 - CONST_PAR), camera.y * (1 - CONST_PAR));
    ctx.lineWidth = 1;

    for (let iy = y0; iy <= y1; iy++) {
        for (let ix = x0; ix <= x1; ix++) {
            const tile = getConstTile(ix, iy);
            const ox = ix * CONST_TILE, oy = iy * CONST_TILE;

            ctx.strokeStyle = rgba(col, 0.2);
            for (const pts of tile.groups) {
                ctx.beginPath();
                for (let i = 0; i < pts.length; i++) {
                    if (i === 0) ctx.moveTo(ox + pts[i].x, oy + pts[i].y);
                    else ctx.lineTo(ox + pts[i].x, oy + pts[i].y);
                }
                ctx.stroke();
                for (const p of pts) {
                    const tw = 0.65 + 0.35 * Math.sin(now * 0.002 + p.tw);
                    ctx.beginPath(); ctx.arc(ox + p.x, oy + p.y, p.r * 3, 0, TAU);
                    ctx.fillStyle = rgba(col, 0.12 * tw); ctx.fill();
                    ctx.beginPath(); ctx.arc(ox + p.x, oy + p.y, p.r, 0, TAU);
                    ctx.fillStyle = rgba(col, 0.85 * tw); ctx.fill();
                }
            }
            for (const s of tile.loose) {
                const tw = 0.4 + 0.6 * Math.sin(now * 0.0015 + s.tw) * 0.5 + 0.3;
                ctx.fillStyle = rgba(col, 0.5 * tw);
                ctx.fillRect(ox + s.x, oy + s.y, s.r * 1.6, s.r * 1.6);
            }
        }
    }
    ctx.restore();
}

function drawArena(now, dt) {
    const arenaRgb = getArenaRgb(now);
    const arenaColor = rgbStr(arenaRgb);

    const elapsed = now - impactStart;
    let impact = 0;
    if (elapsed >= 0 && elapsed < IMPACT_DURATION) {
        impact = Math.sin((elapsed / IMPACT_DURATION) * Math.PI);
    }
    const scale = 1 + impact * 0.012 * impactIntensity;

    let shakeX = 0, shakeY = 0;
    if (impact > 0) {
        shakeX = Math.sin(elapsed * 0.09) * impact * 4 * impactIntensity;
        shakeY = Math.cos(elapsed * 0.11) * impact * 4 * impactIntensity;
    }

    drawBackground(arenaRgb);

    ctx.save();
    ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);
    ctx.translate(-camera.x, -camera.y);

    if (!isVoidMode) {
        drawWorldConstellations(now, arenaRgb);
        ctx.strokeStyle = arenaColor;
        ctx.globalAlpha = 0.16 + impact * 0.25; ctx.lineWidth = 1;

        const gridSize = 40;
        const startX = Math.floor(camera.x / gridSize) * gridSize;
        const endX = startX + width + gridSize * 2;
        const startY = Math.floor(camera.y / gridSize) * gridSize;
        const endY = startY + height + gridSize * 2;

        for (let x = startX; x <= endX; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
        }
        for (let y = startY; y <= endY; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
    } else {
        drawVoidSpace(now);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3.5;
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 18;
        ctx.strokeRect(VOID_BOX.x, VOID_BOX.y, VOID_BOX.width, VOID_BOX.height);
        ctx.shadowBlur = 0;
    }

    if (target) drawTarget(now);
    drawHealthBall(now);
    if (!isVoidMode) {
        for (const d of spaceDebris) drawDebris(d, now);
    }
    drawBoss(now);

    ctx.globalCompositeOperation = "lighter";
    if (!isVoidMode) {
        for (const shadow of shadows) {
            const alpha = getShadowAlpha(shadow, now);
            if (alpha <= 0) continue;
            drawRibbon(getShadowTrail(shadow, now), shadow.rgb, 5, 0.5 * alpha);
        }
    }

    const isDashing = now < dashUntil;
    if (player && !dead) {
        drawRibbon(getPlayerTrail(now, isDashing), isVoidMode ? MONO_WHITE : (isDashing ? WHITE : CYAN), isDashing ? 9 : 6, isDashing ? 0.8 : 0.55);
    }
    ctx.globalCompositeOperation = "source-over";

    if (!isVoidMode) {
        for (const shadow of shadows) {
            const ghost = getShadowPosition(shadow, now);
            if (!ghost) continue;
            const alpha = getShadowAlpha(shadow, now);
            if (alpha <= 0) continue;

            if (now < shadow.fadeInEnd) {
                const p = clamp((now - shadow.fadeInStart) / SHADOW_FADE_IN, 0, 1);
                ctx.beginPath(); ctx.arc(ghost.x, ghost.y, 8 + (1 - p) * 24, 0, TAU);
                ctx.strokeStyle = rgba(shadow.rgb, 0.55 * (0.4 + 0.6 * p));
                ctx.lineWidth = 1.5; ctx.stroke();
            }

            ctx.globalAlpha = alpha;
            drawDot(ghost.x, ghost.y, rgbStr(shadow.rgb), 8);
        }
        ctx.globalAlpha = 1;
    }

    const isInvincible = now < iFrameUntil;
    const shouldDrawPlayer = !isInvincible || Math.floor(now / 80) % 2 === 0;

    if (player && !dead && shouldDrawPlayer) {
        drawDot(player.x, player.y, isVoidMode ? "#ffffff" : (isDashing ? "#ffffff" : "#70e1e5"), isDashing ? 9 : 7);
        drawPlayerHealthRingAndOrbit(now, dt);
    }

    ctx.globalCompositeOperation = "lighter";
    for (const p of particles) {
        const t = clamp((now - p.born) / p.life, 0, 1);
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.3, p.size * (1 - t * 0.7)), 0, TAU);
        ctx.fillStyle = rgba(p.rgb, (1 - t) * 0.9); ctx.fill();
    }
    for (const r of rings) {
        const t = clamp((now - r.start) / r.duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        ctx.beginPath(); ctx.arc(r.x, r.y, r.maxRadius * eased, 0, TAU);
        ctx.strokeStyle = rgba(r.rgb, (1 - t) * r.alpha);
        ctx.lineWidth = r.lineWidth * (1 - t) + 0.5; ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    for (const ft of floatingTexts) {
        ctx.fillStyle = ft.color;
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText(ft.text, ft.x, ft.y);
    }

    if (impact > 0 && !isVoidMode) {
        ctx.globalAlpha = impact * 0.16 * impactIntensity;
        ctx.fillStyle = arenaColor; ctx.fillRect(camera.x, camera.y, width, height);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    drawOffScreenIndicator();

    if (canvasFadeAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${canvasFadeAlpha})`;
        ctx.fillRect(0, 0, width, height);
    }

    ctx.strokeStyle = isVoidMode ? "#ffffff" : arenaColor; 
    ctx.shadowColor = isVoidMode ? "#ffffff" : arenaColor; 
    ctx.shadowBlur = 14;
    ctx.globalAlpha = 0.25 + impact * 0.5; ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;

    if (arenaColor !== lastCssColor && !isVoidMode) {
        lastCssColor = arenaColor;
        document.documentElement.style.setProperty("--arena", arenaColor);
    }
}

function drawTouchJoystick(now) {
    if (!touchState.active || !running) return;

    const rgb = isVoidMode ? MONO_WHITE : getArenaRgb(now);
    const dashing = now < dashUntil;
    const knobRgb = dashing ? WHITE : rgb;

    ctx.save();
    ctx.beginPath();
    ctx.arc(touchState.originX, touchState.originY, TOUCH_RADIUS, 0, TAU);
    ctx.fillStyle = rgba(rgb, 0.06);
    ctx.fill();
    ctx.strokeStyle = rgba(rgb, 0.28);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(touchState.curX, touchState.curY, 20, 0, TAU);
    ctx.fillStyle = rgba(knobRgb, dashing ? 0.55 : 0.28);
    ctx.shadowColor = rgbStr(knobRgb);
    ctx.shadowBlur = dashing ? 16 : 8;
    ctx.fill();
    ctx.restore();
}

function draw(dt) {
    const now = performance.now();
    ctx.clearRect(0, 0, width, height);
    drawArena(now, dt);
    drawTouchJoystick(now);
}

function loop() {
    if (!running || isPaused || isChoiceActive) return;

    const now = performance.now();
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
    lastTime = now;

    update(dt, now);
    if (!running || isPaused || isChoiceActive) return;

    draw(dt);
    rafId = requestAnimationFrame(loop);
}

function deathFrame() {
    if (running) return;
    const now = performance.now();
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
    lastTime = now;

    updateEffects(dt, now);
    draw(dt);

    if (now < deathUntil) {
        rafId = requestAnimationFrame(deathFrame);
    } else {
        // animasi mati selesai -> tampilkan menu Try Again (sebelumnya tidak pernah muncul = freeze)
        message.classList.remove("hidden");
    }
}

function gameOver(now) {
    running = false; dead = true;
    bossBarContainer.classList.add("hidden");
    pauseBtn.classList.add("hidden");

    burst(now, player.x, player.y, CYAN, 46, 60, 420, 900, 2.8);
    burst(now, player.x, player.y, WHITE, 14, 40, 260, 600, 2);
    addRing(now, player.x, player.y, CYAN, 140, 800, 3, 0.9);

    if (isVoidMode) {
        const lostScore = score;
        score = 0;
        // skor run ini dihapus, termasuk dari BEST (kembali ke rekor sebelum run ini)
        topScore = bestAtRunStart;
        try { localStorage.setItem("afteryou_topscore", topScore); } catch (e) {}
        topScoreText.textContent = "BEST: " + topScore;
        title.textContent = "VOID CONSUMED YOU";
        description.textContent = "Your existence was erased. Score reset to 0! (Lost " + lostScore + " pts)";
    } else if (gameOverReason) {
        title.textContent = "TIME COLLAPSED";
        description.textContent = gameOverReason;
    } else {
        title.textContent = "TIME COLLAPSED";
        description.textContent = "Your score: " + score + (score >= topScore && score > 0 ? " (NEW BEST!)" : "");
    }

    startButton.textContent = "TRY AGAIN";
    scoreText.textContent = "SCORE: " + score;

    deathUntil = now + 900;
    lastTime = now;
    rafId = requestAnimationFrame(deathFrame);
}

startButton.addEventListener("click", startGame);
