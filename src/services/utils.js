/**
 * Formats raw heatmap data into a normalized yearly + global structure.
 *
 * ------------------------------------------------------------
 * Input:
 * ------------------------------------------------------------
 * heatmap: Array<{
 *   date: number (timestamp in ms),
 *   count: number
 * }>
 *
 * ------------------------------------------------------------
 * Output (Standard Format):
 * ------------------------------------------------------------
 * {
 *   years: {
 *     [year: string]: {
 *       heatmap: Array<{ date: number, count: number }>,
 *       currentStreak: number,
 *       longestStreak: number,
 *       totalActiveDays: number,
 *       totalContributions: number
 *     }
 *   },
 *   global: {
 *     currentStreak: number,
 *     longestStreak: number,
 *     totalActiveDays: number,
 *     totalContributions: number
 *   }
 * }
 *
 * ------------------------------------------------------------
 * Rules:
 * ------------------------------------------------------------
 * - Single pass processing (O(n))
 * - Ignores invalid entries (null, bad date, count <= 0)
 * - No duplicate handling (assumes input responsibility)
 * - No side effects
 * - Deterministic output
 */
function formatHeatmap(heatmap = []) {
    const years = {};

    const state = {
        currentYear: null,
        previousTime: null,

        year: {
            heatmap: [],
            currentStreak: 0,
            longestStreak: 0,
            totalActiveDays: 0,
            totalContributions: 0
        },

        global: {
            longestStreak: 0,
            totalActiveDays: 0,
            totalContributions: 0
        }
    };

    function finalizeYear() {
        const y = state.currentYear;
        if (y === null || state.year.totalContributions === 0) return;

        years[y] = { ...state.year };

        state.global.longestStreak = Math.max(
            state.global.longestStreak,
            state.year.longestStreak
        );

        state.global.totalActiveDays += state.year.totalActiveDays;
        state.global.totalContributions += state.year.totalContributions;
    }

    function resetYear(year) {
        state.currentYear = year;
        state.year = {
            heatmap: [],
            currentStreak: 0,
            longestStreak: 0,
            totalActiveDays: 0,
            totalContributions: 0
        };
        state.previousTime = null;
    }

    for (const item of heatmap) {
        const { date = null, count = 0 } = item ?? {};

        if (!date || count <= 0) continue;

        const year = new Date(date).getUTCFullYear();
        if (!year || Number.isNaN(year)) continue;

        if (state.currentYear !== year) {
            finalizeYear();
            resetYear(year);
        }
        if (isStreak(state.previousTime, date)) {
            state.year.currentStreak += 1;
        } else {
            state.year.currentStreak = 1;
        }

        state.year.longestStreak = Math.max(
            state.year.longestStreak,
            state.year.currentStreak
        );

        state.year.totalActiveDays += 1;
        state.year.totalContributions += count;
        state.year.heatmap.push({ date, count });
        state.previousTime = date;
    }
    
    finalizeYear();

    return {
        years,
        global: {
            currentStreak: state.year.currentStreak,
            longestStreak: state.global.longestStreak,
            totalActiveDays: state.global.totalActiveDays,
            totalContributions: state.global.totalContributions
        }
    };
}
