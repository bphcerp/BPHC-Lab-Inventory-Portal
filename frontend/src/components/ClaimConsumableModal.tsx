import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Label, TextInput, Table } from 'flowbite-react';
import { Search } from 'lucide-react';
import { toastError, toastSuccess } from '../toasts';

interface Consumable {
  _id: string;
  consumableName: string;
  categoryFields?: { [key: string]: any };
  availableQuantity: number;
}

interface Person {
  _id: string;
  name: string;
}

interface ClaimConsumableModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumables: Consumable[];
  onClaimSuccess: () => void;
}

interface ConsumableQuantity {
  consumableId: string;
  quantity: string;
}

interface TransactionResult {
  referenceNumber: string;
  consumableName: string;
  quantity: number;
}

interface SuccessData {
  groupTransactionId: string;
  transactions: TransactionResult[];
}


// ... (previous imports remain the same)

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder,
  disabled}:
  { 
  options: Person[], 
  value: string, 
  onChange: (value: string) => void,
  placeholder: string,
  disabled: boolean,
  id: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ... (previous useEffect and other code remains the same)

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find selected person by ID, not by name
  const selectedPerson = options.find(option => option._id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full cursor-pointer bg-white border border-gray-300 rounded-lg p-2.5 flex items-center justify-between"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`block truncate ${!selectedPerson ? 'text-gray-500' : ''}`}>
          {selectedPerson ? selectedPerson.name : placeholder}
        </span>
        <Search className="h-4 w-4 text-gray-500" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2">
            <TextInput
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="max-h-60 overflow-auto">
            {filteredOptions.map((option) => (
              <li
                key={option._id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onChange(option._id); // Pass the ID, not the name
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {option.name}
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="px-4 py-2 text-gray-500">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const ClaimConsumableModal: React.FC<ClaimConsumableModalProps> = ({
  isOpen,
  onClose,
  consumables,
}) => {
  const [quantities, setQuantities] = useState<ConsumableQuantity[]>([]);
  const [issuedBy, setIssuedBy] = useState<string>('');
  const [issuedTo, setIssuedTo] = useState<string>('');
  const [people, setPeople] = useState<Array<Person>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize quantities array with empty values for each consumable
      setQuantities(consumables.map(c => ({ consumableId: c._id, quantity: '' })));
      setIssuedBy('');
      setIssuedTo('');
      setError(null);
      fetchPeople();
    }
  }, [isOpen, consumables]);

  const fetchPeople = async () => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
      const response = await fetch(`${baseUrl}/people`, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch people list: ${response.status}`);
      }

      const data = await response.json();
      setPeople(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching people list';
      toastError(errorMessage);
      console.error('Error fetching people:', error);
    }
  };

  const handleQuantityChange = (consumableId: string, value: string) => {
    setQuantities(prev => 
      prev.map(q => 
        q.consumableId === consumableId ? { ...q, quantity: value } : q
      )
    );
  };

  const validateForm = () => {
    if (consumables.length === 0) {
      setError('No consumables selected');
      return false;
    }

    // Validate all quantities
    for (const q of quantities) {
      const quantity = Number(q.quantity);
      const consumable = consumables.find(c => c._id === q.consumableId);
      
      if (!consumable) continue;

      if (!quantity || quantity <= 0) {
        setError(`Please enter a valid quantity for ${consumable.consumableName}`);
        return false;
      }

      if (quantity > consumable.availableQuantity) {
        setError(`Requested quantity exceeds available quantity for ${consumable.consumableName}`);
        return false;
      }
    }

    if (!issuedBy.trim()) {
      setError('Please select who is issuing the consumables');
      return false;
    }

    if (!issuedTo.trim()) {
      setError('Please select who is receiving the consumables');
      return false;
    }

    setError(null);
    return true;
  };

// ClaimConsumableModal.tsx - Updated handleClaimConsumables function
const handleClaimConsumables = async () => {
  if (!validateForm()) return;

  setIsSubmitting(true);
  setError(null);
  setSuccessData(null);

  try {
    const baseUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
    
    const itemsToSubmit = quantities
      .filter(q => Number(q.quantity) > 0)
      .map(q => ({
        consumableId: q.consumableId,
        quantity: Number(q.quantity)
      }));

    if (itemsToSubmit.length === 0) {
      setError('Please enter quantities for at least one item');
      return;
    }

    const response = await fetch(`${baseUrl}/consumable/claim/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        items: itemsToSubmit,
        issuedBy,
        issuedTo
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to claim consumables');
    }

    // Set the success data from the response
    if (data.success && data.data) {
      setSuccessData(data.data);
      toastSuccess(data.message || 'Consumables claimed successfully');
      // Don't close the modal immediately so user can see the reference numbers
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    setError(errorMessage);
    toastError(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
};

const handleClose = () => {
  setSuccessData(null);
  onClose();
};

  return (
    <Modal show={isOpen} onClose={handleClose} size="xl">
    <Modal.Header>
      {successData ? 'Issue Complete' : 'Issue Consumables'}
    </Modal.Header>
    <Modal.Body>
      {successData ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 text-green-800 rounded-lg">
            <h3 className="font-medium mb-2">Successfully issued consumables</h3>
            <p className="text-sm">Group Transaction ID: <span className="font-medium">{successData.groupTransactionId}</span></p>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Reference Numbers:</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <Table>
                <Table.Head>
                  <Table.HeadCell>Reference Number</Table.HeadCell>
                  <Table.HeadCell>Item</Table.HeadCell>
                  <Table.HeadCell>Quantity</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {successData.transactions.map((transaction, index) => (
                    <Table.Row key={index} className="bg-white">
                      <Table.Cell className="font-medium">{transaction.referenceNumber}</Table.Cell>
                      <Table.Cell>{transaction.consumableName}</Table.Cell>
                      <Table.Cell>{transaction.quantity}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Please save these reference numbers for your records.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="p-4 text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}
          
          <Table>
            <Table.Head>
              <Table.HeadCell>Consumable</Table.HeadCell>
              <Table.HeadCell>Available</Table.HeadCell>
              <Table.HeadCell>Quantity to Issue</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {consumables.map((consumable) => (
                <Table.Row key={consumable._id}>
                  <Table.Cell>
                    <div>
                      <p className="font-medium">{consumable.consumableName}</p>
                      {consumable.categoryFields && (
                        <div className="text-sm text-gray-500">
                          {Object.entries(consumable.categoryFields).map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>{consumable.availableQuantity}</Table.Cell>
                  <Table.Cell>
                    <TextInput
                      type="number"
                      value={quantities.find(q => q.consumableId === consumable._id)?.quantity || ''}
                      onChange={(e) => handleQuantityChange(consumable._id, e.target.value)}
                      disabled={isSubmitting}
                      required
                      min="1"
                      max={consumable.availableQuantity}
                      className="w-24"
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          <div>
            <Label htmlFor="issuedBy" value="Issued By" />
            <SearchableSelect
              id="issuedBy"
              options={people}
              value={issuedBy}
              onChange={setIssuedBy}
              placeholder="Select Person Issuing"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="issuedTo" value="Issued To" />
            <SearchableSelect
              id="issuedTo"
              options={people}
              value={issuedTo}
              onChange={setIssuedTo}
              placeholder="Select Person Receiving"
              disabled={isSubmitting}
            />
          </div>
        </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {successData ? (
          <Button color="gray" onClick={handleClose}>
            Close
          </Button>
        ) : (
          <>
            <Button color="gray" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button color="blue" onClick={handleClaimConsumables} disabled={isSubmitting}>
              {isSubmitting ? 'Issuing...' : 'Issue All'}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ClaimConsumableModal;
