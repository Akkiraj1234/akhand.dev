# Akhand.dev — Website Implementation Plan

## 1. Project Vision

`akhand.dev` is my personal website and the central public hub for the software, projects, experiments, writing, and services that I build.

It should feel like a **personal engineering space**, not a generic developer portfolio.

The website should communicate:

* Who I am
* What I am currently building
* What I have built
* How I approach software
* My coding activity
* My learning/activity across public platforms
* My writing
* What I am interested in
* How people can contact or interact with me

The first version should be **fully static**.

The main backend is still being developed, so the frontend must not depend on `akki-core-backend` to function.

---

# 2. Important Context About Me

My name is **Akhand Raj**, and I usually go by **Akki**.

I am a software developer and hands-on builder.

My background is somewhat unusual. I started working with mobile repair at a young age, later moved into teaching and Python/backend development, completed a B.Com, and am currently pursuing BCA while continuing to work and build software.

I enjoy understanding how things work underneath abstractions.

My interests include:

* Backend development
* Systems programming
* C/C++
* Python
* JavaScript
* Networking
* Realtime systems
* CLI/TUI applications
* Architecture
* Performance optimization
* Data synchronization
* Infrastructure

I also enjoy things outside software, including:

* Sketching
* Archery
* Guitar
* Chess
* Clay/art
* Learning unrelated technical subjects

The website should show both sides:

```text
Software engineer
        +
Person who builds and explores things
```

Do not turn the About section into a formal résumé.

The site should feel personal, calm, technical, and genuine.

---

# 3. Main Website Structure

The main navigation should initially contain:

```text
Home
Projects
Blog
About
More
```

Potential future pages under `More`:

```text
Lab
Activity
Uses
Contact
Experiments
```

Do not expose every possible page in the primary navigation immediately.

Keep the navigation simple.

---

# 4. Core Architecture

The frontend should initially be:

```text
Static Website
      │
      ├── master.json
      │
      ├── local content
      │
      └── public external APIs
```

Later:

```text
                     ┌── GitHub
                     ├── LeetCode
                     ├── Roadmap.sh
                     └── other public services
                              │
                              ▼
                         Data layer
                              │
                              ▼
                         Frontend
```

Eventually:

```text
External Services
       │
       ▼
akki-core-backend
       │
       ├── PostgreSQL
       ├── Redis
       ├── Fetch Scheduler
       ├── Data Listener
       ├── Packet Generator
       └── Delta Updates
              │
              ▼
          API / SSE
              │
              ▼
           Website
```

The frontend architecture should allow this transition without a complete rewrite.

---

# 5. `master.json`

Create a root-level:

```text
master.json
```

This is the **single source of truth for editable website information**.

The purpose is to allow me to change website details without modifying frontend components.

For example:

```json
{
    "site": {
        "name": "Akki",
        "domain": "akhand.dev",
        "title": "Software Developer",
        "description": "I build software, systems, tools and experiments."
    },

    "hero": {
        "title": "I build things.",
        "subtitle": "Software, systems, tools and experiments."
    },

    "about": {
        "short": "",
        "full": ""
    },

    "currently": {
        "project": "",
        "status": "",
        "description": ""
    },

    "projects": [],

    "blog": [],

    "social": {},

    "profiles": {},

    "outside_software": [],

    "settings": {}
}
```

The schema can evolve.

The important rule is:

> **Content/data belongs in `master.json`; presentation belongs in the frontend.**

Do not hardcode personal information throughout components.

---

# 6. Public External Data

The static website should be able to fetch publicly available information from external services.

Possible sources:

```text
GitHub
LeetCode
Roadmap.sh
Spotify
other public services
```

The website should use these sources to show useful information about my current public activity.

Examples:

### GitHub

Potential information:

* Public repositories
* Repository names
* Stars
* Languages
* Contribution activity
* Recent activity
* Profile information
* Public commit activity
* Current repositories/projects

### LeetCode

Potential information:

* Public profile
* Problems solved
* Problem difficulty breakdown
* Ranking where publicly available
* Contribution/activity data
* Recent activity

### Roadmap.sh

Potential information:

* Public profile
* Learning activity
* Progress where publicly available
* Public contribution/activity data

Important:

Only fetch information that is publicly accessible and permitted by the relevant service.

If an external service does not provide a reliable public API, use an appropriate public endpoint or omit that data rather than building a fragile scraper by default.

---

# 7. `master.json` Profile Configuration

External profile identifiers should also live in `master.json`.

Example:

```json
{
    "profiles": {
        "github": {
            "username": "akhandraj"
        },

        "leetcode": {
            "username": ""
        },

        "roadmap": {
            "username": ""
        }
    }
}
```

This means usernames can be changed without editing components.

---

# 8. Unified Activity System

One of the most important visual features of the website should be a **unified activity section**.

Instead of showing:

```text
GitHub heatmap

LeetCode heatmap

Roadmap heatmap
```

as three completely separate components, combine them into a single visual activity system.

Conceptually:

```text
GitHub       ─┐
LeetCode     ─┼──→ Normalize activity
Roadmap.sh   ─┘
                    │
                    ▼
             Unified activity data
                    │
                    ▼
             Merged heatmap
```

---

# 9. Merged Contribution Heatmap

The website should have a major contribution/activity heatmap.

It should combine activity from:

```text
GitHub
LeetCode
Roadmap.sh
```

and potentially other supported sources later.

Example conceptual structure:

```text
          2026 ACTIVITY

Mon  ░ ░ ▒ ▒ █ ░ ░ ▒ ░
Tue  ░ ▒ ▒ █ █ ▒ ░ ░ ▒
Wed  ▒ █ ░ ▒ ▒ █ ▒ ░ ░
Thu  ░ ░ ▒ █ █ ▒ ▒ █ ░
Fri  ▒ ▒ █ ▒ ░ ░ █ ▒ ▒
Sat  █ ▒ ░ ░ ▒ █ ░ ▒ █
Sun  ░ ░ ▒ ▒ █ ░ ░ ▒ ░
```

The exact visualization can evolve.

The important concept:

> Activity from multiple platforms should contribute to one unified activity timeline.

---

# 10. Activity Normalization

Different platforms represent activity differently.

Normalize them into a common structure.

For example:

```json
{
    "date": "2026-08-29",
    "sources": {
        "github": 4,
        "leetcode": 2,
        "roadmap": 1
    },
    "total": 7
}
```

The frontend can then determine the heatmap intensity from `total`.

Do not lose the source information.

A user should be able to inspect a day and see:

```text
August 29

Total activity: 7

GitHub       4
LeetCode     2
Roadmap      1
```

---

# 11. Activity Heatmap Interaction

Hovering/clicking a day should show useful information.

Example:

```text
August 29, 2026

7 activities

GitHub       4
LeetCode     2
Roadmap.sh   1
```

If a source has no activity:

```text
GitHub       0
LeetCode     2
Roadmap.sh   0
```

The heatmap should not pretend that all activity types are equivalent.

The merged number is useful for visualization, while the source breakdown preserves meaning.

---

# 12. External Profile Links

Each public profile should have a direct link.

For example:

```text
GitHub       → profile
LeetCode     → profile
Roadmap.sh   → profile
```

The links should come from `master.json`.

Do not hardcode them into individual components.

---

# 13. Homepage

Recommended homepage structure:

```text
Home
│
├── Hero
├── Current Project
├── Activity / Heatmap
├── Selected Projects
├── Engineering Philosophy
├── About
├── What I'm Listening To / Currently Into
├── Latest Blog Posts
├── Ask Me
└── Footer
```

---

# 14. Hero

Main message:

```text
I build things.
```

Supporting text:

```text
Software, systems, tools and experiments.
```

The hero should be simple and visually strong.

Avoid generic portfolio introductions.

---

# 15. Current Project

Show what I am currently working on.

Example:

```text
CURRENTLY BUILDING

akki-core-backend

Infrastructure for my personal software ecosystem.

Status
In development

Focus
Backend infrastructure
Realtime systems
Data synchronization
```

This should be controlled by `master.json`.

Later it can become backend-powered.

---

# 16. Activity Section

Show the merged activity heatmap prominently.

Possible title:

```text
ACTIVITY
```

or:

```text
WHAT I'VE BEEN BUILDING
```

Include:

```text
GitHub
LeetCode
Roadmap.sh
```

with source indicators and profile links.

The activity system should be designed as a reusable data component.

---

# 17. Selected Projects

Show approximately 4–6 meaningful projects.

Examples:

```text
Shipyard
Testpy
Diff System
akki-core-backend
other future projects
```

Each project should contain:

```text
Name
Description
Status
Technologies
Link
```

Example:

```text
SHIPYARD

A modular CLI infrastructure project focused
on command discovery, parsing, metadata and
terminal output.

Python · CLI · Architecture

→ Explore
```

Projects should explain what makes the project interesting.

Do not turn the section into a technology logo wall.

---

# 18. Engineering Philosophy

Include a small section describing how I approach engineering.

Potential themes:

### Build from fundamentals

I like understanding the machinery underneath abstractions.

### Clear boundaries

Systems should have clear ownership and interfaces.

### Optimize intentionally

Measure first, then optimize the parts that actually matter.

### Build useful things

Projects usually start because I wanted something that didn't exist.

This section should communicate engineering thinking rather than marketing.

---

# 19. About

The About section should explain my background without becoming a résumé.

Include:

* My name
* Software development background
* Interest in systems/backend development
* Hands-on building
* Learning philosophy
* Interests outside software

The final text should be editable through `master.json`.

---

# 20. What I'm Currently Into

A small dynamic-feeling section showing things such as:

```text
Currently coding:
C++ / uWebSockets

Currently learning:
...

Currently listening to:
...

Currently building:
akki-core-backend
```

Initially these can be static values in `master.json`.

Later they can become dynamically fetched data.

---

# 21. Blog

Create a lightweight blog section.

Homepage should show:

```text
Latest posts
```

with:

```text
Title
Date
Short description
Tags
```

The complete blog should have its own page.

Possible topics:

```text
Systems
Backend
Architecture
Programming
Experiments
Learning
Personal engineering notes
```

The blog should feel like technical notes rather than corporate content marketing.

---

# 22. Ask Me

Add an `Ask Me` section.

This can initially be a simple static/contact interface.

Potential future implementation:

```text
User
 ↓
Ask Me
 ↓
akki-core-backend
 ↓
Response
```

For the first static version, it can simply provide:

```text
Ask me about software, projects, architecture, etc.
```

and a contact mechanism.

Do not make this dependent on the unfinished backend yet.

---

# 23. Social Profiles

Public social links should be configurable through `master.json`.

Current profiles include:

```text
X
Reddit
LinkedIn
Discord
Instagram
Email
```

The website should not necessarily display every account prominently.

Use them primarily in:

```text
Footer
About
Contact
```

---

# 24. Visual Design

The visual identity should be:

```text
Minimal
Technical
Personal
Calm
Precise
Modern
```

Use:

```text
Large typography
Generous whitespace
Thin borders
Monospace metadata
Subtle animation
Clean cards
Technical visualizations
```

Avoid:

```text
Huge gradient backgrounds
Excessive animations
Generic laptop illustrations
"10x developer" language
Huge technology-logo grids
Overloaded dashboards
```

The website should feel like a software project itself.

---

# 25. Responsive Design

The website must work well on:

```text
Desktop
Laptop
Tablet
Mobile
```

The activity heatmap in particular needs a mobile-friendly representation.

Do not simply shrink the desktop heatmap until it becomes unusable.

Possible mobile behavior:

```text
Horizontal scrolling
Reduced density
Month selector
Expandable activity details
```

---

# 26. Performance

Because the first version is static:

* Minimize JavaScript
* Lazy-load expensive external data
* Cache external responses where appropriate
* Avoid blocking page rendering
* Optimize images
* Keep animations lightweight
* Avoid unnecessary API requests

External services should not prevent the main page from rendering.

If GitHub or LeetCode is unavailable:

```text
Website still works.
```

Show graceful fallback:

```text
Activity currently unavailable.
```

Do not crash the entire page.

---

# 27. Data Fetching Strategy

Initially:

```text
Page load
    ↓
Render static content
    ↓
Fetch public external data
    ↓
Normalize
    ↓
Render activity
```

Do not make the initial page depend on every external service responding.

Eventually:

```text
External services
      ↓
Fetch scheduler
      ↓
akki-core-backend
      ↓
Storage
      ↓
API/SSE
      ↓
Frontend
```

---

# 28. Future `akki-core-backend`

The existing backend architecture is intended to eventually support:

```text
/get_data
/get_update
/health
```

The backend will eventually:

* Generate session tokens
* Store session state
* Track timestamps
* Apply rate limits
* Store data
* Generate delta packets
* Fetch external data
* Schedule fetches
* Listen for data changes
* Provide realtime/SSE updates

The existing design specifies:

```text
/get_data?timestamp=
```

for full/delta data retrieval and:

```text
/get_update?token=
```

for incremental updates.

The frontend should be compatible with this future architecture.

---

# 29. Backend Development Roadmap

The backend implementation plan currently includes:

1. Session token API limiter
2. IP limiter
3. Packet generator
4. Redis storage connector
5. RAM fallback storage
6. Fetch scheduler
7. Main loop
8. GitHub data gathering
9. LeetCode data gathering
10. External data APIs
11. Better persistent storage
12. PostgreSQL connector
13. Main loop refinement
14. Data listener

The backend MVP should still remain smaller than the final system.

Start with:

```text
HTTP server
    ↓
/health
/get_data
/get_update
    ↓
Session
    ↓
Rate limiting
    ↓
Packet generation
    ↓
In-memory storage
```

Then gradually add:

```text
Redis
PostgreSQL
Fetch scheduler
GitHub
LeetCode
Roadmap
SSE
Data listener
```

---

# 30. Frontend → Backend Migration

The static version:

```text
master.json
     ↓
frontend
```

Later:

```text
master.json
     +
backend API
     ↓
frontend
```

Eventually:

```text
backend
   ↓
API + SSE
   ↓
frontend
```

Do not duplicate backend logic inside the frontend.

---

# 31. Error Handling

Every external integration must fail independently.

For example:

```text
GitHub       ✓
LeetCode     ✓
Roadmap      ✗
```

The website should still show:

```text
GitHub
LeetCode
```

and simply indicate that Roadmap data is unavailable.

Likewise:

```text
Backend offline
```

must not make the entire website unusable.

---

# 32. SEO and Metadata

Add:

* Page titles
* Descriptions
* OpenGraph metadata
* Twitter/X metadata
* Canonical URLs
* Favicon
* Structured metadata where useful

The homepage should clearly identify:

```text
Akki / Akhand Raj
Software Developer
akhand.dev
```

---

# 33. Accessibility

The website should include:

* Semantic HTML
* Keyboard navigation
* Proper focus states
* Accessible contrast
* Alt text
* Reduced-motion support
* Screen-reader-friendly activity information

The heatmap must have a non-visual representation of its information.

Do not rely only on color intensity.

---

# 34. Implementation Order

## Phase 1 — Foundation

```text
Create frontend
Create master.json
Create data layer
Create global styles
Create navigation
Create responsive layout
```

## Phase 2 — Homepage

```text
Hero
Current Project
Activity section
Projects
Engineering Philosophy
About
Currently Into
Blog preview
Ask Me
Footer
```

## Phase 3 — External Data

```text
GitHub
LeetCode
Roadmap.sh
Profile links
Activity normalization
Merged heatmap
```

## Phase 4 — Content

```text
Projects page
Blog page
About page
More pages
```

## Phase 5 — Polish

```text
Mobile
Accessibility
SEO
Performance
Error states
Loading states
Animations
```

## Phase 6 — Backend Integration

```text
API
Session
Delta updates
SSE
Backend health
Cached external data
Realtime activity
```

---

# 35. Important Implementation Rules

### Rule 1

Do not hardcode editable personal information into components.

Use:

```text
master.json
```

### Rule 2

Do not make the website dependent on the unfinished backend.

### Rule 3

External public APIs can be used directly during the static phase when appropriate.

### Rule 4

External data must be normalized before reaching visualization components.

### Rule 5

GitHub, LeetCode and Roadmap.sh activity should be represented in a **merged activity/heatmap system**.

### Rule 6

Preserve source-specific information even after merging activity.

### Rule 7

External API failures must not break the website.

### Rule 8

Build the frontend so the eventual `akki-core-backend` can replace public API fetching without redesigning the UI.

---

# 36. Final Product Direction

The finished website should communicate:

```text
This is Akki.

This is what I'm building.

This is what I've built.

This is how I think about software.

This is what I've been learning.

This is what I've been doing lately.

And this is the infrastructure behind it.
```

It should feel like a **living personal engineering hub**, rather than a static résumé.

The static website comes first.

The backend comes underneath it later.

The two should evolve independently but share a clear data model.
