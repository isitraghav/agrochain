import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { generateShareableBatchUrl, copyToClipboard, downloadDataUrl } from '../lib/url-utils';
import type { BatchInfo } from '../lib/contract';
import type { BatchMetadata } from '../types/batch';

interface QRCodeGeneratorProps {
  batch: BatchInfo;
  size?: number;
  showControls?: boolean;
  className?: string;
}

export function QRCodeGenerator({
  batch,
  size = 256,
  showControls = true,
  className = ''
}: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const metadata = batch.metadata as BatchMetadata | undefined;
  const batchName = metadata?.name || `Batch #${batch.batchId}`;
  const shareableUrl = generateShareableBatchUrl(batch.batchId, batchName);

  useEffect(() => {
    generateQRCode();
  }, [batch.batchId, batchName]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(shareableUrl, {
        width: size,
        margin: 2,
        color: {
          dark: '#1f2937', // gray-800
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(shareableUrl);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (qrDataUrl) {
      const filename = `batch-${batch.batchId}-qr-code.png`;
      downloadDataUrl(qrDataUrl, filename);
    }
  };

  const handleOpenUrl = () => {
    window.open(shareableUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* QR Code Display */}
      <div className="relative">
        {isGenerating ? (
          <div
            className="flex items-center justify-center bg-gray-100 rounded-lg"
            style={{ width: size, height: size }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Code for ${batchName}`}
            className="rounded-lg shadow-sm border border-gray-200"
            width={size}
            height={size}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200"
            style={{ width: size, height: size }}
          >
            <span className="text-gray-500 text-sm">Failed to generate QR code</span>
          </div>
        )}
      </div>

      {/* Batch Information */}
      <div className="text-center">
        <h3 className="font-medium text-gray-900">{batchName}</h3>
        <p className="text-sm text-gray-500">Batch #{batch.batchId}</p>
      </div>

      {/* URL Display */}
      <div className="w-full max-w-md">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Shareable URL:
        </label>
        <div className="flex rounded-md shadow-sm">
          <input
            type="text"
            value={shareableUrl}
            readOnly
            className="flex-1 min-w-0 px-3 py-2 text-xs border border-gray-300 rounded-l-md bg-gray-50 text-gray-700 font-mono"
          />
          <button
            onClick={handleCopyUrl}
            className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs"
            title="Copy URL"
          >
            {copySuccess ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        {copySuccess && (
          <p className="text-xs text-green-600 mt-1">URL copied to clipboard!</p>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
          <button
            onClick={handleDownloadQR}
            disabled={!qrDataUrl}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Download QR
          </button>
          <button
            onClick={handleOpenUrl}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Page
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center max-w-md">
        <p className="text-xs text-gray-500">
          📱 Scan this QR code with any device to view detailed batch information and ownership history.
        </p>
      </div>
    </div>
  );
}

interface QRCodeButtonProps {
  batch: BatchInfo;
  onShowQR: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon';
  className?: string;
}

export function QRCodeButton({
  batch,
  onShowQR,
  size = 'md',
  variant = 'button',
  className = ''
}: QRCodeButtonProps) {
  const metadata = batch.metadata as BatchMetadata | undefined;
  const batchName = metadata?.name || `Batch #${batch.batchId}`;

  const sizeClasses = {
    sm: variant === 'icon' ? 'w-4 h-4' : 'px-2 py-1 text-xs',
    md: variant === 'icon' ? 'w-5 h-5' : 'px-3 py-2 text-sm',
    lg: variant === 'icon' ? 'w-6 h-6' : 'px-4 py-2 text-base'
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={onShowQR}
        className={`text-gray-500 hover:text-blue-600 transition-colors ${className}`}
        title={`Generate QR code for ${batchName}`}
      >
        <svg className={sizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={onShowQR}
      className={`inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors ${sizeClasses[size]} ${className}`}
      title={`Generate QR code for ${batchName}`}
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
      QR Code
    </button>
  );
}