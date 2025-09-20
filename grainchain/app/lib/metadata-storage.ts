// Local storage for batch metadata hashes
// This is a temporary solution until the smart contract is updated to store IPFS hashes

interface BatchMetadataMapping {
  [batchId: number]: string; // IPFS hash
}

const STORAGE_KEY = 'grainchain_batch_metadata';

export class MetadataStorage {
  /**
   * Store IPFS hash for a batch ID
   */
  static setBatchMetadata(batchId: number, ipfsHash: string): void {
    try {
      const existing = this.getAllBatchMetadata();
      existing[batchId] = ipfsHash;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      console.log(`Stored metadata hash for batch ${batchId}: ${ipfsHash}`);
    } catch (error) {
      console.error('Failed to store batch metadata:', error);
    }
  }

  /**
   * Get IPFS hash for a batch ID
   */
  static getBatchMetadata(batchId: number): string | null {
    try {
      const existing = this.getAllBatchMetadata();
      return existing[batchId] || null;
    } catch (error) {
      console.error('Failed to retrieve batch metadata:', error);
      return null;
    }
  }

  /**
   * Get all batch metadata mappings
   */
  static getAllBatchMetadata(): BatchMetadataMapping {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse stored metadata:', error);
      return {};
    }
  }

  /**
   * Remove metadata for a batch ID
   */
  static removeBatchMetadata(batchId: number): void {
    try {
      const existing = this.getAllBatchMetadata();
      delete existing[batchId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to remove batch metadata:', error);
    }
  }

  /**
   * Check if metadata exists for a batch ID
   */
  static hasBatchMetadata(batchId: number): boolean {
    const hash = this.getBatchMetadata(batchId);
    return hash !== null && hash.length > 0;
  }

  /**
   * Clear all stored metadata (useful for development/testing)
   */
  static clearAllMetadata(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Cleared all batch metadata');
    } catch (error) {
      console.error('Failed to clear metadata:', error);
    }
  }
}