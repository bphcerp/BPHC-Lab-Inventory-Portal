import React, { useState, useEffect } from 'react';
import { Button, Table, TextInput, Select } from 'flowbite-react';
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import { toastError, toastSuccess } from '../toasts';
import AddConsumableCategoryModal from '../components/AddConsumableCategory';
import EditCategoryModal from '../components/EditCategoryModal';
import DeleteConsumableCategoryModal from '../components/DeleteConsumableCategory';

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

const AddCategoryTypePage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(Array.isArray(data) ? data : []);
            } else {
                toastError('Failed to fetch categories');
            }
        } catch (error) {
            toastError('Error fetching categories');
        }
    };

    const handleAddCategory = async (consumableName: string, fields: { name: string; values: string[] }[]) => {
        setLoading(true);
        try {
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

            await fetchCategories();
            toastSuccess('Category added successfully');
            setAddModalOpen(false);
        } catch (error) {
            toastError(error instanceof Error ? error.message : 'Error adding category');
        } finally {
            setLoading(false);
        }
    };

    // Sort and filter categories
    const sortedAndFilteredCategories = categories
        .filter((category) => 
            category.consumableName?.toLowerCase().includes(searchText.toLowerCase())
        )
        .sort((a, b) => {
            const nameA = (a.consumableName || '').toLowerCase();
            const nameB = (b.consumableName || '').toLowerCase();
            return sortDirection === 'asc' 
                ? nameA.localeCompare(nameB)
                : nameB.localeCompare(nameA);
        });

    const totalPages = Math.ceil(sortedAndFilteredCategories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentCategories = sortedAndFilteredCategories.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.min(Math.max(1, page), totalPages));
    };

    const handleItemsPerPageChange = (value: string) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return (
       <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Manage Consumables</h1>

            <div className="relative flex flex-col md:flex-row mb-4">
                <div className="flex flex-col md:flex-row justify-center items-center gap-4 w-full md:w-2/3 mx-auto">
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
                
                <div className="flex items-center gap-1 md:absolute md:right-0">
                    <span className="text-sm text-gray-600">Show</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onChange={(e) => handleItemsPerPageChange(e.target.value)}
                        className="w-20"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </Select>
                    <span className="text-sm text-gray-600">entries</span>
                </div>
            </div>

            <Table striped className="w-full">
                <Table.Head>
                    <Table.HeadCell 
                        className="text-center cursor-pointer"
                        onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                        <div className="flex items-center justify-center gap-2">
                            Consumable Name
                            <span className="text-xs">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                        </div>
                    </Table.HeadCell>
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

            {totalPages > 0 && (
                <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-4">
                    <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedAndFilteredCategories.length)} of {sortedAndFilteredCategories.length} entries
                    </div>
                    <div className="flex items-center">
                        <Button.Group>
                            <Button
                                size="sm"
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                            >
                                <FaAngleDoubleLeft />
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <FaChevronLeft />
                            </Button>
                            <div className="flex items-center px-4 bg-gray-50">
                                <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={currentPage}
                                    onChange={(e) => handlePageChange(Number(e.target.value))}
                                    className="w-16 text-center border rounded p-1"
                                />
                                <span className="mx-2">of {totalPages}</span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                <FaChevronRight />
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                            >
                                <FaAngleDoubleRight />
                            </Button>
                        </Button.Group>
                    </div>
                </div>
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
                <DeleteConsumableCategoryModal
                    isOpen={!!deletingCategory}
                    onClose={() => setDeletingCategory(null)}
                    categoryId={deletingCategory._id}
                    categoryName={deletingCategory.consumableName}
                    onCategoryDeleted={(deletedId) => {
                        setCategories((prev) => prev.filter((category) => category._id !== deletedId));
                        setDeletingCategory(null);
                    }}
                />
            )}
        </div>
    );
};

export default AddCategoryTypePage;
