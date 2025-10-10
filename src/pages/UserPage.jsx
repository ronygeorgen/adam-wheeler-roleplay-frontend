import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Clapperboard, AlertCircle } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const UserPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [locationId, setLocationId] = useState(null); // ADD THIS LINE

  const userEmail = searchParams.get('email');

  useEffect(() => {
    const fetchUserCategories = async () => {
      if (!userEmail) {
        setError('Email parameter is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get(`/roleplay/user-access/get_user_categories/?email=${userEmail}`);
        setUser(response.data.user);
        setCategories(response.data.categories);
        
        // Store location ID from the response - ADD THIS
        if (response.data.user && response.data.user.location_id) {
          setLocationId(response.data.user.location_id);
          console.log('User location ID:', response.data.user.location_id); // Debug log
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchUserCategories();
  }, [userEmail]);

  // Helper function to navigate with email parameter
  const navigateWithEmail = (path) => {
    navigate(`${path}?email=${encodeURIComponent(userEmail)}`);
  };

  const handleModelClick = (categoryId, modelId) => {
    navigateWithEmail(`/roleplay/${categoryId}/${modelId}`);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6EBE3A]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please make sure you're accessing this page with the correct email link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-[#6EBE3A] rounded-2xl flex items-center justify-center">
              <Clapperboard className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#333333] mb-2">Roleplay Library</h1>
          <p className="text-lg text-gray-600">Welcome back, {user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          {/* Optional: Show location ID for debugging */}
          {/* {locationId && (
            <p className="text-xs text-gray-400 mt-1">Location: {locationId}</p>
          )} */}
        </div>

        {!selectedCategory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-[#6EBE3A] transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-[#333333] group-hover:text-[#6EBE3A] transition-colors">
                    {category.name}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#6EBE3A] transition-colors" />
                </div>
                <p className="text-gray-600">
                  {category.models.length} {category.models.length === 1 ? 'roleplay' : 'roleplays'} available
                </p>
              </button>
            ))}

            {categories.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No categories assigned to your account
              </div>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={handleBackToCategories}
              className="mb-6 text-[#6EBE3A] hover:text-[#4C9441] font-medium flex items-center space-x-2"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Back to Categories</span>
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-2xl font-bold text-[#333333]">{selectedCategory.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCategory.models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelClick(selectedCategory.id, model.id)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-[#6EBE3A] transition-all text-left group"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-[#333333] group-hover:text-[#6EBE3A] transition-colors flex-1">
                      {model.name}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#6EBE3A] transition-colors flex-shrink-0 mt-1" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Click to start roleplay</p>
                </button>
              ))}

              {selectedCategory.models.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No roleplays available in this category
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPage;