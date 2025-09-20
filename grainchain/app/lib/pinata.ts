// Pinata IPFS integration using REST API

// Pinata configuration from environment variables
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

// Validate environment variables
if (!PINATA_JWT || !PINATA_API_KEY || !PINATA_SECRET_KEY) {
  console.error('Missing Pinata configuration. Please check your environment variables:');
  console.error('- VITE_PINATA_JWT');
  console.error('- VITE_PINATA_API_KEY');
  console.error('- VITE_PINATA_SECRET_KEY');
  throw new Error('Pinata configuration incomplete. Please set the required environment variables.');
}

export interface BatchMetadata {
  name: string;
  description: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  batch_properties?: {
    origin?: string;
    quality_grade?: string;
    harvest_date?: string;
    expiry_date?: string;
    weight?: string;
    location?: string;
    certifications?: string[];
  };
  external_url?: string;
  created_at: string;
  version: string;
}

export interface PinataUploadResult {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export class PinataService {
  private apiKey: string;
  private secretKey: string;
  private jwt: string;

  constructor() {
    this.apiKey = PINATA_API_KEY;
    this.secretKey = PINATA_SECRET_KEY;
    this.jwt = PINATA_JWT;
  }

  /**
   * Upload JSON metadata to IPFS via Pinata
   */
  async uploadJSON(metadata: BatchMetadata): Promise<PinataUploadResult> {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `batch-${metadata.name}-metadata.json`,
            keyvalues: {
              type: 'batch_metadata',
              batch_name: metadata.name,
              created_at: metadata.created_at
            }
          },
          pinataOptions: {
            cidVersion: 1
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Pinata API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading JSON to Pinata:', error);
      throw new Error(`Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a file (image, document, etc.) to IPFS via Pinata
   */
  async uploadFile(file: File): Promise<PinataUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const metadata = JSON.stringify({
        name: `batch-${file.name}`,
        keyvalues: {
          type: 'batch_file',
          filename: file.name,
          uploaded_at: new Date().toISOString()
        }
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 1
      });
      formData.append('pinataOptions', options);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Pinata API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading file to Pinata:', error);
      throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get content from IPFS via Pinata gateway
   */
  async getContent(ipfsHash: string): Promise<any> {
    try {
      const response = await fetch(`${PINATA_GATEWAY}/ipfs/${ipfsHash}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      throw new Error(`Failed to fetch content from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get batch metadata from IPFS hash
   */
  async getBatchMetadata(ipfsHash: string): Promise<BatchMetadata | null> {
    try {
      const metadata = await this.getContent(ipfsHash);

      // Validate that this looks like batch metadata
      if (metadata && typeof metadata === 'object' && metadata.name && metadata.description) {
        return metadata as BatchMetadata;
      }

      console.warn('Retrieved data does not appear to be valid batch metadata:', metadata);
      return null;
    } catch (error) {
      console.error('Error fetching batch metadata:', error);
      return null;
    }
  }

  /**
   * Check if an IPFS hash contains an image
   */
  async isImageHash(ipfsHash: string): Promise<boolean> {
    try {
      const response = await fetch(`${PINATA_GATEWAY}/ipfs/${ipfsHash}`, { method: 'HEAD' });
      const contentType = response.headers.get('content-type') || '';
      return contentType.startsWith('image/');
    } catch {
      return false;
    }
  }

  /**
   * Get image URL from IPFS hash
   */
  getImageUrl(ipfsHash: string): string {
    return `${PINATA_GATEWAY}/ipfs/${ipfsHash}`;
  }

  /**
   * Create a complete batch metadata object
   */
  createBatchMetadata(
    name: string,
    description: string,
    imageHash?: string,
    properties?: BatchMetadata['batch_properties'],
    attributes?: BatchMetadata['attributes']
  ): BatchMetadata {
    const metadata: BatchMetadata = {
      name,
      description,
      created_at: new Date().toISOString(),
      version: "1.0",
      batch_properties: properties || {},
      attributes: attributes || []
    };

    if (imageHash) {
      metadata.image = `${PINATA_GATEWAY}/ipfs/${imageHash}`;
    }

    return metadata;
  }

  /**
   * Upload complete batch with image and metadata
   */
  async uploadBatchWithAssets(
    name: string,
    description: string,
    image?: File,
    properties?: BatchMetadata['batch_properties'],
    attributes?: BatchMetadata['attributes']
  ): Promise<{ metadataHash: string; imageHash?: string; metadata: BatchMetadata }> {
    try {
      let imageHash: string | undefined;

      // Upload image first if provided
      if (image) {
        console.log('Uploading image to IPFS...');
        const imageResult = await this.uploadFile(image);
        imageHash = imageResult.IpfsHash;
        console.log('Image uploaded to IPFS:', imageHash);
      }

      // Create metadata
      const metadata = this.createBatchMetadata(name, description, imageHash, properties, attributes);

      // Upload metadata
      console.log('Uploading metadata to IPFS...');
      const metadataResult = await this.uploadJSON(metadata);
      console.log('Metadata uploaded to IPFS:', metadataResult.IpfsHash);

      return {
        metadataHash: metadataResult.IpfsHash,
        imageHash,
        metadata
      };
    } catch (error) {
      console.error('Error uploading batch assets:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const pinataService = new PinataService();