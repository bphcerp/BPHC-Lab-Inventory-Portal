import React, { useState } from 'react';
import { Modal, Button } from 'flowbite-react';
import { toastSuccess, toastError } from '../toasts';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
    itemName: string;
    deleteEndpoint: string; // API endpoint for deletion
    onItemDeleted: (itemId: string) => void; // Callback to update parent state
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    itemId,
    itemName,
    deleteEndpoint,
    onItemDeleted,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/${deleteEndpoint}/${itemId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (response.ok) {
                toastSuccess(`Successfully deleted "${itemName}"`);
                onItemDeleted(itemId);
                onClose();
            } else {
                const error = await response.json();
                setError(error.message || 'Failed to delete item');
                toastError(error.message || 'Failed to delete item');
            }
        } catch (err) {
            setError('An error occurred while deleting the item');
            toastError('An error occurred while deleting the item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Confirm Deletion</Modal.Header>
            <Modal.Body>
                <p>Are you sure you want to delete "{itemName}"?</p>
                {error && <div className="text-red-500 mt-2">{error}</div>}
            </Modal.Body>
            <Modal.Footer>
                <Button color="failure" onClick={handleDelete} disabled={loading}>
                    {loading ? 'Deleting...' : 'Confirm'}
                </Button>
                <Button color="gray" onClick={onClose}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmDeleteModal;
