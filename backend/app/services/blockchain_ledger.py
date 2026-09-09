import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List
from app.schemas.ledger import LedgerLogRequest, LedgerBlock

# Simple append-only, hash-chained ledger persisted as JSON on disk.
# Each block's hash depends on the previous block's hash, so any tampering
# with an earlier block breaks the chain from that point forward — the
# core property of a blockchain, implemented without running real
# distributed-ledger infrastructure (Hyperledger Fabric etc.).
# Swap this file's storage backend for Hyperledger Fabric later without
# changing the public functions below (log_event / get_chain / verify_chain).

# Vercel's serverless filesystem is read-only except /tmp, and files
# written there do not persist across cold starts. Locally (no VERCEL
# env var) we keep using the real project directory so data persists
# across local runs.
if os.environ.get("VERCEL"):
    LEDGER_DIR = Path("/tmp/ledger_store")
else:
    LEDGER_DIR = Path(__file__).resolve().parents[1] / "data" / "ledger_store"
LEDGER_DIR.mkdir(parents=True, exist_ok=True)


def _ledger_path(entity_type: str, entity_id: str) -> Path:
    safe_type = entity_type.replace("/", "_")
    safe_id = entity_id.replace("/", "_")
    return LEDGER_DIR / f"{safe_type}__{safe_id}.json"


def _compute_hash(block_data: dict) -> str:
    block_string = json.dumps(block_data, sort_keys=True).encode()
    return hashlib.sha256(block_string).hexdigest()


def _read_chain(entity_type: str, entity_id: str) -> List[dict]:
    path = _ledger_path(entity_type, entity_id)
    if not path.exists():
        return []
    with open(path) as f:
        return json.load(f)


def _write_chain(entity_type: str, entity_id: str, chain: List[dict]):
    path = _ledger_path(entity_type, entity_id)
    with open(path, "w") as f:
        json.dump(chain, f, indent=2)


def log_event(req: LedgerLogRequest) -> LedgerBlock:
    chain = _read_chain(req.entity_type, req.entity_id)
    prev_hash = chain[-1]["hash"] if chain else "0" * 64

    block_data = {
        "index": len(chain),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "entity_type": req.entity_type,
        "entity_id": req.entity_id,
        "event_type": req.event_type,
        "payload": req.payload,
        "actor": req.actor,
        "prev_hash": prev_hash,
    }
    block_data["hash"] = _compute_hash(block_data)

    chain.append(block_data)
    _write_chain(req.entity_type, req.entity_id, chain)
    return LedgerBlock(**block_data)


def get_chain(entity_type: str, entity_id: str) -> List[LedgerBlock]:
    chain = _read_chain(entity_type, entity_id)
    return [LedgerBlock(**b) for b in chain]


def list_all_blocks(entity_type: str, limit: int = 100) -> List[dict]:
    """
    Every block, across every entity_id, for a given entity_type — the
    'shared feed' read path (e.g. all success stories from all farmers,
    not just one device's chain). Sorted newest first.
    """
    safe_type = entity_type.replace("/", "_")
    all_blocks = []
    for path in LEDGER_DIR.glob(f"{safe_type}__*.json"):
        try:
            with open(path) as f:
                chain = json.load(f)
            all_blocks.extend(chain)
        except (json.JSONDecodeError, OSError):
            continue
    all_blocks.sort(key=lambda b: b.get("timestamp", ""), reverse=True)
    return all_blocks[:limit]


def verify_chain(entity_type: str, entity_id: str) -> bool:
    chain = _read_chain(entity_type, entity_id)
    prev_hash = "0" * 64
    for block in chain:
        expected_prev = block["prev_hash"]
        if expected_prev != prev_hash:
            return False
        block_copy = {k: v for k, v in block.items() if k != "hash"}
        if _compute_hash(block_copy) != block["hash"]:
            return False
        prev_hash = block["hash"]
    return True
