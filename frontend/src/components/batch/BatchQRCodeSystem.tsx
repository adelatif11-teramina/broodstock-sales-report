'use client';

import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import {
  QrCode,
  Scan,
  Download,
  Copy,
  Check,
  X,
  Camera,
  Upload,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  Package,
  Calendar,
  MapPin,
  User,
  Activity,
  FileText,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';

interface BatchData {
  id: string;
  species: string;
  origin: string;
  birthDate: Date;
  parentBatch1?: string;
  parentBatch2?: string;
  currentLocation: string;
  quantity: number;
  weight: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  vaccinations: Array<{
    vaccine: string;
    date: Date;
    veterinarian: string;
  }>;
  certifications: string[];
  notes: string;
  qrCodeData?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface QRCodeData {
  batchId: string;
  species: string;
  birthDate: string;
  origin: string;
  url: string;
  timestamp: number;
}

export default function BatchQRCodeSystem() {
  const [activeTab, setActiveTab] = useState<'generate' | 'scan' | 'history'>('generate');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [scanResult, setScanResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{
    id: string;
    batchId: string;
    timestamp: Date;
    location: string;
    scannedBy: string;
  }>>([]);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);

  // Mock batch data
  const batchData: BatchData[] = [
    {
      id: 'BST-2024-001',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      origin: 'Hawaii Breeding Facility',
      birthDate: new Date('2024-01-15'),
      parentBatch1: 'BST-2023-087',
      parentBatch2: 'BST-2023-089',
      currentLocation: 'Tank A-15, Building 3',
      quantity: 5000,
      weight: 2.3,
      healthStatus: 'excellent',
      vaccinations: [
        {
          vaccine: 'WSSV Vaccine',
          date: new Date('2024-02-01'),
          veterinarian: 'Dr. Sarah Chen'
        },
        {
          vaccine: 'Vibrio Vaccine',
          date: new Date('2024-02-15'),
          veterinarian: 'Dr. Sarah Chen'
        }
      ],
      certifications: ['Organic Certified', 'SPF Certified', 'Best Aquaculture Practices'],
      notes: 'Exceptional growth rate, showing strong resistance to environmental stress.',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-09-30')
    },
    {
      id: 'BST-2024-002',
      species: 'Black Tiger Prawn (Penaeus monodon)',
      origin: 'Thailand Breeding Center',
      birthDate: new Date('2024-02-20'),
      parentBatch1: 'BST-2023-091',
      currentLocation: 'Tank B-08, Building 2',
      quantity: 3200,
      weight: 1.8,
      healthStatus: 'good',
      vaccinations: [
        {
          vaccine: 'IHHNV Vaccine',
          date: new Date('2024-03-05'),
          veterinarian: 'Dr. Michael Rodriguez'
        }
      ],
      certifications: ['BAP Certified', 'ASC Certified'],
      notes: 'Regular monitoring shows consistent growth patterns.',
      createdAt: new Date('2024-02-20'),
      updatedAt: new Date('2024-09-29')
    },
    {
      id: 'BST-2024-003',
      species: 'Giant Freshwater Prawn (Macrobrachium rosenbergii)',
      origin: 'Florida Aquaculture Station',
      birthDate: new Date('2024-03-10'),
      currentLocation: 'Pond C-12, Outdoor Facility',
      quantity: 1500,
      weight: 3.1,
      healthStatus: 'fair',
      vaccinations: [],
      certifications: ['USDA Organic'],
      notes: 'Monitoring for bacterial infections. Treatment protocol initiated.',
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-09-28')
    }
  ];

  // Generate QR Code
  const generateQRCode = async (batchId: string) => {
    setIsGenerating(true);
    const batch = batchData.find(b => b.id === batchId);
    if (!batch) return;

    const qrData: QRCodeData = {
      batchId: batch.id,
      species: batch.species,
      birthDate: format(batch.birthDate, 'yyyy-MM-dd'),
      origin: batch.origin,
      url: `${window.location.origin}/batch/${batch.id}`,
      timestamp: Date.now()
    };

    try {
      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      setQrCodeDataUrl(qrCodeUrl);
      
      // Update batch data with QR code
      const updatedBatch = { ...batch, qrCodeData: JSON.stringify(qrData) };
      console.log('QR Code generated for batch:', updatedBatch);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Start scanning
  const startScanning = () => {
    if (!scannerElementRef.current) return;

    setIsScanning(true);
    setScanResult('');

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    };

    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      config,
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        console.log('QR Code scanned:', decodedText);
        setScanResult(decodedText);
        stopScanning();
        
        // Add to scan history
        try {
          const qrData: QRCodeData = JSON.parse(decodedText);
          setScanHistory(prev => [{
            id: Math.random().toString(36).substr(2, 9),
            batchId: qrData.batchId,
            timestamp: new Date(),
            location: 'Scanning Station 1',
            scannedBy: 'Current User'
          }, ...prev]);
        } catch (error) {
          console.error('Error parsing QR code data:', error);
        }
      },
      (error) => {
        console.warn('QR Code scan error:', error);
      }
    );
  };

  // Stop scanning
  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Download QR Code
  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.download = `batch-${selectedBatch}-qr-code.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  // Copy QR Code data
  const copyQRData = async () => {
    if (!selectedBatch) return;
    
    const batch = batchData.find(b => b.id === selectedBatch);
    if (!batch) return;

    const qrData: QRCodeData = {
      batchId: batch.id,
      species: batch.species,
      birthDate: format(batch.birthDate, 'yyyy-MM-dd'),
      origin: batch.origin,
      url: `${window.location.origin}/batch/${batch.id}`,
      timestamp: Date.now()
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Parse scanned QR code data
  const parsedScanResult = React.useMemo(() => {
    if (!scanResult) return null;
    
    try {
      return JSON.parse(scanResult) as QRCodeData;
    } catch (error) {
      return null;
    }
  }, [scanResult]);

  // Get batch details from scanned data
  const scannedBatchDetails = React.useMemo(() => {
    if (!parsedScanResult) return null;
    return batchData.find(b => b.id === parsedScanResult.batchId);
  }, [parsedScanResult]);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'fair': return <Info className="h-4 w-4" />;
      case 'poor': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Batch QR Code System</h2>
          <p className="text-gray-600">Generate, scan, and track batch QR codes for traceability</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Data
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'generate', label: 'Generate QR', icon: QrCode },
            { id: 'scan', label: 'Scan QR', icon: Scan },
            { id: 'history', label: 'Scan History', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Generate QR Code Tab */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Batch Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Batch</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Batch to Generate QR Code
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a batch...</option>
                  {batchData.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.id} - {batch.species}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBatch && (
                <div className="space-y-4">
                  {(() => {
                    const batch = batchData.find(b => b.id === selectedBatch);
                    if (!batch) return null;

                    return (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Batch Details</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Species:</span>
                            <p className="font-medium">{batch.species}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Origin:</span>
                            <p className="font-medium">{batch.origin}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Birth Date:</span>
                            <p className="font-medium">{format(batch.birthDate, 'MMM dd, yyyy')}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Quantity:</span>
                            <p className="font-medium">{batch.quantity.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Health Status:</span>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(batch.healthStatus)}`}>
                              {getHealthStatusIcon(batch.healthStatus)}
                              <span className="ml-1 capitalize">{batch.healthStatus}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Location:</span>
                            <p className="font-medium">{batch.currentLocation}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <Button
                    onClick={() => generateQRCode(selectedBatch)}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Code
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Display */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated QR Code</h3>
            
            {qrCodeDataUrl ? (
              <div className="space-y-4">
                <div className="text-center">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Batch QR Code" 
                    className="mx-auto border border-gray-200 rounded-lg"
                  />
                </div>
                
                <div className="text-center text-sm text-gray-600">
                  QR Code for Batch: <span className="font-medium">{selectedBatch}</span>
                </div>

                <div className="flex space-x-3">
                  <Button onClick={downloadQRCode} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={copyQRData} variant="outline" className="flex-1">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Data
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">QR Code Contains:</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Batch ID and species information</li>
                    <li>• Birth date and origin facility</li>
                    <li>• Direct link to batch details</li>
                    <li>• Timestamp for verification</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a batch and generate QR code to display here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scan QR Code Tab */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code Scanner</h3>
            
            <div className="space-y-4">
              {!isScanning ? (
                <div className="text-center py-8">
                  <Camera className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">Click to start scanning QR codes</p>
                  <Button onClick={startScanning}>
                    <Scan className="h-4 w-4 mr-2" />
                    Start Scanner
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div 
                    id="qr-reader" 
                    ref={scannerElementRef}
                    className="w-full"
                  />
                  <Button onClick={stopScanning} variant="outline" className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Stop Scanner
                  </Button>
                </div>
              )}

              {scanResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="font-medium text-green-800">QR Code Scanned Successfully!</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scan Results */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Results</h3>
            
            {parsedScanResult && scannedBatchDetails ? (
              <div className="space-y-6">
                {/* Batch Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    {parsedScanResult.batchId}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Birth Date:</span>
                      <span className="ml-2 font-medium">{parsedScanResult.birthDate}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Origin:</span>
                      <span className="ml-2 font-medium">{parsedScanResult.origin}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Species:</span>
                      <span className="ml-2 font-medium">{parsedScanResult.species}</span>
                    </div>
                  </div>
                </div>

                {/* Current Status */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-3">Current Status</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Location:</span>
                      <span className="font-medium">{scannedBatchDetails.currentLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Quantity:</span>
                      <span className="font-medium">{scannedBatchDetails.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Weight:</span>
                      <span className="font-medium">{scannedBatchDetails.weight} kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Health:</span>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(scannedBatchDetails.healthStatus)}`}>
                        {getHealthStatusIcon(scannedBatchDetails.healthStatus)}
                        <span className="ml-1 capitalize">{scannedBatchDetails.healthStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Button className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Details
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Batch Record
                  </Button>
                </div>

                {/* Certifications */}
                {scannedBatchDetails.certifications.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">Certifications</h5>
                    <div className="flex flex-wrap gap-2">
                      {scannedBatchDetails.certifications.map((cert, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : scanResult && !parsedScanResult ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium text-red-800">Invalid QR Code Format</span>
                </div>
                <p className="text-red-700 text-sm mt-2">
                  The scanned QR code does not contain valid batch data.
                </p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Scan className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Scan a batch QR code to view details here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scan History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Scan Activity</h3>
            <p className="text-sm text-gray-600">Track all QR code scans and batch verifications</p>
          </div>
          
          <div className="overflow-x-auto">
            {scanHistory.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scan Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scanned By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scanHistory.map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <QrCode className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{scan.batchId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(scan.timestamp, 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.scannedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="outline" size="sm">
                          View Batch
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No scan history available</p>
                <p className="text-sm">Start scanning QR codes to see activity here</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}