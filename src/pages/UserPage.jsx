import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronRight, 
  Clapperboard, 
  AlertCircle, 
  Trophy, 
  TrendingUp, 
  Activity,
  Star,
  Target,
  Calendar,
  Award
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { fetchUserPerformance } from '../features/roleplay/roleplaySlice';

const UserPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'library'

  const { userPerformance, performanceLoading } = useSelector((state) => state.roleplay);

  const userEmail = searchParams.get('email');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userEmail) {
        setError('Email parameter is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch user categories and performance data in parallel
        const [categoriesResponse] = await Promise.all([
          axiosInstance.get(`/roleplay/user-access/get_user_categories/?email=${userEmail}`),
        ]);
        
        setUser(categoriesResponse.data.user);
        setCategories(categoriesResponse.data.categories);
        
        if (categoriesResponse.data.user?.location_id) {
          setLocationId(categoriesResponse.data.user.location_id);
        }

        // Fetch performance data
        dispatch(fetchUserPerformance(userEmail));
        
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userEmail, dispatch]);

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

  // Dashboard Components
// Dashboard Components
const PerformanceDashboard = () => {
  if (performanceLoading || !userPerformance) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 rounded-2xl h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  const { overall_stats, category_stats, recent_activities, debug_info } = userPerformance;

  return (
    <div className="space-y-8">
      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {overall_stats.average_score ? Math.round(overall_stats.average_score) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Across {overall_stats.total_scores} attempt{overall_stats.total_scores !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Highest Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {overall_stats.highest_score ? `${overall_stats.highest_score}%` : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Personal best
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories Attempted</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {category_stats.filter(cat => cat.attempts_count > 0).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                of {category_stats.length} total
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Feedbacks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {overall_stats.total_feedbacks}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Performance reviews
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <Star className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-[#6EBE3A]" />
            Performance by Category
            <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {category_stats.length} categories
            </span>
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {category_stats.map((category) => (
              <div 
                key={category.category_id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  category.attempts_count > 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{category.category_name}</p>
                    {category.attempts_count > 0 ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {category.models_attempted || 0}/{category.models_count || 0} models
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Not started
                      </span>
                    )}
                  </div>
                  
                  {category.attempts_count > 0 ? (
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <p className="text-gray-600">Attempts</p>
                        <p className="font-semibold text-gray-900">{category.attempts_count}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Average</p>
                        <p className="font-semibold text-gray-900">
                          {Math.round(category.average_score)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Highest</p>
                        <p className="font-semibold text-gray-900">
                          {category.highest_score}%
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      {category.models_count || 0} model{category.models_count !== 1 ? 's' : ''} available
                    </p>
                  )}
                  
                  {category.last_attempt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last attempt: {new Date(category.last_attempt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {category_stats.length === 0 && (
              <p className="text-gray-500 text-center py-8">No categories assigned</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-[#6EBE3A]" />
            Recent Activity
            <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Last 10 activities
            </span>
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recent_activities.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'score' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {activity.type === 'score' ? (
                      <Target className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Star className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {activity.type === 'score' ? activity.model_name : 'Feedback Submitted'}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{activity.category_name}</span>
                      <span>•</span>
                      <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-lg">{activity.score}%</p>
                  {activity.raw_score && activity.raw_score !== `${activity.score}%` && (
                    <p className="text-xs text-gray-500">({activity.raw_score})</p>
                  )}
                </div>
              </div>
            ))}
            {recent_activities.length === 0 && (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      {debug_info && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">Debug Info</h4>
          <pre className="text-xs text-yellow-700">
            {JSON.stringify(debug_info, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
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
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-[#6EBE3A] rounded-2xl flex items-center justify-center">
              <Clapperboard className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#333333] mb-2">Roleplay Library</h1>
          <p className="text-lg text-gray-600">Welcome back, {user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl w-fit mx-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-[#333333] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Performance Dashboard
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                activeTab === 'library'
                  ? 'bg-white text-[#333333] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clapperboard className="w-4 h-4 inline mr-2" />
              Roleplay Library
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' ? (
          <PerformanceDashboard />
        ) : (
          /* Original Library Content */
          !selectedCategory ? (
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
          )
        )}
      </div>
    </div>
  );
};

export default UserPage;