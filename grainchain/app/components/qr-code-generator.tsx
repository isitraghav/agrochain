import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({ value, size = 200, className = '' }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current || !value) return;

      try {
        setError(null);
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (err) {
        setError('Failed to generate QR code');
        console.error('QR Code generation error:', err);
      }
    };

    generateQR();
  }, [value, size]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width: size, height: size }}>
        <div className="text-center p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-gray-200"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}