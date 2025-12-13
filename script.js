document.addEventListener('DOMContentLoaded', () => {
    // Elements
    // Elements
    // Elements
    const labelWidthInput = document.getElementById('labelWidth');

    const flowInput = document.getElementById('flow');
    const quantityInput = document.getElementById('quantity');
    const acrossInput = document.getElementById('across');
    const speedInput = document.getElementById('speed');

    const totalLengthEl = document.getElementById('totalLength');
    const totalAreaM2El = document.getElementById('totalAreaM2');
    const totalStrokesEl = document.getElementById('totalStrokes');
    const totalTimeEl = document.getElementById('totalTime');
    const resetBtn = document.getElementById('resetBtn');

    // Constants
    const MM_TO_M = 1000;
    const MM2_TO_M2 = 1000000;

    function calculate() {
        const width = parseFloat(labelWidthInput.value) || 0;
        const height = 0; // Removed input
        const flow = parseFloat(flowInput.value) || 0;

        updateZMeasureOptions();
        const quantity = parseFloat(quantityInput.value) || 0;
        const across = parseFloat(acrossInput.value) || 1;
        const speed = parseFloat(speedInput.value) || 0;

        if (quantity === 0) {
            resetDisplay();
            return;
        }

        // 1. Technical Calcs
        const strokes = Math.ceil(quantity / across);

        // Formula: (Akış + Ara Boşluğu) * (Strokes / Across)
        // 'width' variable comes from 'Akış' input
        // 'flow' variable comes from 'Ara Boşluğu' input
        const repeatLengthMm = width + flow;
        const totalLengthMm = repeatLengthMm * (strokes / across);
        const totalLengthM = totalLengthMm / MM_TO_M;

        let timeMin = 0;
        if (speed > 0) {
            timeMin = totalLengthM / speed;
        }

        // Area Calculation (m²)
        // We use Total Length * Total Width (Effective width of material used)
        // OR simply Total Label Area? Usually material cost is based on raw material width.
        // But here we only have label dimensions. Let's assume Area = (Width + Gaps) * Length.
        // To be precise with inputs given: Total Area = (Label Width * Across) * Total Length. 
        // This approximates the utilized material area.
        const totalWidthMm = width * across;
        const totalAreaM2 = (totalWidthMm * totalLengthM) / 1000; // mm * m / 1000 = m²

        // Display Results
        totalLengthEl.innerHTML = `${formatNumber(totalLengthM)} <span class="unit-small">m</span>`;
        totalAreaM2El.innerHTML = `${formatNumber(totalAreaM2)} <span class="unit-small">m²</span>`;
        totalStrokesEl.innerHTML = `${formatNumber(strokes)}`;

        // Time display without decimal points (Math.ceil to be safe for production time, or Math.round)
        // User asked for "virgül olmadan" (without comma). Integer.
        // Using Math.ceil to ensure we account for any partial minute as a full minute of work usually,
        // or Math.round. Let's use Math.ceil as it is safer for "estimated time".
        // But simply "no comma" implies integer.
        // Let's use Math.round() for a standard approximation or toFixed(0).
        // Time display
        // Show: Total Minutes / X Hours Y Minutes
        if (speed > 0) {
            const totalMinutes = Math.ceil(timeMin);
            const hours = Math.floor(totalMinutes / 60);
            const remainingMinutes = totalMinutes % 60;

            if (hours > 0) {
                totalTimeEl.innerHTML = `${totalMinutes} <span class="unit-small">dk</span> / ${hours} <span class="unit-small">sa</span> ${remainingMinutes} <span class="unit-small">dk</span>`;
            } else {
                totalTimeEl.innerHTML = `${totalMinutes} <span class="unit-small">dk</span>`;
            }
        } else {
            totalTimeEl.innerHTML = `- <span class="unit-small">dk</span>`;
        }
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(num);
    }

    function resetDisplay() {
        totalLengthEl.innerHTML = `0 <span class="unit-small">m</span>`;
        totalAreaM2El.innerHTML = `0 <span class="unit-small">m²</span>`;
        totalStrokesEl.innerHTML = `0`;
        totalTimeEl.innerHTML = `0 <span class="unit-small">dk</span>`;
    }

    // Event Listeners
    const inputs = [
        labelWidthInput, flowInput, quantityInput,
        acrossInput, speedInput
    ];

    inputs.forEach(input => {
        input.addEventListener('input', calculate);
    });

    resetBtn.addEventListener('click', () => {
        labelWidthInput.value = '';

        flowInput.value = '3';
        quantityInput.value = '';
        acrossInput.value = '1';
        speedInput.value = '';
        resetDisplay();
        labelWidthInput.focus();
    });

    // Initial Focus
    labelWidthInput.focus();

    // Splash Screen Logic
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 800);
        }, 2500);
    }

    // Page Navigation Logic
    const pageCalculator = document.getElementById('page-calculator');
    const pagePaperCost = document.getElementById('page-paper-cost');
    const goToPaperBtn = document.getElementById('goToPaperBtn');
    const backToCalcBtn = document.getElementById('backToCalcBtn');


    // Z Measure Logic
    function updateZMeasureOptions() {
        const width = parseFloat(labelWidthInput.value) || 0;
        const flow = parseFloat(flowInput.value) || 0;
        const zMeasureSelect = document.getElementById('zMeasure');

        if (!zMeasureSelect) return;

        zMeasureSelect.innerHTML = ''; // Clear existing

        if (width === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "Önce Akış giriniz";
            zMeasureSelect.appendChild(option);
            return;
        }

        const repeatLength = width + flow;
        let foundAny = false;
        const PITCH = 3.175; // 1/8 inch gear pitch

        for (let z = 60; z <= 136; z++) {
            const cylinderCircumference = z * PITCH;

            // Check if circumference is a multiple of repeatLength
            const ratio = cylinderCircumference / repeatLength;
            const remainder = Math.abs(ratio - Math.round(ratio));

            if (remainder < 0.01) {
                const option = document.createElement('option');
                option.value = z;
                option.textContent = `${z} ZET`;
                zMeasureSelect.appendChild(option);
                foundAny = true;
            }
        }

        if (!foundAny) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "Uygun ZET Bulunamadı";
            zMeasureSelect.appendChild(option);
        }
    }

    // Auto-update material price
    const materialTypeSelect = document.getElementById('materialType');
    const materialPriceInput = document.getElementById('materialPrice');
    let materialPrices = {};

    // Fetch prices from "simulated internet source" (local JSON file)
    fetch('prices.json')
        .then(response => response.json())
        .then(data => {
            materialPrices = data;
            // Set initial price if exists
            if (materialTypeSelect && materialPriceInput && materialPrices[materialTypeSelect.value]) {
                materialPriceInput.value = materialPrices[materialTypeSelect.value].toFixed(2);
            }
        })
        .catch(error => console.error('Fiyatlar yüklenirken hata oluştu:', error));


    // Material Cost Calculation Logic
    const totalMaterialCostInput = document.getElementById('totalMaterialCost');

    function updateMaterialCost() {
        if (!materialPriceInput || !totalMaterialCostInput) return;

        // User wants: Total Metraj × Material Price
        // Parse the displayed Total Metraj (Total Length in meters)
        const lengthText = document.getElementById('totalLength').innerText;
        // Format is "1.234,56 m" (TR format)
        // Remove " m" and replace thousands dot and decimal comma
        const cleanText = lengthText.replace(' m', '').replace(/\./g, '').replace(',', '.');
        const totalLength = parseFloat(cleanText) || 0;

        const price = parseFloat(materialPriceInput.value) || 0;
        const totalCost = totalLength * price;

        totalMaterialCostInput.value = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalCost);
    }

    if (materialTypeSelect && materialPriceInput) {
        materialTypeSelect.addEventListener('change', () => {
            const selectedMaterial = materialTypeSelect.value;
            if (materialPrices[selectedMaterial]) {
                materialPriceInput.value = materialPrices[selectedMaterial].toFixed(2);
            } else {
                materialPriceInput.value = '';
            }
            updateMaterialCost();
        });

        materialPriceInput.addEventListener('input', updateMaterialCost);
    }

    // Also update cost when main calculations change (since area changes)
    // We can attach to the inputs array defined earlier
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            // Wait for calculate() to update UI
            setTimeout(updateMaterialCost, 10);
        });
    });

    // Elements on Page 3 (Job Order)
    if (goToPaperBtn && backToCalcBtn) {
        goToPaperBtn.addEventListener('click', () => {
            // Validate inputs
            const width = parseFloat(labelWidthInput.value) || 0;
            if (width === 0) {
                alert("Lütfen Akış (Etiket Boyu) giriniz.");
                return;
            }

            // Switch pages
            pageCalculator.classList.remove('active');
            pageCalculator.classList.add('hidden');
            pagePaperCost.classList.remove('hidden');
            pagePaperCost.classList.add('active');
        });

        backToCalcBtn.addEventListener('click', () => {
            pagePaperCost.classList.remove('active');
            pagePaperCost.classList.add('hidden');
            pageCalculator.classList.remove('hidden');
            pageCalculator.classList.add('active');
        });
    }


});
