import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { 
  fetchCategories, 
  fetchModels, 
  setSelectedCategory, 
  setSelectedModel,
  deleteCategory,
  deleteModel 
} from './roleplaySlice';
import Button from '../../components/Button';

const RolePlayList = ({ onAddCategory, onEditCategory, onAddModel, onEditModel }) => {
  const dispatch = useDispatch();
  const { categories, models, loading, error } = useSelector((state) => state.roleplay);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchModels());
  }, [dispatch]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const getCategoryModels = (categoryId) => {
    if (!Array.isArray(models)) return [];
    return models.filter((model) => model.category === categoryId);
  };

  const handleEditCategory = (category) => {
    dispatch(setSelectedCategory(category));
    onEditCategory();
  };

  const handleAddModel = (category) => {
    dispatch(setSelectedCategory(category));
    onAddModel();
  };

  const handleEditModel = (model) => {
    dispatch(setSelectedModel(model));
    onEditModel();
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? All models in this category will also be deleted.')) {
      return;
    }

    setDeleting(prev => ({ ...prev, [`category-${categoryId}`]: true }));
    try {
      await dispatch(deleteCategory(categoryId)).unwrap();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    } finally {
      setDeleting(prev => ({ ...prev, [`category-${categoryId}`]: false }));
    }
  };

  const handleDeleteModel = async (modelId, modelName) => {
    if (!window.confirm(`Are you sure you want to delete the model "${modelName}"?`)) {
      return;
    }

    setDeleting(prev => ({ ...prev, [`model-${modelId}`]: true }));
    try {
      await dispatch(deleteModel(modelId)).unwrap();
    } catch (error) {
      console.error('Failed to delete model:', error);
      alert('Failed to delete model');
    } finally {
      setDeleting(prev => ({ ...prev, [`model-${modelId}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6EBE3A]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {typeof error === 'string' ? error : 'Failed to load categories'}
      </div>
    );
  }

  if (!Array.isArray(categories)) {
    return (
      <div className="text-center py-12 text-gray-500">
        No categories data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#333333]">Roleplay Categories</h3>
        <Button icon={Plus} onClick={onAddCategory} size="sm">
          Add Category
        </Button>
      </div>

      <div className="space-y-3">
        {categories.map((category) => {
          const categoryModels = getCategoryModels(category.id);
          const isExpanded = expandedCategories[category.id];
          const isDeletingCategory = deleting[`category-${category.id}`];

          return (
            <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <h4 className="text-base font-semibold text-[#333333]">{category.name}</h4>
                  <span className="text-sm text-gray-500">
                    ({categoryModels.length} {categoryModels.length === 1 ? 'model' : 'models'})
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit}
                    onClick={() => handleEditCategory(category)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={isDeletingCategory}
                  >
                    {isDeletingCategory ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium text-[#333333]">Models</h5>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Plus}
                      onClick={() => handleAddModel(category)}
                    >
                      Add Model
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {categoryModels.map((model) => {
                      const isDeletingModel = deleting[`model-${model.id}`];
                      return (
                        <div
                          key={model.id}
                          className="bg-white rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h6 className="font-medium text-[#333333]">{model.name}</h6>
                            <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                              {model.iframe_code?.substring(0, 50)}...
                            </p>
                            <div className="flex space-x-4">
                              <span>Min Score: {model.min_score_to_pass}%</span>
                              <span>Min Attempts: {model.min_attempts_required}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Edit}
                              onClick={() => handleEditModel(model)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleDeleteModel(model.id, model.name)}
                              disabled={isDeletingModel}
                            >
                              {isDeletingModel ? '...' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {categoryModels.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No models yet. Add one to get started.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No categories found. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default RolePlayList;