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

export interface BatchFormData {
  name: string;
  description: string;
  origin?: string;
  quality_grade?: string;
  harvest_date?: string;
  expiry_date?: string;
  weight?: string;
  location?: string;
  certifications?: string[];
  image?: File;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface BatchInfo {
  batchId: number;
  currentOwner: string;
  ownerCount: number;
  createdAt: number;
  lastTransferAt: number;
  ipfsHash?: string;
}