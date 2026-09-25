"""GET/POST /progress — StudentProgress + TroubleshootingSessions + Scores.

Called only on session start and session complete from the frontend (never
per simulator tick) to keep DynamoDB write volume, and therefore cost, low.
See ARCHITECTURE.md §4 and §7 (Demo Mode never calls this at all).
"""
import json
import os
import time
import uuid

import boto3
from boto3.dynamodb.conditions import Key

from common.response import error, ok, user_id_from_event

dynamodb = boto3.resource("dynamodb")
TABLE_PREFIX = os.environ.get("DDB_TABLE_PREFIX", "ControlReady")

progress_table = dynamodb.Table(f"{TABLE_PREFIX}-StudentProgress")
sessions_table = dynamodb.Table(f"{TABLE_PREFIX}-TroubleshootingSessions")
scores_table = dynamodb.Table(f"{TABLE_PREFIX}-Scores")


def handler(event: dict, _context) -> dict:
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    user_id = user_id_from_event(event)
    if not user_id:
        return error("Unauthorized", 401)

    if method == "GET":
        return _get_progress(user_id)
    if method == "POST":
        return _post_progress(user_id, event)
    return error(f"Unsupported method {method}", 405)


def _get_progress(user_id: str) -> dict:
    resp = progress_table.query(KeyConditionExpression=Key("userId").eq(user_id))
    return ok({"items": resp.get("Items", [])})


def _post_progress(user_id: str, event: dict) -> dict:
    body = json.loads(event.get("body") or "{}")
    lab_id = body.get("labId")
    if not lab_id:
        return error("labId is required")

    session_id = str(uuid.uuid4())
    now = int(time.time())

    sessions_table.put_item(
        Item={
            "userId": user_id,
            "sessionId": session_id,
            "labId": lab_id,
            "faultId": body.get("faultId", ""),
            "startTime": body.get("startedAt", now),
            "completionTime": now,
            "hintsUsed": body.get("hintsUsed", 0),
            "actionCounts": body.get("actionCounts", {}),
            "score": body.get("score", {}),
        }
    )
    scores_table.put_item(
        Item={
            "userId": user_id,
            "sessionId": session_id,
            **body.get("score", {}).get("breakdown", {}),
            "total": body.get("score", {}).get("total", 0),
        }
    )
    # Simplified for MVP: records the latest score as bestScore on first completion only.
    # A true running-max would need a read-modify-write or a DynamoDB transaction; deferred to ROADMAP.md.
    new_total = body.get("score", {}).get("total", 0)
    progress_table.update_item(
        Key={"userId": user_id, "labId": lab_id},
        UpdateExpression="SET #status = :completed, bestScore = if_not_exists(bestScore, :new_total), lastCompletedAt = :now ADD attempts :one",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":completed": "completed",
            ":new_total": new_total,
            ":now": now,
            ":one": 1,
        },
    )
    return ok({"sessionId": session_id})
