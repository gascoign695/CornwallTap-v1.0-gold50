/*
CornwallTap v2.0 - Milestone 2

Modes:
- Daily Challenge: same five locations for everyone, one scored attempt per day.
- Practice: random five locations, unlimited games.

Local Live Server addresses bypass the Daily Challenge lock so
development and testing remain easy.
*/

const developerMode = false;
const totalRounds = 5;

const difficultyBands = [
    { min: 1, max: 2, zeroDistanceKm: 10 },
    { min: 3, max: 4, zeroDistanceKm: 14 },
    { min: 5, max: 6, zeroDistanceKm: 18 },
    { min: 7, max: 8, zeroDistanceKm: 24 },
    { min: 9, max: 10, zeroDistanceKm: 30 }
];

const localDevelopmentHosts = [
    "localhost",
    "127.0.0.1"
];

const dailyLockBypass =
    developerMode ||
    localDevelopmentHosts.includes(
        window.location.hostname
    );

let gameMode = null;
let round = 1;
let score = 0;
let current = null;
let guessed = false;
let gameFinished = false;

let roundScores = [];
let roundDistances = [];
let roundLocations = [];
let practiceUsedIds = [];

let guessMarker = null;
let answerMarker = null;
let answerLine = null;
let toleranceCircle = null;

const startScreen =
    document.getElementById("startScreen");

const gameScreen =
    document.getElementById("gameScreen");

const startDateElement =
    document.getElementById("startDate");

const dailyStartButton =
    document.getElementById("dailyStartButton");

const practiceStartButton =
    document.getElementById("practiceStartButton");

const statsButton =
    document.getElementById("statsButton");

const statsScreen =
    document.getElementById("statsScreen");

const statsBackButton =
    document.getElementById("statsBackButton");

const statsOverview =
    document.getElementById("statsOverview");

const resetStatsButton =
    document.getElementById("resetStatsButton");

const dailyStatusElement =
    document.getElementById("dailyStatus");

const backButton =
    document.getElementById("backButton");

const modeLabelElement =
    document.getElementById("modeLabel");

const targetElement =
    document.getElementById("target");

const categoryElement =
    document.getElementById("category");

const roundElement =
    document.getElementById("round");

const scoreElement =
    document.getElementById("score");

const progressFill =
    document.getElementById("progressFill");

const challengeDateElement =
    document.getElementById("challengeDate");

const resultElement =
    document.getElementById("result");

const resultModal =
    document.getElementById("resultModal");

const nextButton =
    document.getElementById("nextButton");

const finalActions =
    document.getElementById("finalActions");

const shareButton =
    document.getElementById("shareButton");

const playAgainButton =
    document.getElementById("playAgainButton");

const returnButton =
    document.getElementById("returnButton");

const toastElement =
    document.getElementById("toast");


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


function distanceInKm(lat1, lon1, lat2, lon2) {
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


function scoringBandForRound(roundNumber) {
    return difficultyBands[roundNumber - 1];
}


function calculateScore(
    km,
    tolerance,
    zeroDistanceKm
) {
    if (km <= tolerance) {
        return 100;
    }

    if (km >= zeroDistanceKm) {
        return 0;
    }

    const usableDistance =
        zeroDistanceKm - tolerance;

    const progress =
        (km - tolerance) / usableDistance;

    const curvedScore =
        100 * Math.pow(1 - progress, 1.3);

    return Math.max(
        0,
        Math.min(100, Math.round(curvedScore))
    );
}


function categoryIcon(category) {
    const icons = {
        "Town": "🏘️",
        "Village": "🏘️",
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
        "Historic Building": "🏛️",
        "Historic House": "🏛️",
        "Mining Heritage": "⛏️",
        "Railway Heritage": "🚂",
        "Bridge": "🌉",
        "Garden": "🌿"
    };

    return icons[category] || "📍";
}


function resultMessage(points) {
    if (points === 100) return "Perfect!";
    if (points >= 85) return "Excellent!";
    if (points >= 65) return "Very close";
    if (points >= 40) return "Good knowledge";
    if (points >= 15) return "Right part of Cornwall";
    return "A long way off";
}


function titleForScore(finalScore) {
    if (finalScore >= 475) return "Kernow Master";
    if (finalScore >= 425) return "Cornwall Expert";
    if (finalScore >= 350) return "Cornish Explorer";
    if (finalScore >= 250) return "Local";
    if (finalScore >= 150) return "Holidaymaker";
    return "Visitor";
}


/*
Use the Cornwall/UK calendar date rather than the player's
local timezone. This keeps the Daily Challenge aligned for
players in Cornwall and elsewhere.
*/
function cornwallDateParts() {
    const formatter =
        new Intl.DateTimeFormat(
            "en-GB",
            {
                timeZone: "Europe/London",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        );

    const parts =
        formatter.formatToParts(new Date());

    const values = {};

    parts.forEach(part => {
        values[part.type] = part.value;
    });

    return {
        year: values.year,
        month: values.month,
        day: values.day
    };
}


function currentDateKey() {
    const date =
        cornwallDateParts();

    return `${date.year}-${date.month}-${date.day}`;
}


function displayDate() {
    return new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone: "Europe/London",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(new Date());
}


const statisticsStorageKey =
    "cornwallTapStatistics-v2-daily-only";


function defaultStatistics() {
    return {
        gamesPlayed: 0,
        dailyCompleted: 0,
        practiceCompleted: 0,
        totalScore: 0,
        bestScore: 0,
        perfectRounds: 0,
        totalDistanceKm: 0,
        totalGuesses: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastDailyDate: null
    };
}


function getStatistics() {
    const saved =
        localStorage.getItem(
            statisticsStorageKey
        );

    if (!saved) {
        return defaultStatistics();
    }

    try {
        return {
            ...defaultStatistics(),
            ...JSON.parse(saved)
        };
    } catch (error) {
        console.warn(
            "Stored statistics could not be read.",
            error
        );

        return defaultStatistics();
    }
}


function saveStatistics(statistics) {
    localStorage.setItem(
        statisticsStorageKey,
        JSON.stringify(statistics)
    );
}


function daysBetweenDateKeys(
    earlierDateKey,
    laterDateKey
) {
    const earlier =
        new Date(`${earlierDateKey}T00:00:00Z`);

    const later =
        new Date(`${laterDateKey}T00:00:00Z`);

    return Math.round(
        (later - earlier) /
        (24 * 60 * 60 * 1000)
    );
}


function updateDailyStreak(statistics) {
    const today =
        currentDateKey();

    if (statistics.lastDailyDate === today) {
        return false;
    }

    if (!statistics.lastDailyDate) {
        statistics.currentStreak = 1;
    } else {
        const gap =
            daysBetweenDateKeys(
                statistics.lastDailyDate,
                today
            );

        statistics.currentStreak =
            gap === 1
                ? statistics.currentStreak + 1
                : 1;
    }

    statistics.longestStreak =
        Math.max(
            statistics.longestStreak,
            statistics.currentStreak
        );

    statistics.lastDailyDate =
        today;

    return true;
}


function recordCompletedGame() {
    const statistics =
        getStatistics();

    /*
    Practice Mode only contributes to the Practice Games
    counter. It never changes Daily scores, averages,
    distances, perfect rounds or streaks.
    */
    if (gameMode === "practice") {
        statistics.practiceCompleted += 1;
        saveStatistics(statistics);
        return;
    }

    /*
    Localhost permits replaying today's Daily Challenge for
    testing, but only the first completion can affect stats.
    */
    if (
        statistics.lastDailyDate ===
        currentDateKey()
    ) {
        return;
    }

    statistics.gamesPlayed += 1;
    statistics.dailyCompleted += 1;
    statistics.totalScore += score;

    statistics.bestScore =
        Math.max(
            statistics.bestScore,
            score
        );

    statistics.perfectRounds +=
        perfectGuesses();

    statistics.totalDistanceKm +=
        roundDistances.reduce(
            (total, distance) =>
                total + distance,
            0
        );

    statistics.totalGuesses +=
        roundDistances.length;

    updateDailyStreak(statistics);
    saveStatistics(statistics);
}


function averageStoredScore(statistics) {
    if (statistics.gamesPlayed === 0) {
        return 0;
    }

    return Math.round(
        statistics.totalScore /
        statistics.gamesPlayed
    );
}


function averageStoredDistance(statistics) {
    if (statistics.totalGuesses === 0) {
        return 0;
    }

    return (
        statistics.totalDistanceKm /
        statistics.totalGuesses
    );
}


function statisticsCard(
    icon,
    value,
    label,
    featured = false
) {
    return `
        <div class="profile-stat ${
            featured ? "featured" : ""
        }">
            <div class="profile-stat-icon">
                ${icon}
            </div>

            <div class="profile-stat-value">
                ${value}
            </div>

            <div class="profile-stat-label">
                ${label}
            </div>
        </div>
    `;
}


function renderStatistics() {
    const statistics =
        getStatistics();

    statsOverview.innerHTML = [
        statisticsCard(
            "🔥",
            statistics.currentStreak,
            "Current daily streak",
            true
        ),
        statisticsCard(
            "🏆",
            `${statistics.bestScore}/500`,
            "Best Daily score",
            true
        ),
        statisticsCard(
            "📅",
            statistics.dailyCompleted,
            "Daily games completed"
        ),
        statisticsCard(
            "🗺️",
            statistics.dailyCompleted * totalRounds,
            "Daily rounds played"
        ),
        statisticsCard(
            "🎯",
            statistics.practiceCompleted,
            "Practice games"
        ),
        statisticsCard(
            "📈",
            `${averageStoredScore(
                statistics
            )}/500`,
            "Average Daily score"
        ),
        statisticsCard(
            "⭐",
            statistics.perfectRounds,
            "Perfect Daily rounds"
        ),
        statisticsCard(
            "📍",
            displayDistance(
                averageStoredDistance(
                    statistics
                )
            ),
            "Average Daily guess distance"
        ),
        statisticsCard(
            "🌟",
            statistics.longestStreak,
            "Longest daily streak"
        )
    ].join("");
}


function showStatisticsScreen() {
    hideResultModal();

    startScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");
    statsScreen.classList.remove("hidden");

    renderStatistics();
}


function hideStatisticsScreen() {
    statsScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");

    updateStartScreen();
}


function dailyStorageKey() {
    return `cornwallTapDailyResult-${currentDateKey()}`;
}


function getSavedDailyResult() {
    const saved =
        localStorage.getItem(
            dailyStorageKey()
        );

    if (!saved) {
        return null;
    }

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.warn(
            "Stored Daily Challenge result could not be read.",
            error
        );

        return null;
    }
}


function saveDailyResult() {
    const result = {
        date: currentDateKey(),
        score,
        title: titleForScore(score),
        squares:
            roundScores.map(scoreSquare).join(""),
        roundScores: [...roundScores],
        locations: [...roundLocations],
        completedAt:
            new Date().toISOString()
    };

    localStorage.setItem(
        dailyStorageKey(),
        JSON.stringify(result)
    );
}


function updateStartScreen() {
    startDateElement.textContent =
        displayDate();

    const savedResult =
        getSavedDailyResult();

    if (savedResult && !dailyLockBypass) {
        dailyStartButton.textContent =
            "View Today's Result";

        dailyStatusElement.textContent =
            `Completed today: ${savedResult.score}/500 · ${savedResult.title}`;
    } else {
        dailyStartButton.textContent =
            "📅 Play Today's Challenge";

        dailyStatusElement.textContent =
            dailyLockBypass
                ? "Local testing: daily replay is enabled."
                : "One scored attempt available today.";
    }
}


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
    const value =
        Math.sin(seed) * 10000;

    return value - Math.floor(value);
}


function selectDailyLocation() {
    const band =
        scoringBandForRound(round);

    const possible =
        locations.filter(
            location =>
                location.difficulty >= band.min &&
                location.difficulty <= band.max
        );

    if (possible.length === 0) {
        throw new Error(
            `No locations available for difficulty ${band.min}-${band.max}.`
        );
    }

    const seed =
        textSeed(
            `${currentDateKey()}-cornwalltap-round-${round}`
        );

    const selectedIndex =
        Math.floor(
            seededRandom(seed) * possible.length
        );

    current =
        possible[selectedIndex];
}


function selectPracticeLocation() {
    const band =
        scoringBandForRound(round);

    const possible =
        locations.filter(
            location =>
                location.difficulty >= band.min &&
                location.difficulty <= band.max &&
                !practiceUsedIds.includes(location.id)
        );

    if (possible.length === 0) {
        throw new Error(
            `No unused practice locations are available for difficulty ${band.min}-${band.max}.`
        );
    }

    current =
        possible[
            Math.floor(
                Math.random() * possible.length
            )
        ];

    practiceUsedIds.push(current.id);
}


function selectLocation() {
    if (gameMode === "daily") {
        selectDailyLocation();
        return;
    }

    selectPracticeLocation();
}


function updateProgress() {
    const completedBeforeCurrent =
        round - 1;

    progressFill.style.width =
        `${(completedBeforeCurrent / totalRounds) * 100}%`;
}


function resetGameState() {
    round = 1;
    score = 0;
    current = null;
    guessed = false;
    gameFinished = false;

    roundScores = [];
    roundDistances = [];
    roundLocations = [];
    practiceUsedIds = [];

    scoreElement.textContent = score;
    progressFill.style.width = "0%";
}


function showGameScreen() {
    startScreen.classList.add("hidden");
    statsScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    setTimeout(
        () => map.invalidateSize(),
        50
    );
}


function showStartScreen() {
    hideResultModal();
    clearMapReveal();

    gameScreen.classList.add("hidden");
    statsScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");

    updateStartScreen();
}


function startMode(selectedMode) {
    gameMode = selectedMode;

    resetGameState();

    modeLabelElement.textContent =
        gameMode === "daily"
            ? "📅 Today's Challenge"
            : "🎯 Practice Mode";

    challengeDateElement.textContent =
        displayDate();

    showGameScreen();
    startRound();
}


function startRound() {
    clearMapReveal();
    hideResultModal();

    guessed = false;

    finalActions.classList.add("hidden");
    nextButton.classList.remove("hidden");

    nextButton.disabled = true;
    nextButton.textContent =
        "Make your guess";

    resultElement.innerHTML = "";

    selectLocation();

    roundLocations.push(current.name);

    targetElement.textContent =
        current.name;

    categoryElement.textContent =
        `${categoryIcon(current.category)} ${current.category}`;

    roundElement.textContent = round;
    scoreElement.textContent = score;

    updateProgress();

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


function scoreSquare(points) {
    if (points >= 85) return "🟩";
    if (points >= 60) return "🟨";
    if (points >= 30) return "🟧";
    return "🟥";
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
                            current.tolerance * 1000,
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

        const scoringBand =
            scoringBandForRound(round);

        const points =
            calculateScore(
                km,
                current.tolerance,
                scoringBand.zeroDistanceKm
            );

        score += points;

        roundScores.push(points);
        roundDistances.push(km);

        scoreElement.textContent =
            score;

        progressFill.style.width =
            `${(round / totalRounds) * 100}%`;

        resultElement.innerHTML = `
            <div class="result-card">

                <div class="result-category">
                    ${categoryIcon(current.category)}
                    ${current.category}
                </div>

                <h2>${current.name}</h2>

                <div class="result-message">
                    ${resultMessage(points)}
                </div>

                <div class="round-score">
                    ${points}<span>/100</span>
                </div>

                <div class="distance-result">
                    You were ${displayDistance(km)} away
                </div>

                <div class="scoring-context">
                    This round scores down to zero at
                    ${scoringBand.zeroDistanceKm} km.
                </div>

                <div class="location-fact">
                    <strong>Did you know?</strong><br>
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
                                    current.tolerance * 1000
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

        setTimeout(
            showResultModal,
            800
        );
    }
);


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
    return Math.max(...roundScores);
}


function worstRound() {
    return Math.min(...roundScores);
}


function journeyHtml(
    locationsList,
    scoresList
) {
    if (
        !Array.isArray(locationsList) ||
        locationsList.length === 0
    ) {
        return "";
    }

    const items =
        locationsList
            .map(
                (locationName, index) => `
                    <li class="journey-item">
                        <span class="journey-number">
                            ${index + 1}
                        </span>

                        <span class="journey-name">
                            ${locationName}
                        </span>

                        <span class="journey-score">
                            ${scoresList?.[index] ?? "–"}/100
                        </span>
                    </li>
                `
            )
            .join("");

    return `
        <div class="journey">
            <h3>Today's Cornwall Journey</h3>
            <ol class="journey-list">
                ${items}
            </ol>
        </div>
    `;
}


function finalResultHtml({
    finalScore,
    resultTitle,
    squares,
    locationsList = [],
    scoresList = [],
    saved = false
}) {
    const savedNote =
        saved
            ? `
                <div class="locked-message">
                    Today's scored challenge is complete.
                    Practice Mode is still available.
                </div>
            `
            : "";

    return `
        <div class="result-card">

            <div class="result-category">
                ${
                    gameMode === "daily"
                        ? "Today's final score"
                        : "Practice score"
                }
            </div>

            <h2>${resultTitle}</h2>

            <div class="final-score">
                ${finalScore}<span>/500</span>
            </div>

            <div class="round-summary">
                ${squares}
            </div>

            ${journeyHtml(
                locationsList,
                scoresList
            )}

            ${
                saved
                    ? savedNote
                    : `
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
                    `
            }

        </div>
    `;
}


function showFinalResult() {
    gameFinished = true;

    clearMapReveal();

    targetElement.textContent =
        "Challenge complete";

    categoryElement.textContent =
        gameMode === "daily"
            ? "📅 Today's Challenge"
            : "🎯 Practice Mode";

    const resultSquares =
        roundScores
            .map(scoreSquare)
            .join("");

    recordCompletedGame();

    if (gameMode === "daily") {
        saveDailyResult();
    }

    resultElement.innerHTML =
        finalResultHtml({
            finalScore: score,
            resultTitle: titleForScore(score),
            squares: resultSquares,
            locationsList: roundLocations,
            scoresList: roundScores
        });

    nextButton.classList.add("hidden");
    finalActions.classList.remove("hidden");

    shareButton.textContent =
        "Share Score";

    playAgainButton.classList.toggle(
        "hidden",
        gameMode !== "practice"
    );

    showResultModal();

    map.setView(
        [50.35, -5.1],
        9
    );

    updateStartScreen();
}


function viewSavedDailyResult() {
    const saved =
        getSavedDailyResult();

    if (!saved) {
        startMode("daily");
        return;
    }

    gameMode = "daily";
    gameFinished = true;

    modeLabelElement.textContent =
        "📅 Today's Challenge";

    challengeDateElement.textContent =
        displayDate();

    showGameScreen();

    targetElement.textContent =
        "Challenge complete";

    categoryElement.textContent =
        "📅 Today's Challenge";

    roundElement.textContent = totalRounds;
    scoreElement.textContent = saved.score;
    progressFill.style.width = "100%";

    resultElement.innerHTML =
        finalResultHtml({
            finalScore: saved.score,
            resultTitle: saved.title,
            squares: saved.squares,
            locationsList: saved.locations || [],
            scoresList: saved.roundScores || [],
            saved: true
        });

    nextButton.classList.add("hidden");
    finalActions.classList.remove("hidden");

    shareButton.textContent =
        "Share Score";

    playAgainButton.classList.add(
        "hidden"
    );

    showResultModal();
}


function restartPractice() {
    startMode("practice");
}


function canonicalShareUrl() {
    if (
        window.location.hostname ===
        "cornwalltap.pages.dev"
    ) {
        return "https://cornwalltap.pages.dev";
    }

    if (
        window.location.hostname.endsWith(
            ".cornwalltap.pages.dev"
        )
    ) {
        return "https://cornwalltap.pages.dev";
    }

    return window.location.origin;
}


function shareText() {
    const savedDaily =
        gameMode === "daily"
            ? getSavedDailyResult()
            : null;

    const resultSquares =
        savedDaily?.squares ||
        roundScores.map(scoreSquare).join("");

    const currentScore =
        savedDaily?.score ?? score;

    const modeText =
        gameMode === "daily"
            ? `Daily Challenge · ${displayDate()}`
            : "Practice Mode";

    return [
        "🌊 CornwallTap",
        modeText,
        "",
        `${currentScore}/500`,
        titleForScore(currentScore),
        "",
        resultSquares,
        "",
        "Five places. How well do you know Cornwall?",
        canonicalShareUrl()
    ].join("\n");
}


async function shareScore() {
    const text =
        shareText();

    try {
        if (navigator.share) {
            await navigator.share({
                title: "CornwallTap",
                text
            });

            return;
        }

        await navigator.clipboard.writeText(text);

        showToast(
            "Score copied to clipboard"
        );
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        console.warn(
            "Sharing failed.",
            error
        );

        showToast(
            "Could not share automatically"
        );
    }
}


function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("visible");

    window.setTimeout(
        () => {
            toastElement.classList.remove(
                "visible"
            );
        },
        2200
    );
}


nextButton.addEventListener(
    "click",
    function () {
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


dailyStartButton.addEventListener(
    "click",
    function () {
        const saved =
            getSavedDailyResult();

        if (saved && !dailyLockBypass) {
            viewSavedDailyResult();
            return;
        }

        startMode("daily");
    }
);


practiceStartButton.addEventListener(
    "click",
    function () {
        startMode("practice");
    }
);


statsButton.addEventListener(
    "click",
    showStatisticsScreen
);


statsBackButton.addEventListener(
    "click",
    hideStatisticsScreen
);


resetStatsButton.addEventListener(
    "click",
    function () {
        const confirmed =
            window.confirm(
                "Reset all CornwallTap statistics on this device?"
            );

        if (!confirmed) {
            return;
        }

        localStorage.removeItem(
            statisticsStorageKey
        );

        renderStatistics();
        showToast(
            "Statistics reset"
        );
    }
);


backButton.addEventListener(
    "click",
    showStartScreen
);


playAgainButton.addEventListener(
    "click",
    restartPractice
);


returnButton.addEventListener(
    "click",
    showStartScreen
);


shareButton.addEventListener(
    "click",
    shareScore
);


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


updateStartScreen();
showStartScreen();
