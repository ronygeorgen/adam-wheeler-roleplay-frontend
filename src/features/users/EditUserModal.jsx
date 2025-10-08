import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { assignCategoriesToUser } from './usersSlice';
import { fetchCategories } from '../roleplay/roleplaySlice';

const EditUserModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { selectedUser } = useSelector((state) => state.users);
  const { categories } = useSelector((state) => state.roleplay);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCategories());
      if (selectedUser?.assigned_categories) {
        setSelectedCategories(selectedUser.assigned_categories.map(cat => cat.id));
      }
    }
  }, [isOpen, dispatch, selectedUser]);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dispatch(
        assignCategoriesToUser({
          userId: selectedUser.user_id,
          categoryIds: selectedCategories,
        })
      ).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to assign categories:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!selectedUser) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Categories to ${selectedUser.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Roleplay Categories
          </label>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-900">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
