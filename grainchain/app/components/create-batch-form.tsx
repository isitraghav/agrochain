import { useState } from 'react';
import { useWeb3 } from '../lib/web3-context';
import { createBatchWithMetadata } from '../lib/contract';
import type { BatchFormData } from '../types/batch';

interface CreateBatchFormProps {
  onBatchCreated: () => void;
}

export function CreateBatchForm({ onBatchCreated }: CreateBatchFormProps) {
  const { signer, isConnected } = useWeb3();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [formData, setFormData] = useState<BatchFormData>({
    name: '',
    description: '',
    origin: '',
    quality_grade: '',
    harvest_date: '',
    expiry_date: '',
    weight: '',
    location: '',
    certifications: [],
    external_url: '',
    attributes: []
  });

  const [certificationInput, setCertificationInput] = useState('');
  const [attributeInput, setAttributeInput] = useState({ trait_type: '', value: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (field: keyof BatchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB.');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setError(null);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: undefined }));
    setImagePreview(null);
    
    // Reset file input
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const addCertification = () => {
    if (certificationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), certificationInput.trim()]
      }));
      setCertificationInput('');
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || []
    }));
  };

  const addAttribute = () => {
    if (attributeInput.trait_type.trim() && attributeInput.value.trim()) {
      setFormData(prev => ({
        ...prev,
        attributes: [...(prev.attributes || []), {
          trait_type: attributeInput.trait_type.trim(),
          value: attributeInput.value.trim()
        }]
      }));
      setAttributeInput({ trait_type: '', value: '' });
    }
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes?.filter((_, i) => i !== index) || []
    }));
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signer) {
      setError('No wallet connected. Please connect your wallet first.');
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      setError('Batch name is required.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required.');
      return;
    }

    if (formData.name.length > 100) {
      setError('Batch name must be 100 characters or less.');
      return;
    }

    if (formData.description.length > 500) {
      setError('Description must be 500 characters or less.');
      return;
    }

    // Validate dates if provided
    if (formData.harvest_date && formData.expiry_date) {
      const harvestDate = new Date(formData.harvest_date);
      const expiryDate = new Date(formData.expiry_date);
      if (expiryDate <= harvestDate) {
        setError('Expiry date must be after harvest date.');
        return;
      }
    }

    // Validate external URL if provided
    if (formData.external_url && formData.external_url.trim()) {
      try {
        new URL(formData.external_url);
      } catch {
        setError('Please enter a valid URL (must include http:// or https://).');
        return;
      }
    }

    try {
      setIsCreating(true);
      setError(null);
      setSuccess(null);

      console.log('Starting batch creation with metadata...');
      const batchId = await createBatchWithMetadata(signer, formData);

      setSuccess(`🎉 Batch #${batchId} created successfully with metadata uploaded to IPFS!`);
      onBatchCreated();

      // Reset form
      setFormData({
        name: '',
        description: '',
        origin: '',
        quality_grade: '',
        harvest_date: '',
        expiry_date: '',
        weight: '',
        location: '',
        certifications: [],
        external_url: '',
        attributes: []
      });
      setImagePreview(null);
      setIsExpanded(false);

      // Reset file input
      const fileInput = document.getElementById('image') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Create batch failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create batch';
      setError(errorMessage);

      // Auto-clear error after 10 seconds
      setTimeout(() => setError(null), 10000);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please connect your wallet to create batches.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Create New Batch</h2>
        <span className="text-sm text-gray-500">📦 Required: Name, Description</span>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Adding metadata helps track your batch's journey and provides transparency to consumers. 
          All data will be stored securely on IPFS and linked to your blockchain batch.
        </p>
      </div>

      <form onSubmit={handleCreateBatch}>
        {/* Basic Information */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Batch Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Premium Coffee Batch #001"
              required
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose a unique, descriptive name for easy identification
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe this batch: quality, characteristics, processing methods..."
              required
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide details about quality, origin, processing, or any special characteristics ({formData.description.length}/500)
            </p>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              Batch Image
            </label>
            <div className="space-y-3">
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Supported formats: JPG, PNG, GIF, WebP (Max 5MB)
              </p>
              
              {imagePreview && (
                <div className="relative">
                  <div className="w-full max-w-xs">
                    <img
                      src={imagePreview}
                      alt="Batch preview"
                      className="w-full h-32 object-cover border rounded-md"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {formData.image && !imagePreview && (
                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-sm text-blue-800">📎 {formData.image.name}</span>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Properties Toggle */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <span className="mr-2">{isExpanded ? '▼' : '▶'}</span>
            Advanced Properties
            <span className="ml-2 text-sm text-gray-500">
              ({isExpanded ? 'Click to hide' : 'Optional - Click to add origin, quality, certifications...'})
            </span>
          </button>
        </div>

        {/* Advanced Properties */}
        {isExpanded && (
          <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-700 mb-1">📋 Additional Batch Information</h3>
              <p className="text-xs text-gray-600">
                These details help provide transparency and traceability for your batch
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🌍 Origin</label>
                <input
                  type="text"
                  value={formData.origin || ''}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Colombia, Blue Mountain"
                />
                <p className="text-xs text-gray-500 mt-1">Where was this batch produced?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">⭐ Quality Grade</label>
                <select
                  value={formData.quality_grade || ''}
                  onChange={(e) => handleInputChange('quality_grade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select grade...</option>
                  <option value="Premium">Premium</option>
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Standard">Standard</option>
                  <option value="Organic">Organic</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Official quality classification</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📅 Harvest Date</label>
                <input
                  type="date"
                  value={formData.harvest_date || ''}
                  onChange={(e) => handleInputChange('harvest_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">When was this batch harvested?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">⏰ Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry_date || ''}
                  onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Best before or expiration date</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">⚖️ Weight</label>
                <input
                  type="text"
                  value={formData.weight || ''}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 50 kg, 100 lbs"
                />
                <p className="text-xs text-gray-500 mt-1">Total weight with units</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📍 Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Farm coordinates, warehouse location"
                />
                <p className="text-xs text-gray-500 mt-1">Current storage location or GPS coordinates</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">🔗 External URL</label>
              <input
                type="url"
                value={formData.external_url || ''}
                onChange={(e) => handleInputChange('external_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-website.com/batch-details"
              />
              <p className="text-xs text-gray-500 mt-1">Link to additional information or your website</p>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🏆 Certifications</label>
              <p className="text-xs text-gray-600 mb-2">Add certifications that apply to this batch</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={certificationInput}
                  onChange={(e) => setCertificationInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Organic, Fair Trade, Rainforest Alliance"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <button
                  type="button"
                  onClick={addCertification}
                  disabled={!certificationInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {formData.certifications && formData.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Attributes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Custom Attributes</label>
              <p className="text-xs text-gray-600 mb-2">Add any custom properties specific to your batch</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={attributeInput.trait_type}
                  onChange={(e) => setAttributeInput(prev => ({ ...prev, trait_type: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Attribute name (e.g., Processing Method)"
                />
                <input
                  type="text"
                  value={attributeInput.value}
                  onChange={(e) => setAttributeInput(prev => ({ ...prev, value: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Value (e.g., Wet Process)"
                />
                <button
                  type="button"
                  onClick={addAttribute}
                  disabled={!attributeInput.trait_type.trim() || !attributeInput.value.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {formData.attributes && formData.attributes.length > 0 && (
                <div className="space-y-2">
                  {formData.attributes.map((attr, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-100 rounded"
                    >
                      <span className="text-sm">
                        <strong>{attr.trait_type}:</strong> {attr.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttribute(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating || !formData.name.trim() || !formData.description.trim()}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isCreating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Batch & Uploading to IPFS...
            </span>
          ) : (
            '🚀 Create Batch with Metadata'
          )}
        </button>

        {!formData.name.trim() || !formData.description.trim() ? (
          <p className="text-xs text-gray-500 text-center mt-2">
            Please fill in the required fields (Name and Description) to continue
          </p>
        ) : (
          <p className="text-xs text-green-600 text-center mt-2">
            ✓ Ready to create! Your metadata will be stored on IPFS and linked to the blockchain
          </p>
        )}
      </form>
    </div>
  );
}