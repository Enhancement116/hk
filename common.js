// ==========================================
// 1. 首頁 (index.html) 專用的自動跳轉邏輯
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
if (!urlParams.get('hub') && (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/'))) {
    const today = new Date();
    const m = today.getMonth() + 1; // 0-based
    const d = today.getDate();
    if (m === 3) {
        if (d === 22) window.location.replace('hk_day01.html');
        if (d === 23) window.location.replace('hk_day02.html');
        if (d === 24) window.location.replace('hk_day03.html');
        if (d === 25) window.location.replace('hk_day04.html');
        if (d === 26) window.location.replace('hk_day05.html');
    }
}

// ==========================================
// 2. 共用：即時匯率換算邏輯
// ==========================================
const currencyPanel = document.getElementById('currency-panel');
let currentRate = 4.1; 
let isRateFetched = false;

async function fetchRealTimeRate() {
    if (isRateFetched) return; 
    const rateDisplay = document.getElementById('rate-display');
    if (!rateDisplay) return;
    
    rateDisplay.textContent = '🔄 正在獲取最新網路匯率...';
    rateDisplay.style.color = 'var(--tech-blue)';

    try {
        const response = await fetch('https://open.er-api.com/v6/latest/HKD');
        const data = await response.json();
        if (data && data.rates && data.rates.TWD) {
            currentRate = data.rates.TWD; 
            isRateFetched = true;
            rateDisplay.textContent = `✅ 最新匯率 1 HKD = ${currentRate.toFixed(2)} TWD`;
            rateDisplay.style.color = '#2e7d32'; 
            calcCurrency(); 
        } else throw new Error("API 格式不符");
    } catch (error) {
        rateDisplay.textContent = `⚠️ 處於離線狀態，使用預設匯率 1 : 4.1`;
        rateDisplay.style.color = '#d93025'; 
    }
}

function toggleCurrency() {
    if (currencyPanel) {
        currencyPanel.classList.toggle('show');
        if(currencyPanel.classList.contains('show')) {
            document.getElementById('hkd-input').focus();
            fetchRealTimeRate(); 
        }
    }
}

function closeCurrencyPanel() {
    if(currencyPanel && currencyPanel.classList.contains('show')) {
        currencyPanel.classList.remove('show');
    }
}

function calcCurrency() {
    const hkd = document.getElementById('hkd-input')?.value;
    const out = document.getElementById('twd-output');
    if(out) out.textContent = hkd ? Math.round(hkd * currentRate) : 0;
}

// ==========================================
// 3. 共用：系統時鐘與深淺色模式
// ==========================================
function updateSystemData() {
    const now = new Date();
    const liveClock = document.getElementById('live-clock');
    if (liveClock) {
        liveClock.textContent = 
            String(now.getHours()).padStart(2, '0') + ':' + 
            String(now.getMinutes()).padStart(2, '0') + ':' + 
            String(now.getSeconds()).padStart(2, '0');
    }

    // Day 01 專屬：機場快線倒數邏輯
    if(document.getElementById('ael-next-time')) {
        const currentMin = now.getMinutes();
        let minsToAdd = 10 - (currentMin % 10);
        let nextTrainTime = new Date(now.getTime());
        nextTrainTime.setMinutes(currentMin + minsToAdd);
        nextTrainTime.setSeconds(0);
        
        let diffMs = nextTrainTime - now;
        let diffMin = Math.floor(diffMs / 60000);
        let diffSec = Math.floor((diffMs % 60000) / 1000);
        let arrTime = new Date(nextTrainTime.getTime() + 24 * 60000);

        document.getElementById('ael-next-time').textContent = String(nextTrainTime.getHours()).padStart(2, '0') + ':' + String(nextTrainTime.getMinutes()).padStart(2, '0');
        document.getElementById('ael-countdown').textContent = String(diffMin).padStart(2, '0') + ' 分 ' + String(diffSec).padStart(2, '0') + ' 秒';
        document.getElementById('ael-arr-time').textContent = String(arrTime.getHours()).padStart(2, '0') + ':' + String(arrTime.getMinutes()).padStart(2, '0');
    }
}
setInterval(updateSystemData, 1000); 
updateSystemData();

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = document.body.classList.contains('dark-mode') ? '🌜' : '🌞';
    closeCurrencyPanel();
}

// ==========================================
// 4. Day 1~5 專屬：卡片導航滑動邏輯
// ==========================================
const stack = document.getElementById('stack');
if (stack) {
    const cards = document.querySelectorAll('.card');
    let currentIndex = 0;

    function timeToMins(timeStr) {
        let parts = timeStr.split(':');
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }

    function getActiveIndexByTime() {
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        let targetIndex = cards.length - 1; 
        for (let i = 0; i < cards.length; i++) {
            if (nowMins >= timeToMins(cards[i].dataset.start) && nowMins < timeToMins(cards[i].dataset.end)) {
                targetIndex = i; break;
            }
        }
        return targetIndex;
    }

    function renderCards() {
        cards.forEach((card, index) => {
            card.classList.remove('active', 'prev');
            if (index === currentIndex) { card.classList.add('active'); card.scrollTop = 0; } 
            else if (index < currentIndex) { card.classList.add('prev'); }
        });
        closeCurrencyPanel();
    }

    function goNext() { if (currentIndex < cards.length - 1) { currentIndex++; renderCards(); } }
    function goPrev() { if (currentIndex > 0) { currentIndex--; renderCards(); } }
    function jumpToNow() { currentIndex = getActiveIndexByTime(); renderCards(); }

    document.getElementById('btn-next')?.addEventListener('click', goNext);
    document.getElementById('btn-prev')?.addEventListener('click', goPrev);
    document.getElementById('btn-now')?.addEventListener('click', jumpToNow);

    let touchStartX = 0, touchStartY = 0;
    stack.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, {passive: true});
    stack.addEventListener('touchend', e => {
        let diffX = touchStartX - e.changedTouches[0].screenX;
        let diffY = Math.abs(touchStartY - e.changedTouches[0].screenY);
        if (diffY > Math.abs(diffX) && diffY > 50) return;
        if (diffX > 50) goNext(); else if (diffX < -50) goPrev();
    }, {passive: true});

    jumpToNow();
}

// ==========================================
// 5. 港鐵戰術雷達 (全域自由選點 + 卡片內嵌)
// ==========================================
const mtrPanel = document.getElementById('mtr-panel');

// 路線站點字典 (用於計算方向與車程)
const mtrLines = {
    "ISL": ["KET", "HKU", "SYP", "SHW", "CEN", "ADM", "WAC", "CAB", "TIH", "FOH", "NOP", "QUB", "TAK", "SWH", "SKW", "HFC", "CHW"],
    "TWL": ["CEN", "ADM", "TST", "JOR", "YMT", "MOK", "PRE", "SSP", "CSW", "LCK", "MEF", "LAK", "KWF", "KWH", "TWH", "TSW"],
    "AEL": ["HOK", "KOW", "TSY", "AIR", "AWE"]
};

function toggleMTR() {
    if (mtrPanel) { mtrPanel.classList.toggle('show'); closeCurrencyPanel(); }
}
const originalToggleCurrency = toggleCurrency;
toggleCurrency = function() {
    if (mtrPanel && mtrPanel.classList.contains('show')) mtrPanel.classList.remove('show');
    originalToggleCurrency();
};
if(stack) stack.addEventListener('click', () => { if(mtrPanel) mtrPanel.classList.remove('show'); });

// --- 核心：智慧計算方向與車程 ---
function calculateMTRRoute(fromStr, toStr) {
    if (fromStr === toStr) return { error: "起終點相同" };
    const [fromLine, fromSta] = fromStr.split('-');
    const [toLine, toSta] = toStr.split('-');
    
    let dir = "UP", journeyTime = 0;
    
    if (fromLine === toLine) {
        // 同線直達
        const idxFrom = mtrLines[fromLine].indexOf(fromSta);
        const idxTo = mtrLines[fromLine].indexOf(toSta);
        dir = idxTo > idxFrom ? "UP" : "DOWN";
        journeyTime = Math.abs(idxTo - idxFrom) * 2; // 每站約抓 2 分鐘
    } else {
        // 跨線轉乘 (以金鐘 ADM 作為樞紐)
        const idxFrom = mtrLines[fromLine].indexOf(fromSta);
        const idxTransfer = mtrLines[fromLine].indexOf("ADM");
        const idxTo = mtrLines[toLine].indexOf(toSta);
        const idxTransferTo = mtrLines[toLine].indexOf("ADM");
        
        dir = idxTransfer > idxFrom ? "UP" : "DOWN";
        journeyTime = (Math.abs(idxTransfer - idxFrom) * 2) + 5 + (Math.abs(idxTo - idxTransferTo) * 2);
    }
    return { line: fromLine, sta: fromSta, dir: dir, journeyTime: journeyTime };
}

// --- API 抓取邏輯 ---
async function fetchMTRData(routeInfo, resultCallback, errorCallback) {
    try {
        const res = await fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${routeInfo.line}&sta=${routeInfo.sta}`);
        const data = await res.json();
        if (data.status === 1 && data.data[`${routeInfo.line}-${routeInfo.sta}`]) {
            const stationData = data.data[`${routeInfo.line}-${routeInfo.sta}`];
            if (stationData[routeInfo.dir] && stationData[routeInfo.dir].length > 0) {
                const nextTrain = stationData[routeInfo.dir][0];
                const boardTime = new Date(nextTrain.time.replace(' ', 'T'));
                const arriveTime = new Date(boardTime.getTime() + routeInfo.journeyTime * 60000);
                
                resultCallback(nextTrain.ttnt, boardTime, arriveTime, routeInfo.journeyTime);
            } else errorCallback("目前無班次資料");
        } else errorCallback("路線讀取失敗");
    } catch (e) { errorCallback("無法連線至港鐵"); }
}

const formatTime = (date) => String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');

// --- 全域雷達掃描 (左上角下拉選單) ---
function scanGlobalMTR() {
    const fromStr = document.getElementById('mtr-origin').value;
    const toStr = document.getElementById('mtr-dest').value;
    const statusText = document.getElementById('mtr-status');
    const resultBox = document.getElementById('mtr-result');
    
    const routeInfo = calculateMTRRoute(fromStr, toStr);
    if (routeInfo.error) { statusText.textContent = "⚠️ " + routeInfo.error; statusText.style.color = "#d93025"; return; }

    statusText.textContent = "📡 掃描中..."; statusText.style.color = "var(--tech-blue)"; resultBox.style.display = "none";

    fetchMTRData(routeInfo, (ttnt, boardTime, arriveTime, jTime) => {
        document.getElementById('mtr-ttnt').textContent = ttnt === "0" ? "即將進站" : `${ttnt} 分鐘`;
        document.getElementById('mtr-board-time').textContent = formatTime(boardTime);
        document.getElementById('mtr-journey-time').textContent = `${jTime} 分鐘 (含轉乘)`;
        document.getElementById('mtr-arrive-time').textContent = formatTime(arriveTime);
        resultBox.style.display = "flex";
        statusText.textContent = `✅ 規劃完成`; statusText.style.color = "#2e7d32";
    }, (errMsg) => {
        statusText.textContent = "⚠️ " + errMsg; statusText.style.color = "#d93025";
    });
}

// --- 卡片內嵌雷達掃描 ---
function scanCardMTR(btnElem) {
    const widget = btnElem.closest('.card-mtr-widget');
    const fromStr = widget.dataset.from;
    const toStr = widget.dataset.to;
    const resultBox = widget.querySelector('.w-result');
    const btnText = btnElem.textContent;

    btnElem.textContent = "掃描中...";
    const routeInfo = calculateMTRRoute(fromStr, toStr);

    fetchMTRData(routeInfo, (ttnt, boardTime, arriveTime, jTime) => {
        widget.querySelector('.j-time').textContent = `${jTime} 分鐘`;
        widget.querySelector('.n-train').textContent = ttnt === "0" ? "即將進站" : `${ttnt} 分鐘 (${formatTime(boardTime)})`;
        widget.querySelector('.a-time').textContent = formatTime(arriveTime);
        resultBox.style.display = "flex";
        btnElem.textContent = "更新數據";
    }, (errMsg) => {
        alert("⚠️ " + errMsg);
        btnElem.textContent = btnText;
    });
}