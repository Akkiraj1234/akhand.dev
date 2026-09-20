import { describe, expect, it } from "vitest";
import {
    currently_formater,
    featureRepo_formater,
    heatmap_formater,
    tokenIsUsable,
} from "./utils";
import format_heatmap from "../pages/Home/ActivitySection/format_heatmap";

const repository = {
    name: "portfolio",
    description: "Personal site",
    url: "https://example.com/portfolio",
    stars: 3,
    release: { tagName: "v1.0.0" },
    topics: ["preact"],
    languages: [
        { name: "JavaScript", size: 75 },
        { name: "CSS", size: 25 },
    ],
    totalCommits: 12,
    totalActiveDays: 4,
    createdAt: "2026-01-15T00:00:00Z",
};

describe("runtime-data formatters", () => {
    it("formats active repositories for the Currently section", () => {
        expect(currently_formater([repository])).toEqual({
            label: "Currently building",
            projects: [expect.objectContaining({
                name: "portfolio",
                commits: 12,
                active_days: 4,
                languages: { JavaScript: 75, CSS: 25 },
            })],
        });
    });

    it("formats pinned repositories with safe contribution defaults", () => {
        const pinned = { ...repository };
        delete pinned.totalCommits;
        delete pinned.totalActiveDays;

        expect(featureRepo_formater([pinned])).toEqual({
            label: "Featured projects",
            projects: [expect.objectContaining({
                commits: 0,
                active_days: 0,
            })],
        });
    });

    it("flattens each combined heatmap provider without losing its year", () => {
        const years = {
            "2026": { heatmap: [{ date: 1767225600000, count: 2 }] },
        };

        expect(heatmap_formater({
            github: { year: "2026", data: { years } },
            leetcode: null,
        })).toEqual({
            github: { year: "2026", years },
            leetcode: { year: null, years: {} },
            roadmap: { year: null, years: {} },
        });
    });

    it("formats the activity calendar into month buckets from the real API payload shape", () => {
        const payload = {
            github: {
                year: "2026",
                data: {
                    years: {
                        "2026": {
                            heatmap: [{ date: 1767225600000, count: 2 }],
                            currentStreak: 1,
                            longestStreak: 2,
                            totalActiveDays: 3,
                            totalContributions: 4,
                        },
                    },
                },
            },
            leetcode: {
                year: "2026",
                data: {
                    years: {
                        "2026": {
                            heatmap: [{ date: 1767225600000, count: 1 }],
                            currentStreak: 5,
                            longestStreak: 6,
                            totalActiveDays: 7,
                            totalContributions: 8,
                        },
                    },
                },
            },
            roadmap: {
                year: "2025",
                data: {
                    years: {
                        "2025": {
                            heatmap: [{ date: 1735689600000, count: 3 }],
                            currentStreak: 9,
                            longestStreak: 10,
                            totalActiveDays: 11,
                            totalContributions: 12,
                        },
                    },
                },
            },
        };

        const result = format_heatmap(payload);

        expect(result.year).toBe("2026");
        expect(Array.isArray(result.months)).toBe(true);
        expect(result.months.length).toBeGreaterThan(0);
        expect(result.months[0]).toMatchObject({
            label: expect.any(String),
            leadingEmptyDays: expect.any(Number),
            days: expect.any(Array),
        });
        expect(result.providers.github.totalContributions).toBe(4);
    });

    it("keeps a JWT only when it remains valid beyond the refresh buffer", () => {
        const encode = (payload) => btoa(JSON.stringify(payload))
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
        const now = Math.floor(Date.now() / 1000);

        expect(tokenIsUsable(`header.${encode({ exp: now + 120 })}.signature`))
            .toBe(true);
        expect(tokenIsUsable(`header.${encode({ exp: now + 30 })}.signature`))
            .toBe(false);
    });
});
