def anchor_hash(record_id: str, sha256_hex: str) -> dict:
    return {"status": "simulated", "tx_hash": "0x" + "0" * 64}

def verify_hash(record_id: str, expected_hash: str) -> dict:
    return {"verified": True, "reason": "simulated"}
