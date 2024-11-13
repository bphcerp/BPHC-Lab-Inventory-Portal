import React, { useState } from 'react';
import { Modal, Button, Label, TextInput, Textarea } from 'flowbite-react';
import { toastError, toastSuccess } from '../toasts';

interface EditVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendor: {
        _id: string;
        name: string;
        comment?: string;
    };
    onVendorUpdate: (updatedVendor: { _id: string; name: string; comment?: string }) => void;
}

const EditVendorModal: React.FC<EditVendorModalProps> = ({ 
    isOpen, 
    onClose, 
    vendor, 
    onVendorUpdate 
}) => {
    const [name, setName] = useState(vendor.name);
    const [comment, setComment] = useState(vendor.comment || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor/${vendor._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, comment }),
            });

            if (response.ok) {
                const updatedVendor = await response.json();
                onVendorUpdate(updatedVendor);
                toastSuccess('Vendor updated successfully');
                onClose();
            } else {
                toastError('Failed to update vendor');
            }
        } catch (error) {
            toastError('Error updating vendor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Edit Vendor</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="edit-name" value="Vendor Name" />
                        <TextInput
                            id="edit-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-comment" value="Comment" />
                        <Textarea
                            id="edit-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    color="blue"
                    onClick={handleSubmit}
                    disabled={loading || !name}
                    isProcessing={loading}
                >
                    {loading ? 'Updating...' : 'Update Vendor'}
                </Button>
                <Button color="gray" onClick={onClose}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditVendorModal;
