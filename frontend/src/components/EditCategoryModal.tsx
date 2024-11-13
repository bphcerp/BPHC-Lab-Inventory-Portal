import React, { useEffect, useState } from 'react';
import { Modal, Button, Label, TextInput, Select } from 'flowbite-react';
import { toastError, toastSuccess } from '../toasts';

interface EditCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: {
        _id: string;
        name: string;
        fields: { name: string; type: string }[];
    };
    onCategoryUpdate: (updatedCategory: { _id: string; name: string; fields: { name: string; type: string }[] }) => void;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ isOpen, onClose, category, onCategoryUpdate }) => {
    const [name, setName] = useState(category.name);
    const [fields, setFields] = useState<{ name: string; type: string }[]>(category.fields);
    const [loading, setLoading] = useState(false);

    const handleFieldChange = (index: number, field: Partial<{ name: string; type: string }>) => {
        const updatedFields = [...fields];
        updatedFields[index] = { ...updatedFields[index], ...field };
        setFields(updatedFields);
    };

    const addField = () => {
        setFields([...fields, { name: '', type: 'string' }]);
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category/${category._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, fields }),
            });

            if (response.ok) {
                const updatedCategory = await response.json();
                onCategoryUpdate(updatedCategory);
                toastSuccess('Category updated successfully');
                onClose();
            } else {
                toastError('Failed to update category');
            }
        } catch (error) {
            toastError('Error updating category');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setName(category.name);
        setFields(category.fields);
    }, [category]);

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Edit Category</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="edit-category-name" value="Category Name" />
                        <TextInput
                            id="edit-category-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label value="Fields" />
                        {fields.map((field, index) => (
                            <div key={index} className="flex items-center space-x-4 mt-2">
                                <TextInput
                                    placeholder="Field Name"
                                    value={field.name}
                                    onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                                    required
                                    className="flex-1"
                                />
                                <Select
                                    value={field.type}
                                    onChange={(e) => handleFieldChange(index, { type: e.target.value })}
                                    required
                                    className="w-32"
                                >
                                    <option value="string">String</option>
                                    <option value="integer">Integer</option>
                                </Select>
                            </div>
                        ))}
                        <Button color="blue" onClick={addField} className="mt-3 flex items-center">
                            + Add Field
                        </Button>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button color="blue" onClick={handleSubmit} disabled={loading || !name} isProcessing={loading}>
                    {loading ? 'Updating...' : 'Update Category'}
                </Button>
                <Button color="gray" onClick={onClose}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditCategoryModal;
