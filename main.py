"""
KavachSetu — Advanced 6-Step Trust Engine (FastAPI + SQLite Implementation)
===========================================================================
Complete standalone Python FastAPI + SQLite implementation of the 6-Step
Scam Reporting Trust Engine pipeline:
  - Step 1: The Gatekeeper (Reject Junk like "12345", "test", "1234567890" with 400)
  - Step 2: The Cleaner (Normalize phones to +91XXXXXXXXXX, lowercase UPI IDs)
  - Step 3 & 4: Advanced Deduplication & Heuristics (Calculate trust_score:
      Base 1.0, +0.5 if len(note) > 30;
      0.0 on Same IP/ID, Copy-Paste Note, Velocity >10 in 10s, or
      Payload Entropy of 5 blank-note same-channel/pincode reports)
  - Step 5: The Judge (Verdict Calculation: VERIFIED_BUSINESS whitelist,
      Dispute Kill Switch under_review -> cap at SUSPICIOUS,
      Sum(trust_score) < 3 -> SUSPICIOUS + masked display_value,
      Sum(trust_score) >= 3 -> KNOWN_SCAM + full display_value)
  - Step 6: Required Endpoints (POST /reports with 429 rate limit, GET /lookup, POST /challenges)
"""

import re
import sqlite3
import time
import uuid
from collections import defaultdict
from contextlib import contextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(
    title="KavachSetu Advanced Trust Engine",
    description="6-Step Behavioral Trust Engine backed by SQLite",
    version="1.0.0",
)

DB_PATH = "kavachsetu_trust.db"

# Hardcoded dictionary of verified businesses & public helplines
VERIFIED_WHITELIST = {
    ("phone", "1930"): "National Cybercrime Helpline (I4C)",
    ("phone", "1909"): "TRAI Do Not Disturb",
    ("phone", "18001600"): "HDFC Bank Customer Care",
    ("phone", "18001234"): "State Bank of India Customer Care",
    ("phone", "18001080"): "ICICI Bank Customer Care",
    ("phone", "+918041002233"): "Fresh Bakes, Indiranagar",
    ("upi", "freshbakes@okaxis"): "Fresh Bakes, Indiranagar",
}

# In-memory rate limit tracker: reporter_id -> list of request timestamps (epoch seconds)
rate_limit_tracker: dict[str, list[float]] = defaultdict(list)


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS Reports (
                report_id TEXT PRIMARY KEY,
                identifier_type TEXT NOT NULL,
                identifier_value TEXT NOT NULL,
                reporter_id TEXT NOT NULL,
                ip_prefix TEXT NOT NULL,
                note TEXT NOT NULL,
                channel TEXT NOT NULL,
                pincode TEXT NOT NULL,
                timestamp REAL NOT NULL,
                trust_score REAL NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS Challenges (
                challenge_id TEXT PRIMARY KEY,
                identifier_type TEXT NOT NULL,
                identifier_value TEXT NOT NULL,
                claimant_name TEXT NOT NULL,
                status TEXT NOT NULL,
                timestamp REAL NOT NULL,
                UNIQUE(identifier_type, identifier_value)
            )
            """
        )


init_db()


# =====================================================================
# STEP 1 & STEP 2: THE GATEKEEPER (REJECT JUNK) & THE CLEANER
# =====================================================================

JUNK_VALUES = {
    "12345",
    "test",
    "testing",
    "1234567890",
    "0123456789",
    "98765432100",
    "0000000000",
    "9999999999",
}


def normalize_and_validate(identifier_type: str, raw_value: str) -> Optional[str]:
    if not identifier_type or not raw_value:
        return None

    kind = identifier_type.strip().lower()
    val = raw_value.strip()
    if not val or val.lower() in JUNK_VALUES:
        return None

    if kind == "phone":
        # Reject any alphabetic characters
        if re.search(r"[a-zA-Z]", val):
            return None
        cleaned = re.sub(r"[\s\-().]", "", val)

        # Allow official shortcodes & toll-free numbers
        if cleaned in {"1930", "1909"} or re.match(r"^(1800|1860)\d{4,7}$", cleaned):
            return cleaned

        # Extract 10-digit Indian subscriber number
        if re.match(r"^\+91\d{10}$", cleaned):
            ten = cleaned[3:]
        elif re.match(r"^91\d{10}$", cleaned):
            ten = cleaned[2:]
        elif re.match(r"^0\d{10}$", cleaned):
            ten = cleaned[1:]
        elif re.match(r"^\d{10}$", cleaned):
            ten = cleaned
        else:
            return None

        # Reject obvious junk ("1234567890", repeating digits like "9999999999", invalid starting digit)
        if (
            ten in JUNK_VALUES
            or len(set(ten)) == 1
            or not re.match(r"^[2-9]\d{9}$", ten)
        ):
            return None

        return f"+91{ten}"

    elif kind == "upi":
        cleaned = re.sub(r"\s+", "", val).lower()
        if not re.match(r"^[a-z0-9._-]{2,64}@[a-z0-9]{2,32}$", cleaned):
            return None
        return cleaned

    return None


def mask_display_value(identifier_type: str, normalized_value: str) -> str:
    kind = identifier_type.lower()
    if kind == "phone":
        digits = normalized_value.replace("+91", "")
        if len(digits) == 10:
            return f"{digits[:2]}XXXXX{digits[7:]}"
        return digits
    elif kind == "upi" and "@" in normalized_value:
        user, handle = normalized_value.split("@", 1)
        return f"{user[0]}***@{handle}"
    return normalized_value


# =====================================================================
# PYDANTIC SCHEMAS
# =====================================================================


class ReportPayload(BaseModel):
    identifier_type: str
    identifier_value: str
    reporter_id: str
    ip_prefix: Optional[str] = "103.21.124"
    note: Optional[str] = ""
    channel: Optional[str] = "Phone call"
    pincode: Optional[str] = "560102"


class ChallengePayload(BaseModel):
    identifier_type: str
    identifier_value: str
    claimant_name: str


# =====================================================================
# STEP 6: ENDPOINTS (POST /reports, GET /lookup, POST /challenges)
# =====================================================================


@app.post("/reports", status_code=201)
def create_report(payload: ReportPayload, request: Request):
    now = time.time()
    reporter_id = (payload.reporter_id or "anon").strip()

    # Basic Rate Limit: 429 if reporter_id hits > 5 times/minute
    recent_hits = [t for t in rate_limit_tracker[reporter_id] if now - t < 60.0]
    if len(recent_hits) >= 5:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded (>5 requests/minute)"},
        )
    recent_hits.append(now)
    rate_limit_tracker[reporter_id] = recent_hits

    # Step 1 & Step 2: Gatekeeper & Cleaner
    kind = payload.identifier_type.strip().lower()
    normalized = normalize_and_validate(kind, payload.identifier_value)
    if not normalized:
        return JSONResponse(status_code=400, content={"error": "Invalid format"})

    ip_prefix = (payload.ip_prefix or request.client.host or "103.21.124").strip()
    note_text = (payload.note or "").strip()
    channel = (payload.channel or "Phone call").strip()
    pincode = (payload.pincode or "560102").strip()

    # Step 3 & Step 4: Advanced Deduplication & Heuristics (Calculate trust_score)
    trust_score = 1.0
    if len(note_text) > 30:
        trust_score += 0.5  # Detailed Story Bonus (+0.5)

    with get_db() as conn:
        # 1. IP/ID Deduplication: If reporter_id OR ip_prefix already exists for this identifier_value -> 0.0
        dup_row = conn.execute(
            """
            SELECT 1 FROM Reports
            WHERE identifier_type = ? AND identifier_value = ?
              AND (reporter_id = ? OR ip_prefix = ?)
            LIMIT 1
            """,
            (kind, normalized, reporter_id, ip_prefix),
        ).fetchone()
        if dup_row:
            trust_score = 0.0

        # 2. Copy-Paste Filter: If exact same note text already exists for this identifier_value from a different IP -> 0.0
        if note_text and trust_score > 0.0:
            copy_row = conn.execute(
                """
                SELECT 1 FROM Reports
                WHERE identifier_type = ? AND identifier_value = ?
                  AND LOWER(TRIM(note)) = LOWER(TRIM(?))
                  AND ip_prefix != ?
                LIMIT 1
                """,
                (kind, normalized, note_text, ip_prefix),
            ).fetchone()
            if copy_row:
                trust_score = 0.0

        # 3. Velocity Tracking: If identifier_value received > 10 reports in the last 10 seconds -> 0.0
        velocity_row = conn.execute(
            """
            SELECT COUNT(*) AS cnt FROM Reports
            WHERE identifier_type = ? AND identifier_value = ?
              AND timestamp >= ?
            """,
            (kind, normalized, now - 10.0),
        ).fetchone()
        if velocity_row and velocity_row["cnt"] >= 10:
            trust_score = 0.0

        # 4. Payload Entropy: If the last 5 reports (4 previous + this one) have exact same channel, blank note, and same pincode -> 0.0
        if note_text == "":
            last_four = conn.execute(
                """
                SELECT report_id, channel, note, pincode FROM Reports
                WHERE identifier_type = ? AND identifier_value = ?
                ORDER BY timestamp DESC
                LIMIT 4
                """,
                (kind, normalized),
            ).fetchall()
            if len(last_four) == 4 and all(
                r["note"] == ""
                and r["channel"].lower() == channel.lower()
                and r["pincode"] == pincode
                for r in last_four
            ):
                trust_score = 0.0
                conn.executemany(
                    "UPDATE Reports SET trust_score = 0.0 WHERE report_id = ?",
                    [(r["report_id"],) for r in last_four],
                )

        report_id = f"rep_{uuid.uuid4().hex[:10]}"
        conn.execute(
            """
            INSERT INTO Reports (
                report_id, identifier_type, identifier_value,
                reporter_id, ip_prefix, note, channel, pincode,
                timestamp, trust_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                report_id,
                kind,
                normalized,
                reporter_id,
                ip_prefix,
                note_text,
                channel,
                pincode,
                now,
                trust_score,
            ),
        )

    return {
        "report_id": report_id,
        "identifier_type": kind,
        "normalized_value": normalized,
        "trust_score": trust_score,
    }


@app.get("/lookup")
def lookup_identifier(
    type: str = Query(..., description="phone or upi"),
    value: str = Query(..., description="Identifier value to look up"),
):
    kind = type.strip().lower()
    normalized = normalize_and_validate(kind, value)
    if not normalized:
        return JSONResponse(status_code=400, content={"error": "Invalid format"})

    # 1. Verified Whitelist Check
    if (kind, normalized) in VERIFIED_WHITELIST:
        return {
            "verdict": "VERIFIED_BUSINESS",
            "identifier_type": kind,
            "display_value": normalized,
            "trust_score_sum": 0.0,
            "distinct_reporters": 0,
            "challenged": False,
        }

    with get_db() as conn:
        # 2. Dispute Kill Switch
        challenge_row = conn.execute(
            """
            SELECT status FROM Challenges
            WHERE identifier_type = ? AND identifier_value = ?
            LIMIT 1
            """,
            (kind, normalized),
        ).fetchone()
        under_review = bool(
            challenge_row and challenge_row["status"] == "under_review"
        )

        # 3. Score Summation & Distinct Reporter Count
        agg = conn.execute(
            """
            SELECT
                COUNT(*) AS total_reports,
                COALESCE(SUM(trust_score), 0.0) AS trust_score_sum,
                COUNT(DISTINCT CASE WHEN trust_score > 0 THEN reporter_id END) AS distinct_reporters
            FROM Reports
            WHERE identifier_type = ? AND identifier_value = ?
            """,
            (kind, normalized),
        ).fetchone()

        total_reports = agg["total_reports"] if agg else 0
        score_sum = round(float(agg["trust_score_sum"] or 0.0), 2)
        distinct_reporters = int(agg["distinct_reporters"] or 0)

    if total_reports == 0:
        return {
            "verdict": "NO_REPORTS",
            "identifier_type": kind,
            "display_value": mask_display_value(kind, normalized),
            "trust_score_sum": 0.0,
            "distinct_reporters": 0,
            "challenged": under_review,
        }

    if under_review or score_sum < 3.0:
        return {
            "verdict": "SUSPICIOUS",
            "identifier_type": kind,
            "display_value": mask_display_value(kind, normalized),
            "trust_score_sum": score_sum,
            "distinct_reporters": max(1, distinct_reporters),
            "challenged": under_review,
        }

    return {
        "verdict": "KNOWN_SCAM",
        "identifier_type": kind,
        "display_value": normalized,
        "trust_score_sum": score_sum,
        "distinct_reporters": distinct_reporters,
        "challenged": False,
    }


@app.post("/challenges", status_code=201)
def create_challenge(payload: ChallengePayload):
    kind = payload.identifier_type.strip().lower()
    normalized = normalize_and_validate(kind, payload.identifier_value)
    if not normalized or not payload.claimant_name.strip():
        return JSONResponse(status_code=400, content={"error": "Invalid format"})

    challenge_id = f"chk_{uuid.uuid4().hex[:8]}"
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO Challenges (challenge_id, identifier_type, identifier_value, claimant_name, status, timestamp)
            VALUES (?, ?, ?, ?, 'under_review', ?)
            ON CONFLICT(identifier_type, identifier_value)
            DO UPDATE SET claimant_name = excluded.claimant_name, status = 'under_review', timestamp = excluded.timestamp
            """,
            (challenge_id, kind, normalized, payload.claimant_name.strip(), time.time()),
        )

    return {"challenge_id": challenge_id, "status": "under_review"}
