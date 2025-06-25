// script.js

// Attend que le contenu de la page soit entièrement chargé pour exécuter le script
document.addEventListener('DOMContentLoaded', () => {

    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const chargeGInput = document.getElementById('chargeG');
    const valeurG = document.getElementById('valeurG');
    const chargeQInput = document.getElementById('chargeQ');
    const valeurQ = document.getElementById('valeurQ');
    const calculCharge = document.getElementById('calculCharge');

    const poutreCanvas = document.getElementById('poutreCanvas');
    const ctx = poutreCanvas.getContext('2d');
    const shearCanvas = document.getElementById('shearCanvas');
    const momentCanvas = document.getElementById('momentCanvas');
    let shearChart, momentChart;
    const reactionA = document.getElementById('reactionA');
    const reactionB = document.getElementById('reactionB');

    const poutreLargeurInput = document.getElementById('poutreLargeur');
    const valeurLargeur = document.getElementById('valeurLargeur');
    const poutreHauteurInput = document.getElementById('poutreHauteur');
    const valeurHauteur = document.getElementById('valeurHauteur');
    const sectionVisu = document.getElementById('sectionVisu');
    const valeurContrainte = document.getElementById('valeurContrainte');
    const verdict = document.getElementById('verdict');

    // Nouveaux éléments pour l'onglet Isostatique
    const appuiASelect = document.getElementById('appuiA');
    const appuiBSelect = document.getElementById('appuiB');
    const resultatIsostatique = document.getElementById('resultatIsostatique');

    // Constantes
    const LONGUEUR_POUTRE = 5; // mètres
    const RESISTANCE_ACIER_ADM = 235; // MPa

    // --- FONCTION PRINCIPALE DE MISE À JOUR (CALCULS) ---
    function mettreAJourToutesLesValeurs() {
        // Onglet 1: Charges
        const g = parseFloat(chargeGInput.value);
        const q = parseFloat(chargeQInput.value);
        valeurG.textContent = g;
        valeurQ.textContent = q;
        const chargeTotale = 1.35 * g + 1.5 * q;
        calculCharge.innerHTML = `1.35 * ${g} + 1.5 * ${q} = <strong>${chargeTotale.toFixed(2)}</strong> kN/m`;

        // Onglet 2: Équilibre
        const chargeTotaleEnNewtons = chargeTotale * 1000;
        const forceTotale = chargeTotaleEnNewtons * LONGUEUR_POUTRE;
        const ra = forceTotale / 2;
        const rb = forceTotale / 2;
        reactionA.textContent = (ra / 1000).toFixed(2);
        reactionB.textContent = (rb / 1000).toFixed(2);
        dessinerPoutreEquilibre(chargeTotale, (ra / 1000), (rb / 1000));
        dessinerDiagrammes(chargeTotale, (ra / 1000), (rb / 1000));

        // Onglet 3: Mécanique et Résistance
        const b_cm = parseFloat(poutreLargeurInput.value);
        const h_cm = parseFloat(poutreHauteurInput.value);
        valeurLargeur.textContent = b_cm;
        valeurHauteur.textContent = h_cm;
        sectionVisu.style.width = `${b_cm * 2}px`;
        sectionVisu.style.height = `${h_cm * 1}px`;
        const I_cm4 = (b_cm * Math.pow(h_cm, 3)) / 12;
        const M_max_kNm = (chargeTotale * Math.pow(LONGUEUR_POUTRE, 2)) / 8;
        const M_max_Nmm = M_max_kNm * 1e6;
        const y_mm = (h_cm / 2) * 10;
        const I_mm4 = I_cm4 * 1e4;
        let contrainte_MPa = I_mm4 > 0 ? (M_max_Nmm * y_mm) / I_mm4 : 0;
        valeurContrainte.textContent = contrainte_MPa.toFixed(2);

        if (contrainte_MPa <= RESISTANCE_ACIER_ADM) {
            verdict.textContent = "SÉCURITAIRE : La contrainte est inférieure à la résistance du matériau.";
            verdict.className = 'verdict-securitaire';
        } else {
            verdict.textContent = "RISQUE DE RUPTURE : La contrainte dépasse la résistance du matériau !";
            verdict.className = 'verdict-danger';
        }
    }
    
    // --- FONCTION POUR DESSINER LA POUTRE (ONGLET 2) ---
function dessinerPoutreEquilibre(charge, ra, rb) {
        ctx.clearRect(0, 0, poutreCanvas.width, poutreCanvas.height);
        const yPoutre = 100, xStart = 50, xEnd = 450;
        ctx.fillStyle = '#555';
        ctx.fillRect(xStart, yPoutre, xEnd - xStart, 10);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        for (let x = xStart; x <= xEnd; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, yPoutre - 40); ctx.lineTo(x, yPoutre); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, yPoutre); ctx.lineTo(x - 4, yPoutre - 6); ctx.lineTo(x + 4, yPoutre - 6); ctx.stroke();
        }
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`${charge.toFixed(2)} kN/m`, 220, 40);
        ctx.strokeStyle = '#27ae60';
        ctx.beginPath(); ctx.moveTo(xStart, yPoutre + 50); ctx.lineTo(xStart, yPoutre + 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xStart, yPoutre + 10); ctx.lineTo(xStart - 6, yPoutre + 16); ctx.lineTo(xStart + 6, yPoutre + 16); ctx.stroke();
        ctx.fillStyle = '#27ae60';
        ctx.fillText(`RA = ${ra.toFixed(2)} kN`, xStart - 20, yPoutre + 70);
        ctx.beginPath(); ctx.moveTo(xEnd, yPoutre + 50); ctx.lineTo(xEnd, yPoutre + 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xEnd, yPoutre + 10); ctx.lineTo(xEnd - 6, yPoutre + 16); ctx.lineTo(xEnd + 6, yPoutre + 16); ctx.stroke();
        ctx.fillText(`RB = ${rb.toFixed(2)} kN`, xEnd - 20, yPoutre + 70);
    }

    // --- FONCTION POUR DESSINER LES DIAGRAMMES DE V ET M ---
    function dessinerDiagrammes(charge, ra, rb) {
        const L = LONGUEUR_POUTRE;
        const n = 50;
        const labels = [];
        const shear = [];
        const moment = [];
        for (let i = 0; i <= n; i++) {
            const x = (L / n) * i;
            labels.push(x.toFixed(2));
            shear.push(ra - charge * x);
            moment.push(ra * x - 0.5 * charge * x * x);
        }

        if (shearChart) shearChart.destroy();
        shearChart = new Chart(shearCanvas, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'V (kN)', data: shear, borderColor: '#2980b9', fill: false }] },
            options: { responsive: false, scales: { x: { title: { display: true, text: 'x (m)' } }, y: { title: { display: true, text: 'V (kN)' } } } }
        });

        if (momentChart) momentChart.destroy();
        momentChart = new Chart(momentCanvas, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'M (kN.m)', data: moment, borderColor: '#c0392b', fill: false }] },
            options: { responsive: false, scales: { x: { title: { display: true, text: 'x (m)' } }, y: { title: { display: true, text: 'M (kN.m)' } } } }
        });
    }

    // --- NOUVELLE FONCTION POUR LE CALCULATEUR D'ISOSTATICITÉ ---
    function calculerIsostaticite() {
        const reactionsA = parseInt(appuiASelect.value);
        const reactionsB = parseInt(appuiBSelect.value);
        const R_total = reactionsA + reactionsB;
        const np = 1; // Pour une poutre simple, on a 1 seule partie
        const ne = 3 * np; // Nombre d'équations de la statique (toujours 3 en 2D pour 1 solide)

        const delta_h = R_total - ne;

        let message = `Nombre de réactions (R) = ${R_total}. Nombre d'équations = ${ne}.<br>`;
        message += `<strong>Δh = ${R_total} - ${ne} = ${delta_h}</strong><br>`;

        if (delta_h === 0) {
            resultatIsostatique.innerHTML = message + "Le système est <strong>ISOSTATIQUE</strong>.";
            resultatIsostatique.className = "verdict-securitaire";
        } else if (delta_h > 0) {
            resultatIsostatique.innerHTML = message + `Le système est <strong>HYPERSTATIQUE</strong> de degré ${delta_h}. Il y a ${delta_h} réaction(s) superflue(s).`;
            resultatIsostatique.className = "verdict-neutre";
        } else { // delta_h < 0
            resultatIsostatique.innerHTML = message + "Le système est <strong>HYPOSTATIQUE</strong> (instable). Il manque des liaisons !";
            resultatIsostatique.className = "verdict-danger";
        }
    }

    // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
    chargeGInput.addEventListener('input', mettreAJourToutesLesValeurs);
    chargeQInput.addEventListener('input', mettreAJourToutesLesValeurs);
    poutreLargeurInput.addEventListener('input', mettreAJourToutesLesValeurs);
    poutreHauteurInput.addEventListener('input', mettreAJourToutesLesValeurs);
    
    // Nouveaux écouteurs pour le calculateur
    appuiASelect.addEventListener('change', calculerIsostaticite);
    appuiBSelect.addEventListener('change', calculerIsostaticite);


    // --- APPELS INITIAUX ---
    mettreAJourToutesLesValeurs();
    calculerIsostaticite(); // Calcul initial pour l'onglet isostatique
});

// --- FONCTION POUR LA NAVIGATION PAR ONGLETS ---
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}