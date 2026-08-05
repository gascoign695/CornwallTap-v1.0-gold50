const developerMode = false;
const totalRounds = 10;

let gameMode = "normal";

let round = 1;
let score = 0;
let current = null;

let guessed = false;
let gameFinished = false;
let newPersonalBest = false;

let roundScores = [];
let roundDistances = [];
let lifetimeStats = {
    gamesPlayed:0,
    totalScore:0,
    highestScore:0,
    perfectGuesses:0
};
let guessMarker = null;
let answerMarker = null;
let answerLine = null;
let toleranceCircle = null;

const targetElement =
    document.getElementById("target");

const categoryElement =
    document.getElementById("category");

const roundElement =
    document.getElementById("round");

const scoreElement =
    document.getElementById("score");

const resultElement =
    document.getElementById("result");

const resultModal =
    document.getElementById("resultModal");
    
const nextButton =
    document.getElementById("nextButton");

const normalModeButton =
    document.getElementById("normalModeButton");

const dailyModeButton =
    document.getElementById("dailyModeButton");


const map = L.map("map", {
    minZoom: 8,
    maxZoom: 18
}).setView([50.35, -5.1], 9);


L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Satellite imagery © Esri",
        maxZoom: 18
    }
).addTo(map);


function clearMapReveal() {

    if (guessMarker) {
        map.removeLayer(guessMarker);
        guessMarker = null;
    }

    if (answerMarker) {
        map.removeLayer(answerMarker);
        answerMarker = null;
    }

    if (answerLine) {
        map.removeLayer(answerLine);
        answerLine = null;
    }

    if (toleranceCircle) {
        map.removeLayer(toleranceCircle);
        toleranceCircle = null;
    }
}


function distanceInKm(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius = 6371;

    const dLat =
        (lat2 - lat1) * Math.PI / 180;

    const dLon =
        (lon2 - lon1) * Math.PI / 180;

    const firstLatitude =
        lat1 * Math.PI / 180;

    const secondLatitude =
        lat2 * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(firstLatitude) *
        Math.cos(secondLatitude) *
        Math.sin(dLon / 2) ** 2;

    return earthRadius * 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );
}


function calculateScore(km, tolerance) {

    if (km <= tolerance) {
        return 100;
    }

    const missDistance =
        km - tolerance;

    const maximumMissDistance = 5;

    const rawScore =
        100 *
        (
            1 -
            missDistance /
            maximumMissDistance
        );

    return Math.max(
        0,
        Math.round(rawScore)
    );
}


function categoryIcon(category) {

    const icons = {
        "Town": "🏘️",
        "Headland": "🌊",
        "Tidal Island": "🏝️",
        "Attraction": "🌿",
        "Castle": "🏰",
        "Harbour": "⚓",
        "Cove": "🏖️",
        "Beach": "🏖️",
        "Landmark": "📍",
        "Lighthouse": "💡",
        "Natural Feature": "⛰️",
        "Prehistoric Monument": "🪨",
        "Historic Building": "🏛️"
    };

    return icons[category] || "📍";
}


function resultMessage(points) {

    if (points === 100) {
        return "Perfect!";
    }

    if (points >= 85) {
        return "Excellent!";
    }

    if (points >= 65) {
        return "Very close";
    }

    if (points >= 40) {
        return "Good attempt";
    }

    if (points >= 15) {
        return "Not quite";
    }

    return "A long way off";
}


function titleForScore(finalScore) {

    if (finalScore >= 950) {
        return "Kernow Master";
    }

    if (finalScore >= 850) {
        return "Cornwall Expert";
    }

    if (finalScore >= 700) {
        return "Cornish Explorer";
    }

    if (finalScore >= 500) {
        return "Local";
    }

    if (finalScore >= 300) {
        return "Holidaymaker";
    }

    return "Visitor";
}


function currentDateKey() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/*
Creates a repeatable number from text.

This means every player gets the same
Daily Challenge locations on the same date.
*/
function textSeed(text) {

    let seed = 0;

    for (
        let index = 0;
        index < text.length;
        index += 1
    ) {

        seed =
            (
                seed * 31 +
                text.charCodeAt(index)
            ) >>> 0;
    }

    return seed;
}


function seededRandom(seed) {

    let value =
        Math.sin(seed) * 10000;

    return value - Math.floor(value);
}


function selectLocation() {

    const possible =
        locations.filter(
            location =>
                location.difficulty === round
        );

    if (possible.length === 0) {

        throw new Error(
            `No locations available for difficulty ${round}.`
        );
    }

    if (gameMode === "daily") {

        const seedText =
            `${currentDateKey()}-${round}`;

        const seed =
            textSeed(seedText);

        const selectedIndex =
            Math.floor(
                seededRandom(seed) *
                possible.length
            );

        current =
            possible[selectedIndex];

        return;
    }

    current =
        possible[
            Math.floor(
                Math.random() *
                possible.length
            )
        ];
}


function startRound() {

    clearMapReveal();
    hideResultModal();

    guessed = false;

    nextButton.disabled = true;
    nextButton.textContent =
        "Make your guess";

    resultElement.innerHTML = "";

    selectLocation();

    targetElement.textContent =
        current.name;

    categoryElement.textContent =
        `${categoryIcon(current.category)} ${current.category}`;

    roundElement.textContent = round;
    scoreElement.textContent = score;

    map.setView(
        [50.35, -5.1],
        9
    );
}


function createGuessMarker(latlng) {

    const blueIcon =
        L.divIcon({
            className: "custom-map-marker",
            html:
                '<div class="marker-pin guess-pin"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

    return L.marker(
        latlng,
        {
            icon: blueIcon
        }
    ).addTo(map);
}


function createAnswerMarker(latlng) {

    const greenIcon =
        L.divIcon({
            className: "custom-map-marker",
            html:
                '<div class="marker-pin answer-pin"></div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

    return L.marker(
        latlng,
        {
            icon: greenIcon,
            zIndexOffset: 1000
        }
    ).addTo(map);
}


function displayDistance(km) {

    if (km < 1) {

        return `${Math.round(km * 1000)} metres`;
    }

    return `${km.toFixed(2)} km`;
}


map.on(
    "click",
    function (event) {

        if (
            guessed ||
            gameFinished ||
            !current
        ) {
            return;
        }

        guessed = true;

        const answerLatLng =
            L.latLng(
                current.lat,
                current.lon
            );

        guessMarker =
            createGuessMarker(
                event.latlng
            );

        answerMarker =
            createAnswerMarker(
                answerLatLng
            );

        answerLine =
            L.polyline(
                [
                    event.latlng,
                    answerLatLng
                ],
                {
                    weight: 3,
                    dashArray: "8, 8"
                }
            ).addTo(map);

        if (developerMode) {

            toleranceCircle =
                L.circle(
                    answerLatLng,
                    {
                        radius:
                            current.tolerance *
                            1000,

                        weight: 2,
                        fillOpacity: 0.12
                    }
                ).addTo(map);
        }

        map.fitBounds(
            L.latLngBounds(
                [
                    event.latlng,
                    answerLatLng
                ]
            ),
            {
                padding: [60, 60],
                maxZoom: 14
            }
        );

        const km =
            distanceInKm(
                event.latlng.lat,
                event.latlng.lng,
                current.lat,
                current.lon
            );

        const points =
            calculateScore(
                km,
                current.tolerance
            );

        score += points;

        roundScores.push(points);
        roundDistances.push(km);

        scoreElement.textContent =
            score;

        resultElement.innerHTML = `
            <div class="result-card">

                ${
                    gameMode === "daily"
                    ? `
                        <div class="daily-label">
                            📅 Daily Challenge
                        </div>
                    `
                    : ""
                }

                <div class="result-category">
                    ${categoryIcon(current.category)}
                    ${current.category}
                </div>

                <h2>
                    ${current.name}
                </h2>

                <div class="result-message">
                    ${resultMessage(points)}
                </div>

                <div class="round-score">
                    ${points}<span>/100</span>
                </div>

                <div class="distance-result">
                    You were
                    ${displayDistance(km)}
                    away
                </div>

                <div class="location-fact">
                    ${current.fact}
                </div>

                ${
                    developerMode
                    ? `
                        <div class="developer-data">

                            Target:
                            ${current.lat.toFixed(5)},
                            ${current.lon.toFixed(5)}

                            &nbsp; | &nbsp;

                            Perfect radius:
                            ${Math.round(
                                current.tolerance *
                                1000
                            )}m

                        </div>
                    `
                    : ""
                }

            </div>
        `;

        nextButton.disabled = false;

        nextButton.textContent =
            round === totalRounds
                ? "See final result"
                : "Continue";

                setTimeout(() => {
    showResultModal();
}, 800);    
    }
);

function loadLifetimeStats(){

    const saved =
        localStorage.getItem("cornwallTapStats");

    if(saved){

        lifetimeStats =
            JSON.parse(saved);

    }

}
function saveLifetimeStats(){

    localStorage.setItem(

        "cornwallTapStats",

        JSON.stringify(lifetimeStats)

    );

}
function getPersonalBest() {

    const stored =
        localStorage.getItem(
            "cornwallTapPersonalBest"
        );

    return stored
        ? Number(stored)
        : 0;
}


function updatePersonalBest() {

    const existingBest =
        getPersonalBest();

    newPersonalBest =
        score > existingBest;

    if (newPersonalBest) {

        localStorage.setItem(
            "cornwallTapPersonalBest",
            String(score)
        );
    }
}


function saveDailyScore() {

    const key =
        `cornwallTapDaily-${currentDateKey()}`;

    const previousScore =
        Number(
            localStorage.getItem(key) || 0
        );

    if (score > previousScore) {

        localStorage.setItem(
            key,
            String(score)
        );
    }
}


function averageDistance() {

    if (roundDistances.length === 0) {
        return 0;
    }

    const total =
        roundDistances.reduce(
            (sum, value) =>
                sum + value,
            0
        );

    return total /
        roundDistances.length;
}


function perfectGuesses() {

    return roundScores.filter(
        roundScore =>
            roundScore === 100
    ).length;
}


function bestRound() {

    return Math.max(
        ...roundScores
    );
}


function worstRound() {

    return Math.min(
        ...roundScores
    );
}


function showFinalResult() {

    gameFinished = true;

    clearMapReveal();

    updatePersonalBest();

    lifetimeStats.gamesPlayed++;

lifetimeStats.totalScore+=score;

if(score>lifetimeStats.highestScore){

    lifetimeStats.highestScore=score;

}

lifetimeStats.perfectGuesses+=perfectGuesses();

saveLifetimeStats();

    if (gameMode === "daily") {
        saveDailyScore();
    }

    const personalBest =
        getPersonalBest();

    targetElement.textContent =
        "Game complete";

    categoryElement.textContent =
        gameMode === "daily"
            ? "📅 Daily Challenge"
            : "Normal Game";

    nextButton.disabled = false;
    nextButton.textContent =
        "Play Again";

    resultElement.innerHTML = `
        <div class="result-card">

            <div class="result-category">
                Final accuracy
            </div>

            <h2>
                ${titleForScore(score)}
            </h2>

            <div class="final-score">
                ${score}<span>/1000</span>
            </div>

            ${
                newPersonalBest
                ? `
                    <div class="personal-best">
                        ⭐ New personal best! ⭐
                    </div>
                `
                : `
                    <div class="personal-best">
                        Personal best:
                        ${personalBest}/1000
                    </div>
                `
            }

            <div class="stats-grid">

                <div class="stat-box">

                    <span class="stat-label">
                        Average distance
                    </span>

                    <span class="stat-value">
                        ${displayDistance(
                            averageDistance()
                        )}
                    </span>

                </div>

                <div class="stat-box">

                    <span class="stat-label">
                        Perfect guesses
                    </span>

                    <span class="stat-value">
                        ${perfectGuesses()}
                    </span>

                </div>

                <div class="stat-box">

                    <span class="stat-label">
                        Best round
                    </span>

                    <span class="stat-value">
                        ${bestRound()}/100
                    </span>

                </div>

                <div class="stat-box">

                    <span class="stat-label">
                        Lowest round
                    </span>

                    <span class="stat-value">
                        ${worstRound()}/100
                    </span>

                </div>

            </div>

        </div>
    `;

    showResultModal();

    map.setView(
        [50.35, -5.1],
        9
    );
}


function restartGame() {

    round = 1;
    score = 0;

    guessed = false;
    gameFinished = false;
    newPersonalBest = false;

    roundScores = [];
    roundDistances = [];

    scoreElement.textContent = score;

    startRound();
}


function changeMode(newMode) {

    gameMode = newMode;

    if (gameMode === "normal") {

        normalModeButton.classList.add(
            "active-mode"
        );

        dailyModeButton.classList.remove(
            "active-mode"
        );

    } else {

        dailyModeButton.classList.add(
            "active-mode"
        );

        normalModeButton.classList.remove(
            "active-mode"
        );
    }

    restartGame();
}


nextButton.addEventListener(
    "click",
    function () {

        if (gameFinished) {
            restartGame();
            return;
        }

        if (!guessed) {
            return;
        }

        if (round === totalRounds) {
            showFinalResult();
            return;
        }

        round += 1;

        startRound();
    }
);


normalModeButton.addEventListener(
    "click",
    function () {
        changeMode("normal");
    }
);


dailyModeButton.addEventListener(
    "click",
    function () {
        changeMode("daily");
    }
);


loadLifetimeStats();

function showResultModal() {

    resultModal.classList.add("visible");

    resultModal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function hideResultModal() {

    resultModal.classList.remove("visible");

    resultModal.setAttribute(
        "aria-hidden",
        "true"
    );
}

startRound();