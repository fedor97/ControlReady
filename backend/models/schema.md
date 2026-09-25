# DynamoDB Data Model

All tables use on-demand (`PAY_PER_REQUEST`) billing. Keys are chosen so the app's actual access patterns (get a student's progress, list a student's sessions, list labs) are single-partition queries — no scans in the request path.

## Users
| Attribute | Type | Notes |
|---|---|---|
| `userId` (PK) | String | Cognito `sub` |
| `email` | String | |
| `displayName` | String | |
| `createdAt` | String (ISO) | |

## Labs
| Attribute | Type | Notes |
|---|---|---|
| `labId` (PK) | String | e.g. `lab1-motor-control` |
| `name` | String | |
| `summary` | String | |
| `skillOnCompletion` | String | |
| `status` | String | `available` \| `coming_soon` |

Seeded from the frontend's `LabDefinition` catalog metadata (not the full simulation data — that stays in the client bundle).

## WorkOrders
| Attribute | Type | Notes |
|---|---|---|
| `workOrderId` (PK) | String | e.g. `WO-1001` |
| `labId` | String | |
| `equipment` | String | |
| `problem` | String | |
| `description` | String | |
| `task` | String | |

## FaultScenarios
| Attribute | Type | Notes |
|---|---|---|
| `labId` (PK) | String | |
| `faultId` (SK) | String | e.g. `wrong_vfd_ip` |
| `title` | String | |
| `implemented` | Bool | |
| `rootCause` | String | |
| `correctiveAction` | String | |

## StudentProgress
| Attribute | Type | Notes |
|---|---|---|
| `userId` (PK) | String | |
| `labId` (SK) | String | one item per lab per student |
| `status` | String | `not_started` \| `in_progress` \| `completed` |
| `bestScore` | Number | |
| `attempts` | Number | |
| `lastCompletedAt` | String (ISO) | |
| `skillsEarned` | String Set | |

## TroubleshootingSessions
Written once per completed (or abandoned) lab attempt — **not** per simulator tick, to keep write volume and cost low.

| Attribute | Type | Notes |
|---|---|---|
| `userId` (PK) | String | |
| `sessionId` (SK) | String | ULID, sortable by time |
| `labId` | String | |
| `faultId` | String | |
| `startTime` | String (ISO) | |
| `completionTime` | String (ISO) | |
| `hintsUsed` | Number | |
| `actionCounts` | Map | tallies by `ActionType`, not the full raw log |
| `score` | Map | `{ total, breakdown: {...} }` |

## Scores
| Attribute | Type | Notes |
|---|---|---|
| `userId` (PK) | String | |
| `sessionId` (SK) | String | matches `TroubleshootingSessions` |
| `total` | Number | |
| `networking` / `plc` / `faultDiagnosis` / `verification` / `documentation` | Number | 0-100 each |

## ServiceReports
| Attribute | Type | Notes |
|---|---|---|
| `userId` (PK) | String | |
| `sessionId` (SK) | String | |
| `technicianName` | String | |
| `workOrderId` | String | |
| `problemFound` / `rootCause` / `correctiveAction` / `testingPerformed` | String | |
| `finalStatus` | String | |
| `rubricScore` | Number | from `reportRubric.ts`, recomputed server-side on write |

## AIInteractions
Reserved for the future optional premium AI Tutor (not used by the MVP's rule-based hint engine — see `ARCHITECTURE.md` §6). Schema kept here so the table can be provisioned ahead of time without a migration:

| Attribute | Type | Notes |
|---|---|---|
| `userId` (PK) | String | |
| `interactionId` (SK) | String | |
| `sessionId` | String | |
| `question` | String | |
| `response` | String | |
| `hintLevel` | Number | |
