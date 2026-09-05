// scripts/siteDataSync.js
const fs = require("node:fs/promises");
const path = require("node:path");


/* ============================================================
 * Configuration
 * ============================================================ */

const API_URL =
    process.env.SITE_API_URL ??
    "https://api.akhand.dev";


const DATA_KEYS = {
    githubProfile: "github.profile",
    githubHeatmap: "github.heatmap",
    githubEvents: "github.events",

    // Keep this configurable because your current backend
    // registration should be checked before hard-coding it.
    githubRepos: process.env.GITHUB_REPOS_KEY ?? "github.repos",

    leetcodeHeatmap: "leetcode.heatmap.history",
    roadmapProfile: "roadmap.profile",
};


/* ============================================================
 * CLI
 * ============================================================ */

function getArg(name) {
    const index = process.argv.indexOf(name);

    if (index === -1) {
        return null;
    }

    return process.argv[index + 1] ?? null;
}


/* ============================================================
 * API
 * ============================================================ */

async function fetchRecord(key, apiKey) {
    const response = await fetch(
        `${API_URL}/data/${encodeURIComponent(key)}`,
        {
            headers: {
                "x-api-key": apiKey,
            },
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch "${key}": ` +
            `${response.status} ${response.statusText}`
        );
    }

    const result = await response.json();

    if (!result?.ok || !result?.record) {
        throw new Error(
            `Invalid response for "${key}"`
        );
    }

    /*
     * Your API currently returns:

     * {
     *   record: {
     *     key,
     *     data: {
     *       data: <actual service data>,
     *       error,
     *       code
     *     }
     *   }
     * }
     */

    return result.record?.data?.data ?? null;
}


/* ============================================================
 * Heatmap
 * ============================================================ */

function flattenFormattedHeatmap(data) {
    return Object.values(
        data?.years ?? {}
    ).flatMap(
        (year) => year?.heatmap ?? []
    );
}


function mergeHeatmaps(...sources) {
    const merged = new Map();

    for (const source of sources) {
        for (const item of source ?? []) {
            const date = Number(item?.date);
            const count = Number(item?.count) || 0;

            if (!Number.isFinite(date)) {
                continue;
            }

            merged.set(
                date,
                (merged.get(date) ?? 0) + count
            );
        }
    }

    return [...merged.entries()]
        .sort(([a], [b]) => a - b)
        .map(([date, count]) => ({
            date,
            count,
        }));
}


/* ============================================================
 * Github "Currently" ranking
 * ============================================================ */

/*
 * GitHub events only give us a signal.

 * They do NOT prove "this is a current project".
 *
 * We therefore:
 *
 *   events
 *      ↓
 *   score repos
 *      ↓
 *   top candidates
 *      ↓
 *   match against repo metadata
 */

const EVENT_WEIGHTS = {
    PushEvent: 10,
    PullRequestEvent: 8,
    IssuesEvent: 5,
    IssueCommentEvent: 4,
    PullRequestReviewEvent: 7,
    CreateEvent: 4,
    ReleaseEvent: 7,
    DeleteEvent: 1,
};


function eventScore(event) {
    const createdAt =
        new Date(event?.createdAt).getTime();

    if (!Number.isFinite(createdAt)) {
        return 0;
    }

    const age =
        Date.now() - createdAt;

    const ageDays =
        age / (1000 * 60 * 60 * 24);

    /*
     * Ignore events older than 30 days.
     */
    if (ageDays > 30) {
        return 0;
    }

    const weight =
        EVENT_WEIGHTS[event?.type] ?? 2;

    /*
     * Recent activity matters more.
     * 1.0 today → approaches 0 near 30 days.
     */
    const recency =
        Math.max(0, 1 - ageDays / 30);

    return weight * recency;
}


function rankActiveRepositories(events) {
    const repos = new Map();

    for (const event of events ?? []) {
        const repoName =
            event?.repo?.name;

        if (!repoName) {
            continue;
        }

        const score = eventScore(event);

        if (score <= 0) {
            continue;
        }

        const existing =
            repos.get(repoName) ?? {
                score: 0,
                activeDays: new Set(),
                lastActivity: null,
            };

        existing.score += score;


        const createdAt =
            event.createdAt;

        if (createdAt) {
            const day =
                new Date(createdAt)
                    .toISOString()
                    .slice(0, 10);

            existing.activeDays.add(day);

            if (
                !existing.lastActivity ||
                new Date(createdAt) >
                new Date(existing.lastActivity)
            ) {
                existing.lastActivity = createdAt;
            }
        }

        repos.set(repoName, existing);
    }

    return [...repos.entries()]
        .sort(
            (a, b) =>
                b[1].score -
                a[1].score
        );
}


/* ============================================================
 * Currently builder
 * ============================================================ */

/*
 * These are site-owned fields.

 * GitHub supplies repository facts.
 * You supply editorial/project facts.
 */

const PROJECT_META = {
    shipyard: {
        started_at: "2026-08-09",
        ended_at: null,
        release_version: "v0.1",
    },

    "akki-core-backend": {
        started_at: "2026-06-18",
        ended_at: null,
        release_version: "v1.1",
    },

    testpy: {
        started_at: "2026-05-12",
        ended_at: null,
        release_version: "v0.3",
    },
};


function buildCurrentProject(repo, activity) {
    const meta =
        PROJECT_META[repo.name] ?? {};

    const activeDays =
        activity?.activeDays?.size ?? 0;

    return {
        name: repo.name,

        started_at:
            meta.started_at ??
            repo.createdAt ??
            null,

        ended_at:
            meta.ended_at ??
            null,

        description:
            repo.description ?? "",

        /*
         * We don't have an authoritative commit count
         * from the repo list itself.
         *
         * For now this is supplied by your metadata or
         * can be added later from a dedicated service.
         */
        commits:
            meta.commits ??
            0,

        release_version:
            meta.release_version ??
            null,

        topics:
            repo.topics ?? [],

        languages:
            Object.fromEntries(
                (repo.languages ?? [])
                    .map((language) => [
                        language.name,
                        language.size,
                    ])
            ),

        star:
            repo.stars ?? 0,

        active_days:
            meta.active_days ??
            activeDays,
    };
}


function buildCurrently({
    events,
    repositories,
}) {
    const ranked =
        rankActiveRepositories(events);

    const repositoryMap =
        new Map(
            (repositories ?? [])
                .map((repo) => [
                    repo.name,
                    repo,
                ])
        );


    const projects = [];

    for (
        const [repoName, activity] of ranked
    ) {
        const repo =
            repositoryMap.get(repoName);

        if (!repo) {
            continue;
        }

        projects.push(
            buildCurrentProject(
                repo,
                activity
            )
        );

        if (projects.length === 3) {
            break;
        }
    }


    /*
     * Fallback:
     *
     * If recent events don't produce three
     * projects, fill from recently updated repos.
     */

    if (projects.length < 3) {
        const existing =
            new Set(
                projects.map(
                    (project) => project.name
                )
            );

        const fallback =
            [...(repositories ?? [])]
                .sort(
                    (a, b) =>
                        new Date(
                            b.updatedAt ?? 0
                        ) -
                        new Date(
                            a.updatedAt ?? 0
                        )
                );

        for (const repo of fallback) {
            if (existing.has(repo.name)) {
                continue;
            }

            projects.push(
                buildCurrentProject(
                    repo,
                    {
                        activeDays: new Set(),
                    }
                )
            );

            existing.add(repo.name);

            if (projects.length === 3) {
                break;
            }
        }
    }


    return {
        label: "Currently building",
        projects,
    };
}


/* ============================================================
 * Main site data builder
 * ============================================================ */

async function buildSiteData(apiKey) {
    const [
        githubProfile,
        githubHeatmap,
        githubEvents,
        githubRepos,
        leetcodeHeatmap,
        roadmapProfile,
    ] = await Promise.all([
        fetchRecord(
            DATA_KEYS.githubProfile,
            apiKey
        ),

        fetchRecord(
            DATA_KEYS.githubHeatmap,
            apiKey
        ),

        fetchRecord(
            DATA_KEYS.githubEvents,
            apiKey
        ),

        fetchRecord(
            DATA_KEYS.githubRepos,
            apiKey
        ),

        fetchRecord(
            DATA_KEYS.leetcodeHeatmap,
            apiKey
        ),

        fetchRecord(
            DATA_KEYS.roadmapProfile,
            apiKey
        ),
    ]);


    const github =
        githubHeatmap ?? {};

    const leetcode =
        leetcodeHeatmap ?? {};

    const roadmap =
        roadmapProfile?.activity?.heatmap ??
        {};


    const mergedHeatmap =
        mergeHeatmaps(
            flattenFormattedHeatmap(
                github
            ),

            flattenFormattedHeatmap(
                leetcode
            ),

            flattenFormattedHeatmap(
                roadmap
            )
        );


    const currently =
        buildCurrently({
            events:
                githubEvents ?? [],

            repositories:
                githubRepos ?? [],
        });


    return {
        profile: {
            github:
                githubProfile ?? {},
        },

        currently,

        repositories:
            githubRepos ?? [],

        activity: {
            github,
            leetcode,
            roadmap,

            merged: {
                heatmap:
                    mergedHeatmap,
            },
        },
    };
}


/* ============================================================
 * Save
 * ============================================================ */

async function main() {
    const apiKey =
        getArg("--key");

    if (!apiKey) {
        throw new Error(
            "Missing API key.\n\n" +
            "Usage:\n" +
            "npm run site:sync -- --key YOUR_KEY"
        );
    }


    console.log(
        `Syncing from ${API_URL}...`
    );


    const siteData =
        await buildSiteData(apiKey);


    const outputPath =
        path.resolve(
            process.cwd(),
            "src/data/site-data.json"
        );


    await fs.mkdir(
        path.dirname(outputPath),
        { recursive: true }
    );


    await fs.writeFile(
        outputPath,
        JSON.stringify(
            siteData,
            null,
            4
        ),
        "utf8"
    );


    console.log(
        `Site data written to:\n${outputPath}`
    );


    console.log(
        `Currently:\n` +
        siteData.currently.projects
            .map(
                (project) =>
                    `  - ${project.name}`
            )
            .join("\n")
    );
}


main().catch((error) => {
    console.error(
        "\nSite data sync failed."
    );

    console.error(error);

    process.exit(1);
});