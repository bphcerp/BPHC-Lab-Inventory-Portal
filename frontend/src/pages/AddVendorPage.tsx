import React, { useState, useEffect } from 'react';
import { Button, Label, TextInput, Textarea, Table, Pagination } from 'flowbite-react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { toastError, toastSuccess } from '../toasts';
import VendorDetails from './VendorDetails';
import EditVendorModal from '../components/EditVendorModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const AddVendorPage: React.FC = () => {
    const [name, setName] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [vendors, setVendors] = useState<{ _id: string; name: string; comment?: string }[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<{ id: string; name: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingVendor, setEditingVendor] = useState<{ _id: string; name: string; comment?: string } | null>(null);
    const [deletingVendor, setDeletingVendor] = useState<{ _id: string; name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const itemsPerPage = 10;

    const fetchVendors = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor`, { 
                credentials: 'include' 
            });
            const data = await response.json();
            setVendors(data);
        } catch (error) {
            toastError('Failed to fetch vendors');
        }
    };

    const handleAddVendor = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, comment }),
            });
            if (response.ok) {
                const newVendor = await response.json();
                setVendors((prev) => [...prev, newVendor]);
                setName('');
                setComment('');
                toastSuccess('Vendor added successfully');
            } else {
                toastError('Vendor already exists or other error');
            }
        } catch (error) {
            toastError('Error adding vendor');
        } finally {
            setLoading(false);
        }
    };

    const handleVendorClick = (vendorId: string, vendorName: string) => {
        setSelectedVendor({ id: vendorId, name: vendorName });
    };

    const handleDeleteVendor = async () => {
        if (!deletingVendor) return;
        
        setDeleteLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor/${deletingVendor._id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                setVendors((prev) => prev.filter(v => v._id !== deletingVendor._id));
                toastSuccess('Vendor deleted successfully');
                setDeletingVendor(null);
            } else {
                toastError('Failed to delete vendor');
            }
        } catch (error) {
            toastError('Error deleting vendor');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleVendorUpdate = (updatedVendor: { _id: string; name: string; comment?: string }) => {
        setVendors(prev => 
            prev.map(vendor => 
                vendor._id === updatedVendor._id ? updatedVendor : vendor
            )
        );
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const totalPages = Math.ceil(vendors.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentVendors = vendors.slice(startIndex, endIndex);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Add Vendor</h1>
            
            {/* Vendor Form Section */}
            <div className="flex flex-col items-center mb-6">
                <div className="flex gap-4 max-w-4xl w-full">
                    <div className="flex-1">
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
                    <div className="flex-1">
                        <Label htmlFor="comment" value="Comment" />
                        <Textarea
                            id="comment"
                            placeholder="Additional comments"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={1}
                        />
                    </div>
                </div>

                <Button 
                    color="blue"
                    onClick={handleAddVendor} 
                    disabled={loading || !name}
                    isProcessing={loading}
                    className="w-32 mt-4"
                >
                    {loading ? 'Adding...' : 'Add Vendor'}
                </Button>
            </div>

            {/* Vendors Table Section */}
            <div className="max-w-7xl mx-auto mb-6">
                <Table striped className="w-full">
                    <Table.Head>
                        <Table.HeadCell className="text-center">Name</Table.HeadCell>
                        <Table.HeadCell className="text-center">Comment</Table.HeadCell>
                        <Table.HeadCell className="text-center">Operations</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                        {currentVendors.length > 0 ? (
                            currentVendors.map((vendor) => (
                                <Table.Row key={vendor._id}>
                                    <Table.Cell 
                                        className="cursor-pointer text-center"
                                        onClick={() => handleVendorClick(vendor._id, vendor.name)}
                                    >
                                        {vendor.name}
                                    </Table.Cell>
                                    <Table.Cell className="text-center">{vendor.comment || 'N/A'}</Table.Cell>
                                    <Table.Cell className="text-center">
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingVendor(vendor);
                                                }}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <FaEdit size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeletingVendor(vendor);
                                                }}
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
                                    No vendors found.
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>

                {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            showIcons
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedVendor && (
                <VendorDetails
                    vendorId={selectedVendor.id}
                    vendorName={selectedVendor.name}
                    isOpen={!!selectedVendor}
                    onClose={() => setSelectedVendor(null)}
                />
            )}

            {editingVendor && (
                <EditVendorModal
                    isOpen={!!editingVendor}
                    onClose={() => setEditingVendor(null)}
                    vendor={editingVendor}
                    onVendorUpdate={handleVendorUpdate}
                />
            )}

            {deletingVendor && (
                <ConfirmDeleteModal
                    isOpen={!!deletingVendor}
                    onClose={() => setDeletingVendor(null)}
                    onConfirm={handleDeleteVendor}
                    title="Delete Vendor"
                    message={`Are you sure you want to delete vendor "${deletingVendor.name}"?`}
                    loading={deleteLoading}
                />
            )}
        </div>
    );
};

export default AddVendorPage;
