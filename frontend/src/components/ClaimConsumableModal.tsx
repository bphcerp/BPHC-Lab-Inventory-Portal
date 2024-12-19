import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Label, TextInput } from 'flowbite-react';
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
  consumable: Consumable | null;
  onClaimSuccess: () => void;
}

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder,
  disabled}: { 
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  onChange(option._id);
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
  consumable,
  onClaimSuccess,
}) => {
  const [claimQuantity, setClaimQuantity] = useState<number | string>('');
  const [issuedBy, setIssuedBy] = useState<string>('');
  const [issuedTo, setIssuedTo] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [people, setPeople] = useState<Array<Person>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClaimQuantity('');
      setIssuedBy('');
      setIssuedTo('');
      setIssueDate('');
      fetchPeople();
    }
  }, [isOpen]);

  const fetchPeople = async () => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
      const apiUrl = `${baseUrl}/people`;

      const response = await fetch(apiUrl, {
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
      toastError('Error fetching people list');
      console.error('Error fetching people:', error);
    }
  };

  const validateForm = () => {
    if (!consumable) {
      toastError('No consumable selected');
      return false;
    }

    const quantity = Number(claimQuantity);
    if (!quantity || quantity <= 0) {
      toastError('Please enter a valid quantity');
      return false;
    }

    if (quantity > consumable.availableQuantity) {
      toastError('Requested quantity exceeds available quantity');
      return false;
    }

    if (!issuedBy.trim()) {
      toastError('Please select who is issuing the consumable');
      return false;
    }

    if (!issuedTo.trim()) {
      toastError('Please select who is receiving the consumable');
      return false;
    }

    if (!issueDate) {
      toastError('Please select the issue date');
      return false;
    }

    return true;
  };

  const handleClaimConsumable = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
      const apiUrl = `${baseUrl}/consumable/claim/${consumable?._id}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          quantity: Number(claimQuantity),
          issuedBy,
          issuedTo,
          issueDate: new Date(issueDate).toISOString(),
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to issue consumable');
      }

      toastSuccess(data.message || 'Consumable issued successfully');
      onClaimSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toastError(errorMessage);
      console.error('Error issuing consumable:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="lg">
      <Modal.Header>Issue Consumable</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <p>
            <strong>Consumable:</strong> {consumable?.consumableName}
          </p>
          <p>
            <strong>Available Quantity:</strong> {consumable?.availableQuantity}
          </p>
          <div>
            <strong>Category Details:</strong>
            {consumable?.categoryFields && Object.keys(consumable.categoryFields).length > 0 ? (
              <ul className="ml-4 list-disc">
                {Object.entries(consumable.categoryFields).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No category details available.</p>
            )}
          </div>
          <div>
            <Label htmlFor="claimQuantity" value="Quantity to Issue" />
            <TextInput
              id="claimQuantity"
              type="number"
              value={claimQuantity}
              onChange={(e) => setClaimQuantity(e.target.value)}
              disabled={isSubmitting}
              required
              min="1"
              max={consumable?.availableQuantity}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="issueDate" value="Date of Issue" />
            <TextInput
              id="issueDate"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              disabled={isSubmitting}
              required
              className="mt-1"
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
            />
          </div>

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
      </Modal.Body>
      <Modal.Footer>
        <Button color="gray" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button color="blue" onClick={handleClaimConsumable} disabled={isSubmitting}>
          {isSubmitting ? 'Issuing...' : 'Issue'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClaimConsumableModal;
