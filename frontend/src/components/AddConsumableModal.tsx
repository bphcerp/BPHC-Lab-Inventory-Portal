import React, { useEffect, useState } from 'react';
import { Button, Modal, Label, TextInput, Select } from 'flowbite-react';
import { toastError, toastSuccess } from '../toasts';
import AddConsumableCategoryModal from './AddConsumableCategory';
import AddVendorModal from './AddVendorModal';
import AddPeopleModal from './AddPeopleModal';

interface AddConsumableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: Function;
}

export interface Category {
  _id: string;
  consumableName: string;
  fields?: { name: string; values: string[] }[];
}

export interface Vendor {
  _id: string;
  name: string;
}

export interface Person {
  _id: string;
  name: string;
}

export interface Consumable {
  _id?: string;
  quantity: number;
  unitPrice: number;
  vendor: string;
  date: string;
  addedBy: string;
  totalCost: number;
  consumableName: string;
  entryReferenceNumber: string;
  categoryFields?: { [key: string]: any };
}

const AddConsumableModal: React.FC<AddConsumableModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [category, setCategory] = useState<string>('');
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [vendors, setVendors] = useState<Array<Vendor>>([]);
  const [people, setPeople] = useState<Array<Person>>([]);
  const [addedBy, setAddedBy] = useState<string>('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [quantity, setQuantity] = useState<number | string>('');
  const [unitPrice, setUnitPrice] = useState<number | string>('');
  const [vendor, setVendor] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [totalCost, setTotalCost] = useState<number | string>('');
  const [entryReferenceNumber, setEntryReferenceNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [categoryFields, setCategoryFields] = useState<any[]>([]);
  const [categoryFieldValues, setCategoryFieldValues] = useState<{ [key: string]: any }>({});
  
  // State for modal steps
  const [currentStep, setCurrentStep] = useState<'form' | 'review' | 'success'>('form');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedVendorName, setSelectedVendorName] = useState<string>('');
  const [selectedPersonName, setSelectedPersonName] = useState<string>('');
  const [summaryData, setSummaryData] = useState<Consumable | null>(null);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
        credentials: 'include',
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toastError('Error fetching categories');
      console.error('Error fetching categories:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor`, {
        credentials: 'include',
      });
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      toastError('Error fetching vendors');
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchPeople = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/people`, {
        credentials: 'include',
      });
      const data = await response.json();
      setPeople(data);
    } catch (error) {
      toastError('Error fetching people');
      console.error('Error fetching people:', error);
    }
  };

  const handleCategoryChange = (selectedCategoryId: string) => {
    setCategory(selectedCategoryId);
    const selectedCategory = categories.find((cat) => cat._id === selectedCategoryId);

    if (selectedCategory) {
      setSelectedCategoryName(selectedCategory.consumableName);
      
      if (selectedCategory.fields) {
        setCategoryFields(selectedCategory.fields);
        const initialFieldValues: { [key: string]: any } = {};
        selectedCategory.fields.forEach((field) => {
          initialFieldValues[field.name] = '';
        });
        setCategoryFieldValues(initialFieldValues);
      } else {
        setCategoryFields([]);
      }
    }
  };

  const handleVendorChange = (selectedVendorId: string) => {
    setVendor(selectedVendorId);
    const selectedVendor = vendors.find((v) => v._id === selectedVendorId);
    if (selectedVendor) {
      setSelectedVendorName(selectedVendor.name);
    }
  };

  const handlePersonChange = (selectedPersonId: string) => {
    setAddedBy(selectedPersonId);
    const selectedPerson = people.find((p) => p._id === selectedPersonId);
    if (selectedPerson) {
      setSelectedPersonName(selectedPerson.name);
    }
  };

  const validateReferenceNumber = (refNumber: string): boolean => {
    const pattern = /^LAMBDA\/QPI\/\d{4}-\d{2}\/\d{3}$/;
    return pattern.test(refNumber);
  };

  const handleGoToReview = () => {
    if (!category || !quantity || !unitPrice || !vendor || !addedBy || !date || !entryReferenceNumber) {
      toastError('Please fill in all required fields.');
      return;
    }

    if (!validateReferenceNumber(entryReferenceNumber)) {
      toastError('Invalid reference number format. Please use format: LAMBDA/QPI/YYYY-YY/XXX');
      return;
    }

    const selectedCategory = categories.find((cat) => cat._id === category);
    if (!selectedCategory) {
      toastError('Invalid category selection.');
      return;
    }

    const newConsumable: Consumable = {
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      vendor,
      addedBy,
      date,
      totalCost: Number(totalCost),
      consumableName: selectedCategory.consumableName,
      entryReferenceNumber,
      categoryFields: categoryFieldValues,
    };

    setSummaryData(newConsumable);
    setCurrentStep('review');
  };

  const handleGoBackToForm = () => {
    setCurrentStep('form');
  };

  const handleSubmit = async () => {
    if (!summaryData) {
      toastError('No data to submit');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(summaryData);
      toastSuccess(`${selectedCategoryName} added successfully`);
      setCurrentStep('success');
      setLoading(false);
    } catch (error) {
      console.error('Error adding consumable:', error);
      toastError('Error adding consumable: ' + (error as Error).message);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCategory('');
    setQuantity('');
    setUnitPrice('');
    setVendor('');
    setAddedBy('');
    setDate('');
    setTotalCost('');
    setEntryReferenceNumber('');
    setCategoryFieldValues({});
    setSelectedCategoryName('');
    setSelectedVendorName('');
    setSelectedPersonName('');
    setSummaryData(null);
    setCurrentStep('form');
  };

  const handleAddAnother = () => {
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchCategories();
      fetchVendors();
      fetchPeople();
    }
  }, [isOpen]);

  useEffect(() => {
    const cost = Number(quantity) * Number(unitPrice);
    setTotalCost(isNaN(cost) ? 0 : cost);
  }, [quantity, unitPrice]);

  // Render success screen
  if (currentStep === 'success' && summaryData) {
    return (
      <Modal show={isOpen} onClose={onClose}>
        <Modal.Header>Consumable Added Successfully</Modal.Header>
        <Modal.Body>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              {selectedCategoryName} has been added to inventory
            </h3>
            <p className="text-green-700">Reference Number: {summaryData.entryReferenceNumber}</p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-md font-semibold">{selectedCategoryName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Quantity</p>
                <p className="text-md font-semibold">{summaryData.quantity}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Unit Price</p>
                <p className="text-md font-semibold">₹{summaryData.unitPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cost</p>
                <p className="text-md font-semibold">₹{Number(summaryData.totalCost).toFixed(2)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Vendor</p>
                <p className="text-md font-semibold">{selectedVendorName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Added By</p>
                <p className="text-md font-semibold">{selectedPersonName}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="text-md font-semibold">{new Date(summaryData.date).toLocaleDateString()}</p>
            </div>
            
            {Object.keys(summaryData.categoryFields || {}).length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Category Fields</p>
                <div className="bg-gray-50 p-3 rounded-md">
                  {Object.entries(summaryData.categoryFields || {}).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-2">
                      <p className="text-sm font-medium text-gray-500">{key}:</p>
                      <p className="text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose} color="gray">
            Close
          </Button>
          <Button onClick={handleAddAnother} color="blue">
            Add Another
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  // Render review screen
  if (currentStep === 'review' && summaryData) {
    return (
      <Modal show={isOpen} onClose={onClose}>
        <Modal.Header>Review Consumable Details</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Reference Number</p>
                <p className="text-md font-semibold">{summaryData.entryReferenceNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-md font-semibold">{selectedCategoryName}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Quantity</p>
                <p className="text-md font-semibold">{summaryData.quantity}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Unit Price</p>
                <p className="text-md font-semibold">₹{summaryData.unitPrice.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cost</p>
                <p className="text-md font-semibold">₹{Number(summaryData.totalCost).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Vendor</p>
                <p className="text-md font-semibold">{selectedVendorName}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Added By</p>
                <p className="text-md font-semibold">{selectedPersonName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-md font-semibold">{new Date(summaryData.date).toLocaleDateString()}</p>
              </div>
            </div>
            
            {Object.keys(summaryData.categoryFields || {}).length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Category Fields</p>
                <div className="bg-gray-50 p-3 rounded-md">
                  {Object.entries(summaryData.categoryFields || {}).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-2">
                      <p className="text-sm font-medium text-gray-500">{key}:</p>
                      <p className="text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-sm text-blue-700">
                Please review the information above. Click "Edit" to make changes or "Confirm" to proceed.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose} color="gray">
            Cancel
          </Button>
          <Button onClick={handleGoBackToForm} color="light">
            Edit
          </Button>
          <Button onClick={handleSubmit} color="blue" disabled={loading}>
            {loading ? 'Processing...' : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  // Render form screen (default)
  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Add New Consumable</Modal.Header>
      <Modal.Body>
        <AddConsumableCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onAddCategory={fetchCategories}
        />
        <AddVendorModal
          isOpen={isVendorModalOpen}
          onClose={() => setIsVendorModalOpen(false)}
          onAddVendor={fetchVendors}
        />
        <AddPeopleModal
          isOpen={isPersonModalOpen}
          onClose={() => setIsPersonModalOpen(false)}
          onSubmit={fetchPeople}
        />
        <div className="space-y-4">
           <div>
            <Label htmlFor="entryReferenceNumber" value="Reference Number *" />
            <TextInput
              id="entryReferenceNumber"
              type="text"
              value={entryReferenceNumber}
              onChange={(e) => setEntryReferenceNumber(e.target.value)}
              placeholder="LAMBDA/QPI/2024-24/001"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: LAMBDA/QPI/YYYY-YY/XXX
            </p>
          </div>
          
          <div>
            <Label htmlFor="category" value="Category *" />
            <Select
              id="category"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              required
            >
              <option value="" disabled>Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.consumableName}
                </option>
              ))}
            </Select>
          </div>
          {categoryFields.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name} value={`${field.name} *`} />
              <Select
                id={field.name}
                value={categoryFieldValues[field.name] || ''}
                onChange={(e) =>
                  setCategoryFieldValues({
                    ...categoryFieldValues,
                    [field.name]: e.target.value,
                  })
                }
                required
              >
                <option value="" disabled>Select {field.name}</option>
                {field.values.map((value: string) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </div>
          ))}
          <div>
            <Label htmlFor="quantity" value="Quantity *" />
            <TextInput
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="unitPrice" value="Unit Price *" />
            <TextInput
              id="unitPrice"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="vendor" value="Vendor *" />
            <Select
              id="vendor"
              value={vendor}
              onChange={(e) => handleVendorChange(e.target.value)}
              required
            >
              <option value="" disabled>Select Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="addedBy" value="Added By *" />
            <Select
              id="addedBy"
              value={addedBy}
              onChange={(e) => handlePersonChange(e.target.value)}
              required
            >
              <option value="" disabled>Select Person</option>
              {people.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="date" value="Date *" />
            <TextInput
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="totalCost" value="Total Cost" />
            <TextInput id="totalCost" type="number" value={totalCost} disabled />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} color="gray" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleGoToReview} color="blue" disabled={loading}>
          Review Entries
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddConsumableModal;
