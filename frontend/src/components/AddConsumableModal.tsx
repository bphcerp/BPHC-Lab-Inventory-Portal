import { Button, Modal, Label, TextInput, Select } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../toasts';
import AddConsumableCategoryModal from './AddConsumableCategory';
import AddVendorModal from './AddVendorModal';

interface AddConsumableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: Function;
}

export interface Category {
  _id: string;
  name: string;
  fields?: { name: string; type: string }[];
}

export interface Vendor {
  _id: string;
  name: string;
}

const AddConsumableModal: React.FC<AddConsumableModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [consumableName, setConsumableName] = useState('');
  const [category, setCategory] = useState<string>('');
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [vendors, setVendors] = useState<Array<Vendor>>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [quantity, setQuantity] = useState<number | string>('');
  const [unitPrice, setUnitPrice] = useState<number | string>('');
  const [vendorName, setVendorName] = useState('');
  const [date, setDate] = useState<string>('');
  const [totalCost, setTotalCost] = useState<number | string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [categoryFields, setCategoryFields] = useState<any[]>([]);
  const [categoryFieldValues, setCategoryFieldValues] = useState<{ [key: string]: any }>({});

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category/consumable`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toastError("Error fetching categories");
      console.error('Error fetching categories:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      toastError("Error fetching vendors");
      console.error('Error fetching vendors:', error);
    }
  };

  const handleAddCategory = async (name: string, fields: { name: string; type: string }[]) => {
    // Check for existing category before adding
    const isCategoryExists = categories.some(category => category.name.toLowerCase() === name.toLowerCase());
    if (isCategoryExists) {
      toastError("Category already exists.");
      return; 
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, type: 'consumable', fields }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to add category: ' + errorData.message || response.statusText);
      }

      const newCategory = await response.json();
      setCategories((prev) => [...prev, newCategory]);
      toastSuccess("Category added successfully");
    } catch (error) {
      toastError("Error adding category: " + (error as Error).message);
      console.error(error);
    }
  };

  const handleAddVendor = async (name: string) => {
    // Add vendor logic
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Failed to add vendor');

      const newVendor = await response.json();
      setVendors((prev) => [...prev, newVendor]);
      toastSuccess("Vendor added successfully");
    } catch (error) {
      toastError("Error adding vendor: " + (error as Error).message);
      console.error(error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchVendors();
      setCategoryFields([]); 
      setCategoryFieldValues({}); 
    }
  }, [isOpen]);

  useEffect(() => {
    const cost = Number(quantity) * Number(unitPrice);
    setTotalCost(cost);
  }, [quantity, unitPrice]);

  const handleSubmit = async () => {
    // Ensure all required fields are filled
    if (!consumableName || !quantity || !unitPrice || !vendorName || !date || !totalCost || !category) {
      toastError("Please fill in all fields."); 
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumable`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          consumableName,
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          vendor: vendors.find(vendor => vendor.name === vendorName)?._id || '',
          date,
          totalCost: Number(totalCost),
          consumableCategory: category, // Ensure category ID is sent correctly
          categoryFields: categoryFieldValues
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to add consumable: ' + errorData.message || response.statusText);
      }

      await response.json(); 
      toastSuccess("Consumable added successfully");
      onClose();
    } catch (error) {
      console.error("Error adding consumable:", error);
      toastError("Error adding consumable: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (selectedCategoryId: string) => {
    setCategory(selectedCategoryId);
    const selectedCategory = categories.find(cat => cat._id === selectedCategoryId);
    if (selectedCategory) {
      setCategoryFields(selectedCategory.fields || []); // Set fields for the selected category
      setCategoryFieldValues({}); // Reset the values for new fields when category changes
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Add New Consumable</Modal.Header>
      <Modal.Body>
        <AddConsumableCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onAddCategory={handleAddCategory}
        />
        <AddVendorModal
          isOpen={isVendorModalOpen}
          onClose={() => setIsVendorModalOpen(false)}
          onAddVendor={handleAddVendor}
        />
        <div className="space-y-4">
          <div>
            <Label htmlFor="consumableName" value="Consumable Name" />
            <TextInput
              id="consumableName"
              value={consumableName}
              onChange={(e) => setConsumableName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div className='flex flex-col'>
            <Label htmlFor="category" value="Category" />
            <div className='flex w-full justify-center items-center space-x-4'>
              <div className='grow'>
                <Select
                  id="category"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                  className="mt-1"
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Button color="blue" className='rounded-md' onClick={() => setIsCategoryModalOpen(true)}>Add Category</Button>
              </div>
            </div>
          </div>
          {/* Render dynamic fields for the selected category */}
          {categoryFields.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name} value={field.name} />
              <TextInput
                id={field.name}
                type={field.type === 'integer' ? 'number' : 'text'} // Use type based on field definition
                value={categoryFieldValues[field.name] || ''}
                onChange={(e) => setCategoryFieldValues({
                  ...categoryFieldValues,
                  [field.name]: e.target.value,
                })}
                className="mt-1"
              />
            </div>
          ))}
          <div>
            <Label htmlFor="quantity" value="Quantity" />
            <TextInput
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="unitPrice" value="Unit Price" />
            <TextInput
              id="unitPrice"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="vendorName" value="Vendor Name" />
            <div className='flex w-full justify-center items-center space-x-4'>
              <div className='grow'>
                <Select
                  id="vendorName"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  required
                  className="mt-1"
                >
                  <option value="" disabled>Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor.name}>
                      {vendor.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Button color="blue" className='rounded-md' onClick={() => setIsVendorModalOpen(true)}>Add Vendor</Button>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="date" value="Date" />
            <TextInput
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="totalCost" value="Total Cost" />
            <TextInput
              id="totalCost"
              type="number"
              value={totalCost}
              disabled
              className="mt-1"
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button color="gray" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="success"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Consumable'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddConsumableModal;
