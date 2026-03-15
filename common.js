// ==========================================
// 1. 首頁自動跳轉邏輯
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
if (!urlParams.get('hub') && (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/'))) {
    const today = new Date();
    const m = today.getMonth() + 1;
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
// 2. 即時匯率換算邏輯
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
        if (mtrPanel && mtrPanel.classList.contains('show')) mtrPanel.classList.remove('show');
    }
}

function closeCurrencyPanel() {
    if(currencyPanel && currencyPanel.classList.contains('show')) currencyPanel.classList.remove('show');
}

function calcCurrency() {
    const hkd = document.getElementById('hkd-input')?.value;
    const out = document.getElementById('twd-output');
    if(out) out.textContent = hkd ? Math.round(hkd * currentRate) : 0;
}

// ==========================================
// 3. 系統時鐘與深淺色模式
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
// 4. 卡片導航滑動邏輯 (Day 1~5)
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
// 5. 港鐵戰術雷達引擎 (全路網 + 卡片點到點)
// ==========================================
const mtrPanel = document.getElementById('mtr-panel');

// 引擎 A 字典：全路網月台資料 (用於左上角)
const mtrData = {
    "ISL": { name: "港島線 (藍)", up: "柴灣", down: "堅尼地城", stations: {"KET":"堅尼地城", "HKU":"香港大學", "SYP":"西營盤", "SHW":"上環", "CEN":"中環", "ADM":"金鐘", "WAC":"灣仔", "CAB":"銅鑼灣", "TIH":"天后", "FOH":"炮台山", "NOP":"北角", "QUB":"鰂魚涌", "TAK":"太古", "SWH":"西灣河", "SKW":"筲箕灣", "HFC":"杏花邨", "CHW":"柴灣"} },
    "TWL": { name: "荃灣線 (紅)", up: "荃灣", down: "中環", stations: {"CEN":"中環", "ADM":"金鐘", "TST":"尖沙咀", "JOR":"佐敦", "YMT":"油麻地", "MOK":"旺角", "PRE":"太子", "SSP":"深水埗", "CSW":"長沙灣", "LCK":"荔枝角", "MEF":"美孚", "LAK":"荔景", "KWF":"葵芳", "KWH":"葵興", "TWH":"大窩口", "TSW":"荃灣"} },
    "KTL": { name: "觀塘線 (綠)", up: "調景嶺", down: "黃埔", stations: {"WHA":"黃埔", "HOM":"何文田", "YMT":"油麻地", "MOK":"旺角", "PRE":"太子", "SKM":"石硤尾", "KOT":"九龍塘", "LOF":"樂富", "WTS":"黃大仙", "DIH":"鑽石山", "CHH":"彩虹", "KOB":"九龍灣", "NTK":"牛頭角", "KWT":"觀塘", "LAT":"藍田", "YAT":"油塘", "TIK":"調景嶺"} },
    "TCL": { name: "東涌線 (橘)", up: "東涌", down: "香港", stations: {"HOK":"香港", "KOW":"九龍", "OLY":"奧運", "NAC":"南昌", "LAK":"荔景", "TSY":"青衣", "SUN":"欣澳", "TUC":"東涌"} },
    "AEL": { name: "機場快線 (藍綠)", up: "博覽館", down: "香港", stations: {"HOK":"香港", "KOW":"九龍", "TSY":"青衣", "AIR":"機場", "AWE":"博覽館"} },
    "TKL": { name: "將軍澳線 (紫)", up: "寶琳/康城", down: "北角", stations: {"NOP":"北角", "QUB":"鰂魚涌", "YAT":"油塘", "TIK":"調景嶺", "TKO":"將軍澳", "LHP":"坑口", "POA":"寶琳", "HAH":"康城"} },
    "EAL": { name: "東鐵線 (淺藍)", up: "羅湖/落馬洲", down: "金鐘", stations: {"ADM":"金鐘", "EXC":"會展", "HUH":"紅磡", "MKK":"旺角東", "KOT":"九龍塘", "TAW":"大圍", "SHT":"沙田", "FOT":"火炭", "RAC":"馬場", "UNI":"大學", "TAP":"大埔墟", "TWO":"太和", "FAN":"粉嶺", "SHS":"上水", "LOW":"羅湖", "LMC":"落馬洲"} },
    "TML": { name: "屯馬線 (棕)", up: "烏溪沙", down: "屯門", stations: {"TUM":"屯門", "SIH":"兆康", "TIS":"天水圍", "LOP":"朗屏", "YUL":"元朗", "KSR":"錦上路", "TWW":"荃灣西", "TWA":"荃灣", "CWW":"南昌", "HUH":"紅磡", "HOM":"何文田", "TKW":"土瓜灣", "SUW":"宋皇臺", "KAT":"啟德", "DIH":"鑽石山", "HIK":"顯徑", "TAW":"大圍", "CKT":"車公廟", "STW":"沙田圍", "CIO":"第一城", "SHM":"石門", "TSH":"大水坑", "HEO":"恆安", "MOS":"馬鞍山", "WKS":"烏溪沙"} },
    "SIL": { name: "南港島線 (黃綠)", up: "海怡半島", down: "金鐘", stations: {"ADM":"金鐘", "OCP":"海洋公園", "WCH":"黃竹坑", "LET":"利東", "SOH":"海怡半島"} }
};

// 引擎 B 字典：路線站點順序 (用於卡片點到點計算)
const mtrRouteArray = {
    "ISL": ["KET", "HKU", "SYP", "SHW", "CEN", "ADM", "WAC", "CAB", "TIH", "FOH", "NOP", "QUB", "TAK", "SWH", "SKW", "HFC", "CHW"],
    "TWL": ["CEN", "ADM", "TST", "JOR", "YMT", "MOK", "PRE", "SSP", "CSW", "LCK", "MEF", "LAK", "KWF", "KWH", "TWH", "TSW"],
    "AEL": ["HOK", "KOW", "TSY", "AIR", "AWE"]
};

function toggleMTR() {
    if (mtrPanel) {
        mtrPanel.classList.toggle('show');
        if(mtrPanel.classList.contains('show') && document.getElementById('mtr-line-select') && document.getElementById('mtr-line-select').options.length === 0) {
            initMTRSelects(); // 打開時動態生成選單
        }
        closeCurrencyPanel();
    }
}
if(stack) stack.addEventListener('click', () => { if(mtrPanel) mtrPanel.classList.remove('show'); });

function initMTRSelects() {
    const lineSelect = document.getElementById('mtr-line-select');
    if (!lineSelect) return;
    lineSelect.innerHTML = '';
    for (const [code, info] of Object.entries(mtrData)) {
        let opt = document.createElement('option');
        opt.value = code;
        opt.textContent = info.name;
        lineSelect.appendChild(opt);
    }
    updateMTRStations();
}

function updateMTRStations() {
    const lineCode = document.getElementById('mtr-line-select').value;
    const staSelect = document.getElementById('mtr-sta-select');
    if(!staSelect) return;
    staSelect.innerHTML = '';
    const stations = mtrData[lineCode].stations;
    for (const [staCode, staName] of Object.entries(stations)) {
        let opt = document.createElement('option');
        opt.value = staCode;
        opt.textContent = staName;
        staSelect.appendChild(opt);
    }
}

const formatTime = (date) => String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');

// 🟢 引擎 A：全路網月台掃描 (左上角專用)
async function scanStationMTR() {
    const lineCode = document.getElementById('mtr-line-select').value;
    const staCode = document.getElementById('mtr-sta-select').value;
    const statusText = document.getElementById('mtr-status');
    const resultBox = document.getElementById('mtr-result');
    const lineInfo = mtrData[lineCode];
    
    statusText.textContent = "📡 連線至港鐵主機..."; statusText.style.color = "var(--tech-blue)";
    resultBox.style.display = "none";
    document.getElementById('mtr-up-dest').textContent = lineInfo.up;
    document.getElementById('mtr-down-dest').textContent = lineInfo.down;
    document.getElementById('mtr-up-time').textContent = "--";
    document.getElementById('mtr-down-time').textContent = "--";

    try {
        const res = await fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${lineCode}&sta=${staCode}`);
        const data = await res.json();
        
        if (data.status === 1 && data.data[`${lineCode}-${staCode}`]) {
            const staData = data.data[`${lineCode}-${staCode}`];
            if (staData['UP'] && staData['UP'].length > 0) {
                let ttnt = staData['UP'][0].ttnt;
                document.getElementById('mtr-up-time').textContent = ttnt === "0" ? "即將進站" : `${ttnt} 分鐘`;
                document.getElementById('mtr-up-time').style.color = "#d93025";
            } else {
                document.getElementById('mtr-up-time').textContent = "無班次 / 終點站";
                document.getElementById('mtr-up-time').style.color = "var(--text-sub)";
            }
            if (staData['DOWN'] && staData['DOWN'].length > 0) {
                let ttnt = staData['DOWN'][0].ttnt;
                document.getElementById('mtr-down-time').textContent = ttnt === "0" ? "即將進站" : `${ttnt} 分鐘`;
                document.getElementById('mtr-down-time').style.color = "#d93025";
            } else {
                document.getElementById('mtr-down-time').textContent = "無班次 / 終點站";
                document.getElementById('mtr-down-time').style.color = "var(--text-sub)";
            }
            resultBox.style.display = "flex";
            statusText.textContent = `✅ 月台動態更新完成`; statusText.style.color = "#2e7d32";
        } else throw new Error("API 無數據");
    } catch (e) {
        statusText.textContent = "⚠️ 無法取得港鐵訊號 (已收班或網路異常)";
        statusText.style.color = "#d93025";
    }
}

// 🟢 引擎 B：卡片點到點雷達掃描 (卡片內嵌專用)
function calculateMTRRoute(fromStr, toStr) {
    if (fromStr === toStr) return { error: "起終點相同" };
    const [fromLine, fromSta] = fromStr.split('-');
    const [toLine, toSta] = toStr.split('-');
    let dir = "UP", journeyTime = 0;
    
    if (fromLine === toLine) {
        const idxFrom = mtrRouteArray[fromLine].indexOf(fromSta);
        const idxTo = mtrRouteArray[fromLine].indexOf(toSta);
        dir = idxTo > idxFrom ? "UP" : "DOWN";
        journeyTime = Math.abs(idxTo - idxFrom) * 2;
    } else {
        const idxFrom = mtrRouteArray[fromLine].indexOf(fromSta);
        const idxTransfer = mtrRouteArray[fromLine].indexOf("ADM");
        const idxTo = mtrRouteArray[toLine].indexOf(toSta);
        const idxTransferTo = mtrRouteArray[toLine].indexOf("ADM");
        dir = idxTransfer > idxFrom ? "UP" : "DOWN";
        journeyTime = (Math.abs(idxTransfer - idxFrom) * 2) + 5 + (Math.abs(idxTo - idxTransferTo) * 2);
    }
    return { line: fromLine, sta: fromSta, dir: dir, journeyTime: journeyTime };
}

function scanCardMTR(btnElem) {
    const widget = btnElem.closest('.card-mtr-widget');
    const fromStr = widget.dataset.from;
    const toStr = widget.dataset.to;
    const resultBox = widget.querySelector('.w-result');
    const btnText = btnElem.textContent;

    btnElem.textContent = "掃描中...";
    const routeInfo = calculateMTRRoute(fromStr, toStr);

    fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${routeInfo.line}&sta=${routeInfo.sta}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 1 && data.data[`${routeInfo.line}-${routeInfo.sta}`]) {
                const stationData = data.data[`${routeInfo.line}-${routeInfo.sta}`];
                if (stationData[routeInfo.dir] && stationData[routeInfo.dir].length > 0) {
                    const nextTrain = stationData[routeInfo.dir][0];
                    const ttnt = nextTrain.ttnt;
                    const boardTime = new Date(nextTrain.time.replace(' ', 'T'));
                    const arriveTime = new Date(boardTime.getTime() + routeInfo.journeyTime * 60000);
                    
                    widget.querySelector('.j-time').textContent = `${routeInfo.journeyTime} 分鐘`;
                    widget.querySelector('.n-train').textContent = ttnt === "0" ? "即將進站" : `${ttnt} 分鐘 (${formatTime(boardTime)})`;
                    widget.querySelector('.a-time').textContent = formatTime(arriveTime);
                    resultBox.style.display = "flex";
                    btnElem.textContent = "更新數據";
                } else { throw new Error("目前無班次資料"); }
            } else { throw new Error("路線讀取失敗"); }
        })
        .catch(err => {
            alert("⚠️ " + (err.message || "無法連線至港鐵"));
            btnElem.textContent = btnText;
        });
}