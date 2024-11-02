import React, { useEffect, useState } from 'react';
import { Modal, Button, Label, TextInput } from 'flowbite-react';

interface AddVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddVendor: (name: string) => Promise<void>;
}

const AddVendorModal: React.FC<AddVendorModalProps> = ({ isOpen, onClose, onAddVendor }) => {
    const [name, setName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            await onAddVendor(name);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setName('');
        setLoading(false);
    }, [isOpen]);

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Add New Vendor</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name" value="Vendor Name" />
                        <TextInput
                            id="name"
                            type="text"
                            placeholder="Enter vendor name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} disabled={loading} color="failure">
                    Cancel
                </Button>
                <Button color="blue" onClick={handleSubmit} isProcessing={loading} disabled={loading || !name}>
                    {loading ? 'Adding...' : 'Add Vendor'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddVendorModal;
