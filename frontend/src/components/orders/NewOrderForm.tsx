'use client';

import React, { useState, useRef } from 'react';
import {
  Save,
  Send,
  Printer,
  X,
  Upload,
  Plus,
  Search,
  MapPin,
  Calculator,
  FileText,
  AlertTriangle,
  CheckCircle,
  User,
  Package,
  Calendar,
  DollarSign,
  Truck,
  Camera
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';

interface Customer {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  status: 'active' | 'paused' | 'blacklisted';
  hasValidCredentials: boolean;
}

interface BroodstockBatch {
  id: string;
  batchCode: string;
  species: string;
  strain: string;
  hatcheryOrigin: string;
  grade: string;
  availableQuantity: number;
  unitPrice: number;
}

interface NewOrderFormProps {
  onClose: () => void;
  onSave: (order: any) => void;
}

export default function NewOrderForm({ onClose, onSave }: NewOrderFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Customer selection
    customerId: '',
    isNewCustomer: false,
    
    // Customer details (for new customers)
    customerName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    country: '',
    
    // Order details
    species: '',
    strain: '',
    broodstockBatchId: '',
    quantity: '',
    unitPrice: '',
    currency: 'USD',
    packagingType: '',
    
    // Shipment details
    shipmentDate: '',
    destinationAddress: '',
    preferredCarrier: '',
    paymentTerms: '',
    shipmentMethod: '',
    
    // QC and documentation
    testResults: [] as Array<{
      testType: string;
      date: string;
      result: string;
      file?: File;
    }>,
    photos: [] as File[],
    notes: '',
    internalFlags: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedCredentials, setUploadedCredentials] = useState<File[]>([]);

  // Mock data
  const customers: Customer[] = [
    {
      id: 'CUST-001',
      name: 'Minh Phu Seafood Corp',
      contactName: 'Nguyen Van Minh',
      phone: '+84-28-123-4567',
      email: 'minh@minhphu.com',
      address: 'Can Tho, Vietnam',
      country: 'Vietnam',
      status: 'active',
      hasValidCredentials: true
    },
    {
      id: 'CUST-002',
      name: 'Thai Union Aquaculture',
      contactName: 'Somchai Tanaka',
      phone: '+66-2-555-0123',
      email: 'somchai@thaiunion.com',
      address: 'Bangkok, Thailand',
      country: 'Thailand',
      status: 'active',
      hasValidCredentials: true
    }
  ];

  const broodstockBatches: BroodstockBatch[] = [
    {
      id: 'BST-2024-001',
      batchCode: 'PV-SPF-001',
      species: 'Penaeus vannamei',
      strain: 'SPF Line A',
      hatcheryOrigin: 'Hawaii Breeding Facility',
      grade: 'Premium',
      availableQuantity: 15000,
      unitPrice: 0.85
    },
    {
      id: 'BST-2024-002',
      batchCode: 'PM-BT-002',
      species: 'Penaeus monodon',
      strain: 'Black Tiger Premium',
      hatcheryOrigin: 'Ecuador Facility',
      grade: 'Standard',
      availableQuantity: 8000,
      unitPrice: 1.25
    }
  ];

  const species = ['Penaeus vannamei', 'Penaeus monodon', 'Penaeus japonicus'];
  const strains = ['SPF Line A', 'Black Tiger Premium', 'Fast Growth Line', 'Disease Resistant'];
  const packagingTypes = ['Standard Transport Bags', 'Insulated Containers', 'Oxygenated Transport Bags', 'Climate Controlled Containers'];
  const paymentTerms = ['Net 30', 'Net 60', 'Payment on Delivery', '50% Advance, 50% on Delivery'];
  const shipmentMethods = ['Air Freight', 'Sea Freight', 'Express Delivery', 'Ground Transport'];
  const carriers = ['DHL Express', 'FedEx International', 'UPS Worldwide', 'Local Logistics Partner'];

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    return quantity * unitPrice;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.customerId && !formData.isNewCustomer) {
        newErrors.customer = 'Please select a customer or add a new one';
      }
      if (formData.isNewCustomer) {
        if (!formData.customerName) newErrors.customerName = 'Customer name is required';
        if (!formData.contactName) newErrors.contactName = 'Contact name is required';
        if (!formData.contactPhone) newErrors.contactPhone = 'Phone number is required';
        if (!formData.contactEmail) newErrors.contactEmail = 'Email is required';
        if (!formData.address) newErrors.address = 'Address is required';
        if (!formData.country) newErrors.country = 'Country is required';
        if (uploadedCredentials.length === 0) {
          newErrors.credentials = 'At least one credential file is required for new customers';
        }
      }
    }

    if (step === 2) {
      if (!formData.species) newErrors.species = 'Species is required';
      if (!formData.strain) newErrors.strain = 'Strain is required';
      if (!formData.quantity) newErrors.quantity = 'Quantity is required';
      if (!formData.unitPrice) newErrors.unitPrice = 'Unit price is required';
      if (!formData.packagingType) newErrors.packagingType = 'Packaging type is required';
      
      const quantity = parseFloat(formData.quantity);
      if (quantity <= 0) newErrors.quantity = 'Quantity must be positive';
      
      const unitPrice = parseFloat(formData.unitPrice);
      if (unitPrice <= 0) newErrors.unitPrice = 'Unit price must be positive';
    }

    if (step === 3) {
      if (!formData.shipmentDate) newErrors.shipmentDate = 'Shipment date is required';
      if (!formData.paymentTerms) newErrors.paymentTerms = 'Payment terms are required';
      if (!formData.shipmentMethod) newErrors.shipmentMethod = 'Shipment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFileUpload = (type: 'credentials' | 'test' | 'photos', files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    
    if (type === 'credentials') {
      setUploadedCredentials(prev => [...prev, ...fileArray]);
    } else if (type === 'photos') {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...fileArray]
      }));
    }
  };

  const addTestResult = () => {
    setFormData(prev => ({
      ...prev,
      testResults: [...prev.testResults, {
        testType: '',
        date: '',
        result: '',
      }]
    }));
  };

  const updateTestResult = (index: number, field: string, value: string | File) => {
    setFormData(prev => ({
      ...prev,
      testResults: prev.testResults.map((test, i) => 
        i === index ? { ...test, [field]: value } : test
      )
    }));
  };

  const removeTestResult = (index: number) => {
    setFormData(prev => ({
      ...prev,
      testResults: prev.testResults.filter((_, i) => i !== index)
    }));
  };

  const saveOrder = (type: 'draft' | 'submit' | 'print') => {
    if (!validateStep(currentStep)) return;

    const orderData = {
      ...formData,
      totalValue: calculateTotal(),
      status: type === 'draft' ? 'draft' : 'submitted',
      createdAt: new Date(),
      createdBy: 'current.user@company.com'
    };

    onSave(orderData);
    
    if (type === 'print') {
      // Trigger print functionality
      window.print();
    }
    
    onClose();
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create New Order</h2>
            <p className="text-sm text-gray-600">Step {currentStep} of 4</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {[
              { step: 1, title: 'Customer', icon: User },
              { step: 2, title: 'Order Details', icon: Package },
              { step: 3, title: 'Shipment', icon: Truck },
              { step: 4, title: 'Documentation', icon: FileText }
            ].map(({ step, title, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {title}
                </span>
                {step < 4 && <div className="w-8 h-px bg-gray-300 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Customer Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                
                {!formData.isNewCustomer ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Customer
                    </label>
                    <div className="space-y-3">
                      {customers.map(customer => (
                        <div
                          key={customer.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            formData.customerId === customer.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, customerId: customer.id }))}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{customer.name}</h4>
                              <p className="text-sm text-gray-600">
                                {customer.contactName} • {customer.country}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {customer.hasValidCredentials ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                customer.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {customer.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setFormData(prev => ({ ...prev, isNewCustomer: true, customerId: '' }))}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Customer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">New Customer Details</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, isNewCustomer: false }))}
                      >
                        Back to Selection
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          value={formData.customerName}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.customerName ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter company name"
                        />
                        {errors.customerName && (
                          <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Primary Contact Name *
                        </label>
                        <input
                          type="text"
                          value={formData.contactName}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.contactName ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter contact name"
                        />
                        {errors.contactName && (
                          <p className="mt-1 text-xs text-red-600">{errors.contactName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={formData.contactPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.contactPhone ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="+1-555-123-4567"
                        />
                        {errors.contactPhone && (
                          <p className="mt-1 text-xs text-red-600">{errors.contactPhone}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.contactEmail ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="contact@company.com"
                        />
                        {errors.contactEmail && (
                          <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address *
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.address ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Full address"
                        />
                        {errors.address && (
                          <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country *
                        </label>
                        <select
                          value={formData.country}
                          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.country ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select country</option>
                          <option value="Vietnam">Vietnam</option>
                          <option value="Thailand">Thailand</option>
                          <option value="Indonesia">Indonesia</option>
                          <option value="India">India</option>
                          <option value="Philippines">Philippines</option>
                        </select>
                        {errors.country && (
                          <p className="mt-1 text-xs text-red-600">{errors.country}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Credentials Upload *
                      </label>
                      <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                        errors.credentials ? 'border-red-300' : 'border-gray-300'
                      }`}>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Upload business licenses, permits, or certifications
                        </p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload('credentials', e.target.files)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose Files
                        </Button>
                      </div>
                      {uploadedCredentials.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {uploadedCredentials.map((file, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <FileText className="h-4 w-4 mr-2" />
                              {file.name}
                            </div>
                          ))}
                        </div>
                      )}
                      {errors.credentials && (
                        <p className="mt-1 text-xs text-red-600">{errors.credentials}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {errors.customer && (
                  <p className="mt-1 text-xs text-red-600">{errors.customer}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Order Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Species *
                  </label>
                  <select
                    value={formData.species}
                    onChange={(e) => setFormData(prev => ({ ...prev, species: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.species ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select species</option>
                    {species.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.species && (
                    <p className="mt-1 text-xs text-red-600">{errors.species}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Strain *
                  </label>
                  <select
                    value={formData.strain}
                    onChange={(e) => setFormData(prev => ({ ...prev, strain: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.strain ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select strain</option>
                    {strains.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.strain && (
                    <p className="mt-1 text-xs text-red-600">{errors.strain}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Broodstock Batch (Optional)
                  </label>
                  <select
                    value={formData.broodstockBatchId}
                    onChange={(e) => setFormData(prev => ({ ...prev, broodstockBatchId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select batch</option>
                    {broodstockBatches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batchCode} - {batch.species} ({batch.availableQuantity} available)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Packaging Type *
                  </label>
                  <select
                    value={formData.packagingType}
                    onChange={(e) => setFormData(prev => ({ ...prev, packagingType: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.packagingType ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select packaging</option>
                    {packagingTypes.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errors.packagingType && (
                    <p className="mt-1 text-xs text-red-600">{errors.packagingType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.quantity ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter quantity"
                    min="1"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price *
                  </label>
                  <div className="flex">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="VND">VND</option>
                    </select>
                    <input
                      type="number"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                      className={`flex-1 px-3 py-2 border-t border-r border-b rounded-r-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.unitPrice ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  {errors.unitPrice && (
                    <p className="mt-1 text-xs text-red-600">{errors.unitPrice}</p>
                  )}
                </div>
              </div>

              {/* Total Calculation */}
              {formData.quantity && formData.unitPrice && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">Total Value</span>
                    </div>
                    <span className="text-xl font-bold text-blue-900">
                      {formData.currency} {calculateTotal().toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-blue-700">
                    {parseFloat(formData.quantity).toLocaleString()} units × {formData.currency} {parseFloat(formData.unitPrice)} per unit
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Shipment Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Shipment Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Shipment Date *
                  </label>
                  <input
                    type="date"
                    value={formData.shipmentDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipmentDate: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.shipmentDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                  {errors.shipmentDate && (
                    <p className="mt-1 text-xs text-red-600">{errors.shipmentDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Carrier
                  </label>
                  <select
                    value={formData.preferredCarrier}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredCarrier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select carrier</option>
                    {carriers.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms *
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.paymentTerms ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select payment terms</option>
                    {paymentTerms.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errors.paymentTerms && (
                    <p className="mt-1 text-xs text-red-600">{errors.paymentTerms}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipment Method *
                  </label>
                  <select
                    value={formData.shipmentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipmentMethod: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.shipmentMethod ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select method</option>
                    {shipmentMethods.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  {errors.shipmentMethod && (
                    <p className="mt-1 text-xs text-red-600">{errors.shipmentMethod}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Address
                </label>
                <textarea
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinationAddress: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter destination address (leave blank to use customer address)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  If left blank, will use customer address: {selectedCustomer?.address || formData.address}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Documentation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Quality Control & Documentation</h3>
              
              {/* Test Results */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Test Results
                  </label>
                  <Button size="sm" variant="outline" onClick={addTestResult}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Test
                  </Button>
                </div>
                
                {formData.testResults.map((test, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <input
                          type="text"
                          value={test.testType}
                          onChange={(e) => updateTestResult(index, 'testType', e.target.value)}
                          placeholder="Test type"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          value={test.date}
                          onChange={(e) => updateTestResult(index, 'date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <select
                          value={test.result}
                          onChange={(e) => updateTestResult(index, 'result', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Result</option>
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                        </select>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="file"
                          onChange={(e) => updateTestResult(index, 'file', e.target.files?.[0] || '')}
                          className="flex-1 text-sm"
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTestResult(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload photos of the broodstock or packaging
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload('photos', e.target.files)}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <span className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      Choose Photos
                    </span>
                  </label>
                </div>
                {formData.photos.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                        {photo.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Add any internal notes or special instructions..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            {currentStep < 4 ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => saveOrder('draft')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button variant="outline" onClick={() => saveOrder('print')}>
                  <Printer className="h-4 w-4 mr-2" />
                  Save & Print
                </Button>
                <Button onClick={() => saveOrder('submit')}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Order
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}