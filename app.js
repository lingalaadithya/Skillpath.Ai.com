/* =========================================================
   SkillPath AI - Frontend Application
   ========================================================= */

"use strict";

/* ---------------------------------------------------------
   Global State
   --------------------------------------------------------- */

let skills = [];
let typingLevels = [];
let roadmaps = [];
let projects = [];

let currentFilter = "All";

let currentTypingLevel = 1;
let typingStarted = false;
let typingStartTime = 0;
let typingTimer = null;

let paragraphStarted = false;
let paragraphStartTime = 0;
let paragraphTimer = null;

const STORAGE_KEY = "skillpathTypingProgress";

let typingProgress = loadTypingProgress();

/* ---------------------------------------------------------
   DOM Helpers
   --------------------------------------------------------- */

function $(selector) {
    return document.querySelector(selector);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}

/* ---------------------------------------------------------
   HTML Safety
   --------------------------------------------------------- */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ---------------------------------------------------------
   Application Start
   --------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupFilters();
    setupTypingControls();
    setupMentor();
    setupSmoothScrolling();

    loadApplicationData();
});

/* ---------------------------------------------------------
   Load Backend Data
   --------------------------------------------------------- */

async function loadApplicationData() {
    try {
        await Promise.all([
            loadSkills(),
            loadTypingLevels(),
            loadRoadmaps(),
            loadProjects()
        ]);
    } catch (error) {
        console.error("SkillPath loading error:", error);
        showGlobalError();
    }
}

/* ---------------------------------------------------------
   Skills
   --------------------------------------------------------- */

async function loadSkills() {
    try {
        const response = await fetch("/api/skills");

        if (!response.ok) {
            throw new Error("Could not load skills.");
        }

        const data = await response.json();

        skills = Array.isArray(data)
            ? data
            : Array.isArray(data.skills)
                ? data.skills
                : [];

        renderSkills();
    } catch (error) {
        console.error("Skills error:", error);

        const container = $("#skills-grid");

        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📚</span>
                    <h3>Skills are unavailable</h3>
                    <p>Please refresh the page and try again.</p>
                </div>
            `;
        }
    }
}

function renderSkills() {
    const container = $("#skills-grid");

    if (!container) {
        return;
    }

    let filteredSkills = skills;

    if (currentFilter !== "All") {
        filteredSkills = skills.filter(
            skill =>
                String(skill.category || "").toLowerCase() ===
                currentFilter.toLowerCase()
        );
    }

    if (!filteredSkills.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span>🔎</span>
                <h3>No skills found</h3>
                <p>Try another filter.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredSkills.map(skill => {
        const category = escapeHTML(skill.category || "Skill");
        const level = escapeHTML(skill.level || "Beginner");
        const title = escapeHTML(skill.title || "Skill");
        const description = escapeHTML(
            skill.description || "Explore this skill and build practical knowledge."
        );
        const icon = escapeHTML(skill.icon || "📘");

        return `
            <article class="skill-card">
                <div class="skill-icon">${icon}</div>

                <div class="skill-card-content">
                    <span class="skill-category">${category}</span>

                    <h3>${title}</h3>

                    <p>${description}</p>

                    <div class="skill-card-footer">
                        <span>📈 ${level}</span>
                        <button
                            type="button"
                            class="skill-start-btn"
                            data-skill="${escapeHTML(skill.id || skill.title || "")}"
                        >
                            Start Learning →
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    setupSkillButtons();
}

function setupSkillButtons() {
    $all(".skill-start-btn").forEach(button => {
        button.addEventListener("click", () => {
            const skillId = button.dataset.skill;

            const selectedSkill = skills.find(
                skill =>
                    String(skill.id || "") === String(skillId) ||
                    String(skill.title || "") === String(skillId)
            );

            if (!selectedSkill) {
                return;
            }

            openSkillInMentor(selectedSkill);
        });
    });
}

function openSkillInMentor(skill) {
    const mentorInput = $("#mentor-input");

    if (!mentorInput) {
        return;
    }

    const title = skill.title || "this skill";

    mentorInput.value =
        `Teach me ${title} in detail. ` +
        `Explain it step by step with a real-world example, ` +
        `common mistakes, a practical example, and exercises.`;

    const mentorSection = $("#mentor");

    if (mentorSection) {
        mentorSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    setTimeout(() => {
        mentorInput.focus();
    }, 500);
}

/* ---------------------------------------------------------
   Skill Filters
   --------------------------------------------------------- */

function setupFilters() {
    $all(".filter").forEach(button => {
        button.addEventListener("click", () => {
            $all(".filter").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            currentFilter = button.dataset.filter || "All";

            renderSkills();
        });
    });
}

/* ---------------------------------------------------------
   Typing Levels
   --------------------------------------------------------- */

async function loadTypingLevels() {
    try {
        const response = await fetch("/api/typing");

        if (!response.ok) {
            throw new Error("Could not load typing levels.");
        }

        const data = await response.json();

        typingLevels = Array.isArray(data)
            ? data
            : Array.isArray(data.levels)
                ? data.levels
                : [];

        if (!typingLevels.length) {
            throw new Error("No typing levels returned.");
        }

        renderTypingLevels();
        updateTypingInterface();
    } catch (error) {
        console.error("Typing levels error:", error);

        typingLevels = createFallbackTypingLevels();

        renderTypingLevels();
        updateTypingInterface();
    }
}

function createFallbackTypingLevels() {
    return [
        {
            level: 1,
            difficulty: "Easy",
            text: "Learning one small skill every day can create a strong foundation for the future."
        },
        {
            level: 2,
            difficulty: "Easy",
            text: "Practice makes typing smoother because your fingers learn common patterns through repetition."
        },
        {
            level: 3,
            difficulty: "Easy",
            text: "Good typing accuracy helps you write code, notes, messages, and ideas with greater confidence."
        },
        {
            level: 4,
            difficulty: "Medium",
            text: "Web developers use HTML, CSS, and JavaScript together to create useful and interactive digital experiences."
        },
        {
            level: 5,
            difficulty: "Medium",
            text: "A consistent learning routine helps you understand difficult topics by turning large goals into smaller achievable steps."
        },
        {
            level: 6,
            difficulty: "Hard",
            text: "Building a software project teaches you how different ideas connect, from planning and interface design to testing and improvement."
        },
        {
            level: 7,
            difficulty: "Hard",
            text: "When solving programming problems, read the requirements carefully, break the task into smaller parts, and test each part before moving forward."
        },
        {
            level: 8,
            difficulty: "Hard",
            text: "Modern technology changes quickly, so developers benefit from practicing fundamentals while also exploring new tools and ideas."
        },
        {
            level: 9,
            difficulty: "Very Hard",
            text: "Successful project development requires patience, clear communication, careful debugging, thoughtful design, and continuous improvement throughout the process."
        },
        {
            level: 10,
            difficulty: "Very Hard",
            text: "A strong technical foundation allows you to approach complex challenges methodically, experiment with different solutions, learn from mistakes, and build reliable applications."
        }
    ];
}

function renderTypingLevels() {
    const container = $("#level-list");

    if (!container) {
        return;
    }

    container.innerHTML = typingLevels.map(item => {
        const level = Number(item.level);
        const difficulty = getDifficulty(level, item.difficulty);

        const completed =
            typingProgress.completedLevels.includes(level);

        const active =
            level === currentTypingLevel;

        return `
            <button
                type="button"
                class="typing-level ${active ? "active" : ""} ${completed ? "completed" : ""}"
                data-level="${level}"
            >
                <span class="typing-level-number">
                    ${level}
                </span>

                <span class="typing-level-info">
                    <strong>Level ${level}</strong>
                    <small>${escapeHTML(difficulty)}</small>
                </span>

                <span class="typing-level-status">
                    ${completed ? "✓" : "→"}
                </span>
            </button>
        `;
    }).join("");

    $all(".typing-level").forEach(button => {
        button.addEventListener("click", () => {
            const level = Number(button.dataset.level);

            if (!Number.isInteger(level)) {
                return;
            }

            selectTypingLevel(level);
        });
    });
}

function getDifficulty(level, fallback) {
    if (level >= 1 && level <= 3) {
        return "Easy";
    }

    if (level >= 4 && level <= 5) {
        return "Medium";
    }

    if (level >= 6 && level <= 8) {
        return "Hard";
    }

    if (level >= 9 && level <= 10) {
        return "Very Hard";
    }

    return fallback || "Practice";
}

/* ---------------------------------------------------------
   Typing Controls
   --------------------------------------------------------- */

function setupTypingControls() {
    const typingInput = $("#typing-input");

    if (typingInput) {
        typingInput.addEventListener("input", handleTypingInput);

        typingInput.addEventListener("paste", event => {
            event.preventDefault();
        });

        typingInput.addEventListener("drop", event => {
            event.preventDefault();
        });
    }

    const nextButton = $("#next-level");

    if (nextButton) {
        nextButton.addEventListener("click", goToNextLevel);
    }

    const paragraphInput = $("#paragraph-input");

    if (paragraphInput) {
        paragraphInput.addEventListener(
            "input",
            handleParagraphInput
        );

        paragraphInput.addEventListener("paste", event => {
            event.preventDefault();
        });

        paragraphInput.addEventListener("drop", event => {
            event.preventDefault();
        });
    }
}

function selectTypingLevel(level) {
    const availableLevels = typingLevels.map(item =>
        Number(item.level)
    );

    if (!availableLevels.includes(level)) {
        return;
    }

    currentTypingLevel = level;

    stopTypingTimer();
    resetTypingStats();

    renderTypingLevels();
    updateTypingInterface();
}

function getCurrentTypingLevel() {
    return typingLevels.find(
        item => Number(item.level) === currentTypingLevel
    );
}

function updateTypingInterface() {
    const level = getCurrentTypingLevel();

    if (!level) {
        return;
    }

    const levelNumber = Number(level.level);
    const difficulty = getDifficulty(
        levelNumber,
        level.difficulty
    );

    const levelNumberElement = $("#typing-level-number");
    const difficultyElement = $("#typing-difficulty");
    const textElement = $("#typing-text");
    const inputElement = $("#typing-input");
    const progressElement = $("#typing-progress");
    const progressLabel = $("#typing-progress-label");
    const nextButton = $("#next-level");
    const messageElement = $("#typing-message");

    if (levelNumberElement) {
        levelNumberElement.textContent = levelNumber;
    }

    if (difficultyElement) {
        difficultyElement.textContent = difficulty;
    }

    if (textElement) {
        textElement.textContent = level.text || "";
    }

    if (inputElement) {
        inputElement.value = "";
        inputElement.disabled = false;
        inputElement.placeholder =
            "Start typing the text above...";
    }

    if (progressElement) {
        const completedCount =
            typingProgress.completedLevels.length;

        const percentage =
            Math.min(
                100,
                Math.round((completedCount / 10) * 100)
            );

        progressElement.style.width = `${percentage}%`;
    }

    if (progressLabel) {
        progressLabel.textContent =
            `${typingProgress.completedLevels.length}/10 levels completed`;
    }

    if (nextButton) {
        nextButton.style.display = "none";
    }

    if (messageElement) {
        messageElement.textContent =
            `⌨️ Level ${levelNumber} ready. Start typing!`;
        messageElement.className = "typing-message";
    }

    updateTypingStats(0, 100, 0, 0, 0);
}

function handleTypingInput(event) {
    const input = event.target;
    const level = getCurrentTypingLevel();

    if (!level) {
        return;
    }

    const target = String(level.text || "");
    const typed = input.value;

    if (!typingStarted && typed.length > 0) {
        startTypingTimer();
    }

    const stats = calculateTypingStats(target, typed);

    updateTypingStats(
        stats.wpm,
        stats.accuracy,
        stats.errors,
        stats.seconds,
        stats.characters
    );

    if (typed.length >= target.length) {
        if (typed === target) {
            completeTypingLevel(stats);
        } else {
            showTypingMessage(
                "Almost there! Check the characters marked by your typing.",
                "warning"
            );
        }
    }
}

function calculateTypingStats(target, typed) {
    const now = Date.now();

    let seconds = 0;

    if (typingStarted) {
        seconds = Math.max(
            0,
            Math.floor((now - typingStartTime) / 1000)
        );
    }

    const minutes = seconds / 60;

    const characters = typed.length;

    let correctCharacters = 0;
    let errors = 0;

    for (let i = 0; i < typed.length; i++) {
        if (typed[i] === target[i]) {
            correctCharacters++;
        } else {
            errors++;
        }
    }

    let accuracy = 100;

    if (characters > 0) {
        accuracy =
            Math.round(
                (correctCharacters / characters) * 100
            );
    }

    const words = characters / 5;

    let wpm = 0;

    if (minutes > 0) {
        wpm = Math.round(words / minutes);
    }

    return {
        wpm,
        accuracy,
        errors,
        seconds,
        characters
    };
}

function startTypingTimer() {
    if (typingStarted) {
        return;
    }

    typingStarted = true;
    typingStartTime = Date.now();

    clearInterval(typingTimer);

    typingTimer = setInterval(() => {
        const level = getCurrentTypingLevel();
        const input = $("#typing-input");

        if (!level || !input) {
            return;
        }

        const stats = calculateTypingStats(
            String(level.text || ""),
            input.value
        );

        updateTypingStats(
            stats.wpm,
            stats.accuracy,
            stats.errors,
            stats.seconds,
            stats.characters
        );
    }, 1000);
}

function stopTypingTimer() {
    typingStarted = false;
    typingStartTime = 0;

    if (typingTimer) {
        clearInterval(typingTimer);
        typingTimer = null;
    }
}

function resetTypingStats() {
    stopTypingTimer();

    updateTypingStats(
        0,
        100,
        0,
        0,
        0
    );
}

function updateTypingStats(
    wpm,
    accuracy,
    errors,
    seconds,
    characters
) {
    const wpmElement = $("#stat-wpm");
    const accuracyElement = $("#stat-accuracy");
    const errorsElement = $("#stat-errors");
    const timeElement = $("#stat-time");
    const charactersElement = $("#stat-characters");

    if (wpmElement) {
        wpmElement.textContent = `${wpm}`;
    }

    if (accuracyElement) {
        accuracyElement.textContent = `${accuracy}%`;
    }

    if (errorsElement) {
        errorsElement.textContent = `${errors}`;
    }

    if (timeElement) {
        timeElement.textContent = formatTime(seconds);
    }

    if (charactersElement) {
        charactersElement.textContent = `${characters}`;
    }
}

function completeTypingLevel(stats) {
    stopTypingTimer();

    const level = currentTypingLevel;

    if (!typingProgress.completedLevels.includes(level)) {
        typingProgress.completedLevels.push(level);

        typingProgress.completedLevels.sort(
            (a, b) => a - b
        );
    }

    const previousBest =
        typingProgress.bestScores[level];

    if (
        !previousBest ||
        stats.wpm > previousBest.wpm
    ) {
        typingProgress.bestScores[level] = {
            wpm: stats.wpm,
            accuracy: stats.accuracy,
            errors: stats.errors,
            time: stats.seconds
        };
    }

    saveTypingProgress();

    const input = $("#typing-input");
    const nextButton = $("#next-level");

    if (input) {
        input.disabled = true;
    }

    showTypingMessage(
        `🎉 Level ${level} completed! ${stats.wpm} WPM • ${stats.accuracy}% accuracy`,
        "success"
    );

    if (level < 10) {
        if (nextButton) {
            nextButton.style.display = "inline-flex";
            nextButton.textContent =
                `Next Level → ${level + 1}`;
        }
    } else {
        if (nextButton) {
            nextButton.style.display = "none";
        }

        showAdvancedPractice();
    }

    renderTypingLevels();
    updateTypingProgressBar();
}

function goToNextLevel() {
    if (currentTypingLevel >= 10) {
        showAdvancedPractice();
        return;
    }

    selectTypingLevel(currentTypingLevel + 1);
}

function updateTypingProgressBar() {
    const progressElement = $("#typing-progress");
    const progressLabel = $("#typing-progress-label");

    const completedCount =
        typingProgress.completedLevels.length;

    const percentage =
        Math.min(
            100,
            Math.round((completedCount / 10) * 100)
        );

    if (progressElement) {
        progressElement.style.width =
            `${percentage}%`;
    }

    if (progressLabel) {
        progressLabel.textContent =
            `${completedCount}/10 levels completed`;
    }
}

/* ---------------------------------------------------------
   Typing Message
   --------------------------------------------------------- */

function showTypingMessage(message, type = "") {
    const element = $("#typing-message");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.className =
        `typing-message ${type}`.trim();
}

/* ---------------------------------------------------------
   Advanced Paragraph Practice
   --------------------------------------------------------- */

function showAdvancedPractice() {
    const section = $("#advanced-practice");

    if (!section) {
        return;
    }

    section.style.display = "block";

    setupNewParagraph();

    setTimeout(() => {
        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 300);
}

function setupNewParagraph() {
    const paragraphText = $("#paragraph-text");
    const paragraphInput = $("#paragraph-input");

    if (!paragraphText || !paragraphInput) {
        return;
    }

    const paragraphs = [
        "Technology becomes more useful when people understand how to solve problems with it. Strong typing skills can make coding, writing, research, and everyday computer work more comfortable. The goal is not simply to type quickly, but to type accurately while keeping your attention on the ideas you want to communicate. Regular practice can help build confidence over time. Try to maintain a steady rhythm, avoid rushing, and focus on accuracy first. As your accuracy improves, speed will usually become easier to develop naturally.",

        "Learning programming is a process of continuous practice and discovery. A developer may begin with a small idea, turn it into a plan, write some code, test the result, find mistakes, and improve the solution. This process teaches patience and problem solving. The same approach can be used for many technical skills. Break large tasks into smaller steps, understand each step, practice regularly, and review your results. Consistent effort helps transform unfamiliar concepts into skills that can be used confidently in real projects.",

        "Modern applications often combine several technologies to solve practical problems. A website may use HTML for structure, CSS for presentation, JavaScript for interaction, and a server for handling data. Understanding how these parts communicate gives learners a strong foundation for building useful software. When learning a new technology, focus on the fundamentals before trying to memorize everything. Build small projects, test different ideas, read error messages carefully, and improve your work one step at a time."
    ];

    const index =
        Math.floor(Math.random() * paragraphs.length);

    paragraphText.textContent = paragraphs[index];

    paragraphInput.value = "";

    paragraphStarted = false;
    paragraphStartTime = 0;

    if (paragraphTimer) {
        clearInterval(paragraphTimer);
        paragraphTimer = null;
    }

    updateParagraphStats(
        0,
        100,
        0,
        0
    );
}

function handleParagraphInput(event) {
    const input = event.target;
    const paragraphText = $("#paragraph-text");

    if (!paragraphText) {
        return;
    }

    const target = paragraphText.textContent || "";
    const typed = input.value;

    if (!paragraphStarted && typed.length > 0) {
        startParagraphTimer();
    }

    const stats =
        calculateParagraphStats(
            target,
            typed
        );

    updateParagraphStats(
        stats.wpm,
        stats.accuracy,
        stats.errors,
        stats.seconds
    );

    if (typed === target && target.length > 0) {
        stopParagraphTimer();

        updateParagraphStats(
            stats.wpm,
            stats.accuracy,
            stats.errors,
            stats.seconds
        );

        input.disabled = true;

        showParagraphCompletion();
    }
}

function calculateParagraphStats(target, typed) {
    let seconds = 0;

    if (paragraphStarted) {
        seconds = Math.max(
            0,
            Math.floor(
                (Date.now() - paragraphStartTime) /
                1000
            )
        );
    }

    const characters = typed.length;

    let correctCharacters = 0;
    let errors = 0;

    for (let i = 0; i < typed.length; i++) {
        if (typed[i] === target[i]) {
            correctCharacters++;
        } else {
            errors++;
        }
    }

    let accuracy = 100;

    if (characters > 0) {
        accuracy =
            Math.round(
                (correctCharacters / characters) *
                100
            );
    }

    const minutes = seconds / 60;
    const words = characters / 5;

    let wpm = 0;

    if (minutes > 0) {
        wpm = Math.round(words / minutes);
    }

    return {
        wpm,
        accuracy,
        errors,
        seconds
    };
}

function startParagraphTimer() {
    if (paragraphStarted) {
        return;
    }

    paragraphStarted = true;
    paragraphStartTime = Date.now();

    clearInterval(paragraphTimer);

    paragraphTimer = setInterval(() => {
        const input = $("#paragraph-input");
        const paragraphText = $("#paragraph-text");

        if (!input || !paragraphText) {
            return;
        }

        const stats =
            calculateParagraphStats(
                paragraphText.textContent || "",
                input.value
            );

        updateParagraphStats(
            stats.wpm,
            stats.accuracy,
            stats.errors,
            stats.seconds
        );
    }, 1000);
}

function stopParagraphTimer() {
    paragraphStarted = false;
    paragraphStartTime = 0;

    if (paragraphTimer) {
        clearInterval(paragraphTimer);
        paragraphTimer = null;
    }
}

function updateParagraphStats(
    wpm,
    accuracy,
    errors,
    seconds
) {
    const wpmElement = $("#paragraph-wpm");
    const accuracyElement = $("#paragraph-accuracy");
    const errorsElement = $("#paragraph-errors");

    if (wpmElement) {
        wpmElement.textContent = `${wpm}`;
    }

    if (accuracyElement) {
        accuracyElement.textContent =
            `${accuracy}%`;
    }

    if (errorsElement) {
        errorsElement.textContent =
            `${errors}`;
    }
}

function showParagraphCompletion() {
    const message = document.createElement("div");

    message.className =
        "paragraph-complete-message";

    message.innerHTML = `
        🎉 Great work! You completed the advanced paragraph.
        <button type="button" id="new-paragraph-btn">
            Practice Another Paragraph
        </button>
    `;

    const section = $("#advanced-practice");

    if (!section) {
        return;
    }

    const oldMessage =
        section.querySelector(
            ".paragraph-complete-message"
        );

    if (oldMessage) {
        oldMessage.remove();
    }

    section.appendChild(message);

    const newButton =
        $("#new-paragraph-btn");

    if (newButton) {
        newButton.addEventListener(
            "click",
            () => {
                const input = $("#paragraph-input");

                if (input) {
                    input.disabled = false;
                }

                message.remove();

                setupNewParagraph();
            }
        );
    }
}

/* ---------------------------------------------------------
   Local Storage
   --------------------------------------------------------- */

function loadTypingProgress() {
    const defaultProgress = {
        completedLevels: [],
        bestScores: {}
    };

    try {
        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!saved) {
            return defaultProgress;
        }

        const parsed =
            JSON.parse(saved);

        return {
            completedLevels:
                Array.isArray(
                    parsed.completedLevels
                )
                    ? parsed.completedLevels
                        .map(Number)
                        .filter(
                            level =>
                                level >= 1 &&
                                level <= 10
                        )
                    : [],

            bestScores:
                parsed.bestScores &&
                typeof parsed.bestScores === "object"
                    ? parsed.bestScores
                    : {}
        };
    } catch (error) {
        console.warn(
            "Could not load typing progress.",
            error
        );

        return defaultProgress;
    }
}

function saveTypingProgress() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                typingProgress
            )
        );
    } catch (error) {
        console.warn(
            "Could not save typing progress.",
            error
        );
    }
}

/* ---------------------------------------------------------
   Roadmaps
   --------------------------------------------------------- */

async function loadRoadmaps() {
    try {
        let response =
            await fetch("/api/roadmaps");

        if (!response.ok) {
            response =
                await fetch("/api/roadmap");
        }

        if (!response.ok) {
            throw new Error(
                "Could not load roadmaps."
            );
        }

        const data =
            await response.json();

        roadmaps =
            Array.isArray(data)
                ? data
                : Array.isArray(data.roadmaps)
                    ? data.roadmaps
                    : Array.isArray(data.roadmap)
                        ? data.roadmap
                        : [];

        renderRoadmaps();
    } catch (error) {
        console.error(
            "Roadmaps error:",
            error
        );

        const container =
            $("#roadmap-grid");

        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>🗺️</span>
                    <h3>Roadmaps are unavailable</h3>
                    <p>Please refresh the page and try again.</p>
                </div>
            `;
        }
    }
}

function renderRoadmaps() {
    const container =
        $("#roadmap-grid");

    if (!container) {
        return;
    }

    if (!roadmaps.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span>🗺️</span>
                <h3>No roadmaps available</h3>
            </div>
        `;

        return;
    }

    container.innerHTML =
        roadmaps.map(roadmap => {
            const title =
                escapeHTML(
                    roadmap.title ||
                    roadmap.name ||
                    "Learning Roadmap"
                );

            const description =
                escapeHTML(
                    roadmap.description ||
                    "Follow a structured learning path."
                );

            const icon =
                escapeHTML(
                    roadmap.icon ||
                    getRoadmapIcon(title)
                );

            const steps =
                Array.isArray(
                    roadmap.steps
                )
                    ? roadmap.steps
                    : Array.isArray(
                        roadmap.topics
                    )
                        ? roadmap.topics
                        : [];

            return `
                <article class="roadmap-card">
                    <div class="roadmap-icon">
                        ${icon}
                    </div>

                    <h3>${title}</h3>

                    <p>${description}</p>

                    ${
                        steps.length
                            ? `
                                <ol class="roadmap-steps">
                                    ${steps
                                        .slice(0, 6)
                                        .map(
                                            step =>
                                                `<li>${escapeHTML(
                                                    typeof step === "string"
                                                        ? step
                                                        : step.title ||
                                                          step.name ||
                                                          ""
                                                )}</li>`
                                        )
                                        .join("")}
                                </ol>
                              `
                            : ""
                    }

                    <button
                        type="button"
                        class="roadmap-btn"
                        data-roadmap="${title}"
                    >
                        Explore Roadmap →
                    </button>
                </article>
            `;
        }).join("");

    setupRoadmapButtons();
}

function getRoadmapIcon(title) {
    const lower =
        title.toLowerCase();

    if (lower.includes("python")) {
        return "🐍";
    }

    if (lower.includes("javascript")) {
        return "⚡";
    }

    if (
        lower.includes("web")
    ) {
        return "🌐";
    }

    if (
        lower.includes("ai") ||
        lower.includes("artificial")
    ) {
        return "🤖";
    }

    if (
        lower.includes("data")
    ) {
        return "📊";
    }

    if (
        lower.includes("cyber")
    ) {
        return "🔐";
    }

    if (
        lower.includes("cloud")
    ) {
        return "☁️";
    }

    return "🗺️";
}

function setupRoadmapButtons() {
    $all(".roadmap-btn").forEach(button => {
        button.addEventListener(
            "click",
            () => {
                const roadmap =
                    button.dataset.roadmap;

                const mentorInput =
                    $("#mentor-input");

                if (!mentorInput) {
                    return;
                }

                mentorInput.value =
                    `Explain the ${roadmap} roadmap ` +
                    `from beginner to advanced level. ` +
                    `Give me the learning order, important concepts, ` +
                    `real-world examples, projects, and practice tasks.`;

                const mentorSection =
                    $("#mentor");

                if (mentorSection) {
                    mentorSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }

                setTimeout(
                    () => mentorInput.focus(),
                    500
                );
            }
        );
    });
}

/* ---------------------------------------------------------
   Projects
   --------------------------------------------------------- */

async function loadProjects() {
    try {
        const response =
            await fetch("/api/projects");

        if (!response.ok) {
            throw new Error(
                "Could not load projects."
            );
        }

        const data =
            await response.json();

        projects =
            Array.isArray(data)
                ? data
                : Array.isArray(data.projects)
                    ? data.projects
                    : [];

        renderProjects();
    } catch (error) {
        console.error(
            "Projects error:",
            error
        );

        const container =
            $("#project-grid");

        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>🛠️</span>
                    <h3>Projects are unavailable</h3>
                    <p>Please refresh the page and try again.</p>
                </div>
            `;
        }
    }
}

function renderProjects() {
    const container =
        $("#project-grid");

    if (!container) {
        return;
    }

    if (!projects.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span>🛠️</span>
                <h3>No projects available</h3>
            </div>
        `;

        return;
    }

    container.innerHTML =
        projects.map(project => {
            const title =
                escapeHTML(
                    project.title ||
                    project.name ||
                    "Project"
                );

            const description =
                escapeHTML(
                    project.description ||
                    "Build a practical project to improve your skills."
                );

            const icon =
                escapeHTML(
                    project.icon ||
                    getProjectIcon(title)
                );

            const level =
                escapeHTML(
                    project.level ||
                    "Beginner"
                );

            return `
                <article class="project-card">
                    <div class="project-icon">
                        ${icon}
                    </div>

                    <div class="project-content">
                        <span class="project-level">
                            📈 ${level}
                        </span>

                        <h3>${title}</h3>

                        <p>${description}</p>

                        <button
                            type="button"
                            class="project-btn"
                            data-project="${title}"
                        >
                            Build Project →
                        </button>
                    </div>
                </article>
            `;
        }).join("");

    setupProjectButtons();
}

function getProjectIcon(title) {
    const lower =
        title.toLowerCase();

    if (lower.includes("portfolio")) {
        return "💼";
    }

    if (lower.includes("weather")) {
        return "🌤️";
    }

    if (lower.includes("expense")) {
        return "💰";
    }

    if (lower.includes("study")) {
        return "📚";
    }

    if (lower.includes("spam")) {
        return "🛡️";
    }

    if (lower.includes("cyber")) {
        return "🔐";
    }

    if (lower.includes("chat")) {
        return "💬";
    }

    if (lower.includes("attendance")) {
        return "📝";
    }

    if (lower.includes("energy")) {
        return "⚡";
    }

    return "🛠️";
}

function setupProjectButtons() {
    $all(".project-btn").forEach(button => {
        button.addEventListener(
            "click",
            () => {
                const project =
                    button.dataset.project;

                const mentorInput =
                    $("#mentor-input");

                if (!mentorInput) {
                    return;
                }

                mentorInput.value =
                    `Help me build the ${project} project. ` +
                    `Give me the requirements, features, ` +
                    `step-by-step development plan, folder structure, ` +
                    `important code concepts, testing steps, and ideas for improving the project.`;

                const mentorSection =
                    $("#mentor");

                if (mentorSection) {
                    mentorSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }

                setTimeout(
                    () => mentorInput.focus(),
                    500
                );
            }
        );
    });
}

/* ---------------------------------------------------------
   AI Mentor / Local Mentor
   --------------------------------------------------------- */

function setupMentor() {
    const form =
        $("#mentor-form");

    const input =
        $("#mentor-input");

    if (!form || !input) {
        return;
    }

    form.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const message =
                input.value.trim();

            if (!message) {
                input.focus();
                return;
            }

            addMentorMessage(
                message,
                "user"
            );

            input.value = "";

            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.dataset.originalText =
                    submitButton.textContent;

                submitButton.textContent =
                    "Thinking... ⏳";
            }

            const loadingBubble =
                addMentorMessage(
                    "Thinking... 🤔",
                    "assistant loading"
                );

            try {
                const response =
                    await fetch(
                        "/api/mentor",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                message
                            })
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        "Mentor request failed."
                    );
                }

                const data =
                    await response.json();

                if (loadingBubble) {
                    loadingBubble.remove();
                }

                const reply =
                    data.reply ||
                    data.message ||
                    data.response ||
                    "I could not create a response right now.";

                addMentorMessage(
                    reply,
                    "assistant"
                );
            } catch (error) {
                console.error(
                    "Mentor error:",
                    error
                );

                if (loadingBubble) {
                    loadingBubble.remove();
                }

                addMentorMessage(
                    "I couldn't process that request right now. Please try again.",
                    "assistant error"
                );
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;

                    submitButton.textContent =
                        submitButton.dataset.originalText ||
                        "Ask Mentor";
                }

                input.focus();
            }
        }
    );

    input.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {
                event.preventDefault();

                form.requestSubmit();
            }
        }
    );
}

function addMentorMessage(
    message,
    type
) {
    const container =
        $("#mentor-messages");

    if (!container) {
        return null;
    }

    const bubble =
        document.createElement("div");

    bubble.className =
        `mentor-message ${type}`;

    if (type.includes("assistant")) {
        const formatted =
            formatMentorResponse(message);

        bubble.innerHTML = `
            <div class="mentor-avatar">
                🤖
            </div>

            <div class="mentor-bubble">
                ${formatted}
            </div>
        `;
    } else {
        bubble.innerHTML = `
            <div class="mentor-avatar">
                👤
            </div>

            <div class="mentor-bubble">
                ${escapeHTML(message)}
            </div>
        `;
    }

    container.appendChild(bubble);

    container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
    });

    return bubble;
}

function formatMentorResponse(message) {
    const safe =
        escapeHTML(message);

    return safe
        .replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        )
        .replace(
            /\n\n/g,
            "<br><br>"
        )
        .replace(
            /\n/g,
            "<br>"
        );
}

/* ---------------------------------------------------------
   Navigation
   --------------------------------------------------------- */

function setupNavigation() {
    const links =
        $all(
            'a[href^="#"]'
        );

    links.forEach(link => {
        link.addEventListener(
            "click",
            event => {
                const targetId =
                    link.getAttribute("href");

                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }

                const target =
                    document.querySelector(
                        targetId
                    );

                if (!target) {
                    return;
                }

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        );
    });
}

function setupSmoothScrolling() {
    const hash =
        window.location.hash;

    if (!hash) {
        return;
    }

    setTimeout(() => {
        const target =
            document.querySelector(hash);

        if (target) {
            target.scrollIntoView({
                behavior: "smooth"
            });
        }
    }, 300);
}

/* ---------------------------------------------------------
   Utility
   --------------------------------------------------------- */

function formatTime(seconds) {
    const safeSeconds =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const minutes =
        Math.floor(
            safeSeconds / 60
        );

    const remainingSeconds =
        safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}

function showGlobalError() {
    console.warn(
        "Some SkillPath AI data could not be loaded."
    );
}

/* ---------------------------------------------------------
   Prevent accidental page refresh while typing
   --------------------------------------------------------- */

window.addEventListener(
    "beforeunload",
    () => {
        stopTypingTimer();
        stopParagraphTimer();
    }
);
