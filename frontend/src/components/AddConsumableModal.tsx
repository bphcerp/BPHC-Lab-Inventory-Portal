import { Button, Modal, Label, TextInput, Select } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../toasts';
import AddConsumableCategoryModal from './AddConsumableCategory';
import AddVendorModal from './AddVendorModal';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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

export interface Consumable {
  _id?: string;
  consumableName: string;
  quantity: number;
  unitPrice: number;
  vendor: string;
  date: string;
  totalCost: number;
  consumableCategory: string;
  categoryFields?: { [key: string]: any };
}

const AddConsumableModal: React.FC<AddConsumableModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
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
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
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
    const isCategoryExists = categories.some((category: { name: string; }) => category.name.toLowerCase() === name.toLowerCase());
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
      setCategories((prev: any) => [...prev, newCategory]);
      toastSuccess("Category added successfully");
      fetchCategories();
    } catch (error) {
      toastError("Error adding category: " + (error as Error).message);
      console.error(error);
    }
  };

  const handleAddVendor = async (name: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Failed to add vendor');

      const newVendor = await response.json();
      setVendors((prev: any) => [...prev, newVendor]);
      toastSuccess("Vendor added successfully");
      fetchVendors();
    } catch (error) {
      toastError("Error adding vendor: " + (error as Error).message);
      console.error(error);
    }
  };


  // Reset function
  const resetForm = () => {
    setCurrentStep(1);
    setConsumableName('');
    setCategory('');
    setQuantity('');
    setUnitPrice('');
    setVendorName('');
    setDate('');
    setTotalCost('');
    setCategoryFieldValues({});
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchCategories();
      fetchVendors();
    }
  }, [isOpen]);

  const handleCategoryChange = (selectedCategoryId: string) => {
  setCategory(selectedCategoryId);
  const selectedCategory = categories.find((cat: { _id: string; }) => cat._id === selectedCategoryId);
  
  if (selectedCategory?.fields) {
    setCategoryFields(selectedCategory.fields);
    // Initialize category field values for Step 2
    const initialFieldValues: { [key: string]: any } = {};
    selectedCategory.fields.forEach((field: { name: string | number; type: string; }) => {
      initialFieldValues[field.name] = field.type === 'integer' ? '' : '';
    });
    setCategoryFieldValues(initialFieldValues);
  } else {
    setCategoryFields([]);
  }
};



  // Update validation logic to handle transition to Step 2 if there are fields
const validateStep1 = () => {
    //const hasRequiredFields = consumableName && category && quantity && unitPrice && vendorName && date;
    //const selectedCategory = categories.find(cat => cat._id === category);
    //const hasCategoryFields = selectedCategory?.fields && selectedCategory.fields.length > 0;

    // Only require all fields if no category fields exist
    return consumableName && category && quantity && unitPrice && vendorName && date;
};

  const validateStep2 = () => {
    return categoryFields.every((field: { name: string | number; }) => categoryFieldValues[field.name] !== '');
  };

  // Step 1: Adjust handleNext to move directly to submission if no fields in Step 2
const handleNext = () => {
  // Ensure all required fields in Step 1 are completed
  if (!validateStep1()) {
    toastError('Please fill in all required fields in Step 1.');
    return;
  }

  const selectedCategory = categories.find((cat: { _id: any; }) => cat._id === category);

  // Move to Step 2 if category fields exist; otherwise, submit the form
  if (selectedCategory?.fields && selectedCategory.fields.length > 0) {
    setCurrentStep(2);
  } else {
    handleSubmit(); // No fields in step 2; directly submit
  }
};


  const handleBack = () => {
    setCurrentStep(1);
  };

  // Handle form submission
const handleSubmit = async () => {
    if (currentStep === 1 && !validateStep1()) {
        toastError('Please fill in all required fields in Step 1.');
        return;
    }

    if (currentStep === 2 && !validateStep2()) {
        toastError('Please fill in all category fields.');
        return;
    }

    setLoading(true);
    try {
        const newConsumable: Consumable = {
            consumableName,
            quantity: Number(quantity),
            unitPrice: Number(unitPrice),
            vendor: vendors.find((vendor: { name: any; }) => vendor.name === vendorName)?._id || '',
            date,
            totalCost: Number(totalCost),
            consumableCategory: category,
            categoryFields: categoryFieldValues,
        };

        await onSubmit(newConsumable);
        onClose();
        resetForm();
    } catch (error) {
        console.error('Error adding consumable:', error);
        toastError('Error adding consumable: ' + (error as Error).message);
    } finally {
        setLoading(false);
    }
};

  // Calculate total cost when quantity or unit price changes
  useEffect(() => {
    const cost = Number(quantity) * Number(unitPrice);
    setTotalCost(isNaN(cost) ? 0 : cost);
  }, [quantity, unitPrice]);

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="consumableName" value="Consumable Name *" />
        <TextInput
          id="consumableName"
          value={consumableName}
          onChange={(e: { target: { value: any; }; }) => setConsumableName(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div className='flex flex-col'>
        <Label htmlFor="category" value="Category *" />
        <div className='flex w-full justify-center items-center space-x-4'>
          <div className='grow'>
            <Select
              id="category"
              value={category}
              onChange={(e: { target: { value: string; }; }) => handleCategoryChange(e.target.value)}
              required
              className="mt-1"
            >
              <option value="" disabled>Select Category</option>
              {categories.map((cat: { _id: any; name: any; }) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Button color="blue" className='rounded-md' onClick={() => setIsCategoryModalOpen(true)}>
              Add Category
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="quantity" value="Quantity *" />
        <TextInput
          id="quantity"
          type="number"
          value={String(quantity)}
          onChange={(e: { target: { value: any; }; }) => setQuantity(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="unitPrice" value="Unit Price *" />
        <TextInput
          id="unitPrice"
          type="number"
          value={String(unitPrice)}
          onChange={(e: { target: { value: any; }; }) => setUnitPrice(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="vendorName" value="Vendor Name *" />
        <div className='flex w-full justify-center items-center space-x-4'>
          <div className='grow'>
            <Select
              id="vendorName"
              value={vendorName}
              onChange={(e: { target: { value: any; }; }) => setVendorName(e.target.value)}
              required
              className="mt-1"
            >
              <option value="" disabled>Select Vendor</option>
              {vendors.map((vendor: { _id: any; name: any; }) => (
                <option key={vendor._id} value={vendor.name}>
                  {vendor.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Button color="blue" className='rounded-md' onClick={() => setIsVendorModalOpen(true)}>
              Add Vendor
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="date" value="Procurement Date *" />
        <TextInput
          id="date"
          type="date"
          value={date}
          onChange={(e: { target: { value: any; }; }) => setDate(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="totalCost" value="Total Cost" />
        <TextInput
          id="totalCost"
          type="number"
          value={String(totalCost)}
          disabled
          className="mt-1"
        />
      </div>
    </div>
  );

  // Render fields in Step 2 based on selected category
const renderStep2 = () => (
    <div className="space-y-4">
        <h3 className="text-lg font-medium mb-4">Category-specific Fields</h3>
        {categoryFields.map((field: { name: string | number; type: string; }) => (
            <div key={field.name}>
                <Label htmlFor={String(field.name)} value={`${field.name} *`} />
                <TextInput
                    id={String(field.name)}
                    type={field.type === 'integer' ? 'number' : 'text'}
                    value={(categoryFieldValues[field.name] ?? '').toString()}
                    onChange={(e: { target: { value: string; }; }) => {
                        const value = field.type === 'integer' 
                            ? e.target.value === '' ? '' : parseInt(e.target.value, 10)
                            : e.target.value;
                        setCategoryFieldValues({
                            ...categoryFieldValues,
                            [field.name]: value,
                        });
                    }}
                    required
                    className="mt-1"
                />
            </div>
        ))}
    </div>
);

return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>
        Add New Consumable - Step {currentStep} of 2
      </Modal.Header>
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
        
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full justify-between">
          <Button
            color="gray"
            onClick={currentStep === 1 ? onClose : handleBack}
          >
            {currentStep === 1 ? (
              'Cancel'
            ) : (
              <div className="flex items-center">
                <FiChevronLeft className="mr-1" /> Back
              </div>
            )}
          </Button>
          <Button
            color={currentStep === 1 ? 'blue' : 'success'}
            onClick={currentStep === 1 ? handleNext : handleSubmit}
            disabled={loading || (currentStep === 1 ? !validateStep1() : !validateStep2())}
          >
            {loading ? (
              'Processing...'
            ) : currentStep === 1 ? (
              <div className="flex items-center">
                Next <FiChevronRight className="ml-1" />
              </div>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AddConsumableModal;

//import { Button, Modal, Label, TextInput, Select } from 'flowbite-react';
// import React, { useEffect, useState } from 'react';
// import { toastError, toastSuccess } from '../toasts';
// import AddConsumableCategoryModal from './AddConsumableCategory';
// import AddVendorModal from './AddVendorModal';

// interface AddConsumableModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: Function;
// }

// export interface Category {
//   _id: string;
//   name: string;
//   fields?: { name: string; type: string }[];
// }

// export interface Vendor {
//   _id: string;
//   name: string;
// }

// export interface Consumable {
//   _id?: string;
//   consumableName: string;
//   quantity: number;
//   unitPrice: number;
//   vendor: string;
//   date: string;
//   totalCost: number;
//   consumableCategory: string;
//   categoryFields?: { [key: string]: any };
// }

// const AddConsumableModal: React.FC<AddConsumableModalProps> = ({ isOpen, onClose, onSubmit }) => {
//   const [consumableName, setConsumableName] = useState('');
//   const [category, setCategory] = useState<string>('');
//   const [categories, setCategories] = useState<Array<Category>>([]);
//   const [vendors, setVendors] = useState<Array<Vendor>>([]);
//   const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
//   const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
//   const [quantity, setQuantity] = useState<number | string>('');
//   const [unitPrice, setUnitPrice] = useState<number | string>('');
//   const [vendorName, setVendorName] = useState('');
//   const [date, setDate] = useState<string>('');
//   const [totalCost, setTotalCost] = useState<number | string>('');
//   const [loading, setLoading] = useState<boolean>(false);
//   const [categoryFields, setCategoryFields] = useState<any[]>([]);
//   const [categoryFieldValues, setCategoryFieldValues] = useState<{ [key: string]: any }>({});

//   const getAuthHeaders = () => {
//     const token = localStorage.getItem('token');
//     return {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`,
//     };
//   };

//   const fetchCategories = async () => {
//     try {
//       const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
//         headers: getAuthHeaders(),
//       });
//       const data = await response.json();
//       setCategories(data);
//     } catch (error) {
//       toastError("Error fetching categories");
//       console.error('Error fetching categories:', error);
//     }
//   };

//   const fetchVendors = async () => {
//     try {
//       const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor`, {
//         headers: getAuthHeaders(),
//       });
//       const data = await response.json();
//       setVendors(data);
//     } catch (error) {
//       toastError("Error fetching vendors");
//       console.error('Error fetching vendors:', error);
//     }
//   };

//   const handleAddCategory = async (name: string, fields: { name: string; type: string }[]) => {
//     // Check for existing category before adding
//     const isCategoryExists = categories.some(category => category.name.toLowerCase() === name.toLowerCase());
//     if (isCategoryExists) {
//       toastError("Category already exists.");
//       return; 
//     }

//     try {
//       const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
//         method: 'POST',
//         headers: getAuthHeaders(),
//         body: JSON.stringify({ name, type: 'consumable', fields }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error('Failed to add category: ' + errorData.message || response.statusText);
//       }

//       const newCategory = await response.json();
//       setCategories((prev) => [...prev, newCategory]);
//       toastSuccess("Category added successfully");
//       fetchCategories();
//     } catch (error) {
//       toastError("Error adding category: " + (error as Error).message);
//       console.error(error);
//     }
//   };

//   const handleAddVendor = async (name: string) => {
//     // Add vendor logic
//     try {
//       const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor`, {
//         method: 'POST',
//         headers: getAuthHeaders(),
//         body: JSON.stringify({ name }),
//       });

//       if (!response.ok) throw new Error('Failed to add vendor');

//       const newVendor = await response.json();
//       setVendors((prev) => [...prev, newVendor]);
//       toastSuccess("Vendor added successfully");
//     } catch (error) {
//       toastError("Error adding vendor: " + (error as Error).message);
//       console.error(error);
//     }
//   };

//   useEffect(() => {
//     if (isOpen) {
//       fetchCategories();
//       fetchVendors();
//       setCategoryFields([]); 
//       setCategoryFieldValues({}); 
//     }
//   }, [isOpen]);

//   useEffect(() => {
//     const cost = Number(quantity) * Number(unitPrice);
//     setTotalCost(cost);
//   }, [quantity, unitPrice]);

//   const handleCategoryChange = (selectedCategoryId: string) => {
//   setCategory(selectedCategoryId);
//   const selectedCategory = categories.find(cat => cat._id === selectedCategoryId);
//   if (selectedCategory) {
//     setCategoryFields(selectedCategory.fields || []); // Set fields for the selected category
//     // Reset the values for new fields when category changes
//     const newCategoryFieldValues: { [key: string]: any } = {};
//     selectedCategory.fields?.forEach(field => {
//       newCategoryFieldValues[field.name] = '';
//     });
//     setCategoryFieldValues(newCategoryFieldValues);
//   }
// };
//   const handleSubmit = async () => {
//     // Ensure all required fields are filled
//     if (!consumableName || !quantity || !unitPrice || !vendorName || !date || !totalCost || !category) {
//       toastError('Please fill in all fields.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const newConsumable: Consumable = {
//         consumableName,
//         quantity: Number(quantity),
//         unitPrice: Number(unitPrice),
//         vendor: vendors.find(vendor => vendor.name === vendorName)?._id || '',
//         date,
//         totalCost: Number(totalCost),
//         consumableCategory: category,
//         categoryFields: categoryFieldValues,
//       };

//       await onSubmit(newConsumable);
//       onClose();
//     } catch (error) {
//       console.error('Error adding consumable:', error);
//       toastError('Error adding consumable: ' + (error as Error).message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Modal show={isOpen} onClose={onClose}>
//       <Modal.Header>Add New Consumable</Modal.Header>
//       <Modal.Body>
//         <AddConsumableCategoryModal
//           isOpen={isCategoryModalOpen}
//           onClose={() => setIsCategoryModalOpen(false)}
//           onAddCategory={handleAddCategory}
//           onCategoryAdded={fetchCategories}
//         />
//         <AddVendorModal
//           isOpen={isVendorModalOpen}
//           onClose={() => setIsVendorModalOpen(false)}
//           onAddVendor={handleAddVendor}
//         />
//         <div className="space-y-4">
//           <div>
//             <Label htmlFor="consumableName" value="Consumable Name" />
//             <TextInput
//               id="consumableName"
//               value={consumableName}
//               onChange={(e) => setConsumableName(e.target.value)}
//               required
//               className="mt-1"
//             />
//           </div>
//           <div className='flex flex-col'>
//             <Label htmlFor="category" value="Category" />
//             <div className='flex w-full justify-center items-center space-x-4'>
//               <div className='grow'>
//                 <Select
//                   id="category"
//                   value={category}
//                   onChange={(e) => handleCategoryChange(e.target.value)}
//                   required
//                   className="mt-1"
//                 >
//                   <option value="" disabled>Select Category</option>
//                   {categories.map((cat) => (
//                     <option key={cat._id} value={cat._id}>
//                       {cat.name}
//                     </option>
//                   ))}
//                 </Select>
//               </div>
//               <div>
//                 <Button color="blue" className='rounded-md' onClick={() => setIsCategoryModalOpen(true)}>Add Category</Button>
//               </div>
//             </div>
//           </div>
//           {/* Render dynamic fields for the selected category */}
//           {categoryFields.map((field) => (
//             <div key={field.name}>
//               <Label htmlFor={field.name} value={field.name} />
//               <TextInput
//                 id={field.name}
//                 type={field.type === 'integer' ? 'number' : 'text'} // Use type based on field definition
//                 value={categoryFieldValues[field.name] || ''}
//                 onChange={(e) => setCategoryFieldValues({
//                   ...categoryFieldValues,
//                   [field.name]: e.target.value,
//                 })}
//                 className="mt-1"
//               />
//             </div>
//           ))}
//           <div>
//             <Label htmlFor="quantity" value="Quantity" />
//             <TextInput
//               id="quantity"
//               type="number"
//               value={quantity}
//               onChange={(e) => setQuantity(e.target.value)}
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label htmlFor="unitPrice" value="Unit Price" />
//             <TextInput
//               id="unitPrice"
//               type="number"
//               value={unitPrice}
//               onChange={(e) => setUnitPrice(e.target.value)}
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label htmlFor="vendorName" value="Vendor Name" />
//             <div className='flex w-full justify-center items-center space-x-4'>
//               <div className='grow'>
//                 <Select
//                   id="vendorName"
//                   value={vendorName}
//                   onChange={(e) => setVendorName(e.target.value)}
//                   required
//                   className="mt-1"
//                 >
//                   <option value="" disabled>Select Vendor</option>
//                   {vendors.map((vendor) => (
//                     <option key={vendor._id} value={vendor.name}>
//                       {vendor.name}
//                     </option>
//                   ))}
//                 </Select>
//               </div>
//               <div>
//                 <Button color="blue" className='rounded-md' onClick={() => setIsVendorModalOpen(true)}>Add Vendor</Button>
//               </div>
//             </div>
//           </div>
//           <div>
//             <Label htmlFor="date" value="Procurement Date" />
//             <TextInput
//               id="date"
//               type="date"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label htmlFor="totalCost" value="Total Cost" />
//             <TextInput
//               id="totalCost"
//               type="number"
//               value={totalCost}
//               disabled
//               className="mt-1"
//             />
//           </div>
//         </div>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button color="gray" onClick={onClose}>
//           Cancel
//         </Button>
//         <Button
//           color="success"
//           onClick={handleSubmit}
//           disabled={loading}
//         >
//           {loading ? 'Adding...' : 'Add Consumable'}
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default AddConsumableModal;
