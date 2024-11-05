import React, { useState } from 'react';
import { Button, Modal, Label, TextInput } from 'flowbite-react';
import { toastError, toastSuccess } from '../toasts';

interface Consumable {
  _id: string;
  consumableName: string;
  quantity: number;
}

interface ClaimConsumableModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumable: Consumable | null;
  onClaimSuccess: () => void;
}

const ClaimConsumableModal: React.FC<ClaimConsumableModalProps> = ({ isOpen, onClose, consumable, onClaimSuccess }) => {
  const [claimQuantity, setClaimQuantity] = useState<number | string>('');

  const handleClaimConsumable = async () => {
    if (!consumable || !claimQuantity || Number(claimQuantity) <= 0) {
      toastError("Please enter a valid claim quantity.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      toastError("You are not logged in. Please log in to continue.");
      return;
    }

    try {
      // Ensure URL is correctly formatted without duplication
      const backendUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, ""); // Removes trailing slash if exists
      const url = `${backendUrl}/consumable/claim/${consumable._id}`;
      console.log("Claim URL:", url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: Number(claimQuantity) }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Error claiming consumable.");
      }

      toastSuccess("Consumable claimed successfully");
      onClaimSuccess();
    } catch (error) {
      toastError("Error claiming consumable: " + (error as Error).message);
      console.error("Error claiming consumable:", error);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Claim Consumable</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <p><strong>Consumable:</strong> {consumable?.consumableName}</p>
          <p><strong>Available Quantity:</strong> {consumable?.quantity}</p>
          <div>
            <Label htmlFor="claimQuantity" value="Quantity to Claim" />
            <TextInput
              id="claimQuantity"
              type="number"
              value={claimQuantity}
              onChange={(e) => setClaimQuantity(e.target.value)}
              required
              className="mt-1"
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button color="gray" onClick={onClose}>Cancel</Button>
        <Button color="success" onClick={handleClaimConsumable}>Claim</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClaimConsumableModal;
