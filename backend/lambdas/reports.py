"""POST /reports — persist a submitted ServiceReport with its rule-based rubric score.

No AI grading in the MVP (see ARCHITECTURE.md). The rubric itself lives in the
frontend (`engine/reportRubric.ts`) for instant feedback; this handler trusts
the client-computed score for the MVP and simply stores it. A stricter future
version would re-run an equivalent rubric server-side before persisting.
"""
import json
import os
import time
import uuid

import boto3

from common.response import error, ok, user_id_from_event

dynamodb = boto3.resource("dynamodb")
TABLE_PREFIX = os.environ.get("DDB_TABLE_PREFIX", "ControlReady")
reports_table = dynamodb.Table(f"{TABLE_PREFIX}-ServiceReports")

REQUIRED_FIELDS = ["technicianName", "workOrderId", "problemFound", "rootCause", "correctiveAction", "testingPerformed", "finalStatus"]


def handler(event: dict, _context) -> dict:
    user_id = user_id_from_event(event)
    if not user_id:
        return error("Unauthorized", 401)

    body = json.loads(event.get("body") or "{}")
    missing = [f for f in REQUIRED_FIELDS if not body.get(f)]
    if missing:
        return error(f"Missing required fields: {', '.join(missing)}")

    session_id = body.get("sessionId") or str(uuid.uuid4())
    reports_table.put_item(
        Item={
            "userId": user_id,
            "sessionId": session_id,
            "submittedAt": int(time.time()),
            **{f: body[f] for f in REQUIRED_FIELDS},
            "rubricScore": body.get("rubricScore", 0),
        }
    )
    return ok({"sessionId": session_id, "stored": True})
