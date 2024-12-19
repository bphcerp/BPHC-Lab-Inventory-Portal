import React, { useEffect, useState } from 'react';
import { Modal, Button, Label, TextInput } from 'flowbite-react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { toastError, toastSuccess } from '../toasts';

interface Field {
    name: string;
    values: string[];
    rawInput: string;
}

interface Category {
    _id: string;
    consumableName: string;
    fields: Field[];
}

interface EditCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
    onCategoryUpdate: (updatedCategory: Category) => void;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
    isOpen,
    onClose,
    category,
    onCategoryUpdate
}) => {
    const [consumableName, setConsumableName] = useState(category.consumableName);
    const [fields, setFields] = useState<Field[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize fields with rawInput when category changes
        const initialFields = category.fields.map(field => ({
            name: field.name,
            values: field.values,
            rawInput: field.values.join(', ')
        }));
        setFields(initialFields);
        setConsumableName(category.consumableName);
    }, [category]);

    const handleFieldChange = (index: number, field: Partial<Field>) => {
        const updatedFields = [...fields];
        
        if ('rawInput' in field) {
            // Handle raw input string
            const rawInput = field.rawInput || '';
            updatedFields[index] = {
                ...updatedFields[index],
                rawInput,
                values: rawInput.split(',').map(v => v.trim()).filter(v => v !== '')
            };
        } else {
            // Handle other field changes
            updatedFields[index] = {
                ...updatedFields[index],
                ...field
            };
        }
        
        setFields(updatedFields);
    };

    const addField = () => {
        setFields([...fields, { name: '', values: [], rawInput: '' }]);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!consumableName.trim()) {
            toastError('Consumable name is required');
            return;
        }

        const validFields = fields.filter(field => {
            const hasValidName = field.name.trim() !== '';
            const hasValidValues = field.rawInput.trim() !== '';
            return hasValidName && hasValidValues;
        });

        if (validFields.length === 0) {
            toastError('Please provide at least one valid field with non-empty values');
            return;
        }

        // Process the fields for submission
        const processedFields = validFields.map(field => ({
            name: field.name.trim(),
            values: field.rawInput
                .split(',')
                .map(v => v.trim())
                .filter(v => v !== '')
        }));

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category/${category._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    consumableName: consumableName.trim(),
                    fields: processedFields
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update category');
            }

            const updatedCategory = await response.json();
            onCategoryUpdate(updatedCategory);
            toastSuccess('Category updated successfully');
            onClose();
        } catch (error) {
            toastError(error instanceof Error ? error.message : 'Error updating category');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Edit Consumable Category</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="edit-consumable-name" value="Consumable Name" />
                        <TextInput
                            id="edit-consumable-name"
                            type="text"
                            value={consumableName}
                            onChange={(e) => setConsumableName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label value="Fields and Values" />
                        {fields.map((field, index) => (
                            <div key={index} className="space-y-2 mt-2 p-3 border rounded">
                                <div className="flex items-center gap-2">
                                    <TextInput
                                        placeholder="Field Name"
                                        value={field.name}
                                        onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                                        required
                                        className="flex-1"
                                    />
                                    {fields.length > 1 && (
                                        <Button
                                            color="failure"
                                            size="sm"
                                            onClick={() => removeField(index)}
                                        >
                                            <FiTrash2 />
                                        </Button>
                                    )}
                                </div>
                                <TextInput
                                    placeholder="Enter values separated by commas"
                                    value={field.rawInput}
                                    onChange={(e) => handleFieldChange(index, { rawInput: e.target.value })}
                                    required
                                />
                            </div>
                        ))}
                        <Button
                            color="blue"
                            onClick={addField}
                            className="mt-3 flex items-center"
                        >
                            <FiPlus className="mr-1" /> Add Field
                        </Button>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    color="failure"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    color="blue"
                    onClick={handleSubmit}
                    isProcessing={loading}
                    disabled={loading || !consumableName.trim()}
                >
                    {loading ? 'Updating...' : 'Update Category'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditCategoryModal;
