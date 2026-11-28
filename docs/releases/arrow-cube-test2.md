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
| 26 Nov | 1.0.6 (7), status completed (Drop 2048 production still 1.1.0 (12)) | 45801039398 |
| 27 Nov | 1.0.6 (7), status completed (Drop 2048 production still 1.1.0 (12)) | 45981820031 |
| 28 Nov | 1.0.6 (7), status completed (Drop 2048 production still 1.1.0 (12)) | 46135011081 |

## Testers
| Date | Opted-in testers | Source |
|---|---|---|
| 24 Nov | not shared yet (CEO shares the link once Google approves 1.0.6) | CEO message 23 Nov |
| 25 Nov | unknown: no CEO reply yet on the 'share the tester link' approval | HQ approvals |
| 26 Nov | still unknown: approval open, no CEO message or inbox mail about testers | HQ approvals, hq/inbox |
| 27 Nov | still unknown: approval open since 23 Nov, no CEO message or inbox mail about testers. The 14-day clock has most likely not started | HQ approvals, msgs, hq/inbox |
| 28 Nov | still unknown: no CEO message or inbox mail about testers. If the link goes out by 1 Dec, the earliest reapply is about 15 Dec | HQ approvals, msgs, hq/inbox |

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
- 1.0.15 (16), build run https://github.com/ebyb65/arrow-cube-3d/actions/runs/46061511396 (develop 766f5c5, 27 Nov, green; Lena checked 28 Nov: startup and ads unchanged). Replaces the queued 1.0.7 to 1.0.14 builds. New in 1.0.15: asks Google Play for the player's age range on launch (Play Age Signals, required for California from 1 Jan 2027); under 18 gets child-directed, non-personalized ads. On top of 1.0.6 it also adds (from 1.0.7 to 1.0.14):
  - Send feedback button (home screen and Player Profile): a direct channel for tester feedback
  - Classic 2D mode
  - A level win counts once (fast final taps paid up to 6x coins and brought interstitials early); a win can no longer pop up after leaving the level
  - Eraser: Cancel gives the eraser back; tapping Eraser twice no longer uses a second one; bigger Cancel button; one message instead of three
  - One-time tip cards for Eraser, Wand (asks before it fires) and the first two-cube level (26)
  - Arrows on the dimmed side faces readable in the Wood, Sunset and Crystal themes; no faint far-side arrows through the Crystal cube (1.0.13)
  - Hint: the hinted arrow stays bright green and is always on a face you can see; the cube turns to it if needed (1.0.14)
  - Ad debug text off for players; the build proves the Ad Quality SDK is absent
- Still blocked before upload: the feedback address (button points to support@yebeegames.com, which has no inbox; CEO creating a Gmail, ac-feedback-addr), then Arjun merges arjun/feedback-gmail-2 and rebuilds, Lena re-checks the feedback button (5 min), Theo uploads to alpha.
- These are QA-driven fixes, not tester feedback yet. For the reapplication, at least one update should answer real tester feedback, so the tester link matters more than the next build.

## Production application draft
To be written here around 8 Dec: who the testers are, how they were recruited, how they engaged, the feedback received, and what changed in response.
