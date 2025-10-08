import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { createCategory, updateCategory } from './roleplaySlice';

const AddEditCategoryModal = ({ isOpen, onClose, isEdit = false }) => {
  const dispatch = useDispatch();
  const { selectedCategory } = useSelector((state) => state.roleplay);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && selectedCategory) {
      setName(selectedCategory.name);
    } else {
      setName('');
    }
  }, [isEdit, selectedCategory, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (isEdit && selectedCategory) {
        await dispatch(
          updateCategory({
            id: selectedCategory.id,
            data: { name: name.trim() },
          })
        ).unwrap();
      } else {
        await dispatch(createCategory({ name: name.trim() })).unwrap();
      }
      setName('');
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

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditCategoryModal;
