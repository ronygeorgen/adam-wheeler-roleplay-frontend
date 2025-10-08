import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import { fetchCategories, fetchModels, setSelectedCategory, setSelectedModel } from './roleplaySlice';
import Button from '../../components/Button';

const RolePlayList = ({ onAddCategory, onEditCategory, onAddModel, onEditModel }) => {
  const dispatch = useDispatch();
  const { categories, models, loading, error } = useSelector((state) => state.roleplay);
  const [expandedCategories, setExpandedCategories] = useState({});

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

  // Safe array check before mapping
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
        <h3 className="text-lg font-semibold text-gray-900">Roleplay Categories</h3>
        <Button icon={Plus} onClick={onAddCategory} size="sm">
          Add Category
        </Button>
      </div>

      <div className="space-y-3">
        {categories.map((category) => {
          const categoryModels = getCategoryModels(category.id);
          const isExpanded = expandedCategories[category.id];

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
                  <h4 className="text-base font-semibold text-gray-900">{category.name}</h4>
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
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium text-gray-700">Models</h5>
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
                    {categoryModels.map((model) => (
                      <div
                        key={model.id}
                        className="bg-white rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h6 className="font-medium text-gray-900">{model.name}</h6>
                          <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                            {model.iframe_code?.substring(0, 50)}...
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit}
                          onClick={() => handleEditModel(model)}
                        >
                          Edit
                        </Button>
                      </div>
                    ))}

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