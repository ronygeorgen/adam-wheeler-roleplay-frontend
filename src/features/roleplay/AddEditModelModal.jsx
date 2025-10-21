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
  const [minScoreToPass, setMinScoreToPass] = useState(70); // Add this state
  const [minAttemptsRequired, setMinAttemptsRequired] = useState(1); // Add this state
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && selectedModel) {
      setName(selectedModel.name);
      setIframeCode(selectedModel.iframe_code);
      setMinScoreToPass(selectedModel.min_score_to_pass || 70); // Set default value
      setMinAttemptsRequired(selectedModel.min_attempts_required || 1); // Set default value
    } else {
      setName('');
      setIframeCode('');
      setMinScoreToPass(70); // Reset to default
      setMinAttemptsRequired(1); // Reset to default
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
        min_score_to_pass: minScoreToPass, // Include new fields
        min_attempts_required: minAttemptsRequired, // Include new fields
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
      setMinScoreToPass(70);
      setMinAttemptsRequired(1);
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

        {/* Add Minimum Score Field */}
        <div>
          <label htmlFor="minScoreToPass" className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Score to Pass (%)
          </label>
          <input
            type="number"
            id="minScoreToPass"
            min="0"
            max="100"
            value={minScoreToPass}
            onChange={(e) => setMinScoreToPass(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Add Minimum Attempts Field */}
        <div>
          <label htmlFor="minAttemptsRequired" className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Attempts Required
          </label>
          <input
            type="number"
            id="minAttemptsRequired"
            min="1"
            max="10"
            value={minAttemptsRequired}
            onChange={(e) => setMinAttemptsRequired(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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