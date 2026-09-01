/*
CornwallTap v2.3.1 - Delight Update

Modes:
- Daily Challenge: same five locations for everyone, one scored attempt per day.
- Practice: random five locations, unlimited games.

Local Live Server addresses bypass the Daily Challenge lock so
development and testing remain easy.
*/

const developerMode = false;

const standardTotalRounds = 5;
let totalRounds = standardTotalRounds;

const difficultyBands = [
    { min: 1, max: 2 },
    { min: 3, max: 4 },
    { min: 5, max: 6 },
    { min: 7, max: 8 },
    { min: 7, max: 10 }
];

const dailyExcludedLocationIds = [
    20,
    45,
    46,
    47,
    50
];

const roundStages = [
    {
        name: "Warm-up",
        share: "Warm-up"
    },
    {
        name: "Finding your feet",
        share: "Finding your feet"
    },
    {
        name: "Local knowledge",
        share: "Local knowledge"
    },
    {
        name: "Expert territory",
        share: "Expert territory"
    },
    {
        name: "The Legend Round",
        share: "Legend Round"
    }
];


/*
Each profile describes what a distance means in gameplay.
Landmarks and natural features are deliberately generous:
recognising the correct area should feel rewarding.
*/
const scoringProfiles = {
    settlement_easy: {
        label: "Settlement scoring",
        points: [
            { km: 0.8, score: 97 },
            { km: 1.8, score: 93 },
            { km: 3.5, score: 82 },
            { km: 6, score: 65 },
            { km: 10, score: 40 },
            { km: 16, score: 15 },
            { km: 20, score: 0 }
        ]
    },

    settlement_standard: {
        label: "Settlement scoring",
        points: [
            { km: 1, score: 97 },
            { km: 2, score: 93 },
            { km: 4, score: 82 },
            { km: 7, score: 65 },
            { km: 12, score: 40 },
            { km: 18, score: 15 },
            { km: 22, score: 0 }
        ]
    },

    landmark_easy: {
        label: "Landmark scoring",
        points: [
            { km: 1.2, score: 97 },
            { km: 2.5, score: 92 },
            { km: 5, score: 82 },
            { km: 9, score: 68 },
            { km: 14, score: 48 },
            { km: 22, score: 25 },
            { km: 35, score: 10 },
            { km: 50, score: 0 }
        ]
    },

    landmark_standard: {
        label: "Landmark scoring",
        points: [
            { km: 1.5, score: 97 },
            { km: 3, score: 92 },
            { km: 6, score: 82 },
            { km: 10, score: 70 },
            { km: 16, score: 52 },
            { km: 25, score: 35 },
            { km: 35, score: 25 },
            { km: 50, score: 15 },
            { km: 65, score: 0 }
        ]
    },

    landmark_remote: {
        label: "Remote landmark scoring",
        points: [
            { km: 2, score: 97 },
            { km: 4, score: 92 },
            { km: 8, score: 82 },
            { km: 14, score: 68 },
            { km: 22, score: 50 },
            { km: 35, score: 32 },
            { km: 50, score: 20 },
            { km: 65, score: 10 },
            { km: 80, score: 0 }
        ]
    },

    natural_standard: {
        label: "Natural feature scoring",
        points: [
            { km: 2, score: 97 },
            { km: 4, score: 92 },
            { km: 8, score: 82 },
            { km: 14, score: 68 },
            { km: 22, score: 50 },
            { km: 32, score: 35 },
            { km: 45, score: 22 },
            { km: 60, score: 10 },
            { km: 75, score: 0 }
        ]
    },

    natural_remote: {
        label: "Remote natural feature scoring",
        points: [
            { km: 2.5, score: 97 },
            { km: 5, score: 92 },
            { km: 10, score: 82 },
            { km: 18, score: 68 },
            { km: 28, score: 50 },
            { km: 42, score: 34 },
            { km: 58, score: 20 },
            { km: 75, score: 10 },
            { km: 90, score: 0 }
        ]
    }
};

const localDevelopmentHosts = [
    "localhost",
    "127.0.0.1"
];

const dailyLockBypass =
    developerMode ||
    localDevelopmentHosts.includes(
        window.location.hostname
    );

const draftTestAvailable =
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
let roundReviews = [];
let practiceUsedIds = [];

let finalReviewData = [];
let finalReviewMode = false;

let analyticsSessionId = null;
let analyticsGameStartedAt = null;
let analyticsPlayerId = null;

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

const draftTestButton =
    document.getElementById("draftTestButton");

if (draftTestAvailable && draftTestButton) {
    draftTestButton.classList.remove("hidden");
}

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

const roundTotalElement =
    document.getElementById("roundTotal");

const roundStageElement =
    document.getElementById("roundStage");

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

const reviewMapButton =
    document.getElementById("reviewMapButton");

const showResultButton =
    document.getElementById("showResultButton");

const finalActions =
    document.getElementById("finalActions");

const shareButton =
    document.getElementById("shareButton");

const playAgainButton =
    document.getElementById("playAgainButton");

const returnButton =
    document.getElementById("returnButton");

const viewAllRoundsButton =
    document.getElementById("viewAllRoundsButton");

const backToSummaryButton =
    document.getElementById("backToSummaryButton");

const toastElement =
    document.getElementById("toast");


/*
CornwallTap map area.

The bounds include mainland Cornwall and the Isles of Scilly,
with a small amount of sea and land around them so the map
does not feel cramped.

Lanivet is used as the starting centre.
*/
const LANIVET_CENTER =
    [50.44437, -4.76287];

const START_ZOOM = 9;

const CORNWALL_AND_SCILLY_BOUNDS =
    L.latLngBounds(
        [49.40, -7.20],
        [51.02, -3.85]
    );


const map = L.map("map", {
    minZoom: 8,
    maxZoom: 18,

    maxBounds:
        CORNWALL_AND_SCILLY_BOUNDS,

    maxBoundsViscosity: 1.0
}).setView(
    LANIVET_CENTER,
    START_ZOOM
);


L.tileLayer(
    "https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/wmts/1.0.0/googlemapscompatible/mapserver/tile/32645/{z}/{y}/{x}",
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


function difficultyBandForRound(roundNumber) {
    return difficultyBands[roundNumber - 1];
}


function scoringProfileName(location) {
    const profileName = location.scoreProfile;

    if (!scoringProfiles[profileName]) {
        console.warn(
            `Unknown score profile '${profileName}' for ${location.name}. ` +
            "Using landmark_standard."
        );
        return "landmark_standard";
    }

    return profileName;
}


function difficultyDistanceMultiplier() {
    return 1;
}


function adjustedProfilePoints(
    profileName,
    difficulty,
    tolerance
) {
    const profile =
        scoringProfiles[profileName];

    const multiplier =
        difficultyDistanceMultiplier(difficulty);

    return [
        {
            km: tolerance,
            score: 100
        },
        ...profile.points.map(
            point => ({
                km: Math.max(
                    point.km * multiplier,
                    tolerance + 0.01
                ),
                score: point.score
            })
        )
    ];
}


function interpolateScore(km, lowerPoint, upperPoint) {
    const distanceRange = upperPoint.km - lowerPoint.km;

    if (distanceRange <= 0) {
        return upperPoint.score;
    }

    const progress = (km - lowerPoint.km) / distanceRange;

    return Math.round(
        lowerPoint.score +
        (upperPoint.score - lowerPoint.score) * progress
    );
}


function calculateScore(
    km,
    location
) {
    const profileName =
        scoringProfileName(location);

    const points =
        adjustedProfilePoints(
            profileName,
            location.difficulty,
            location.tolerance
        );

    if (km <= location.tolerance) {
        return 100;
    }

    for (
        let index = 1;
        index < points.length;
        index += 1
    ) {
        if (km <= points[index].km) {
            return Math.max(
                0,
                Math.min(
                    99,
                    interpolateScore(
                        km,
                        points[index - 1],
                        points[index]
                    )
                )
            );
        }
    }

    return 0;
}


function scoringProfileLabel(location) {
    const profileName = scoringProfileName(location);
    return scoringProfiles[profileName].label;
}


function zeroScoreDistance(location) {
    const profileName = scoringProfileName(location);
    const points = adjustedProfilePoints(
        profileName,
        location.difficulty,
        location.tolerance
    );

    return points[points.length - 1].km;
}

function resultFeedback(points) {
    if (points === 100) {
        return {
            title: "🎯 Perfect!",
            detail: "You knew exactly where this was."
        };
    }

    if (points >= 90) {
        return {
            title: "🌟 Excellent!",
            detail: "You clearly recognised the location."
        };
    }

    if (points >= 75) {
        return {
            title: "🟩 Great knowledge",
            detail: "You found the right area."
        };
    }

    if (points >= 60) {
        return {
            title: "🟨 Good local knowledge",
            detail: "You recognised this part of Cornwall."
        };
    }

    if (points >= 40) {
        return {
            title: "🟨 Good guess",
            detail: "You had the right district."
        };
    }

    if (points >= 20) {
        return {
            title: "🟧 Roughly right",
            detail: "You were on the right side of Cornwall."
        };
    }

    if (points > 0) {
        return {
            title: "🟥 Not this time",
            detail: "Tomorrow's challenge could suit you better."
        };
    }

    return {
        title: "🧭 One to remember",
        detail: "Now you know where it is for next time."
    };
}


function titleForScore(finalScore) {
    if (finalScore >= 450) return "Kernow Legend";
    if (finalScore >= 350) return "Cornwall Expert";
    if (finalScore >= 250) return "Local Guide";
    if (finalScore >= 150) return "Adventurer";
    return "Explorer";
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



function roundStage(roundNumber) {
    return roundStages[roundNumber - 1] || {
        name: `Round ${roundNumber}`,
        share: `Round ${roundNumber}`
    };
}


function finalCelebration(finalScore) {
    if (finalScore >= 450) {
        return {
            emoji: "👑🌊👑",
            ribbon: "An exceptional Cornwall performance",
            message:
                "You navigated Cornwall like a true Kernow legend. That is a score worth sharing."
        };
    }

    if (finalScore >= 350) {
        return {
            emoji: "🏆🌊🏆",
            ribbon: "Brilliant local knowledge",
            message:
                "You knew Cornwall extremely well today. Tomorrow's challenge is waiting."
        };
    }

    if (finalScore >= 250) {
        return {
            emoji: "🗺️✨🗺️",
            ribbon: "A strong trip around Cornwall",
            message:
                "You found plenty of the right areas and built a score to be proud of."
        };
    }

    if (finalScore >= 150) {
        return {
            emoji: "🌊🧭🌊",
            ribbon: "A proper Cornish adventure",
            message:
                "Some places landed, some will be easier next time. Come back tomorrow and beat it."
        };
    }

    return {
        emoji: "🧭🌊🧭",
        ribbon: "Five new places explored",
        message:
            "Today was a tough route around Cornwall. You now know five more places for next time."
    };
}


function shareScoreEmoji(points) {
    if (points >= 95) return "🎯";
    if (points >= 80) return "🟢";
    if (points >= 60) return "🟡";
    if (points >= 40) return "🟠";
    return "🔴";
}


function shareRoundLine(scores) {
    return scores
        .map(
            points =>
                `${points}${shareScoreEmoji(points)}`
        )
        .join(" ");
}


function compactShareTitle(finalScore) {
    if (finalScore >= 450) return "Kernow Legend";
    if (finalScore >= 350) return "Kernow Expert";
    if (finalScore >= 250) return "Local Guide";
    if (finalScore >= 150) return "Adventurer";
    return "Explorer";
}


function shareDisplayDate() {
    return new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone: "Europe/London",
            day: "numeric",
            month: "short"
        }
    ).format(new Date());
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
    "cornwallTapStatistics-v3-profile-pipeline";


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
        dailyRounds75Plus: 0,
        dailyZeroRounds: 0,
        dailyTotalRoundScore: 0,
        dailyRoundsRecorded: 0,
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

    statistics.dailyRounds75Plus +=
        roundScores.filter(
            points => points >= 75
        ).length;

    statistics.dailyZeroRounds +=
        roundScores.filter(
            points => points === 0
        ).length;

    statistics.dailyTotalRoundScore +=
        roundScores.reduce(
            (total, points) => total + points,
            0
        );

    statistics.dailyRoundsRecorded +=
        roundScores.length;

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
        ),
        statisticsCard(
            "💚",
            statistics.dailyRounds75Plus,
            "Daily rounds scoring 75+"
        ),
        statisticsCard(
            "🧭",
            statistics.dailyZeroRounds,
            "Zero-score Daily rounds"
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




function dailyAttemptStorageKey() {
    return `cornwallTapDailyAttempt-${currentDateKey()}`;
}


function getSavedDailyAttempt() {
    const saved = localStorage.getItem(dailyAttemptStorageKey());

    if (!saved) {
        return null;
    }

    try {
        const attempt = JSON.parse(saved);

        if (attempt.date !== currentDateKey()) {
            localStorage.removeItem(dailyAttemptStorageKey());
            return null;
        }

        return attempt;
    } catch (error) {
        console.warn(
            "Stored Daily Challenge attempt could not be read.",
            error
        );
        return null;
    }
}


function saveDailyAttempt() {
    if (gameMode !== "daily" || dailyLockBypass) {
        return;
    }

    const attempt = {
        date: currentDateKey(),
        score,
        roundScores: [...roundScores],
        roundDistances: [...roundDistances],
        roundLocations: [...roundLocations],
        roundReviews: roundReviews.map(review => ({ ...review })),
        sessionId: analyticsSessionId,
        startedAt: analyticsGameStartedAt
    };

    localStorage.setItem(
        dailyAttemptStorageKey(),
        JSON.stringify(attempt)
    );
}


function clearDailyAttempt() {
    localStorage.removeItem(dailyAttemptStorageKey());
}


function resumeDailyAttempt(attempt) {
    gameMode = "daily";
    totalRounds = standardTotalRounds;
    resetGameState();

    score = Number(attempt.score) || 0;
    roundScores = Array.isArray(attempt.roundScores) ? [...attempt.roundScores] : [];
    roundDistances = Array.isArray(attempt.roundDistances) ? [...attempt.roundDistances] : [];
    roundLocations = Array.isArray(attempt.roundLocations) ? [...attempt.roundLocations] : [];
    roundReviews = Array.isArray(attempt.roundReviews)
        ? attempt.roundReviews.map(review => ({ ...review }))
        : [];

    analyticsPlayerId = getAnalyticsPlayerId();
    analyticsSessionId = attempt.sessionId || createAnalyticsSessionId();
    analyticsGameStartedAt = Number(attempt.startedAt) || Date.now();

    scoreElement.textContent = score;
    modeLabelElement.textContent = "Today's Challenge";
    challengeDateElement.textContent = displayDate();

    if (roundTotalElement) {
        roundTotalElement.textContent = totalRounds;
    }

    showGameScreen();

    if (roundScores.length >= totalRounds) {
        round = totalRounds;
        showFinalResult();
        return;
    }

    round = roundScores.length + 1;
    startRound();
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
        roundDistances: [...roundDistances],
        locations: [...roundLocations],
        roundReviews: roundReviews.map(review => ({ ...review })),
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

    const savedAttempt =
        getSavedDailyAttempt();

    if (savedResult && !dailyLockBypass) {
        dailyStartButton.textContent =
            "View Today's Result";

        dailyStatusElement.textContent =
            `Completed today: ${savedResult.score}/500 · ${savedResult.title}`;
    } else if (savedAttempt && !dailyLockBypass) {
        dailyStartButton.textContent =
            "Continue Today's Challenge";

        const completedRounds =
            Array.isArray(savedAttempt.roundScores)
                ? savedAttempt.roundScores.length
                : 0;

        dailyStatusElement.textContent =
            completedRounds > 0
                ? `Attempt in progress · ${completedRounds} of ${standardTotalRounds} rounds completed.`
                : "Attempt in progress · continue today's challenge.";
    } else {
        dailyStartButton.textContent =
            "Play Today's Challenge";

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


function legacyDailyDayNumber(dateKey) {
    const date =
        new Date(`${dateKey}T00:00:00Z`);

    const epoch =
        new Date("2026-08-11T00:00:00Z");

    return Math.floor(
        (date - epoch) /
        (24 * 60 * 60 * 1000)
    );
}


function legacyDailyLocationOrder(possible, band) {
    return [...possible].sort(
        (first, second) => {
            const firstSeed =
                textSeed(
                    `cornwalltap-band-${band.min}-${band.max}-location-${first.id}`
                );

            const secondSeed =
                textSeed(
                    `cornwalltap-band-${band.min}-${band.max}-location-${second.id}`
                );

            return firstSeed - secondSeed;
        }
    );
}


/*
Daily selector v4 begins on 26 August 2026.

The real Daily challenges from 14-25 August are frozen below by location ID.
That historical record must not be rebuilt from the current location pool,
because locations can later be added, removed or moved between difficulty bands.
*/
const dailyV4SelectorVersion = "v4";
const dailyV4EpochKey = "2026-08-26";
const dailyRepeatProtectionDays = 19;
const dailyR45RepeatProtectionDays = 16;
const dailyMinimumSeparationKm = 15;

const frozenDailyHistoryIds = [
    [73, 30, 95, 43, 84],
    [74, 31, 96, 44, 88],
    [1, 32, 103, 48, 87],
    [2, 53, 104, 69, 89],
    [3, 55, 105, 70, 94],
    [4, 61, 106, 79, 90],
    [21, 62, 107, 84, 91],
    [22, 71, 108, 88, 97],
    [23, 72, 109, 89, 98],
    [24, 75, 113, 90, 99],
    [25, 76, 114, 94, 100],
    [26, 77, 9, 97, 110]
];


function frozenDailyHistory() {
    const byId = new Map(
        locations.map(location => [location.id, location])
    );

    return frozenDailyHistoryIds.map((challengeIds, dayIndex) =>
        challengeIds.map((id, roundIndex) => {
            const location = byId.get(id);

            if (!location) {
                throw new Error(
                    `Frozen Daily history is missing location ID ${id} ` +
                    `(history day ${dayIndex + 1}, round ${roundIndex + 1}).`
                );
            }

            return location;
        })
    );
}


function dailyV4DayNumber(dateKey) {
    const date =
        new Date(`${dateKey}T00:00:00Z`);

    const epoch =
        new Date(`${dailyV4EpochKey}T00:00:00Z`);

    return Math.floor(
        (date - epoch) /
        (24 * 60 * 60 * 1000)
    );
}


function dailyV4LocationOrder(possible, band) {
    return [...possible].sort(
        (first, second) => {
            const firstSeed = textSeed(
                `cornwalltap-${dailyV4SelectorVersion}-band-${band.min}-${band.max}-location-${first.id}`
            );

            const secondSeed = textSeed(
                `cornwalltap-${dailyV4SelectorVersion}-band-${band.min}-${band.max}-location-${second.id}`
            );

            return firstSeed - secondSeed || first.id - second.id;
        }
    );
}


function dailyV4Pools() {
    return difficultyBands.map(band => {
        const possible = locations.filter(
            location =>
                location.difficulty >= band.min &&
                location.difficulty <= band.max &&
                !dailyExcludedLocationIds.includes(location.id)
        );

        if (possible.length === 0) {
            throw new Error(
                `No locations available for difficulty ${band.min}-${band.max}.`
            );
        }

        return dailyV4LocationOrder(possible, band);
    });
}


function farEnoughFromChallenge(candidate, challenge) {
    return challenge.every(location =>
        distanceInKm(
            candidate.lat,
            candidate.lon,
            location.lat,
            location.lon
        ) >= dailyMinimumSeparationKm
    );
}


function generateV4DailyChallenge(dateKey) {
    const targetDayNumber =
        dailyV4DayNumber(dateKey);

    if (targetDayNumber < 0) {
        throw new Error(
            `Daily selector ${dailyV4SelectorVersion} only supports dates from ${dailyV4EpochKey}.`
        );
    }

    const pools = dailyV4Pools();

    // Seed v4 with the real challenges served from 14-25 August.
    const recentChallenges = frozenDailyHistory();
    let targetChallenge = null;

    for (
        let dayNumber = 0;
        dayNumber <= targetDayNumber;
        dayNumber += 1
    ) {
        const challenge = [];

        for (
            let roundIndex = 0;
            roundIndex < standardTotalRounds;
            roundIndex += 1
        ) {
            const relevantHistory =
                roundIndex >= 3
                    ? recentChallenges.slice(-dailyR45RepeatProtectionDays)
                    : recentChallenges.slice(-dailyRepeatProtectionDays);

            /*
            Rounds 4 and 5 share overlapping difficulty pools.
            A location used in either position is therefore protected
            from BOTH positions during the R4/R5 protection window.
            */
            const protectedIds = new Set(
                roundIndex >= 3
                    ? relevantHistory
                        .flatMap(previous => [previous[3], previous[4]])
                        .filter(Boolean)
                        .map(location => location.id)
                    : relevantHistory
                        .map(previous => previous[roundIndex])
                        .filter(Boolean)
                        .map(location => location.id)
            );

            const ordered = pools[roundIndex];
            const startIndex = (
                dayNumber +
                textSeed(
                    `${dailyV4SelectorVersion}-round-${roundIndex + 1}`
                )
            ) % ordered.length;

            let selected = null;

            for (
                let offset = 0;
                offset < ordered.length;
                offset += 1
            ) {
                const candidate =
                    ordered[(startIndex + offset) % ordered.length];

                if (protectedIds.has(candidate.id)) {
                    continue;
                }

                if (
                    challenge.some(
                        location => location.id === candidate.id
                    )
                ) {
                    continue;
                }

                if (!farEnoughFromChallenge(candidate, challenge)) {
                    continue;
                }

                selected = candidate;
                break;
            }

            if (!selected) {
                const protection =
                    roundIndex >= 3
                        ? `${dailyR45RepeatProtectionDays}-day R4/R5 cross-round repeat protection`
                        : `${dailyRepeatProtectionDays}-day same-round repeat protection`;

                throw new Error(
                    `Daily selector ${dailyV4SelectorVersion} could not build ${dateKey} round ${roundIndex + 1}. ` +
                    `The ${protection} or ${dailyMinimumSeparationKm} km separation rule needs a larger eligible pool.`
                );
            }

            challenge.push(selected);
        }

        recentChallenges.push(challenge);

        // Rounds 1-3 use the longer 19-day protection window.
        while (
            recentChallenges.length > dailyRepeatProtectionDays
        ) {
            recentChallenges.shift();
        }

        if (dayNumber === targetDayNumber) {
            targetChallenge = challenge;
        }
    }

    return targetChallenge;
}


function selectLegacyDailyLocation() {
    const band =
        difficultyBandForRound(round);

    const possible =
        locations.filter(
            location =>
                location.difficulty >= band.min &&
                location.difficulty <= band.max &&
                !dailyExcludedLocationIds.includes(location.id)
        );

    if (possible.length === 0) {
        throw new Error(
            `No locations available for difficulty ${band.min}-${band.max}.`
        );
    }

    const ordered =
        legacyDailyLocationOrder(
            possible,
            band
        );

    const dayNumber =
        legacyDailyDayNumber(
            currentDateKey()
        );

    for (
        let offset = 0;
        offset < ordered.length;
        offset += 1
    ) {
        const candidate =
            ordered[(dayNumber + offset) % ordered.length];

        if (
            !roundLocations.includes(
                candidate.name
            )
        ) {
            current = candidate;
            return;
        }
    }

    throw new Error(
        `No unused legacy Daily locations available for difficulty ${band.min}-${band.max}.`
    );
}


function selectDailyLocation() {
    if (currentDateKey() < dailyV4EpochKey) {
        selectLegacyDailyLocation();
        return;
    }

    const challenge =
        generateV4DailyChallenge(
            currentDateKey()
        );

    current = challenge[round - 1];

    if (!current) {
        throw new Error(
            `No Daily location generated for round ${round}.`
        );
    }
}


function selectPracticeLocation() {
    const band =
        difficultyBandForRound(round);

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



function selectDraftTestLocation() {
    current =
        locations[round - 1];

    if (!current) {
        throw new Error(
            `No draft test location exists for round ${round}.`
        );
    }
}


function selectLocation() {
    if (gameMode === "daily") {
        selectDailyLocation();
        return;
    }

    if (gameMode === "draft_test") {
        selectDraftTestLocation();
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
    roundReviews = [];
    finalReviewData = [];
    finalReviewMode = false;
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
    clearFinalReviewMap();
    finalReviewMode = false;
    viewAllRoundsButton.classList.add("hidden");
    backToSummaryButton.classList.add("hidden");

    gameScreen.classList.add("hidden");
    statsScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");

    updateStartScreen();
}

function getAnalyticsPlayerId() {
    const storageKey = "cornwallTapAnalyticsPlayerId";

    let playerId =
        localStorage.getItem(storageKey);

    if (playerId) {
        return playerId;
    }

    if (window.crypto?.randomUUID) {
        playerId =
            window.crypto.randomUUID();
    } else {
        playerId = [
            Date.now().toString(36),
            Math.random().toString(36).slice(2)
        ].join("-");
    }

    localStorage.setItem(
        storageKey,
        playerId
    );

    return playerId;
}

function analyticsDeviceType() {
    return window.matchMedia("(max-width: 650px)").matches
        ? "mobile"
        : "desktop";
}


function createAnalyticsSessionId() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return [
        Date.now().toString(36),
        Math.random().toString(36).slice(2)
    ].join("-");
}


function analyticsDurationSeconds() {
    if (!analyticsGameStartedAt) {
        return null;
    }

    return Math.max(
        0,
        Math.round(
            (Date.now() - analyticsGameStartedAt) / 1000
        )
    );
}


function trackEvent(eventType, details = {}) {
    if (localDevelopmentHosts.includes(window.location.hostname)) {
        return;
    }

    const payload = {
    event_type: eventType,
    game_mode: gameMode,
    challenge_date: currentDateKey(),
    session_id: analyticsSessionId,
    player_id: analyticsPlayerId,
    device_type: analyticsDeviceType(),
    ...details
};

    fetch("/api/event", {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(payload),
        keepalive: true
    }).catch(error => {
        console.warn(
            "Analytics event could not be sent.",
            error
        );
    });
}

function startMode(selectedMode) {
    /*
    Defence-in-depth for the Daily Challenge lock.
    Any code path that tries to start a Daily must first respect an
    existing completed result or in-progress attempt. The Daily button
    already performs these checks, but keeping the guard here prevents
    another caller from accidentally creating a second Daily session.
    */
    if (selectedMode === "daily" && !dailyLockBypass) {
        const savedResult = getSavedDailyResult();

        if (savedResult) {
            viewSavedDailyResult();
            return;
        }

        const savedAttempt = getSavedDailyAttempt();

        if (savedAttempt) {
            resumeDailyAttempt(savedAttempt);
            return;
        }
    }

    const localDraftBatch =
        draftTestAvailable &&
        selectedMode === "practice" &&
        Array.isArray(locations) &&
        locations.length > 0 &&
        locations.length <= 40;

    gameMode =
        localDraftBatch
            ? "draft_test"
            : selectedMode;

    totalRounds =
        gameMode === "draft_test"
            ? locations.length
            : standardTotalRounds;

    resetGameState();

    analyticsPlayerId =
    getAnalyticsPlayerId();
    
analyticsSessionId =
    createAnalyticsSessionId();

analyticsGameStartedAt =
    Date.now();

trackEvent("game_started");

if (gameMode === "daily") {
    saveDailyAttempt();
}

modeLabelElement.textContent =
        gameMode === "daily"
            ? "Today's Challenge"
            : gameMode === "draft_test"
                ? "Draft Location Test"
                : "Practice Mode";

    challengeDateElement.textContent =
        displayDate();

    if (roundTotalElement) {
        roundTotalElement.textContent =
            totalRounds;
    }

    showGameScreen();
    startRound();
}


function startRound() {
    clearMapReveal();
    hideResultModal();

    guessed = false;

    finalActions.classList.add("hidden");
    viewAllRoundsButton.classList.add("hidden");
    backToSummaryButton.classList.add("hidden");
    reviewMapButton.classList.add("hidden");
    showResultButton.classList.add("hidden");
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
    current.category;

    roundElement.textContent = round;
    roundStageElement.textContent =
        gameMode === "draft_test"
            ? `Draft ${round} of ${totalRounds}`
            : roundStage(round).name;
    scoreElement.textContent = score;

    updateProgress();

    map.setView(
        LANIVET_CENTER,
        START_ZOOM
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

        const points =
            calculateScore(
                km,
                current
            );

        const feedback =
            resultFeedback(points);

        score += points;

        roundScores.push(points);
roundDistances.push(km);
roundReviews.push({
    roundNumber: round,
    locationName: current.name,
    category: current.category,
    score: points,
    distanceKm: km,
    guessLat: event.latlng.lat,
    guessLon: event.latlng.lng,
    answerLat: current.lat,
    answerLon: current.lon
});

if (gameMode === "daily") {
    saveDailyAttempt();
}

trackEvent(
    "round_completed",
    {
        round_number: round,
        location_name: current.name,
        location_category: current.category,
        round_score: points,
        distance_km: Number(km.toFixed(3))
    }
);

scoreElement.textContent =
            score;

        progressFill.style.width =
            `${(round / totalRounds) * 100}%`;

        resultElement.innerHTML = `
            <div class="result-card">

                <div class="round-result-stage">
                    ${
                        gameMode === "draft_test"
                            ? `Draft ${round} of ${totalRounds}`
                            : roundStage(round).name
                    }
                </div>

                <div class="result-category">
    ${current.category}
</div>

                <h2>${current.name}</h2>

                <div class="result-message">
                    ${feedback.title}
                </div>

                <div class="knowledge-message">
                    ${feedback.detail}
                </div>

                <div class="round-score">
                    ${points}<span>/100</span>
                </div>

                <div class="distance-result">
                    You were ${displayDistance(km)} away
                </div>

                <div class="scoring-profile">
                    ${scoringProfileLabel(current)}
                </div>

                ${
                    (developerMode || gameMode === "draft_test")
                        ? `
                            <div class="diagnostic-note">
                                Zero-score distance:
                                ${zeroScoreDistance(
                                    current
                                ).toFixed(1)} km
                            </div>
                        `
                        : ""
                }

                <div class="location-fact">
                    <strong>Did you know?</strong><br>
                    ${current.fact}
                </div>

                ${
                    (developerMode || gameMode === "draft_test")
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
        reviewMapButton.classList.remove("hidden");

        nextButton.textContent =
            round === totalRounds
                ? (
                    gameMode === "draft_test"
                        ? "Finish draft test"
                        : "See final result"
                )
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
    scoresList,
    distancesList = [],
    reviewAvailable = false
) {
    if (!Array.isArray(locationsList) || locationsList.length === 0) {
        return "";
    }

    const items = locationsList.map((locationName, index) => `
        <li class="journey-item">
            <span class="journey-number">${index + 1}</span>

            <span class="journey-details">
                <span class="journey-name">${locationName}</span>
                ${
                    Number.isFinite(distancesList?.[index])
                        ? `<span class="journey-distance">${displayDistance(distancesList[index])} away</span>`
                        : ""
                }
            </span>

            <span class="journey-score">
                ${scoresList?.[index] ?? "–"}/100
            </span>

            ${
                reviewAvailable
                    ? `<button type="button" class="journey-review-button" data-review-round="${index}">Review</button>`
                    : ""
            }
        </li>
    `).join("");

    return `
        <div class="journey">
            <h3>Today's Cornwall Journey</h3>
            <ol class="journey-list">${items}</ol>
        </div>
    `;
}


function finalResultHtml({
    finalScore,
    resultTitle,
    squares,
    locationsList = [],
    scoresList = [],
    distancesList = [],
    reviewAvailable = false,
    saved = false
}) {
    const celebration =
        finalCelebration(finalScore);

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

            <div class="final-kicker">
                ${
                    gameMode === "daily"
                        ? "Today's Cornwall journey"
                        : "Practice journey complete"
                }
            </div>

            <div class="final-celebration">
                ${celebration.emoji}
            </div>

            <h2>${resultTitle}</h2>

            <div class="score-ribbon">
                ${celebration.ribbon}
            </div>

            <div class="final-score">
                ${finalScore}<span>/500</span>
            </div>

            <div class="round-summary">
                ${squares}
            </div>

            <div class="final-message">
                ${celebration.message}
            </div>

            ${journeyHtml(
                locationsList,
                scoresList,
                distancesList,
                reviewAvailable
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
                                    Bullseyes
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
                                    Toughest round
                                </span>
                                <span class="stat-value">
                                    ${worstRound()}/100
                                </span>
                            </div>

                        </div>
                    `
            }

            <div class="share-preview">
                Share your five coloured squares and challenge your friends.
            </div>

        </div>
    `;
}


function normaliseReviewData(reviews) {
    if (!Array.isArray(reviews)) {
        return [];
    }

    return reviews.filter(review =>
        Number.isFinite(review?.guessLat) &&
        Number.isFinite(review?.guessLon) &&
        Number.isFinite(review?.answerLat) &&
        Number.isFinite(review?.answerLon)
    );
}


function setFinalReviewData(reviews) {
    finalReviewData = normaliseReviewData(reviews);
    viewAllRoundsButton.classList.toggle(
        "hidden",
        finalReviewData.length === 0
    );
}


function clearFinalReviewMap() {
    clearMapReveal();

    map.eachLayer(layer => {
        if (layer._cornwallTapFinalReview) {
            map.removeLayer(layer);
        }
    });
}


function markAsFinalReview(layer) {
    layer._cornwallTapFinalReview = true;
    return layer;
}


function showFinalReview(roundIndex = null) {
    if (!finalReviewData.length) {
        return;
    }

    hideResultModal();
    clearFinalReviewMap();
    finalReviewMode = true;

    const reviews =
        roundIndex === null
            ? finalReviewData
            : [finalReviewData[roundIndex]].filter(Boolean);

    if (reviews.length === 0) {
        showFinalSummary();
        return;
    }

    const bounds = [];

    reviews.forEach(review => {
        const guessLatLng =
            L.latLng(review.guessLat, review.guessLon);

        const answerLatLng =
            L.latLng(review.answerLat, review.answerLon);

        const guess = markAsFinalReview(
            createGuessMarker(guessLatLng)
        );

        const answer = markAsFinalReview(
            createAnswerMarker(answerLatLng)
        );

        markAsFinalReview(
            L.polyline(
                [guessLatLng, answerLatLng],
                {
                    weight: 3,
                    dashArray: "8, 8"
                }
            ).addTo(map)
        );

        guess.bindTooltip(
            `R${review.roundNumber}: your guess`,
            { direction: "top" }
        );

        answer.bindTooltip(
            `R${review.roundNumber}: ${review.locationName}`,
            { direction: "top" }
        );

        bounds.push(guessLatLng, answerLatLng);
    });

    backToSummaryButton.classList.remove("hidden");

    window.setTimeout(
        () => {
            map.invalidateSize();
            map.fitBounds(
                L.latLngBounds(bounds),
                {
                    padding: [45, 45],
                    maxZoom: roundIndex === null ? 11 : 14
                }
            );
        },
        50
    );
}


function showFinalSummary() {
    clearFinalReviewMap();
    finalReviewMode = false;
    backToSummaryButton.classList.add("hidden");
    showResultModal();
}


function bindJourneyReviewButtons() {
    resultElement
        .querySelectorAll("[data-review-round]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => showFinalReview(
                    Number(button.dataset.reviewRound)
                )
            );
        });
}


function showFinalResult() {
    gameFinished = true;

    clearMapReveal();

    targetElement.textContent =
        "Challenge complete";

    roundStageElement.textContent =
        "Journey complete";

    categoryElement.textContent =
        gameMode === "daily"
            ? "Today's Challenge"
            : "Practice Mode";

    const resultSquares =
        roundScores
            .map(scoreSquare)
            .join("");

    setFinalReviewData(roundReviews);

    recordCompletedGame();

    if (gameMode === "daily") {
        saveDailyResult();
        clearDailyAttempt();
    }

trackEvent(
    "game_completed",
    {
        final_score: score,
        duration_seconds:
            analyticsDurationSeconds()
    }
);

resultElement.innerHTML =
        finalResultHtml({
            finalScore: score,
            resultTitle: titleForScore(score),
            squares: resultSquares,
            locationsList: roundLocations,
            scoresList: roundScores,
            distancesList: roundDistances,
            reviewAvailable: finalReviewData.length > 0
        });

    bindJourneyReviewButtons();

    reviewMapButton.classList.add("hidden");
    showResultButton.classList.add("hidden");
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
        LANIVET_CENTER,
        START_ZOOM
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
        "Today's Challenge";

    challengeDateElement.textContent =
        displayDate();

    showGameScreen();

    targetElement.textContent =
        "Challenge complete";

    categoryElement.textContent =
        "Today's Challenge";

    roundElement.textContent = totalRounds;
    roundStageElement.textContent =
        "Challenge complete";
    scoreElement.textContent = saved.score;
    progressFill.style.width = "100%";

    setFinalReviewData(saved.roundReviews || []);

    resultElement.innerHTML =
        finalResultHtml({
            finalScore: saved.score,
            resultTitle: saved.title,
            squares: saved.squares,
            locationsList: saved.locations || [],
            scoresList: saved.roundScores || [],
            distancesList: saved.roundDistances || [],
            reviewAvailable: finalReviewData.length > 0,
            saved: true
        });

    bindJourneyReviewButtons();

    reviewMapButton.classList.add("hidden");
    showResultButton.classList.add("hidden");
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
    return "cornwalltap.co.uk";

}


function shareText() {
    const savedDaily =
        gameMode === "daily"
            ? getSavedDailyResult()
            : null;

    const scores =
        savedDaily?.roundScores ||
        roundScores;

    const currentScore =
        savedDaily?.score ?? score;

    const header =
    gameMode === "daily"
        ? `CornwallTap • ${shareDisplayDate()}`
        : "CornwallTap • Practice";

return [
    header,
    "",
    shareRoundLine(scores),
    "",
    `${currentScore}/500 • ${compactShareTitle(currentScore)}`,
    "",
    canonicalShareUrl()
].join("\n");
}


async function shareScore() {
    trackEvent(
        "share_clicked",
        {
            final_score:
                gameMode === "daily"
                    ? getSavedDailyResult()?.score ?? score
                    : score,
            duration_seconds:
                analyticsDurationSeconds()
        }
    );

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


reviewMapButton.addEventListener(
    "click",
    function () {
        if (!guessed || gameFinished) {
            return;
        }

        hideResultModal();
        showResultButton.classList.remove("hidden");

        window.setTimeout(
            () => map.invalidateSize(),
            50
        );
    }
);


showResultButton.addEventListener(
    "click",
    function () {
        if (!guessed || gameFinished) {
            return;
        }

        showResultButton.classList.add("hidden");
        showResultModal();
    }
);


nextButton.addEventListener(
    "click",
    function () {
        if (!guessed) {
            return;
        }

        if (
            gameMode === "draft_test" &&
            round === totalRounds
        ) {
            showToast(
                `All ${totalRounds} draft locations tested`
            );

            totalRounds = standardTotalRounds;

            if (roundTotalElement) {
                roundTotalElement.textContent =
                    totalRounds;
            }

            showStartScreen();
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

        const savedAttempt =
            getSavedDailyAttempt();

        if (savedAttempt && !dailyLockBypass) {
            resumeDailyAttempt(savedAttempt);
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


if (draftTestButton) {
    draftTestButton.addEventListener(
        "click",
        function () {
            if (!draftTestAvailable) {
                return;
            }

            startMode("draft_test");
        }
    );
}


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


viewAllRoundsButton.addEventListener(
    "click",
    function () {
        showFinalReview();
    }
);


backToSummaryButton.addEventListener(
    "click",
    showFinalSummary
);


shareButton.addEventListener(
    "click",
    shareScore
);


function showResultModal() {
    showResultButton.classList.add("hidden");
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
