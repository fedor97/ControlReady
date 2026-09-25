"""GET /labs — serves the lab catalog (metadata only, not simulation data).

The full LabDefinition (devices, ladder program, fault catalog) is bundled
into the frontend, not fetched from here — this endpoint just lets the
Dashboard know which labs exist/are unlocked, so Lab 2/3 can be added by
seeding a new row instead of shipping a frontend change to the catalog list.
"""
import os

import boto3

from common.response import ok

dynamodb = boto3.resource("dynamodb")
TABLE_PREFIX = os.environ.get("DDB_TABLE_PREFIX", "ControlReady")
labs_table = dynamodb.Table(f"{TABLE_PREFIX}-Labs")


def handler(_event: dict, _context) -> dict:
    resp = labs_table.scan()
    return ok({"labs": resp.get("Items", [])})
