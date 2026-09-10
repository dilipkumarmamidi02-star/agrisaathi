"""
AgriSaathi real blockchain integration.

Uses the deployed AgriSaathiRegistry Solidity contract.

Environment variables:

BLOCKCHAIN_RPC_URL
BLOCKCHAIN_PRIVATE_KEY
BLOCKCHAIN_CONTRACT_ADDRESS
BLOCKCHAIN_CHAIN_ID

The module intentionally performs configuration lazily so that
the backend can still start when blockchain credentials are not
configured for a particular environment.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

from web3 import Web3


BACKEND_ROOT = Path(__file__).resolve().parents[1]
ABI_PATH = BACKEND_ROOT / "contracts" / "AgriSaathiRegistry.abi.json"


def _get_config() -> tuple[Web3, Any]:
    """
    Create a Web3 connection and contract instance.

    Configuration is loaded only when a blockchain operation is
    actually requested.
    """

    rpc_url = os.getenv(
        "BLOCKCHAIN_RPC_URL",
        "http://127.0.0.1:8545",
    )

    private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")

    contract_address = os.getenv("BLOCKCHAIN_CONTRACT_ADDRESS")

    if not private_key:
        raise RuntimeError(
            "BLOCKCHAIN_PRIVATE_KEY is not configured"
        )

    if not contract_address:
        raise RuntimeError(
            "BLOCKCHAIN_CONTRACT_ADDRESS is not configured"
        )

    if not ABI_PATH.exists():
        raise RuntimeError(
            f"AgriSaathiRegistry ABI not found: {ABI_PATH}"
        )

    w3 = Web3(Web3.HTTPProvider(rpc_url))

    if not w3.is_connected():
        raise RuntimeError(
            f"Unable to connect to blockchain RPC: {rpc_url}"
        )

    with ABI_PATH.open("r", encoding="utf-8") as f:
        abi = json.load(f)

    checksum_address = Web3.to_checksum_address(
        contract_address
    )

    contract = w3.eth.contract(
        address=checksum_address,
        abi=abi,
    )

    return w3, contract


def _normalize_hash(sha256_hex: str) -> str:
    """
    Validate and normalize a SHA-256 hexadecimal digest.
    """

    value = sha256_hex.strip().lower()

    if value.startswith("0x"):
        value = value[2:]

    if len(value) != 64:
        raise ValueError(
            "SHA-256 hash must contain exactly 64 hexadecimal characters"
        )

    try:
        int(value, 16)
    except ValueError as exc:
        raise ValueError(
            "Invalid SHA-256 hexadecimal hash"
        ) from exc

    return value


def _hash_bytes32(sha256_hex: str) -> bytes:
    """
    Convert SHA-256 hex digest to Solidity bytes32.
    """

    normalized = _normalize_hash(sha256_hex)

    return bytes.fromhex(normalized)


def anchor_hash(record_id: str, sha256_hex: str) -> dict:
    """
    Anchor a SHA-256 record hash on the real AgriSaathiRegistry.

    Returns only VERIFIED after the transaction succeeds and the
    stored blockchain record is read back and matches the expected hash.
    """

    if not record_id or not record_id.strip():
        raise ValueError("record_id is required")

    record_id = record_id.strip()

    normalized_hash = _normalize_hash(sha256_hex)
    hash_bytes = _hash_bytes32(normalized_hash)

    w3, contract = _get_config()

    private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
    if not private_key:
        raise RuntimeError(
            "BLOCKCHAIN_PRIVATE_KEY is not configured"
        )

    account = w3.eth.account.from_key(private_key)
    sender = account.address

    # Check whether the record already exists.
    existing_hash, existing_timestamp, existing_submitter = (
        contract.functions.getRecord(record_id).call()
    )

    # If already anchored, verify instead of attempting to overwrite.
    if existing_timestamp and existing_timestamp != 0:
        existing_hash_hex = existing_hash.hex().lower()

        if existing_hash_hex.startswith("0x"):
            existing_hash_hex = existing_hash_hex[2:]

        if existing_hash_hex == normalized_hash:
            return {
                "status": "verified",
                "verified": True,
                "tx_hash": None,
                "block_number": None,
                "record_id": record_id,
                "sha256": normalized_hash,
                "submitter": existing_submitter,
                "reason": "record_already_anchored",
            }

        raise RuntimeError(
            f"Blockchain record already exists with a different hash: "
            f"{record_id}"
        )

    # Confirm sender is authorized.
    owner = contract.functions.owner().call()

    authorized = contract.functions.authorizedWriters(
        sender
    ).call()

    if sender.lower() != owner.lower() and not authorized:
        raise PermissionError(
            f"Blockchain account {sender} is not authorized to anchor records"
        )

    nonce = w3.eth.get_transaction_count(
        sender,
        "pending",
    )

    chain_id = w3.eth.chain_id

    function = contract.functions.anchorRecord(
        record_id,
        hash_bytes,
    )

    # Estimate gas from the actual chain.
    gas_estimate = function.estimate_gas(
        {
            "from": sender,
        }
    )

    gas_price = w3.eth.gas_price

    transaction = function.build_transaction(
        {
            "from": sender,
            "nonce": nonce,
            "chainId": chain_id,
            "gas": int(gas_estimate * 1.20),
            "gasPrice": gas_price,
        }
    )

    signed = account.sign_transaction(transaction)

    tx_hash = w3.eth.send_raw_transaction(
        signed.raw_transaction
    )

    receipt = w3.eth.wait_for_transaction_receipt(
        tx_hash,
        timeout=300,
    )

    if receipt.status != 1:
        raise RuntimeError(
            f"Blockchain transaction failed: {tx_hash.hex()}"
        )

    # Read the record back from the blockchain.
    stored_hash, stored_timestamp, stored_submitter = (
        contract.functions.getRecord(record_id).call()
    )

    stored_hash_hex = stored_hash.hex().lower()

    if stored_hash_hex.startswith("0x"):
        stored_hash_hex = stored_hash_hex[2:]

    if stored_hash_hex != normalized_hash:
        raise RuntimeError(
            "Blockchain transaction succeeded but stored hash "
            "does not match expected SHA-256 hash"
        )

    if not stored_timestamp:
        raise RuntimeError(
            "Blockchain transaction succeeded but record timestamp is missing"
        )

    return {
        "status": "verified",
        "verified": True,
        "tx_hash": tx_hash.hex(),
        "block_number": receipt.blockNumber,
        "record_id": record_id,
        "sha256": normalized_hash,
        "submitter": stored_submitter,
        "timestamp": stored_timestamp,
        "reason": "real_blockchain_transaction_confirmed",
    }


def verify_hash(record_id: str, expected_hash: str) -> dict:
    """
    Verify an existing record against the hash stored on-chain.
    """

    if not record_id or not record_id.strip():
        raise ValueError("record_id is required")

    record_id = record_id.strip()

    normalized_hash = _normalize_hash(expected_hash)

    w3, contract = _get_config()

    stored_hash, timestamp, submitter = (
        contract.functions.getRecord(record_id).call()
    )

    stored_hash_hex = stored_hash.hex().lower()

    if stored_hash_hex.startswith("0x"):
        stored_hash_hex = stored_hash_hex[2:]

    verified = (
        bool(timestamp)
        and stored_hash_hex == normalized_hash
    )

    return {
        "verified": verified,
        "status": "verified" if verified else "mismatch",
        "record_id": record_id,
        "expected_hash": normalized_hash,
        "stored_hash": stored_hash_hex,
        "timestamp": timestamp,
        "submitter": submitter,
        "reason": (
            "on_chain_hash_matches"
            if verified
            else "on_chain_hash_mismatch"
        ),
    }


def calculate_sha256(data: bytes) -> str:
    """
    Calculate a SHA-256 digest for arbitrary bytes.
    """

    return hashlib.sha256(data).hexdigest()


def calculate_record_hash(record: dict) -> str:
    """
    Calculate a deterministic SHA-256 hash for a structured record.
    """

    canonical = json.dumps(
        record,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")

    return hashlib.sha256(canonical).hexdigest()


def blockchain_health() -> dict:
    """
    Check blockchain RPC, chain ID, contract and owner.
    """

    w3, contract = _get_config()

    contract_address = os.getenv(
        "BLOCKCHAIN_CONTRACT_ADDRESS"
    )

    owner = contract.functions.owner().call()

    return {
        "connected": w3.is_connected(),
        "chain_id": w3.eth.chain_id,
        "latest_block": w3.eth.block_number,
        "contract_address": contract_address,
        "contract_owner": owner,
        "status": "healthy",
    }
