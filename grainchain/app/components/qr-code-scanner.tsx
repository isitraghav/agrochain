import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
  className?: string;
}

export function QRCodeScanner({ onScan, onError, onClose, className = '' }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initScanner = async () => {
      if (!videoRef.current) return;

      try {
        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          setError('No camera found on this device');
          return;
        }

        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            onScan(result.data);
            qrScanner.stop();
            setIsScanning(false);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        setScanner(qrScanner);

        try {
          await qrScanner.start();
          setHasPermission(true);
          setIsScanning(true);
          setError(null);
        } catch (err) {
          if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
              setError('Camera access denied. Please allow camera access in your browser settings and try again.');
              setHasPermission(false);
            } else if (err.name === 'NotFoundError') {
              setError('No camera found on this device.');
            } else if (err.name === 'NotSupportedError') {
              setError('QR scanning is not supported in this browser. Please try Chrome, Firefox, or Safari.');
            } else if (err.name === 'NotReadableError') {
              setError('Camera is being used by another application. Please close other camera apps and try again.');
            } else if (err.name === 'SecurityError') {
              setError('Camera access blocked due to security restrictions. Please enable camera access for this site.');
            } else {
              setError('Failed to start camera: ' + err.message);
            }
          } else {
            setError('Failed to start camera');
          }
          onError?.('Failed to start camera');
        }
      } catch (err) {
        setError('Failed to initialize scanner');
        onError?.('Failed to initialize scanner');
      }
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.stop();
        scanner.destroy();
      }
    };
  }, [onScan, onError]);

  const handleRetry = () => {
    setError(null);
    setHasPermission(null);
    // Re-trigger the effect by forcing a re-render
    window.location.reload();
  };

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Access Issue</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>

          <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Troubleshooting Steps:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Ensure you're using HTTPS (camera requires secure connection)</li>
              <li>• Click the camera icon in your browser's address bar</li>
              <li>• Allow camera access when prompted</li>
              <li>• Close other apps that might be using the camera</li>
              <li>• Try refreshing the page and allowing permissions again</li>
              <li>• Use Chrome, Firefox, or Safari for best compatibility</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-center">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
            >
              Use Manual Input
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-64 object-cover"
          playsInline
          muted
        />

        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="border-2 border-white border-dashed rounded-lg w-48 h-48 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="mb-2">
                <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h2M6 4h.01M6 4H4v2m2-2h2v2m0 0v2m0 0h2m2-2h2v2m0 0h2v-2m-2 0v2m0 0h-2m2-2v-2m-2 2h-2v-2" />
                </svg>
              </div>
              <p className="text-sm">Position QR code here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
        >
          Cancel Scan
        </button>
      </div>

      {isScanning && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-600">Looking for QR code...</p>
        </div>
      )}
    </div>
  );
}