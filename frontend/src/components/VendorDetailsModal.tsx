import React, { useState } from 'react'; // Importing useState
import { Modal, Button, Alert, TextInput } from 'flowbite-react'; // Adding missing imports

interface Comment {
  _id: string;
  text: string;
  addedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Consumable {
  _id: string;
  consumableName: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  date: string;
  vendor?: {
    name: string;
  };
  comments?: Comment[];
}

interface VendorStats {
  totalTransactions: number;
  totalSpent: number;
  uniqueItems: number;
  mostRecentTransaction: string;
  oldestTransaction: string;
}

interface VendorDetailsModalProps {
  vendorName: string;
  consumables: Consumable[];
  stats?: VendorStats;
  isOpen: boolean;
  onClose: () => void;
}

const VendorDetailsModal: React.FC<VendorDetailsModalProps> = ({
  vendorName,
  consumables,
  isOpen,
  onClose,
}) => {
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const [activeCommentRow, setActiveCommentRow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddComment = async (consumableId: string) => {
    if (!newComments[consumableId]?.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/consumable/${consumableId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newComments[consumableId],
          
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      setNewComments((prev) => ({
        ...prev,
        [consumableId]: '',
      }));
      setActiveCommentRow(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (consumableId: string, commentId: string) => {
    try {
      const response = await fetch(`/api/consumable/${consumableId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="7xl">
      <Modal.Header>Consumables from {vendorName}</Modal.Header>
      <Modal.Body>
        {error && (
          <Alert color="failure" className="mb-4">
            {error}
          </Alert>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Unit Price</th>
                <th className="px-4 py-2">Total Cost</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Comments</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consumables.map((consumable) => (
                <React.Fragment key={consumable._id}>
                  <tr className="border-b">
                    <td className="px-4 py-2">{consumable.consumableName}</td>
                    <td className="px-4 py-2">{consumable.quantity}</td>
                    <td className="px-4 py-2">${consumable.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-2">${consumable.totalCost.toFixed(2)}</td>
                    <td className="px-4 py-2">{new Date(consumable.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <div className="max-h-24 overflow-y-auto">
                        {consumable.comments?.map((comment) => (
                          <div key={comment._id} className="mb-2 p-2 bg-gray-50 rounded">
                            <p className="text-sm">{comment.text}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500">
                                {comment.addedBy.name} - {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                              {(
                                <Button
                                  size="xs"
                                  color="failure"
                                  onClick={() => handleDeleteComment(consumable._id, comment._id)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        size="sm"
                        onClick={() => setActiveCommentRow(consumable._id)}
                      >
                        💬 Add Comment
                      </Button>
                    </td>
                  </tr>
                  {activeCommentRow === consumable._id && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-4 py-2">
                        <div className="flex gap-2">
                          <TextInput
                            className="flex-1"
                            placeholder="Add your comment..."
                            value={newComments[consumable._id] || ''}
                            onChange={(e) =>
                              setNewComments((prev) => ({
                                ...prev,
                                [consumable._id]: e.target.value,
                              }))
                            }
                          />
                          <Button onClick={() => handleAddComment(consumable._id)} disabled={loading}>
                            {loading ? 'Adding...' : 'Submit'}
                          </Button>
                          <Button color="gray" onClick={() => setActiveCommentRow(null)}>
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VendorDetailsModal;
