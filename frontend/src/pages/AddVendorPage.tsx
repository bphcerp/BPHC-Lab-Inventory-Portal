import React, { useState, useEffect } from 'react';
import { Button, TextInput, Table, Pagination } from 'flowbite-react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { toastError, toastSuccess } from '../toasts';
import EditVendorModal from '../components/EditVendorModal';
import ConfirmVendorDeleteModal from '../components/ConfirmVendorDeleteModal';
import AddVendorModal from '../components/AddVendorModal';
import VendorDetailsModal from '../components/VendorDetailsModal'; 

interface Vendor {
  _id: string; 
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Manage Vendors</h1>

      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
        <Button color="blue" onClick={handleAddVendor}>
          Add Vendor
        </Button>
        <TextInput
          id="search"
          value={searchText}
          onChange={handleSearch}
          placeholder="Search by name, email, or phone"
          className="w-full max-w-xs"
        />
      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <Table striped>
          <Table.Head>
            <Table.HeadCell>Name</Table.HeadCell>
            <Table.HeadCell>Email</Table.HeadCell>
            <Table.HeadCell>Phone</Table.HeadCell>
            <Table.HeadCell>Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {currentVendors.length > 0 ? (
              currentVendors.map((vendor) => (
                <Table.Row key={vendor._id}>
                  <Table.Cell
                    onClick={() => handleVendorClick(vendor)}
                    className="cursor-pointer text-blue-600 hover:text-blue-800"
                  >
                    {vendor.name}
                  </Table.Cell>
                  <Table.Cell>{vendor.email}</Table.Cell>
                  <Table.Cell>{vendor.phone}</Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingVendor(vendor)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingVendor(vendor)}
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
                <Table.Cell colSpan={4} className="text-center">
                  No vendors found.
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
            className="mt-4"
          />
        )}
      </div>

      {editingVendor && (
        <EditVendorModal
          isOpen={!!editingVendor}
          onClose={() => setEditingVendor(null)}
          vendor={editingVendor}
          onVendorUpdate={(updatedVendor) => {
  setVendors((prev) =>
    prev.map((v) => (v._id === updatedVendor._id ? updatedVendor : v))
  );
  setFilteredVendors((prev) =>
    prev.map((v) => (v._id === updatedVendor._id ? updatedVendor : v))
  );
}}
        />
      )}

      {deletingVendor && (
        <ConfirmVendorDeleteModal
          isOpen={!!deletingVendor}
          onClose={() => setDeletingVendor(null)}
          itemName={deletingVendor.name} // Pass vendor name only
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
