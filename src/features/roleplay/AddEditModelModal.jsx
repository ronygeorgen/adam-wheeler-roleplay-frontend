import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { createModel, updateModel } from './roleplaySlice';

const AddEditModelModal = ({ isOpen, onClose, isEdit = false }) => {
  const dispatch = useDispatch();
  const { selectedCategory, selectedModel } = useSelector((state) => state.roleplay);
  const [name, setName] = useState('');
  const [iframeCode, setIframeCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && selectedModel) {
      setName(selectedModel.name);
      setIframeCode(selectedModel.iframe_code);
    } else {
      setName('');
      setIframeCode('');
    }
  }, [isEdit, selectedModel, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !iframeCode.trim()) return;

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        iframe_code: iframeCode.trim(),
      };

      if (isEdit && selectedModel) {
        await dispatch(
          updateModel({
            id: selectedModel.id,
            data,
          })
        ).unwrap();
      } else {
        data.category = selectedCategory.id;
        await dispatch(createModel(data)).unwrap();
      }

      setName('');
      setIframeCode('');
      onClose();
    } catch (error) {
      console.error('Failed to save model:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Model' : `Add Model to ${selectedCategory?.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="modelName" className="block text-sm font-medium text-gray-700 mb-2">
            Model Name
          </label>
          <input
            type="text"
            id="modelName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter model name"
            required
          />
        </div>

        <div>
          <label htmlFor="iframeCode" className="block text-sm font-medium text-gray-700 mb-2">
            Iframe Code
          </label>
          <textarea
            id="iframeCode"
            value={iframeCode}
            onChange={(e) => setIframeCode(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder='<iframe src="..." width="100%" height="600"></iframe>'
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Paste the complete iframe embed code
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim() || !iframeCode.trim()}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditModelModal;
