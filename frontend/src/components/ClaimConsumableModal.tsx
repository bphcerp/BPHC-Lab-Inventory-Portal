import React, { useState, useEffect } from 'react';
import { Button, Modal, Label, TextInput, Select } from 'flowbite-react';
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

const ClaimConsumableModal: React.FC<ClaimConsumableModalProps> = ({
  isOpen,
  onClose,
  consumable,
  onClaimSuccess,
}) => {
  const [claimQuantity, setClaimQuantity] = useState<number | string>('');
  const [issuedBy, setIssuedBy] = useState<string>('');
  const [issuedTo, setIssuedTo] = useState<string>('');
  const [people, setPeople] = useState<Array<Person>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClaimQuantity('');
      setIssuedBy('');
      setIssuedTo('');
      fetchPeople();
    }
  }, [isOpen]);

  const fetchPeople = async () => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
      const apiUrl = `${baseUrl}/people`;

      console.log('Fetching people from:', apiUrl); // Debug log

      const response = await fetch(apiUrl, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response status:', response.status);
        console.error('Response text:', errorText);
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

    return true;
  };

  const handleClaimConsumable = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
      const apiUrl = `${baseUrl}/consumable/claim/${consumable?._id}`;

      console.log('Claiming consumable at:', apiUrl); // Debug log

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
        }),
      });

      // If response is not JSON, get the text content for debugging
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Received non-JSON response:', textResponse);
        throw new Error('Received non-JSON response from server');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to claim consumable');
      }

      toastSuccess(data.message || 'Consumable claimed successfully');
      onClaimSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toastError(errorMessage);
      console.error('Error claiming consumable:', error);
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
            <Label htmlFor="issuedBy" value="Issued By" />
            <Select
              id="issuedBy"
              value={issuedBy}
              onChange={(e) => setIssuedBy(e.target.value)}
              disabled={isSubmitting}
              required
              className="mt-1"
            >
              <option value="">Select Person Issuing</option>
              {people.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="issuedTo" value="Issued To" />
            <Select
              id="issuedTo"
              value={issuedTo}
              onChange={(e) => setIssuedTo(e.target.value)}
              disabled={isSubmitting}
              required
              className="mt-1"
            >
              <option value="">Select Person Receiving</option>
              {people.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button color="gray" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button color="blue" onClick={handleClaimConsumable} disabled={isSubmitting}>
          {isSubmitting ? 'Claiming...' : 'Issue'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClaimConsumableModal;
