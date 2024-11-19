import React, { useEffect, useState } from 'react';
import { Modal, Button, Label, TextInput } from 'flowbite-react';

interface AddVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddVendor: (vendor: { name: string; phone: string; email: string }) => Promise<void>;
}

const AddVendorModal: React.FC<AddVendorModalProps> = ({ isOpen, onClose, onAddVendor }) => {
    const [name, setName] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!name.trim() || !phone.trim() || !email.trim()) return;
        setLoading(true);
        try {
            await onAddVendor({ name, phone, email });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setName('');
        setPhone('');
        setEmail('');
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
                    <div>
                        <Label htmlFor="phone" value="Phone Number" />
                        <TextInput
                            id="phone"
                            type="tel"
                            placeholder="Enter phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="email" value="Email Address" />
                        <TextInput
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} disabled={loading} color="failure">
                    Cancel
                </Button>
                <Button color="blue" onClick={handleSubmit} isProcessing={loading} disabled={loading || !name || !phone || !email}>
                    {loading ? 'Adding...' : 'Add Vendor'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddVendorModal;
