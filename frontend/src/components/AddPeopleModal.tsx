import { Button, Modal, Label, TextInput } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { toastError, toastSuccess } from '../toasts';

interface Person {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface AddPeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (person: Person) => void;
  editingPerson?: Person | null;
}

const AddPeopleModal = ({ isOpen, onClose, onSubmit, editingPerson }: AddPeopleModalProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingPerson) {
      setName(editingPerson.name);
      setEmail(editingPerson.email || '');
      setPhone(editingPerson.phone || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
    }
  }, [editingPerson]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toastError('Name is required');
      return;
    }

    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/people${editingPerson ? `/${editingPerson._id}` : ''}`;
      const method = editingPerson ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), email, phone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error processing request');
      }

      const personData = await response.json();
      onSubmit(personData);
      toastSuccess(`Person ${editingPerson ? 'updated' : 'added'} successfully`);
      onClose();
    } catch (error) {
      console.error(error);
      toastError(`Error ${editingPerson ? 'updating' : 'adding'} person: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>{editingPerson ? 'Edit Person' : 'Add Person'}</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" value="Name *" />
            <TextInput
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email" value="Email" />
            <TextInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone" value="Phone" />
            <TextInput
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : editingPerson ? 'Save Changes' : 'Add Person'}
        </Button>
        <Button color="gray" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddPeopleModal;
