import React from 'react';
import { Modal, Button } from 'flowbite-react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    loading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    loading = false
}) => {
    return (
        <Modal show={isOpen} onClose={onClose} size="md" popup>
            <Modal.Header />
            <Modal.Body>
                <div className="text-center">
                    <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        {message}
                    </h3>
                    <div className="flex justify-center gap-4">
                        <Button
                            color="failure"
                            onClick={onConfirm}
                            disabled={loading}
                            isProcessing={loading}
                        >
                            {loading ? 'Deleting...' : 'Yes, delete'}
                        </Button>
                        <Button color="gray" onClick={onClose}>
                            No, cancel
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default ConfirmDeleteModal;
