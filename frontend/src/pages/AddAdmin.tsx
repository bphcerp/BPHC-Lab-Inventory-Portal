import React, { useState, useEffect } from 'react';
import { Button, TextInput, Table, Pagination } from 'flowbite-react';
import { FaTrash } from 'react-icons/fa';
import { toastError, toastSuccess } from "../toasts";
import AddAdminEntryModal from "../components/AddAdminEntryModal";
import DeleteAdminEntryModal from "../components/DeleteAdminEntryModal";

const AdminPage: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchUsers = async () => {
        const fetchPath = "/user";

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${fetchPath}`, {
            credentials: "include",
        });

        if (res.ok) {
            const userData = await res.json();
            setData(userData);
            setFilteredData(userData);
        } else {
            toastError((await res.json()).message ?? "Something went wrong");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleModalSubmit = async (formData: any) => {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            toastSuccess("User added!");
            fetchUsers();
        } else {
            toastError((await res.json()).message ?? "Something went wrong");
        }

        setIsModalOpen(false);
    };

    const handleDelete = (rowData: any) => {
        setItemToDelete(rowData);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/${itemToDelete._id}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (res.ok) {
            toastSuccess("User deleted!");
            setData(data.filter((item) => item._id !== itemToDelete._id));
            setFilteredData(filteredData.filter((item) => item._id !== itemToDelete._id));
        } else {
            toastError((await res.json()).message ?? "Something went wrong");
        }

        setIsDeleteModalOpen(false);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const searchTerm = event.target.value.toLowerCase();
        setSearchText(searchTerm);

        setFilteredData(
            data.filter((item) => {
                return Object.values(item)
                    .filter((value): value is string => typeof value === 'string')
                    .some((value) => value.toLowerCase().includes(searchTerm));
            })
        );

        setCurrentPage(1);
    };

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredData.slice(startIndex, endIndex);

    const getTableHeaders = () => {
        if (data.length === 0) return [];
        return Object.keys(data[0]).filter(key => key !== '_id' && key !== '__v');
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Management</h1>

            <AddAdminEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                selectedConfig={"User"}
            />

            <DeleteAdminEntryModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteConfirm}
                itemName={"User"}
            />

            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
                <Button color="blue" onClick={() => setIsModalOpen(true)}>
                    Add Admin
                </Button>
                <TextInput
                    id="search"
                    value={searchText}
                    onChange={handleSearch}
                    placeholder="Search users..."
                    className="w-full max-w-xs"
                />
            </div>

            <div className="max-w-7xl mx-auto mb-6">
                <Table striped className="w-full">
                    <Table.Head>
                        {getTableHeaders().map((header) => (
                            <Table.HeadCell key={header} className="text-center">
                                {header.charAt(0).toUpperCase() + header.slice(1).replace(/_/g, ' ')}
                            </Table.HeadCell>
                        ))}
                        <Table.HeadCell className="text-center">Actions</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                        {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <Table.Row key={item._id}>
                                    {getTableHeaders().map((header) => (
                                        <Table.Cell key={header} className="text-center">
                                            {item[header]}
                                        </Table.Cell>
                                    ))}
                                    <Table.Cell className="text-center">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => handleDelete(item)}
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
                                <Table.Cell colSpan={getTableHeaders().length + 1} className="text-center">
                                    No users found.
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
        </div>
    );
};

export default AdminPage;
