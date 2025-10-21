import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { createCategory, updateCategory } from './roleplaySlice';
import { useLocation } from 'react-router-dom';

const AddEditCategoryModal = ({ isOpen, onClose, isEdit = false }) => {
  const dispatch = useDispatch();
  const { selectedCategory } = useSelector((state) => state.roleplay);
  const { users } = useSelector((state) => state.users);
  const [name, setName] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [isDefault, setIsDefault] = useState(false); // Add this state
  const location = useLocation();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && selectedCategory) {
      setName(selectedCategory.name);
      setIsDefault(selectedCategory.is_default || false); // Set default value
      if (selectedCategory.user_id) {
        setAssignedUserId(String(selectedCategory.user_id));
      }
    } else {
      setName('');
      setAssignedUserId('');
      setIsDefault(false); // Reset to false for new categories
    }
  }, [isEdit, selectedCategory, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const categoryData = { 
        name: name.trim(), 
        user_id: assignedUserId || null,
        is_default: isDefault // Include is_default in data
      };

      if (isEdit && selectedCategory) {
        await dispatch(
          updateCategory({
            id: selectedCategory.id,
            data: categoryData,
          })
        ).unwrap();
      } else {
        const params = new URLSearchParams(location.search);
        const locationId = params.get('location');
        await dispatch(createCategory({ 
          ...categoryData, 
          location_id: locationId 
        })).unwrap();
      }
      setName('');
      setAssignedUserId('');
      setIsDefault(false);
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Category' : 'Add New Category'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
            Category Name
          </label>
          <input
            type="text"
            id="categoryName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter category name"
            required
          />
        </div>

        {/* Add Default Category Checkbox */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
            Set as default category
          </label>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Default categories are automatically assigned to all users (existing and new)
        </p>

        {!isEdit && !isDefault && ( // Only show user assignment if not default
          <div>
            <label htmlFor="assignedUser" className="block text-sm font-medium text-gray-700 mb-2">
              Assign to User
            </label>
            <select
              id="assignedUser"
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required={!isDefault}
            >
              <option value="" disabled>
                Select a user
              </option>
              {Array.isArray(users) && users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim() || (!isEdit && !isDefault && !assignedUserId)}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditCategoryModal;