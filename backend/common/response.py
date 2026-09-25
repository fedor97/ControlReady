"""Shared helpers for API Gateway (HTTP API / Lambda proxy) responses.

Kept deliberately tiny: the MVP's Lambdas do simple DynamoDB reads/writes,
not orchestration, so a shared framework would be overkill.
"""
import json
from decimal import Decimal
from typing import Any


class _DecimalEncoder(json.JSONEncoder):
    def default(self, o: Any) -> Any:
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
}


def ok(body: Any, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, cls=_DecimalEncoder),
    }


def error(message: str, status: int = 400) -> dict:
    return ok({"error": message}, status)


def user_id_from_event(event: dict) -> str | None:
    """Extract the Cognito sub from a Lambda proxy event's JWT authorizer claims."""
    try:
        return event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]
    except (KeyError, TypeError):
        return None
