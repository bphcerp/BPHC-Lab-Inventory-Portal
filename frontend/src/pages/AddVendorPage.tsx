import React, { useState, useEffect } from 'react';
import { Button, TextInput, Table, Pagination, Card } from 'flowbite-react';
import { FaEdit, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';
import { toastError, toastSuccess } from '../toasts';
import EditVendorModal from '../components/EditVendorModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import AddVendorModal from '../components/AddVendorModal';
import VendorDetailsModal from '../components/VendorDetailsModal';

interface Vendor {
  vendorId: string;
  name: string;
  email: string;
  phone: string;
}

const AddVendorPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isVendorDetailsModalOpen, setIsVendorDetailsModalOpen] = useState(false);
  const itemsPerPage = 10;

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      const data = await response.json();
      setVendors(data);
      setFilteredVendors(data);
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Failed to fetch vendors');
    }
  };

  const handleVendorClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsVendorDetailsModalOpen(true);
  };

  const closeVendorDetailsModal = () => {
    setIsVendorDetailsModalOpen(false);
    setSelectedVendor(null);
  };

  const addNewVendor = async (vendor: { name: string; phone: string; email: string }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(vendor),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add vendor');
      }

      const newVendor = await response.json();
      handleVendorAdded(newVendor);
      toastSuccess('Vendor added successfully');
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Error adding vendor');
    }
  };

  const handleAddVendor = () => {
    setIsAddVendorModalOpen(true);
  };

  const handleVendorAdded = (newVendor: Vendor) => {
    setVendors((prev) => [...prev, newVendor]);
    setFilteredVendors((prev) => [...prev, newVendor]);
    setIsAddVendorModalOpen(false);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = event.target.value.toLowerCase();
    setSearchText(searchTerm);

    const filtered = vendors.filter((vendor) => {
      const name = vendor.name.toLowerCase();
      const email = vendor.email.toLowerCase();
      const phone = vendor.phone.toLowerCase();
      return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
    });

    setFilteredVendors(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-800">Manage Vendors</h1>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Button color="blue" size="md" onClick={handleAddVendor}>
              <FaPlus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-500" />
              </div>
              <TextInput
                id="search"
                type="text"
                sizing="md"
                value={searchText}
                onChange={handleSearch}
                placeholder="Search by name, email, or phone"
                className="pl-10 w-full"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table striped hoverable>
              <Table.Head>
                <Table.HeadCell className="bg-gray-100">Name</Table.HeadCell>
                <Table.HeadCell className="bg-gray-100">Email</Table.HeadCell>
                <Table.HeadCell className="bg-gray-100">Phone</Table.HeadCell>
                <Table.HeadCell className="bg-gray-100">Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body>
                {currentVendors.length > 0 ? (
                  currentVendors.map((vendor) => (
                    <Table.Row key={vendor.vendorId} className="hover:bg-gray-50">
                      <Table.Cell
                        onClick={() => handleVendorClick(vendor)}
                        className="cursor-pointer font-medium text-blue-600 hover:text-blue-800"
                      >
                        {vendor.name}
                      </Table.Cell>
                      <Table.Cell>{vendor.email}</Table.Cell>
                      <Table.Cell>{vendor.phone}</Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <Button
                            color="blue"
                            size="xs"
                            pill
                            onClick={() => setEditingVendor(vendor)}
                          >
                            <FaEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            color="red"
                            size="xs"
                            pill
                            onClick={() => setDeletingVendor(vendor)}
                          >
                            <FaTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={4} className="text-center py-4">
                      No vendors found.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                showIcons
                layout="pagination"
              />
            </div>
          )}
        </div>
      </Card>

      {editingVendor && (
        <EditVendorModal
          isOpen={!!editingVendor}
          onClose={() => setEditingVendor(null)}
          vendor={editingVendor}
          onVendorUpdate={(updatedVendor) => {
            setVendors((prev) =>
              prev.map((v) => (v.vendorId === updatedVendor.vendorId ? updatedVendor : v))
            );
            setFilteredVendors((prev) =>
              prev.map((v) => (v.vendorId === updatedVendor.vendorId ? updatedVendor : v))
            );
          }}
        />
      )}

      {deletingVendor && (
        <ConfirmDeleteModal
          isOpen={!!deletingVendor}
          onClose={() => setDeletingVendor(null)}
          itemName={deletingVendor.name}
          deleteEndpoint="vendor"
          onItemDeleted={(name) => {
            setVendors((prev) => prev.filter((vendor) => vendor.name !== name));
            setFilteredVendors((prev) => prev.filter((vendor) => vendor.name !== name));
          }}
        />
      )}

      <AddVendorModal
        isOpen={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
        onAddVendor={addNewVendor}
      />

      {selectedVendor && (
        <VendorDetailsModal
          isOpen={isVendorDetailsModalOpen}
          onClose={closeVendorDetailsModal}
          vendorName={selectedVendor.name}
        />
      )}
    </div>
  );
};

export default AddVendorPage;
