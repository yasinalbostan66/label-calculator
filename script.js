document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Init Feather ---
    if (typeof feather !== 'undefined') feather.replace();

    // --- 2. Embedded Data ---
    // --- 2. Dynamic Data ---
    let basePrices = {}; // Will be fetched from prices.json

    async function fetchMaterialPrices() {
        try {
            const response = await fetch('prices.json');
            if (!response.ok) throw new Error("JSON okunamadı");
            basePrices = await response.json();
            populateMaterialSelect();
        } catch (error) {
            console.error("Fiyatlar yüklenirken hata:", error);
            // Fallback if fetch fails (e.g. file:// protocol without local server)
            basePrices = {
                "Kuşe": 1.10, "Termal": 1.25, "Lamine Termal": 1.65, "PP Opak": 2.00,
                "PP Şeffaf": 2.20, "PE Opak": 2.10, "PE Şeffaf": 2.30,
                "Silver Mat": 3.80, "Whitetop": 1.15, "Metalize": 2.80,
                "Kuşe (Pet)": 1.60, "Fast Tyre": 1.50, "Saten": 4.50,
                "Japon Akmaz": 5.00
            };
            populateMaterialSelect();
            // alert("Fiyat listesi güncellenemedi, varsayılan değerler kullanılıyor.");
        }
    }

    const boxBasePrices = {
        "E Dalga Oluklu Mukavva": 0.35,
        "B Dalga Oluklu Mukavva": 0.40,
        "C Dalga Oluklu Mukavva": 0.45,
        "EB Dalga (Mikro Dopel)": 0.55,
        "BC Dalga (Dopel)": 0.60,
        "Amerikan Bristol 230gr": 0.85,
        "Amerikan Bristol 250gr": 0.95,
        "Amerikan Bristol 300gr": 1.10,
        "Amerikan Bristol 350gr": 1.25,
        "Kroma Karton 250gr": 0.75,
        "Kroma Karton 300gr": 0.90,
        "Kroma Karton 350gr": 1.05,
        "Kraft 250gr": 0.80,
        "Kraft 300gr": 0.95,
        "Kuşe 300gr": 1.15,
        "Kuşe 350gr": 1.30
    };

    // Live Rates Cache
    const liveRates = { USD: null, EUR: null };

    // --- 3. DOM Elements (LABEL CALC) ---
    const select = document.getElementById('material');
    const customPriceInput = document.getElementById('custom-price');
    const currencySelect = document.getElementById('currency');
    const exchangeRateInput = document.getElementById('exchange-rate');
    const form = document.getElementById('etiket-form');
    const resetBtn = document.getElementById('reset-btn');
    const calcBtn = document.getElementById('calc-btn');
    const liveRatesDisplay = document.getElementById('live-rates-display');

    const resultPanel = document.getElementById('result');
    const areaEl = document.getElementById('area');
    const linearEl = document.getElementById('linear-meters');
    const strokesEl = document.getElementById('strokes');
    const priceEl = document.getElementById('price');
    const currencySymbolEl = document.getElementById('currency-symbol');
    const tlRow = document.getElementById('tl-equivalent-row');
    const priceTlEl = document.getElementById('price-tl');
    const printTlRow = document.getElementById('print-tl-row');
    const printTlTotal = document.getElementById('print-tl-total');

    // Ink Elements
    const inkConsumptionInput = document.getElementById('ink-consumption');
    const inkPriceInput = document.getElementById('ink-price');
    const inkCurrencySelect = document.getElementById('ink-currency'); // New Dropdown
    const totalInkMlEl = document.getElementById('total-ink-ml');
    const inkResultRow = document.getElementById('ink-result-row');

    const printRateRow = document.getElementById('print-rate-row');
    const printRateVal = document.getElementById('print-rate-val');

    const unitLabelCostEl = document.getElementById('unit-cost-per-label');
    const unitCurrencySymbolEl = document.getElementById('unit-currency-symbol');
    const unitCostTlEl = document.getElementById('unit-cost-tl');
    const printUnitLabelCostEl = document.getElementById('print-unit-label-cost');

    // --- DOM Elements (BOX CALC) ---
    const boxWidth = document.getElementById('box-width');
    const boxDepth = document.getElementById('box-depth');
    const boxHeight = document.getElementById('box-height');
    const boxOpenW = document.getElementById('box-open-width');
    const boxOpenH = document.getElementById('box-open-height');
    const openSizeDisp = document.getElementById('open-size-display');
    const boxDrawingContainer = document.getElementById('box-drawing-container');

    const boxMaterialSelect = document.getElementById('box-material');
    const boxPriceInput = document.getElementById('box-unit-price');
    const boxCurrencySelect = document.getElementById('box-currency');
    const boxExchangeInput = document.getElementById('box-exchange-rate');
    const boxCalcBtn = document.getElementById('box-calc-btn');
    const boxResetBtn = document.getElementById('box-reset-btn');
    const boxResultPanel = document.getElementById('box-result');

    const boxPrintCostInput = document.getElementById('box-print-cost');
    const printCostCurrencySym = document.getElementById('print-cost-currency-symbol');


    // --- 4. Populate Material Selects ---
    function populateMaterialSelect() {
        if (select) {
            select.innerHTML = '<option value="" disabled selected>-- Malzeme Seçiniz --</option>';
            Object.keys(basePrices).forEach((key) => {
                const opt = document.createElement('option');
                opt.value = key; opt.textContent = key;
                select.appendChild(opt);
            });
        }
    }
    // Initial call will be made by fetchMaterialPrices()

    if (boxMaterialSelect) {
        boxMaterialSelect.innerHTML = '<option value="" disabled selected>-- Malzeme Seçiniz --</option>';
        Object.keys(boxBasePrices).forEach((key) => {
            const opt = document.createElement('option');
            opt.value = key; opt.textContent = key;
            boxMaterialSelect.appendChild(opt);
        });
    }

    // --- 5. THEME LOGIC ---
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');
    
    // Check system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    function getStoredTheme() {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        return systemPrefersDark.matches ? 'dark' : 'light';
    }

    function applyTheme(mode) {
        if (mode === 'dark') {
            document.body.classList.add('dark');
            document.body.classList.remove('light');
            if (btnDark) btnDark.classList.add('active');
            if (btnLight) btnLight.classList.remove('active');
            updateMetaTheme('#0f172a'); // --bg-body for dark
        } else {
            document.body.classList.add('light');
            document.body.classList.remove('dark');
            if (btnLight) btnLight.classList.add('active');
            if (btnDark) btnDark.classList.remove('active');
            updateMetaTheme('#f3f4f6'); // --bg-body for light
        }
    }

    function updateMetaTheme(color) {
        let meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', color);
    }

    applyTheme(getStoredTheme());

    if (btnLight) btnLight.addEventListener('click', () => { 
        applyTheme('light'); 
        localStorage.setItem('theme', 'light'); 
    });
    if (btnDark) btnDark.addEventListener('click', () => { 
        applyTheme('dark'); 
        localStorage.setItem('theme', 'dark'); 
    });

    // Listen for system changes
    systemPrefersDark.addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // --- 5.5 WINDING DIRECTION ---
    window.selectWinding = function (num) {
        const container = document.getElementById('winding-container');
        if (!container) return;
        const options = container.querySelectorAll('.winding-option');
        options.forEach((opt, index) => {
            if (index + 1 === num) {
                opt.classList.add('active');
                const radio = opt.querySelector('input');
                if (radio) radio.checked = true;
            } else {
                opt.classList.remove('active');
            }
        });
    };

    // --- 6. LIVE RATES ---
    async function fetchRates() {
        if (liveRatesDisplay) liveRatesDisplay.innerHTML = '<div class="rate-item"><span style="opacity:0.6; font-size:0.9em;">Kur Yükleniyor...</span></div>';
        try {
            const res = await fetch('https://api.frankfurter.app/latest?to=TRY,USD,EUR');
            const data = await res.json();

            if (data && data.rates) {
                const eurTry = data.rates.TRY;
                const eurUsd = data.rates.USD;
                const usdTry = eurTry / eurUsd;

                liveRates.EUR = eurTry;
                liveRates.USD = usdTry;

                if (liveRatesDisplay) {
                    let html = '<span style="font-weight:700; color:var(--text-main); margin-right:5px; font-size:0.8rem; opacity:0.8;">TCMB</span>';
                    if (liveRates.USD) html += `<div class="rate-item"><span style="font-weight:800; font-size:1.1em; color:var(--primary);">$</span> <span>${liveRates.USD.toFixed(4)} ₺</span></div>`;
                    if (liveRates.EUR) html += `<div class="rate-item" style="margin-left:0.5rem;"><span style="font-weight:800; font-size:1.1em; color:var(--primary);">€</span> <span>${liveRates.EUR.toFixed(4)} ₺</span></div>`;
                    liveRatesDisplay.innerHTML = html;
                }
                updateExchangeRatesEverywhere();
            } else {
                throw new Error("Veri hatası");
            }
        } catch (error) {
            console.error("Kur Hatası:", error);
            if (liveRatesDisplay) liveRatesDisplay.innerHTML = '<span style="color:var(--text-muted); font-size:0.8em; cursor:pointer;" onclick="location.reload()">Tekrar Dene</span>';
        }
    }
    fetchRates();
    fetchMaterialPrices(); // Load material prices

    function updateExchangeRatesEverywhere() {
        // Label Calc
        updateExchangeRateState(currencySelect, exchangeRateInput);
        // Box Calc
        updateExchangeRateState(boxCurrencySelect, boxExchangeInput);
    }

    function updateExchangeRateState(selEl, inpEl) {
        if (!selEl || !inpEl) return;
        const cur = selEl.value;
        if (cur === 'TL') {
            inpEl.value = "1.00";
            inpEl.disabled = true;
            inpEl.style.opacity = "0.5";
        } else {
            inpEl.disabled = false;
            inpEl.style.opacity = "1";
            if (liveRates[cur]) inpEl.value = liveRates[cur].toFixed(4);
        }
    }

    // --- 7. LABEL CALCULATOR LOGIC ---
    if (currencySelect) {
        currencySelect.addEventListener('change', () => {
            updateExchangeRateState(currencySelect, exchangeRateInput);
            if (inkCurrencySymbolEl) inkCurrencySymbolEl.innerText = currencySelect.value;
        });
        // Init state
        if (currencySelect.value === 'TL') {
            exchangeRateInput.value = "1.00";
            exchangeRateInput.disabled = true;
            exchangeRateInput.style.opacity = "0.5";
        }
    }

    function calculateResults() {
        let len, wid;
        const radi = document.querySelector('input[name="shape"][value="circle"]');
        const isCircle = radi ? radi.checked : false;

        if (isCircle) {
            const dia = parseFloat(document.getElementById('diameter').value);
            if (!dia) { alert("Lütfen çap değerini giriniz."); return; }
            len = dia;
            wid = dia;
        } else {
            len = parseFloat(document.getElementById('length').value);
            wid = parseFloat(document.getElementById('width').value);
            if (!len || !wid) { alert("Lütfen en ve boy değerlerini giriniz."); return; }
        }

        const gap = parseFloat(document.getElementById('gap').value) || 0;
        const across = parseInt(document.getElementById('across').value) || 1;
        const vertical = parseInt(document.getElementById('vertical').value) || 1;
        const qty = parseInt(document.getElementById('quantity').value);

        let unitPriceStr = customPriceInput.value ? customPriceInput.value.replace(',', '.') : '0';
        let unitPrice = parseFloat(unitPriceStr);

        let rateStr = exchangeRateInput.value ? exchangeRateInput.value.replace(',', '.') : '1';
        let rate = parseFloat(rateStr) || 1;

        if (!qty || isNaN(unitPrice)) {
            alert("Lütfen adet ve fiyat bilgilerini eksiksiz giriniz.");
            return;
        }

        const cur = currencySelect.value;
        const effectiveLen = len + gap;

        const itemsPerFrame = across * vertical;
        const totalStrokes = Math.ceil(qty / itemsPerFrame);
        const frameLengthMm = effectiveLen * vertical;
        const totalLinearMm = totalStrokes * frameLengthMm;
        const linearM = totalLinearMm / 1000;
        const totalWebWidthMm = wid * across;
        const totalAreaMm2 = totalLinearMm * totalWebWidthMm;
        const areaM2 = totalAreaMm2 / 1000000;
        const jobName = document.getElementById('job-name') ? document.getElementById('job-name').value : "";

        // Ink Calculation
        let inkCost = 0;
        let totalInkMl = 0;
        if (inkConsumptionInput && inkPriceInput) {
            const inkConsPerM2 = parseFloat(inkConsumptionInput.value) || 0;
            const inkPricePerLiter = parseFloat(inkPriceInput.value) || 0;
            const inkCurr = inkCurrencySelect ? inkCurrencySelect.value : 'EUR';

            if (inkConsPerM2 > 0) {
                totalInkMl = areaM2 * inkConsPerM2;
                const totalInkLiter = totalInkMl / 1000;
                let rawInkCost = totalInkLiter * inkPricePerLiter;

                // Convert Ink Cost to Main Currency
                // 1. Convert to TL
                let costInTL = 0;
                if (inkCurr === 'TL') costInTL = rawInkCost;
                else if (liveRates[inkCurr]) costInTL = rawInkCost * liveRates[inkCurr];
                else costInTL = rawInkCost * 34; // Fallback

                // 2. Convert TL to Main Currency
                if (cur === 'TL') inkCost = costInTL;
                else {
                    let mainRate = rate; // This is Main -> TL rate
                    if (!mainRate) mainRate = 1;
                    inkCost = costInTL / mainRate;
                }
            }
        }

        const totalPrice = (areaM2 * unitPrice) + inkCost;
        const unitCost = totalPrice / qty;

        // UI Updates
        if (totalInkMl > 0) {
            totalInkMlEl.innerText = totalInkMl.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
            inkResultRow.classList.remove('hidden');
        } else {
            inkResultRow.classList.add('hidden');
        }

        areaEl.textContent = areaM2.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
        if (linearEl) linearEl.textContent = linearM.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
        if (strokesEl) strokesEl.textContent = totalStrokes.toLocaleString('tr-TR');
        priceEl.textContent = totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (currencySymbolEl) currencySymbolEl.textContent = cur;

        if (unitLabelCostEl) {
            unitLabelCostEl.textContent = unitCost.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
            if (unitCurrencySymbolEl) unitCurrencySymbolEl.textContent = cur;
        }

        if (cur !== 'TL') {
            const totalPriceTL = totalPrice * rate;
            const unitCostTL = totalPriceTL / qty;
            priceTlEl.textContent = totalPriceTL.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            if (unitCostTlEl) unitCostTlEl.textContent = unitCostTL.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 6 });

            tlRow.classList.remove('hidden');

            printTlTotal.textContent = totalPriceTL.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
            printTlRow.classList.remove('hidden');

            if (printRateRow) {
                printRateRow.classList.remove('hidden');
                if (printRateVal) printRateVal.textContent = rate.toFixed(4) + " ₺";
            }
        } else {
            tlRow.classList.add('hidden');
            printTlRow.classList.add('hidden');
            if (printRateRow) printRateRow.classList.add('hidden');
        }

        if (printUnitLabelCostEl) {
            let text = unitCost.toLocaleString('tr-TR', { minimumFractionDigits: 4 }) + " " + cur;
            if (cur !== 'TL') {
                const unitTL = (totalPrice * rate) / qty;
                text += " (" + unitTL.toLocaleString('tr-TR', { minimumFractionDigits: 4 }) + " ₺)";
            }
            printUnitLabelCostEl.textContent = text;
        }

        resultPanel.classList.remove('hidden');
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // --- 8. BOX CALCULATOR LOGIC ---
    function updateBoxOpenSize() {
        if (!boxWidth || !boxDepth || !boxHeight) return;
        const w = parseFloat(boxWidth.value) || 0;
        const d = parseFloat(boxDepth.value) || 0;
        const h = parseFloat(boxHeight.value) || 0;

        if (w && d && h) {
            const openW = 2 * (w + d) + 2.0;
            const openH = h + d + 3.0;

            boxOpenW.value = openW.toFixed(1);
            boxOpenH.value = openH.toFixed(1);
            openSizeDisp.innerText = `${openW.toFixed(1)} x ${openH.toFixed(1)} cm`;

            drawBox(w, d, h);
        } else {
            boxDrawingContainer.classList.add('hidden');
            boxDrawingContainer.innerHTML = '';
        }
    }

    function drawBox(w, d, h) {
        if (!boxDrawingContainer) return;
        boxDrawingContainer.classList.remove('hidden');

        const totalW = 2 * (w + d) + 2;
        const totalH = h + d + 3;

        const svgW = 300;
        const scale = svgW / totalW;
        const svgH = totalH * scale;

        const strokeColor = "#333";
        const strokeWidth = 1;
        const fillColor = "#e2e8f0";

        const pW = w * scale;
        const pD = d * scale;
        const pH = h * scale;
        const pGlue = 2 * scale;
        const pFlapH = (d * 0.5) * scale;
        const pMainFlapH = pD;

        let cx = 5;
        let cy = 5 + pMainFlapH;

        let svg = `<svg class="box-svg" width="${svgW + 10}" height="${svgH + 10}" viewBox="0 0 ${svgW + 10} ${svgH + 10}" xmlns="http://www.w3.org/2000/svg">`;

        svg += `<rect x="${cx}" y="${cy}" width="${pGlue}" height="${pH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        cx += pGlue;

        svg += `<rect x="${cx}" y="${cy}" width="${pD}" height="${pH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        svg += `<rect x="${cx}" y="${cy - pFlapH}" width="${pD}" height="${pFlapH}" fill="#cbd5e1" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        svg += `<rect x="${cx}" y="${cy + pH}" width="${pD}" height="${pFlapH}" fill="#cbd5e1" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        cx += pD;

        svg += `<rect x="${cx}" y="${cy}" width="${pW}" height="${pH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        svg += `<rect x="${cx}" y="${cy - pMainFlapH}" width="${pW}" height="${pMainFlapH}" fill="#94a3b8" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        svg += `<rect x="${cx}" y="${cy + pH}" width="${pW}" height="${pMainFlapH}" fill="#94a3b8" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;

        svg += `<text x="${cx + pW / 2}" y="${cy + pH / 2}" font-size="10" text-anchor="middle" fill="#333">${w}x${h}</text>`;

        cx += pW;

        svg += `<rect x="${cx}" y="${cy}" width="${pD}" height="${pH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        svg += `<rect x="${cx}" y="${cy - pFlapH}" width="${pD}" height="${pFlapH}" fill="#cbd5e1" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        svg += `<rect x="${cx}" y="${cy + pH}" width="${pD}" height="${pFlapH}" fill="#cbd5e1" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        cx += pD;

        svg += `<rect x="${cx}" y="${cy}" width="${pW}" height="${pH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        svg += `<rect x="${cx}" y="${cy - pMainFlapH}" width="${pW}" height="${pMainFlapH}" fill="#94a3b8" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        svg += `<rect x="${cx}" y="${cy + pH}" width="${pW}" height="${pMainFlapH}" fill="#94a3b8" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;

        svg += `</svg>`;

        boxDrawingContainer.innerHTML = svg;
    }

    if (boxWidth) boxWidth.addEventListener('input', updateBoxOpenSize);
    if (boxDepth) boxDepth.addEventListener('input', updateBoxOpenSize);
    if (boxHeight) boxHeight.addEventListener('input', updateBoxOpenSize);

    if (boxMaterialSelect) {
        boxMaterialSelect.addEventListener('change', () => {
            const val = boxMaterialSelect.value;
            // Ensure boxPriceInput exists to avoid error if null
            if (boxBasePrices[val] && boxPriceInput) {
                boxPriceInput.value = boxBasePrices[val].toFixed(2);
            }
        });
    }

    if (boxCurrencySelect) {
        boxCurrencySelect.addEventListener('change', () => {
            updateExchangeRateState(boxCurrencySelect, boxExchangeInput);
            if (printCostCurrencySym) printCostCurrencySym.textContent = boxCurrencySelect.value;
        });
        if (printCostCurrencySym) printCostCurrencySym.textContent = boxCurrencySelect.value;
    }

    function calculateBoxResults() {
        const qty = parseInt(document.getElementById('box-quantity').value);
        const openW_cm = parseFloat(boxOpenW.value);
        const openH_cm = parseFloat(boxOpenH.value);

        let unitPriceStr = boxPriceInput.value ? boxPriceInput.value.replace(',', '.') : '0';
        let unitPrice = parseFloat(unitPriceStr);

        let rateStr = boxExchangeInput.value ? boxExchangeInput.value.replace(',', '.') : '1';
        let rate = parseFloat(rateStr) || 1;

        if (!qty || !openW_cm || !openH_cm || isNaN(unitPrice)) {
            alert("Lütfen tüm alanları doldurunuz.");
            return;
        }

        const cur = boxCurrencySelect.value;

        const singleAreaM2 = (openW_cm * openH_cm) / 10000;
        const totalAreaM2 = singleAreaM2 * qty;
        const totalMaterialCost = totalAreaM2 * unitPrice;

        let printCost = 0;
        const isPrinted = document.querySelector('input[name="print-opt"]:checked').value === 'yes';
        if (isPrinted && boxPrintCostInput) {
            printCost = parseFloat(boxPrintCostInput.value.replace(',', '.')) || 0;
        }

        const totalCost = totalMaterialCost + printCost;
        const unitCost = totalCost / qty;

        document.getElementById('box-unit-cost').textContent = unitCost.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
        document.getElementById('box-total-area').textContent = totalAreaM2.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
        document.getElementById('box-total-price').textContent = totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        document.getElementById('box-res-currency-symbol').textContent = cur;
        document.getElementById('box-res-currency-symbol-2').textContent = cur;

        const printRow = document.getElementById('print-result-row');
        const printVal = document.getElementById('box-print-result');
        const printSym = document.querySelector('.box-curr-sym');

        if (isPrinted) {
            printRow.classList.remove('hidden');
            printVal.textContent = printCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
            if (printSym) printSym.textContent = cur;
        } else {
            printRow.classList.add('hidden');
        }

        const boxTlRow = document.getElementById('box-tl-row');

        if (cur !== 'TL') {
            const totalTL = totalCost * rate;
            const unitTL = totalTL / qty;

            document.getElementById('box-price-tl').textContent = totalTL.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('box-unit-cost-tl').textContent = unitTL.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
            boxTlRow.classList.remove('hidden');
        } else {
            boxTlRow.classList.add('hidden');
        }

        boxResultPanel.classList.remove('hidden');
        boxResultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (boxCalcBtn) boxCalcBtn.addEventListener('click', calculateBoxResults);


    // --- 9. LABEL LISTENERS ---
    if (form) {
        if (select) {
            select.addEventListener('change', () => {
                const val = select.value;
                if (basePrices[val]) {
                    customPriceInput.value = basePrices[val].toFixed(2);
                }
            });
        }

        if (calcBtn) {
            calcBtn.addEventListener('click', () => { calculateResults(); });
        }
        form.addEventListener('submit', (e) => { e.preventDefault(); calculateResults(); });
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                form.reset();
                const jobName = document.getElementById('job-name');
                if (jobName) jobName.value = "";
                resultPanel.classList.add('hidden');
                setTimeout(() => updateExchangeRateState(currencySelect, exchangeRateInput), 0);
            });
        }
    }

    // reset box
    if (boxResetBtn) {
        boxResetBtn.addEventListener('click', () => {
            document.getElementById('box-form').reset();
            if (document.getElementById('btn-print-none')) document.getElementById('btn-print-none').click();
            boxResultPanel.classList.add('hidden');
            const drawingContainer = document.getElementById('box-drawing-container');
            if (drawingContainer) {
                drawingContainer.classList.add('hidden');
                drawingContainer.innerHTML = '';
            }
            if (document.getElementById('open-size-display')) document.getElementById('open-size-display').innerText = '-';
            setTimeout(() => updateExchangeRateState(boxCurrencySelect, boxExchangeInput), 0);
        });
    }

    // --- 10. Print & Download ---
    // LABEL PDF
    const printBtn = document.getElementById('download-pdf');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            document.getElementById('print-table-label').classList.remove('hidden');
            document.getElementById('print-table-box').classList.add('hidden');

            const across = document.getElementById('across').value;
            const vertical = document.getElementById('vertical').value;
            const radi = document.querySelector('input[name="shape"][value="circle"]');
            const isCircle = radi ? radi.checked : false;

            const jobNameInput = document.getElementById('job-name');
            const jobStr = jobNameInput && jobNameInput.value ? jobNameInput.value : "Fiyat Teklif Raporu";
            if (document.getElementById('print-area-title')) document.getElementById('print-area-title').innerText = jobStr;
            if (document.getElementById('print-job-name')) document.getElementById('print-job-name').innerText = jobStr;

            document.getElementById('print-date').innerText = new Date().toLocaleDateString('tr-TR');
            document.getElementById('print-material').innerText = select.value;

            const printType = document.getElementById('print-type').value;
            if (document.getElementById('print-type-display')) {
                document.getElementById('print-type-display').innerText = printType;
            }

            if (isCircle) {
                document.getElementById('print-dimensions').innerText = `Çap: ${document.getElementById('diameter').value} mm`;
            } else {
                document.getElementById('print-dimensions').innerText = `${document.getElementById('length').value}x${document.getElementById('width').value} mm`;
            }

            document.getElementById('print-layout').innerText = `Boşluk: ${document.getElementById('gap').value}mm | ${across} Yan x ${vertical} Alt`;

            // Filling winding direction in print
            const windingMap = {
                "1": "1. Kafa Dış", "2": "2. Ayak Dış", "3": "3. Sağ Dış", "4": "4. Sol Dış",
                "5": "5. Kafa İç", "6": "6. Ayak İç", "7": "7. Sağ İç", "8": "8. Sol İç"
            };
            const selectedWinding = document.querySelector('input[name="winding"]:checked')?.value;
            const windingOption = document.querySelector('input[name="winding"]:checked')?.closest('.winding-option');
            const windingText = selectedWinding ? windingMap[selectedWinding] : "Belirtilmedi";

            if (document.getElementById('print-winding-text')) {
                document.getElementById('print-winding-text').innerText = windingText;
            }
            if (document.getElementById('print-winding-visual')) {
                const visualContainer = document.getElementById('print-winding-visual');
                visualContainer.innerHTML = "";
                if (windingOption) {
                    const svg = windingOption.querySelector('svg').cloneNode(true);
                    visualContainer.appendChild(svg);
                }
            }

            const coreSize = document.getElementById('core-size').value;
            if (document.getElementById('print-core')) {
                document.getElementById('print-core').innerText = coreSize + " mm";
            }

            document.getElementById('print-quantity-strokes').innerText = `${document.getElementById('quantity').value} Adet / ${strokesEl.innerText} Vuruş`;
            document.getElementById('print-unit-price').innerText = customPriceInput.value + " " + currencySelect.value + "/m²";
            document.getElementById('print-stats').innerText = `${areaEl.innerText} m² / ${linearEl.innerText} mt`;

            // Add Ink to Print
            let inkInfo = "";
            const inkMl = document.getElementById('total-ink-ml').innerText;
            if (inkMl && inkMl !== '0') {
                inkInfo = ` | Mürekkep: ${inkMl} ml`;
            }
            document.getElementById('print-stats').innerText += inkInfo;

            document.getElementById('print-total').innerText = priceEl.innerText + " " + currencySelect.value;

            if (currencySelect.value !== 'TL') {
                printTlTotal.parentElement.classList.remove('hidden');
                printRateRow.classList.remove('hidden');
            } else {
                printTlTotal.parentElement.classList.add('hidden');
                printRateRow.classList.add('hidden');
            }

            window.print();
        });
    }

    // BOX PDF
    const boxPrintBtn = document.getElementById('box-download-pdf');
    if (boxPrintBtn) {
        boxPrintBtn.addEventListener('click', () => {
            document.getElementById('print-table-label').classList.add('hidden');
            document.getElementById('print-table-box').classList.remove('hidden');

            const jobNameInput = document.getElementById('job-name');
            const jobStr = jobNameInput && jobNameInput.value ? jobNameInput.value : "Fiyat Teklif Raporu";
            if (document.getElementById('print-area-title')) document.getElementById('print-area-title').innerText = jobStr;
            if (document.getElementById('print-box-job-name')) document.getElementById('print-box-job-name').innerText = jobStr;

            document.getElementById('print-date').innerText = new Date().toLocaleDateString('tr-TR');

            // Populate Box Data
            const w = boxWidth.value; const d = boxDepth.value; const h = boxHeight.value;
            document.getElementById('print-box-dims').innerText = `${w} x ${d} x ${h} cm`;
            document.getElementById('print-box-open').innerText = `${boxOpenW.value} x ${boxOpenH.value} cm`;
            document.getElementById('print-box-material').innerText = boxMaterialSelect.value;
            document.getElementById('print-box-qty').innerText = document.getElementById('box-quantity').value + " Adet";

            const isPrinted = document.querySelector('input[name="print-opt"]:checked').value === 'yes';
            document.getElementById('print-box-print-status').innerText = isPrinted ? "Baskılı" : "Baskısız";

            document.getElementById('print-box-unit-price').innerText = boxPriceInput.value + " " + boxCurrencySelect.value + "/m²";

            const unitCost = document.getElementById('box-unit-cost').innerText;
            const cur = boxCurrencySelect.value;
            document.getElementById('print-box-unit-cost').innerText = unitCost + " " + cur;

            if (isPrinted) {
                document.getElementById('print-box-print-cost').innerText = document.getElementById('box-print-result').innerText + " " + cur;
                document.getElementById('print-box-print-cost-row').classList.remove('hidden');
            } else {
                document.getElementById('print-box-print-cost-row').classList.add('hidden');
            }

            document.getElementById('print-box-total').innerText = document.getElementById('box-total-price').innerText + " " + cur;

            if (cur !== 'TL') {
                document.getElementById('print-box-rate').innerText = boxExchangeInput.value + " ₺";
                document.getElementById('print-box-rate-row').classList.remove('hidden');

                document.getElementById('print-box-tl-total').innerText = document.getElementById('box-price-tl').innerText + " ₺";
                document.getElementById('print-box-tl-row').classList.remove('hidden');
            } else {
                document.getElementById('print-box-rate-row').classList.add('hidden');
                document.getElementById('print-box-tl-row').classList.add('hidden');
            }

            window.print();
        });
    }

    // LABEL EXCEL (Generated via ExcelJS for robust .xlsx)
    const dlBtn = document.getElementById('download-csv');
    if (dlBtn) {
        dlBtn.addEventListener('click', async () => {
            const cur = currencySelect.value;
            const unitCostDisp = document.getElementById('unit-cost-per-label') ? document.getElementById('unit-cost-per-label').textContent : "0";
            const radi = document.querySelector('input[name="shape"][value="circle"]');
            const isCircle = radi ? radi.checked : false;

            let dimStr;
            if (isCircle) {
                dimStr = "Çap: " + document.getElementById('diameter').value + " mm";
            } else {
                dimStr = document.getElementById('length').value + "x" + document.getElementById('width').value + " mm";
            }

            const layoutStr = `Boşluk: ${document.getElementById('gap').value}mm | ${document.getElementById('across').value} Yan x ${document.getElementById('vertical').value} Alt`;
            const qtyStr = `${document.getElementById('quantity').value} Adet / ${strokesEl.innerText} Vuruş`;

            // Create Workbook
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Matbaa Portalı';
            workbook.created = new Date();

            const jobNameInput = document.getElementById('job-name');
            const jobStr = jobNameInput && jobNameInput.value ? jobNameInput.value : "Etiket Teklifi";
            const sheet = workbook.addWorksheet(jobStr.substring(0, 31));

            // Define Columns
            sheet.columns = [
                { header: 'AÇIKLAMA', key: 'desc', width: 30 },
                { header: 'DEĞER', key: 'val', width: 40 }
            ];

            // Style Header
            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 30;

            const addRow = (desc, val, isTotal = false) => {
                const row = sheet.addRow({ desc: desc, val: val });
                row.alignment = { vertical: 'middle', horizontal: 'center' };
                row.height = 20;

                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
                    };
                });

                if (isTotal) {
                    row.font = { bold: true, size: 12 };
                    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
                }
            };

            addRow("İş Adı / Firma", jobStr);
            addRow("Baskı Türü", document.getElementById('print-type').value);
            addRow("Tarih", new Date().toLocaleDateString('tr-TR'));
            addRow("Malzeme", select.value);
            addRow("Etiket Boyutu", dimStr);
            addRow("Yerleşim", layoutStr);

            // Get Winding for Excel
            const windingMap = {
                "1": "1. Kafa Dış", "2": "2. Ayak Dış", "3": "3. Sağ Dış", "4": "4. Sol Dış",
                "5": "5. Kafa İç", "6": "6. Ayak İç", "7": "7. Sağ İç", "8": "8. Sol İç"
            };
            const selectedWinding = document.querySelector('input[name="winding"]:checked')?.value;
            const windingText = selectedWinding ? windingMap[selectedWinding] : "Belirtilmedi";
            addRow("Sarım Yönü", windingText);
            addRow("Kuka Çapı", document.getElementById('core-size').value + " mm");

            addRow("Sipariş Miktarı", qtyStr);
            addRow("Malzeme Birim Fiyat (m²)", customPriceInput.value + " " + cur);

            const inkMl = document.getElementById('total-ink-ml').innerText;
            if (inkMl && inkMl !== '0') {
                addRow("Mürekkep Tüketimi", inkMl + " ml");
            }

            addRow("1 Adet Birim Maliyet", unitCostDisp + " " + cur);
            addRow("Toplam Alan", areaEl.innerText + " m²");
            addRow("Toplam Metre", linearEl.innerText + " mt");
            addRow("TOPLAM TUTAR", priceEl.innerText + " " + cur, true);

            if (cur !== 'TL') {
                addRow("Güncel Kur", exchangeRateInput.value + " ₺");
                addRow("Toplam Tutar (TL)", priceTlEl.innerText + " ₺");
                const unitTLDisp = document.getElementById('unit-cost-tl') ? document.getElementById('unit-cost-tl').textContent : "0";
                addRow("1 Adet Maliyet (TL)", unitTLDisp + " ₺");
            }

            // Save File
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), 'etiket_teklif_detayli.xlsx');
        });
    }

    // BOX EXCEL (Generated via ExcelJS for robust .xlsx with Image)
    const boxDlBtn = document.getElementById('box-download-csv');
    if (boxDlBtn) {
        boxDlBtn.addEventListener('click', async () => {
            const cur = boxCurrencySelect.value;
            const isPrinted = document.querySelector('input[name="print-opt"]:checked').value === 'yes';

            // 1. Prepare Data
            const dimStr = `${boxWidth.value} x ${boxDepth.value} x ${boxHeight.value} cm`;
            const openDimStr = `${boxOpenW.value} x ${boxOpenH.value} cm`;
            const dateStr = new Date().toLocaleDateString('tr-TR');

            // 2. Create Workbook
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Matbaa Portalı';
            workbook.created = new Date();

            const sheet = workbook.addWorksheet('Kutu Teklifi');

            // 3. Define Columns
            sheet.columns = [
                { header: 'AÇIKLAMA', key: 'desc', width: 25 },
                { header: 'DEĞER', key: 'val', width: 35 }
            ];

            // Style Header
            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 30;

            // 4. Add Data Rows
            const addRow = (desc, val, isTotal = false) => {
                const row = sheet.addRow({ desc: desc, val: val });
                row.alignment = { vertical: 'middle', horizontal: 'center' };
                row.height = 20;
                // Borders
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
                    };
                });

                if (isTotal) {
                    row.font = { bold: true, size: 12 };
                    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } }; // Light blue
                }
            };

            addRow("Tarih", dateStr);
            addRow("Kutu Ölçüleri", dimStr);
            addRow("Açık Ebat", openDimStr);
            addRow("Malzeme", boxMaterialSelect.value);
            addRow("Sipariş Adeti", document.getElementById('box-quantity').value + " Adet");
            addRow("Baskı Durumu", isPrinted ? "Baskılı" : "Baskısız");
            addRow(`Birim Fiyat (m²)`, boxPriceInput.value + " " + cur);
            addRow(`1 Adet Birim Maliyet`, document.getElementById('box-unit-cost').innerText + " " + cur);
            addRow(`Toplam Malzeme Alanı`, document.getElementById('box-total-area').innerText + " m²");

            if (isPrinted) {
                addRow(`Baskı Maliyeti`, document.getElementById('box-print-result').innerText + " " + cur);
            }

            addRow("TOPLAM TUTAR", document.getElementById('box-total-price').innerText + " " + cur, true);

            if (cur !== 'TL') {
                addRow("Güncel Kur", boxExchangeInput.value + " ₺");
                addRow("Toplam Tutar (TL)", document.getElementById('box-price-tl').innerText + " ₺");
                addRow("1 Adet Maliyet (TL)", document.getElementById('box-unit-cost-tl').innerText + " ₺");
            }

            // 5. Generate and Embed Image
            const svgEl = document.querySelector('.box-svg');
            if (svgEl) {
                try {
                    const serializer = new XMLSerializer();
                    const svgStr = serializer.serializeToString(svgEl);
                    const rect = svgEl.getBoundingClientRect();
                    const canvas = document.createElement('canvas');
                    const scale = 2; // High res
                    canvas.width = rect.width * scale;
                    canvas.height = rect.height * scale;
                    const ctx = canvas.getContext('2d');
                    const img = new Image();

                    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(svgBlob);

                    // Wait for image to load to draw and save
                    await new Promise((resolve) => {
                        img.onload = () => {
                            ctx.fillStyle = "white";
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            URL.revokeObjectURL(url);

                            const imgData = canvas.toDataURL('image/png', 1.0);
                            const imageId = workbook.addImage({
                                base64: imgData,
                                extension: 'png',
                            });

                            // Add "Şema Çizimi" Header
                            const lastRowIdx = sheet.lastRow.number + 2;
                            const titleRow = sheet.getRow(lastRowIdx);
                            titleRow.values = ["ŞEMA ÇİZİMİ"];
                            titleRow.font = { bold: true };
                            titleRow.alignment = { horizontal: 'center' };
                            sheet.mergeCells(`A${lastRowIdx}:B${lastRowIdx}`);

                            // Place Image
                            sheet.addImage(imageId, {
                                tl: { col: 0.5, row: lastRowIdx + 0.5 }, // Offset slightly
                                ext: { width: 400, height: (canvas.height / canvas.width) * 400 }
                            });

                            resolve();
                        };
                        img.src = url;
                    });

                } catch (err) {
                    console.error("Image generation failed", err);
                }
            }

            // 6. Save File using FileSaver.js
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), 'kutu_teklif_detayli.xlsx');
        });
    }

    const y = document.getElementById('year'); if (y) y.innerText = new Date().getFullYear();

    // --- 10. REAL-TIME CLOCK ---
    const timeDisplay = document.getElementById('header-time');
    if (timeDisplay) {
        const updateTime = () => {
            const now = new Date();
            timeDisplay.innerText = now.toLocaleString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
        updateTime();
        setInterval(updateTime, 1000);
    }


});
