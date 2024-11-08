
import React, { useEffect, useState } from 'react';
import { Modal, Button, Label, TextInput, Select } from 'flowbite-react';
import { FiPlus } from 'react-icons/fi';

interface AddConsumableCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCategory: (name: string, fields: { name: string; type: string }[]) => Promise<void>;
}

interface Field {
    name: string;
    type: string;
}

const AddConsumableCategoryModal: React.FC<AddConsumableCategoryModalProps> = ({ isOpen, onClose, onAddCategory }) => {
    const [categoryName, setCategoryName] = useState<string>('');
    const [fields, setFields] = useState<Field[]>([{ name: '', type: 'string' }]);
    const [loading, setLoading] = useState<boolean>(false);

    const handleFieldChange = (index: number, field: Partial<Field>) => {
        const updatedFields = [...fields];
        updatedFields[index] = { ...updatedFields[index], ...field };
        setFields(updatedFields);
    };

    const addField = () => {
        setFields([...fields, { name: '', type: 'string' }]);
    };

    const handleSubmit = async () => {
        if (!categoryName.trim()) return;
        setLoading(true);
        try {
            await onAddCategory(categoryName, fields);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCategoryName('');
        setFields([{ name: '', type: 'string' }]);
        setLoading(false);
    }, [isOpen]);

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Add New Category</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="categoryName" value="Category Name" />
                        <TextInput
                            id="categoryName"
                            type="text"
                            placeholder="Enter category name"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
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
                            <FiPlus className="mr-1" /> Add Field
                        </Button>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} disabled={loading} color="failure">
                    Cancel
                </Button>
                <Button color="blue" onClick={handleSubmit} isProcessing={loading} disabled={loading || !categoryName}>
                    {loading ? 'Adding...' : 'Add Category'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddConsumableCategoryModal;
