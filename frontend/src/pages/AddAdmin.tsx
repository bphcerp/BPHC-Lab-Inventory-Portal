import React, { useState, useEffect } from 'react';
import { Button, TextInput, Table, Pagination, Badge } from 'flowbite-react';
import { FaTrash, FaEdit } from 'react-icons/fa';
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
    const [editingUser, setEditingUser] = useState<any | null>(null);
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
        if (editingUser) {
            // Update existing user
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/${editingUser._id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toastSuccess("User updated!");
                setEditingUser(null);
            } else {
                toastError((await res.json()).message ?? "Something went wrong");
            }
        } else {
            // Create new user
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toastSuccess("User added!");
            } else {
                toastError((await res.json()).message ?? "Something went wrong");
            }
        }

        fetchUsers();
        setIsModalOpen(false);
    };

    // const handleRoleChange = async (userId: string, newRole: string) => {
    //     const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/${userId}/role`, {
    //         method: "PATCH",
    //         credentials: "include",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({ role: newRole }),
    //     });

    //     if (res.ok) {
    //         toastSuccess("User role updated!");
    //         fetchUsers();
    //     } else {
    //         toastError((await res.json()).message ?? "Something went wrong");
    //     }
    // };

    const handleDelete = (rowData: any) => {
        setItemToDelete(rowData);
        setIsDeleteModalOpen(true);
    };

    const handleEdit = (rowData: any) => {
        setEditingUser(rowData);
        setIsModalOpen(true);
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
        if (data.length === 0) return ['Name', 'Email', 'Role'];
        // Filter out _id and __v, but ensure 'role' is included
        const headers = Object.keys(data[0])
            .filter(key => key !== '_id' && key !== '__v')
            .map(header => header.charAt(0).toUpperCase() + header.slice(1).replace(/_/g, ' '));
        
        if (!headers.includes('Role')) headers.push('Role');
        return [...headers, 'Actions'];
    };

    const getAccessLevelBadge = (role: string) => {
        if (role === 'admin') {
            return <Badge color="indigo">Admin</Badge>;
        } else {
            return <Badge color="gray">Dashboard Only</Badge>;
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Management</h1>

            <AddAdminEntryModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                }}
                onSubmit={handleModalSubmit}
                selectedConfig={"User"}
                initialData={editingUser}
            />

            <DeleteAdminEntryModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteConfirm}
                itemName={itemToDelete?.name || "User"}
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
                                {header}
                            </Table.HeadCell>
                        ))}
                    </Table.Head>
                    <Table.Body>
                        {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <Table.Row key={item._id}>
                                    <Table.Cell className="text-center">{item.name}</Table.Cell>
                                    <Table.Cell className="text-center">{item.email}</Table.Cell>
                                    <Table.Cell className="text-center">
                                        {getAccessLevelBadge(item.role)}
                                    </Table.Cell>
                                    <Table.Cell className="text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <FaEdit size={14} />
                                            </button>
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
                                <Table.Cell colSpan={getTableHeaders().length} className="text-center">
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
