# Arrow Cube 3D: second closed test (log)

Owner: Theo (releases and compliance). Backlog item: ac-test2.

## Why
Google refused production access on 23 Nov 2026: testers were not engaged and/or feedback was not acted on through updates. Google asked for 14 more days of closed testing with real testers, then a new application.

## Dates
- Test start: 23 Nov 2026 (1.0.6 code 7 uploaded to the closed testing track, alpha).
- Earliest reapply: about 8 Dec 2026, and only if 14 days of engaged testing have passed. The clock that counts is testers actually opted in and playing, so if the tester link goes out later than 25 Nov, the reapply date moves with it.
- Target: 12+ real, active testers who open the game on several different days.

## Track status (read-only Play API checks)
| Date | alpha (closed testing) | Run |
|---|---|---|
| 23 Nov | 1.0.6 (7), status completed (Google review pending) | 45242169278 |
| 24 Nov | 1.0.6 (7), status completed | 45374476945 |
| 25 Nov | 1.0.6 (7), status completed | 45594791313 |

## Testers
| Date | Opted-in testers | Source |
|---|---|---|
| 24 Nov | not shared yet (CEO shares the link once Google approves 1.0.6) | CEO message 23 Nov |
| 25 Nov | unknown: no CEO reply yet on the 'share the tester link' approval | HQ approvals |

## Tester feedback received
| Date | From | Feedback | Answered by |
|---|---|---|---|
| (none yet) | | | |

Feedback channels: the in-game "Send feedback" button (from 1.0.7; needs a working address, see ac-feedback-addr), CEO messages in HQ, and the business inbox (hq/inbox).

## Updates shipped to testers
| Version | Date on alpha | What changed | Feedback it answers |
|---|---|---|---|
| 1.0.6 (7) | 23 Nov | Treasure chests, colour themes, own icon, level map with stars, daily puzzle with streaks | Baseline for the second test |

## Queued updates
- 1.0.10 (11), build run https://github.com/ebyb65/arrow-cube-3d/actions/runs/45588603216 (develop, 25 Nov, green). Replaces the queued 1.0.7/1.0.8/1.0.9 builds. On top of 1.0.6 it adds:
  - Send feedback button (home screen and Player Profile): a direct channel for tester feedback
  - Classic 2D mode
  - A level win counts once (fast final taps paid up to 6x coins and brought interstitials early)
  - Eraser: Cancel gives the eraser back; tapping Eraser twice no longer uses a second one; bigger Cancel button
  - Ad debug text off for players
- Still blocked before upload: (1) the feedback address (button points to support@yebeegames.com, which has no inbox; CEO creating a Gmail, ac-feedback-addr), then Arjun rebuilds; (2) Lena's final re-check (ac-109-qa). Theo uploads to alpha right after both.
- These are QA-driven fixes, not tester feedback yet. For the reapplication, at least one update should answer real tester feedback, so the tester link matters more than the next build.

## Production application draft
To be written here around 8 Dec: who the testers are, how they were recruited, how they engaged, the feedback received, and what changed in response.
