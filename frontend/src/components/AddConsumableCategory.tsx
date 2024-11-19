import React, { useEffect, useState } from 'react';
import { Modal, Button, Label, TextInput } from 'flowbite-react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface AddConsumableCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCategory: (consumableName: string, fields: { name: string; values: string[] }[]) => Promise<void>;
}

interface Field {
    name: string;
    values: string[];
    rawInput: string; // New field to store the raw input string
}

const AddConsumableCategoryModal: React.FC<AddConsumableCategoryModalProps> = ({ 
    isOpen, 
    onClose, 
    onAddCategory 
}) => {
    const [consumableName, setConsumableName] = useState<string>('');
    const [fields, setFields] = useState<Field[]>([{ name: '', values: [], rawInput: '' }]);
    const [loading, setLoading] = useState<boolean>(false);

    const handleFieldChange = (index: number, field: Partial<Field>) => {
        const updatedFields = [...fields];
        
        if ('rawInput' in field) {
            // Handle raw input string
            const rawInput = field.rawInput || '';
            updatedFields[index] = {
                ...updatedFields[index],
                rawInput,
                // Only split into values when submitting or when needed
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
        alert('Consumable name is required.');
        return;
    }

    const validFields = fields.filter(field => {
        const hasValidName = field.name.trim() !== '';
        const hasValidValues = field.rawInput.trim() !== '';
        return hasValidName && hasValidValues;
    });

    if (validFields.length === 0) {
        alert('Please provide at least one valid field with non-empty values.');
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
        await onAddCategory(consumableName.trim(), processedFields);
        // The modal will be closed by the parent component after successful addition
    } catch (error: any) {
        console.error('Error adding category:', error);
        alert(error.message || 'Error adding category.');
    } finally {
        setLoading(false);
    }
    };

    useEffect(() => {
        if (isOpen) {
            setConsumableName('');
            setFields([{ name: '', values: [], rawInput: '' }]);
            setLoading(false);
        }
    }, [isOpen]);

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Add New Consumable Category</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="consumableName" value="Consumable Name" />
                        <TextInput
                            id="consumableName"
                            type="text"
                            placeholder="Enter consumable name"
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
                    onClick={onClose} 
                    disabled={loading} 
                    color="failure"
                >
                    Cancel
                </Button>
                <Button 
                    color="blue" 
                    onClick={handleSubmit} 
                    isProcessing={loading} 
                    disabled={loading || !consumableName.trim()}
                >
                    {loading ? 'Adding...' : 'Add Category'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddConsumableCategoryModal;
