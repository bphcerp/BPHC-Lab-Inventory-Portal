import React, { useState, useEffect } from 'react';
import { Button, TextInput, Table, Pagination, Spinner } from 'flowbite-react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { toastError, toastSuccess } from '../toasts';
import EditVendorModal from '../components/EditVendorModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import AddVendorModal from '../components/AddVendorModal';
//import VendorDetailsModal from '../components/VendorDetailsModal';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

// interface VendorStats {
//   totalTransactions: number;
//   totalSpent: number;
//   uniqueItems: number;
//   mostRecentTransaction: string;
//   oldestTransaction: string;
// }

const AddVendorPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<{ _id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  //const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  //const [vendorConsumables, setVendorConsumables] = useState([]);
  //const [isVendorDetailsModalOpen, setIsVendorDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;
  //const [vendorStats, setVendorStats] = useState<VendorStats | undefined>(undefined);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/vendor`, {
        credentials: 'include',
      });
      const data = await response.json();
      setVendors(data);
      setFilteredVendors(data);
    } catch (error) {
      toastError('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  // const fetchVendorConsumables = async (vendorId: string) => {
  //   try {
  //     const response = await fetch(
  //       `${import.meta.env.VITE_BACKEND_URL}/transactions/vendor/${vendorId}`,
  //       { credentials: 'include' }
  //     );
  //     const data = await response.json();
  //     setVendorConsumables(data.transactions);
  //     setVendorStats(data.stats);
  //   } catch (error) {
  //     toastError('Failed to fetch vendor consumables');
  //   }
  // };

  // const handleVendorClick = (vendor: Vendor) => {
  //   setSelectedVendor(vendor);
  //   fetchVendorConsumables(vendor._id);
  //   setIsVendorDetailsModalOpen(true);
  // };

  // const closeVendorDetailsModal = () => {
  //   setIsVendorDetailsModalOpen(false);
  //   setSelectedVendor(null);
  //   setVendorConsumables([]);
  //   setVendorStats(undefined);
  // };

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
        toastError(errorData.message || 'Failed to add vendor');
        return;
      }

      const newVendor = await response.json();
      handleVendorAdded(newVendor);
      toastSuccess('Vendor added successfully');
    } catch (error) {
      console.error(error);
      toastError('Error adding vendor');
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

    setFilteredVendors(
      vendors.filter((vendor) => {
        const name = vendor.name?.toLowerCase() || '';
        const email = vendor.email?.toLowerCase() || '';
        const phone = vendor.phone?.toLowerCase() || '';

        return (
          name.includes(searchTerm) ||
          email.includes(searchTerm) ||
          phone.includes(searchTerm)
        );
      })
    );

    if (!searchTerm.trim()) {
      setFilteredVendors(vendors);
    }

    setCurrentPage(1);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white/50 z-50">
        <Spinner size="xl" />
      </div>
    );
  }

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Add Vendor</h1>

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
        <Table striped className="w-full">
          <Table.Head>
            <Table.HeadCell className="text-center">Name</Table.HeadCell>
            <Table.HeadCell className="text-center">Email</Table.HeadCell>
            <Table.HeadCell className="text-center">Phone</Table.HeadCell>
            <Table.HeadCell className="text-center">Operations</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {currentVendors.length > 0 ? (
              currentVendors.map((vendor) => (
                <Table.Row key={vendor._id}>
{/*                   <Table.Cell
                    onClick={() => handleVendorClick(vendor)}
                    className="cursor-pointer text-center text-blue-600 hover:text-blue-800"
                  >
                    {vendor.name}
                  </Table.Cell> */}
                  <Table.Cell
                    className="text-center text-blue-600 hover:text-blue-800"
                  >
                    {vendor.name}
                  </Table.Cell>
                  <Table.Cell className="text-center">{vendor.email}</Table.Cell>
                  <Table.Cell className="text-center">{vendor.phone}</Table.Cell>
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
                <Table.Cell colSpan={4} className="text-center">
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

      {editingVendor && (
        <EditVendorModal
          isOpen={!!editingVendor}
          onClose={() => setEditingVendor(null)}
          vendor={editingVendor}
          onVendorUpdate={handleVendorAdded}
        />
      )}

      {deletingVendor && (
        <ConfirmDeleteModal
          isOpen={!!deletingVendor}
          onClose={() => setDeletingVendor(null)}
          itemId={deletingVendor._id}
          itemName={deletingVendor.name}
          deleteEndpoint="vendor"
          onItemDeleted={(id) => {
            setVendors((prev) => prev.filter((vendor) => vendor._id !== id));
            setFilteredVendors((prev) => prev.filter((vendor) => vendor._id !== id));
          }}
        />
      )}

      <AddVendorModal
        isOpen={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
        onAddVendor={addNewVendor}
      />

{/*       {selectedVendor && (
        <VendorDetailsModal
          isOpen={isVendorDetailsModalOpen}
          onClose={closeVendorDetailsModal}
          vendorName={selectedVendor.name}
          consumables={vendorConsumables}
          stats={vendorStats} 
        />
      )} */}
    </div>
  );
};

export default AddVendorPage;
