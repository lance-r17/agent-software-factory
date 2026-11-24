**English** | [Chinese](README.md)

# Agent Software Factory · Open-Source Field Notes

We research and document one open-source Agent Software Factory solution every day. These are tools that use Agent systems to automate software development. Each solution receives a complete analysis with architecture diagrams, deployment instructions, and verification records. Every new solution is delivered in both Chinese and English.

- **Public site (GitHub Pages)**: https://lance-r17.github.io/agent-software-factory/#/en
- **Stack**: React + TypeScript + Vite + Tailwind, with a static HashRouter site built by `npm ci && npm run build` into `dist/`.
- **Localized routes**: Chinese uses `/` and `/solutions/<slug>`; English uses `/en` and `/en/solutions/<slug>`. Their public Hash URLs are `#/`, `#/solutions/<slug>`, `#/en`, and `#/en/solutions/<slug>`.
- **Language switching**: The EN / ZH control in the header preserves the current solution and in-page anchor. Navigation, body content, diagrams, tabs, deployment guides, modal dialogs, and copy/download feedback all follow the active language.

## Research Pipeline

```text
check_site.py + duplicate checks → security checks and synchronization with the latest GitHub main
→ candidate selection → solution Issue with a bilingual DoD contract → official-source research + local verification
→ Chinese page / guide + English page / guide → production build + bilingual desktop/mobile browser acceptance
→ website preview version → solution branch + PR (Closes #issue)
→ human review and merge → main → Actions build and deploy to GitHub Pages
```

- **Synchronize before starting**: Inspect the current site and worktree, run `git fetch origin main`, switch to local `main` when necessary, and run only `git pull --ff-only origin main`. Stop on a dirty worktree or diverged history. Do not reset, rebase, or overwrite the existing site.
- **One Issue per solution**: Create an Issue for every new solution with candidate details and acceptance criteria. If research fails, keep the Issue and record the failure in a comment.
- **Bilingual DoD**: Every new solution must include the Chinese route `/solutions/<slug>`, the English route `/en/solutions/<slug>`, complete content in both languages, and a bilingual SKILL.md deployment guide. No Chinese may remain in visible text, code comments, or accessibility labels on English pages.
- **Bilingual acceptance**: Verify routes, language switching, tabs (including the mobile dropdown), guide modals, copy, download, and the absence of horizontal overflow on mobile in both languages. Downloaded English files must contain English Markdown.
- **PR as final review**: Each solution uses a `solution/<slug>-<date>` branch and a PR containing bilingual routes, verification date and level, tested scope, and sources. PRs are created or updated but never merged automatically. The linked Issue closes automatically after merge through `Closes`.
- **Actions as publisher**: A merge to `main` triggers `.github/workflows/pages.yml`, which builds the source and deploys GitHub Pages. The public site contains only reviewed content.
- **Historical solutions**: OpenHands Agent Canvas v1.43.0, mini-SWE-agent v2.4.6, and SWE-agent v1.1.0 were indexed before the repository was established and do not receive retroactive solution Issues or PRs. Site-wide bilingual functionality is delivered through independent feature branches and PRs.

## Installable Skills

Deployment guide content is stored separately from the website registry in the open Agent Skills format. Pages read the Markdown at build time through Vite `?raw`, so synchronized rendering, full-text modals, copying, and downloading require no runtime requests.

```text
skills/
├── deploy/
│   ├── zh-CN/<skill-name>/SKILL.md
│   └── en/<skill-name>/SKILL.md
└── analyze/
    └── agent-software-factory-research/
        ├── SKILL.md
        ├── scripts/
        ├── references/
        └── assets/discovery-queries.json
```

Each directory name must match the `name` in its SKILL.md frontmatter. Install only the language or workflow directory you need, avoiding collisions between Chinese and English Skills with the same name in one scope. For example:

```bash
mkdir -p ~/.agents/skills
cp -R skills/deploy/zh-CN/mini-swe-agent-deploy ~/.agents/skills/
cp -R skills/analyze/agent-software-factory-research ~/.agents/skills/
```

Clients such as Claude Code that use different discovery directories can copy the Skills to the location specified by the host. The open format standardizes the Skill package structure, not each client's installation path or permission model.

After code is merged, the daily scheduled task reads `skills/analyze/agent-software-factory-research/SKILL.md`. Candidate and researched state remains in the task data directory and is never committed to Git. New solution guides are added as independent Markdown files rather than being embedded in `deploySkills.ts` or `deploySkillsEn.ts`.

Validate every Skill, resource reference, and website registry entry from the repository root:

```bash
python3 skills/analyze/agent-software-factory-research/scripts/validate_repository.py --repo-root .
```

The first phase of expanded candidate discovery runs only as a dry-run. The Agent first curates reviewed official sources into `/tmp/discovery-curated.json`, then runs:

```bash
cd skills/analyze/agent-software-factory-research
python3 scripts/discover_candidates.py import \
  --input /tmp/discovery-curated.json \
  --candidates /path/to/state/candidates.json \
  --researched /path/to/state/researched.json \
  --dry-run
python3 scripts/rank_candidates.py --candidates /path/to/state/candidates.json
(cd scripts && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v test_candidate_discovery.py test_fast_track.py)
```

A dry-run does not write candidates or discovery history. Formal import, `--strategy ranked`, and scheduled-task activation must be explicitly enabled after review.

## Fast Track Candidate Submission

The home page provides bilingual repository URL submission at `#submit`. It normalizes a GitHub repository root URL and opens a new Issue with the title, body, and labels prefilled through query parameters. It does not depend on the Issue Form already being present on `main`. The Issue body follows the language of the current page. Users must still sign in to GitHub and confirm Issue creation. GitHub Pages stores no URLs, contains no backend or GitHub Token, and does not modify candidate state directly.

- Issue Form: `.github/ISSUE_TEMPLATE/fast-track.yml`. Each Issue accepts one repository, with optional root-license-file evidence and notes.
- Required labels: `candidate:fast-track` and `status:queued`. Create both labels in the repository before using the form so they can be applied correctly.
- The page only generates a submission link; opening GitHub is never described as “submitted” or “admitted.”
- Compliance review, label transitions, and formal import are handled by the daily scheduled task. Official-repository, archive, license, and deduplication requirements are not relaxed for Fast Track.

### Automated Review and Controlled Import

`fast_track.py review` reads Issue JSON exported by the host and writes only the review report and optional curated JSON to `/tmp`, without writing state:

```bash
python3 scripts/fast_track.py review \
  --issue-json /tmp/fast-track-issue.json \
  --candidates /path/to/state/candidates.json \
  --researched /path/to/state/researched.json \
  --output /tmp/fast-track-review.json
```

After selecting the day's solution, the daily scheduled task processes the Fast Track queue through the host's existing GitHub tools to read Issues, update labels, and publish comments. No additional `GITHUB_TOKEN` injection is required. `PENDING` still stops the entire run. If the day already has a successful research record, only daily research is skipped; Fast Track maintenance still runs. Candidates imported on a given day join ranking from the next daily selection onward.

For authorized submissions, the daily task runs the formal import. It reviews the Issue and repository again, then performs a dry-run, atomic import, and ranking update:

```bash
python3 scripts/fast_track.py import \
  --issue-json /tmp/fast-track-issue.json \
  --review /tmp/fast-track-review.json \
  --candidates /path/to/state/candidates.json \
  --researched /path/to/state/researched.json \
  --history /path/to/state/discovery-history.json \
  --output /tmp/fast-track-import.json
```

After correcting a yellow-flagged Issue, return it to `status:queued`. Never grant import permission through comment text. Unknown licenses such as `NOASSERTION` always require manual license-file review and cannot be admitted automatically by the daily task. Machine scores use repository, README, release, and maintenance evidence, never stars.

## GitHub Registry and Resilient Visualization

The public [`agent-software-factory-registry`](https://github.com/lance-r17/agent-software-factory-registry) stores candidates, researched solutions, and discovery history. Each candidate has an independent `candidates/<slug>.json` file, while `candidates/index.json` preserves the original order. Candidate Issues in the main repository provide readable records, and GitHub Projects is only a visualization layer. The candidate pool is not published on GitHub Pages.

The daily task compares the registry with the local cache at startup. After cutover, the registry is authoritative and local `state/` is only a rebuildable cache. Cache changes are exported and delivered through registry PRs rather than direct background pushes to `main`. No paid services are required.

```bash
# Compare only; do not write state
python3 scripts/registry_sync.py verify \
  --registry-dir /tmp/agent-software-factory-registry \
  --state-dir /path/to/state

# Rebuild the cache from the registry after a machine failure
python3 scripts/registry_sync.py rebuild \
  --registry-dir /tmp/agent-software-factory-registry \
  --state-dir /path/to/state

# Export local changes to the registry worktree, then create a registry PR
python3 scripts/registry_sync.py export \
  --registry-dir /tmp/agent-software-factory-registry \
  --state-dir /path/to/state
```

`verify` writes nothing, `rebuild` verifies the result after writing, and `export` leaves local state unchanged. Candidate counts, ordering, scores, research records, and history must match field by field; comparing only the display table is insufficient.

## Indexed Solutions

| Solution | Version | Chinese route | English route | Verified |
| --- | --- | --- | --- | --- |
| OpenHands Agent Canvas | v1.43.0 | `#/solutions/openhands-agent-canvas` | `#/en/solutions/openhands-agent-canvas` | 2026-11-20 |
| mini-SWE-agent | v2.4.6 | `#/solutions/mini-swe-agent` | `#/en/solutions/mini-swe-agent` | 2026-11-21 |
| SWE-agent (legacy) | v1.1.0 | `#/solutions/swe-agent` | `#/en/solutions/swe-agent` | 2026-11-21 |
| Agentless | v1.5.0 | `#/solutions/agentless` | `#/en/solutions/agentless` | 2026-11-22 |

## Security Boundaries

Model keys never enter containers, GitHub Tokens never enter containers, and secrets are never written to YAML or Git. This repository contains public research content only and no secrets.
