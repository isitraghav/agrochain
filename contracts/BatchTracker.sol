// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BatchTracker
 * @dev A smart contract for tracking batch ownership, transfers, and IPFS metadata
 */
contract BatchTracker {
    // Structure to store batch information
    struct Batch {
        uint256 batchId;
        address[] ownerHistory;
        bool exists;
        uint256 createdAt;
        uint256 lastTransferAt;
        string ipfsHash; // Added field for IPFS metadata
    }

    // Mapping from batch ID to Batch struct
    mapping(uint256 => Batch) public batches;

    // Mapping to check if a batch exists
    mapping(uint256 => bool) public batchExists;

    // Counter for generating unique batch IDs
    uint256 private nextBatchId;

    // Events
    event BatchCreated(
        uint256 indexed batchId,
        address indexed creator,
        uint256 timestamp,
        string ipfsHash
    );
    event BatchTransferred(
        uint256 indexed batchId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    event MetadataUpdated(
        uint256 indexed batchId,
        string oldIpfsHash,
        string newIpfsHash,
        uint256 timestamp
    );

    // Modifiers
    modifier batchMustExist(uint256 _batchId) {
        require(batchExists[_batchId], "Batch does not exist");
        _;
    }

    modifier onlyCurrentOwner(uint256 _batchId) {
        require(batchExists[_batchId], "Batch does not exist");
        require(
            batches[_batchId].ownerHistory[
                batches[_batchId].ownerHistory.length - 1
            ] == msg.sender,
            "Only current owner can modify batch"
        );
        _;
    }

    /**
     * @dev Constructor - initializes the contract
     */
    constructor() {
        nextBatchId = 1;
    }

    /**
     * @dev Creates a new batch with the caller as the initial owner
     * @param _ipfsHash The IPFS hash (CID) pointing to metadata
     * @return batchId The ID of the created batch
     */
    function createBatch(string memory _ipfsHash) external returns (uint256) {
        uint256 batchId = nextBatchId;
        nextBatchId++;

        // Initialize the batch
        batches[batchId].batchId = batchId;
        batches[batchId].ownerHistory.push(msg.sender);
        batches[batchId].exists = true;
        batches[batchId].createdAt = block.timestamp;
        batches[batchId].lastTransferAt = block.timestamp;
        batches[batchId].ipfsHash = _ipfsHash;

        batchExists[batchId] = true;

        emit BatchCreated(batchId, msg.sender, block.timestamp, _ipfsHash);
        return batchId;
    }

    /**
     * @dev Transfers a batch to a new owner
     * @param _batchId The ID of the batch to transfer
     * @param _newOwner The address of the new owner
     */
    function transferBatch(
        uint256 _batchId,
        address _newOwner
    ) external batchMustExist(_batchId) onlyCurrentOwner(_batchId) {
        require(_newOwner != address(0), "Cannot transfer to zero address");
        require(
            _newOwner != getCurrentOwner(_batchId),
            "Cannot transfer to current owner"
        );

        address currentOwner = getCurrentOwner(_batchId);

        // Add new owner to the history
        batches[_batchId].ownerHistory.push(_newOwner);
        batches[_batchId].lastTransferAt = block.timestamp;

        emit BatchTransferred(
            _batchId,
            currentOwner,
            _newOwner,
            block.timestamp
        );
    }

    /**
     * @dev Updates the IPFS metadata of a batch (only current owner can do this)
     * @param _batchId The ID of the batch
     * @param _newIpfsHash The new IPFS hash
     */
    function updateMetadata(
        uint256 _batchId,
        string memory _newIpfsHash
    ) external batchMustExist(_batchId) onlyCurrentOwner(_batchId) {
        string memory oldHash = batches[_batchId].ipfsHash;
        batches[_batchId].ipfsHash = _newIpfsHash;

        emit MetadataUpdated(_batchId, oldHash, _newIpfsHash, block.timestamp);
    }

    /**
     * @dev Gets the current owner of a batch
     * @param _batchId The ID of the batch
     * @return The address of the current owner
     */
    function getCurrentOwner(
        uint256 _batchId
    ) public view batchMustExist(_batchId) returns (address) {
        return
            batches[_batchId].ownerHistory[
                batches[_batchId].ownerHistory.length - 1
            ];
    }

    /**
     * @dev Gets the complete ownership history of a batch
     * @param _batchId The ID of the batch
     * @return Array of addresses representing the ownership history
     */
    function getOwnerHistory(
        uint256 _batchId
    ) external view batchMustExist(_batchId) returns (address[] memory) {
        return batches[_batchId].ownerHistory;
    }

    /**
     * @dev Gets batch information
     * @param _batchId The ID of the batch
     * @return batchId The batch ID
     * @return currentOwner The current owner address
     * @return ownerCount The number of owners in history
     * @return createdAt When the batch was created
     * @return lastTransferAt When the batch was last transferred
     * @return ipfsHash The IPFS metadata hash
     */
    function getBatchInfo(
        uint256 _batchId
    )
        external
        view
        batchMustExist(_batchId)
        returns (
            uint256 batchId,
            address currentOwner,
            uint256 ownerCount,
            uint256 createdAt,
            uint256 lastTransferAt,
            string memory ipfsHash
        )
    {
        Batch memory batch = batches[_batchId];
        return (
            batch.batchId,
            batch.ownerHistory[batch.ownerHistory.length - 1],
            batch.ownerHistory.length,
            batch.createdAt,
            batch.lastTransferAt,
            batch.ipfsHash
        );
    }

    /**
     * @dev Gets the total number of batches created
     * @return The total number of batches
     */
    function getTotalBatches() external view returns (uint256) {
        return nextBatchId - 1;
    }

    /**
     * @dev Gets the number of owners a batch has had
     * @param _batchId The ID of the batch
     * @return The number of owners
     */
    function getOwnerCount(
        uint256 _batchId
    ) external view batchMustExist(_batchId) returns (uint256) {
        return batches[_batchId].ownerHistory.length;
    }

    /**
     * @dev Checks if an address was ever an owner of a batch
     * @param _batchId The ID of the batch
     * @param _address The address to check
     * @return True if the address was ever an owner, false otherwise
     */
    function wasOwner(
        uint256 _batchId,
        address _address
    ) external view batchMustExist(_batchId) returns (bool) {
        address[] memory history = batches[_batchId].ownerHistory;
        for (uint256 i = 0; i < history.length; i++) {
            if (history[i] == _address) {
                return true;
            }
        }
        return false;
    }
}
