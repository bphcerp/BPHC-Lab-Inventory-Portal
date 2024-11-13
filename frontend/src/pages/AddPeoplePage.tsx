import { useState, useEffect } from 'react';
import { Button, Spinner } from 'flowbite-react';
import AddPeopleModal from '../components/AddPeopleModal';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { toastError, toastSuccess } from '../toasts';
import PersonTransactionsModal from '../components/PersonTransactionsModal';

// Match the Person interface from your model
interface Person {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

const AddPeoplePage = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/people`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch people');
      }
      
      const data = await response.json();
      setPeople(data);
    } catch (error) {
      console.error('Error fetching people:', error);
      toastError('Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (personId: string) => {
    if (!window.confirm('Are you sure you want to delete this person?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/people/${personId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete person');
      }

      setPeople(people.filter(person => person._id !== personId));
      toastSuccess('Person deleted successfully');
    } catch (error) {
      console.error('Error deleting person:', error);
      toastError('Failed to delete person');
    }
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setIsModalOpen(true);
  };

  const handleNameClick = (person: Person) => {
  setSelectedPerson(person);
  setIsTransactionModalOpen(true);
};

  const handleModalSubmit = async (person: Person) => {
    setPeople(prevPeople => {
      if (editingPerson) {
        return prevPeople.map(p => p._id === editingPerson._id ? person : p);
      }
      return [...prevPeople, person];
    });
    setEditingPerson(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPerson(null);
  };

  return (
    <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">User Management</h1>
        <Button color="blue" onClick={() => setIsModalOpen(true)} className="mx-auto block mb-4">Add User</Button>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="xl" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Created At</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <button
                      onClick={() => handleNameClick(person)}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {person.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{person.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{person.phone || '-'}</td>
                  <td>
                    {new Date(person.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        color="gray"
                        onClick={() => handleEdit(person)}
                      >
                        <FaEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => handleDelete(person._id)}
                      >
                        <FaTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {people.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No people found. Add someone to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AddPeopleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />

      <PersonTransactionsModal
  isOpen={isTransactionModalOpen}
  onClose={() => setIsTransactionModalOpen(false)}
  person={selectedPerson}
/>
    </div>
  );
};

export default AddPeoplePage;
