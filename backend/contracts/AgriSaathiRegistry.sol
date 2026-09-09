// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgriSaathiRegistry
/// @notice Tamper-evident hash-anchoring registry for AgriSaathi lots and
/// quality reports. Anyone can verify a record's hash was anchored at a
/// given block/timestamp; only authorized backend wallets can write, and a
/// record can never be overwritten once anchored (append-only).
contract AgriSaathiRegistry {
    struct Record {
        bytes32 dataHash;
        uint256 timestamp;
        address submitter;
    }

    address public owner;
    mapping(address => bool) public authorizedWriters;
    mapping(string => Record) private records;

    event RecordAnchored(
        string indexed recordId,
        bytes32 dataHash,
        address indexed submitter,
        uint256 timestamp
    );
    event WriterUpdated(address indexed account, bool allowed);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "AgriSaathiRegistry: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedWriters[msg.sender] || msg.sender == owner,
            "AgriSaathiRegistry: caller is not authorized"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedWriters[msg.sender] = true;
        emit WriterUpdated(msg.sender, true);
    }

    /// @notice Owner-only: grant or revoke write access for a backend wallet.
    function setAuthorized(address account, bool allowed) external onlyOwner {
        authorizedWriters[account] = allowed;
        emit WriterUpdated(account, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AgriSaathiRegistry: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Anchor a record's hash on-chain. Reverts if recordId was already anchored
    /// (append-only — this is what makes tampering detectable).
    function anchorRecord(string calldata recordId, bytes32 dataHash) external onlyAuthorized {
        require(records[recordId].timestamp == 0, "AgriSaathiRegistry: record already anchored");
        require(dataHash != bytes32(0), "AgriSaathiRegistry: empty hash");
        records[recordId] = Record({dataHash: dataHash, timestamp: block.timestamp, submitter: msg.sender});
        emit RecordAnchored(recordId, dataHash, msg.sender, block.timestamp);
    }

    /// @notice Anyone can read back an anchored record to verify it independently.
    function getRecord(string calldata recordId)
        external
        view
        returns (bytes32 dataHash, uint256 timestamp, address submitter)
    {
        Record memory r = records[recordId];
        return (r.dataHash, r.timestamp, r.submitter);
    }
}
