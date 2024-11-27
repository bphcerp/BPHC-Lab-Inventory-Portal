import React, { useState, useEffect } from 'react';
import { Button, Table, Pagination, TextInput } from 'flowbite-react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { toastError, toastSuccess } from '../toasts';
import AddConsumableCategoryModal from '../components/AddConsumableCategory';
import EditCategoryModal from '../components/EditCategoryModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

interface Field {
    name: string;
    values: string[];
}

interface Category {
    _id: string;
    consumableName: string;
    fields: Field[];
}

const AddCategoryTypePage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const itemsPerPage = 10;

    const fetchCategories = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
            credentials: 'include',
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Fetched categories:', data); // Debug log
            setCategories(Array.isArray(data) ? data : []);
        } else {
            toastError('Failed to fetch categories');
        }
    } catch (error) {
        toastError('Error fetching categories');
    }
};


    const handleAddCategory = async (consumableName: string, fields: Field[]) => {
    setLoading(true);
    try {
        // Debug log before sending request
        console.log('Sending category data:', { consumableName, fields });

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
                consumableName: consumableName.trim(),
                fields: fields.map(field => ({
                    name: field.name.trim(),
                    values: field.values.filter(v => v !== '')
                }))
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to add category');
        }

        console.log('Category added successfully:', data);
        await fetchCategories();
        toastSuccess('Category added successfully');
        setAddModalOpen(false);
    } catch (error) {
        console.error('Error adding category:', error);
        toastError(error instanceof Error ? error.message : 'Error adding category');
    } finally {
        setLoading(false);
    }
    };  
    const filteredCategories = categories.filter(
    (category) => category.consumableName?.toLowerCase().includes(searchText.toLowerCase())
);
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        fetchCategories();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Manage Consumables</h1>

            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
                <Button color="blue" onClick={() => setAddModalOpen(true)} disabled={loading}>
                    {loading ? 'Adding...' : 'Add New Category'}
                </Button>
                <TextInput
                    type="text"
                    placeholder="Search consumables..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full max-w-xs"
                />
            </div>

            <Table striped className="w-full">
                <Table.Head>
                    <Table.HeadCell className="text-center">Consumable Name</Table.HeadCell>
                    <Table.HeadCell className="text-center">Fields</Table.HeadCell>
                    <Table.HeadCell className="text-center">Actions</Table.HeadCell>
                </Table.Head>
                <Table.Body>
    {currentCategories.length > 0 ? (
        currentCategories.map((category) => (
            <Table.Row key={category._id}>
                <Table.Cell className="text-center">
                    {category.consumableName || 'Unnamed Consumable'}
                </Table.Cell>
                <Table.Cell className="text-center">
                    {category.fields.map((field) => (
                        <div key={field.name} className="mb-1">
                            <span className="font-medium">{field.name}:</span>{' '}
                            <span className="text-gray-600">
                                {field.values.join(', ')}
                            </span>
                        </div>
                    ))}
                </Table.Cell>
                <Table.Cell className="text-center">
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={() => setSelectedCategory(category)}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            <FaEdit size={14} />
                        </button>
                        <button
                            onClick={() => setDeletingCategory(category)}
                            className="text-red-600 hover:text-red-800"
                        >
                            <FaTrash size={14} />
                        </button>
                    </div>
                </Table.Cell>
            </Table.Row>
        ))
    ) : (
        <Table.Row>
            <Table.Cell colSpan={3} className="text-center">
                No consumables found.
            </Table.Cell>
        </Table.Row>
    )}
</Table.Body>
            </Table>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    showIcons
                    className="flex justify-center mt-4"
                />
            )}

            <AddConsumableCategoryModal
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onAddCategory={handleAddCategory}
            />

            {selectedCategory && (
                <EditCategoryModal
                    isOpen={!!selectedCategory}
                    onClose={() => setSelectedCategory(null)}
                    category={selectedCategory}
                    onCategoryUpdate={(updatedCategory) => {
                        setCategories((prev) =>
                            prev.map((c) => (c._id === updatedCategory._id ? updatedCategory : c))
                        );
                        setSelectedCategory(null);
                    }}
                />
            )}

            {deletingCategory && (
                <ConfirmDeleteModal
                    isOpen={!!deletingCategory}
                    onClose={() => setDeletingCategory(null)}
                    itemId={deletingCategory._id}
                    itemName={deletingCategory.consumableName}
                    deleteEndpoint="category"
                    onItemDeleted={(deletedId) => {
                        setCategories((prev) => prev.filter((category) => category._id !== deletedId));
                        setDeletingCategory(null);
                    }}
                />
            )}
        </div>
    );
};

export default AddCategoryTypePage;
