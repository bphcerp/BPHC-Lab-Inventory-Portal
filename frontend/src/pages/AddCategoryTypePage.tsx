import React, { useState, useEffect } from 'react';
import { Button, Table, Pagination } from 'flowbite-react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { toastError, toastSuccess } from '../toasts';
import AddConsumableCategoryModal from '../components/AddConsumableCategory';
import EditCategoryModal from '../components/EditCategoryModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

interface Category {
    _id: string;
    name: string;
    fields: { name: string; type: string }[];
}

const AddCategoryTypePage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const itemsPerPage = 10;

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
                credentials: 'include'
            });
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            toastError('Failed to fetch categories');
        }
    };

    const handleAddCategory = async (name: string, fields: { name: string; type: string }[]) => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, fields }),
            });
            if (response.ok) {
                const newCategory = await response.json();
                setCategories((prev) => [...prev, newCategory]);
                toastSuccess('Category added successfully');
            } else {
                toastError('Category already exists or other error');
            }
        } catch (error) {
            toastError('Error adding category');
        } finally {
            setLoading(false);
            setAddModalOpen(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!deletingCategory) return;

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/category/${deletingCategory._id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (response.ok) {
                setCategories((prev) => prev.filter(c => c._id !== deletingCategory._id));
                toastSuccess('Category deleted successfully');
            } else {
                toastError('Failed to delete category');
            }
        } catch (error) {
            toastError('Error deleting category');
        } finally {
            setLoading(false);
            setDeletingCategory(null);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const totalPages = Math.ceil(categories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentCategories = categories.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Add Category Type</h1>

            {/* Add Category Button */}
            <Button color="blue" onClick={() => setAddModalOpen(true)} className="mx-auto block mb-6">
                Add New Category
            </Button>

            {/* Categories Table */}
            <Table striped className="w-full">
                <Table.Head>
                    <Table.HeadCell className="text-center">Category Name</Table.HeadCell>
                    <Table.HeadCell className="text-center">Fields</Table.HeadCell>
                    <Table.HeadCell className="text-center">Actions</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {currentCategories.length > 0 ? (
                        currentCategories.map((category) => (
                            <Table.Row key={category._id}>
                                <Table.Cell className="text-center">{category.name}</Table.Cell>
                                <Table.Cell className="text-center">
                                    {category.fields.map((field) => `${field.name} (${field.type})`).join(', ')}
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
                                No categories found.
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

            {/* Modals */}
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
                        setCategories((prev) => prev.map((c) =>
                            c._id === updatedCategory._id ? updatedCategory : c
                        ));
                        setSelectedCategory(null);
                    }}
                />
            )}

            {deletingCategory && (
                <ConfirmDeleteModal
                    isOpen={!!deletingCategory}
                    onClose={() => setDeletingCategory(null)}
                    onConfirm={handleDeleteCategory}
                    title="Delete Category"
                    message={`Are you sure you want to delete category "${deletingCategory.name}"?`}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default AddCategoryTypePage;
