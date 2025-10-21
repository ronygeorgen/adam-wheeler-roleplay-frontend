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
const PerformanceDashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'category'
  const [selectedModel, setSelectedModel] = useState(null); // Add state for selected model

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

  const { overall_stats, category_stats, recent_roleplay, user } = userPerformance;

  // Calculate additional stats
  const attemptedCategories = category_stats.filter(cat => cat.attempts_count > 0).length;
  const totalCategories = category_stats.length;
  const completionRate = totalCategories > 0 ? Math.round((attemptedCategories / totalCategories) * 100) : 0;

  // Category Overview View
  const CategoryOverview = () => (
    <div className="space-y-8">
      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {Math.round(overall_stats.average_score)}%
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
                {overall_stats.highest_score}%
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
              <p className="text-sm font-medium text-gray-600">Categories Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {attemptedCategories}/{totalCategories}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {completionRate}% completion
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

      {/* Categories Grid */}
      {/* Categories Grid */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
      <Award className="w-5 h-5 mr-2 text-[#6EBE3A]" />
      Your Categories
      <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
        {totalCategories} categories
      </span>
    </h3>
    <div className="flex space-x-2">
      <button
        onClick={() => setViewMode('overview')}
        className="px-3 py-1 text-sm bg-[#6EBE3A] text-white rounded-lg"
      >
        Overview
      </button>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {category_stats.map((category) => {
      // Calculate incomplete models (models that haven't met minimum attempts)
      const incompleteModels = category.models.filter(model => {
        const hasMinimumAttempts = model.attempts_count >= model.min_attempts_required;
        return !hasMinimumAttempts && model.attempts_count > 0;
      });
      
      const hasIncompleteModels = incompleteModels.length > 0;
      const totalRemainingAttempts = incompleteModels.reduce((total, model) => {
        return total + Math.max(0, model.min_attempts_required - model.attempts_count);
      }, 0);

      return (
        <div
          key={category.category_id}
          className={`border rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg relative ${
            category.attempts_count > 0
              ? 'border-green-200 bg-green-50 hover:border-green-300'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
          onClick={() => {
            setSelectedCategory(category);
            setViewMode('category');
          }}
        >
          {/* Incomplete Models Notification Badge */}
          {hasIncompleteModels && (
            <div className="absolute -top-2 -right-2">
              <div className="relative group">
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-sm">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {incompleteModels.length}
                </span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  {incompleteModels.length} model{incompleteModels.length !== 1 ? 's' : ''} need{incompleteModels.length === 1 ? 's' : ''} more attempts
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 text-lg">
              {category.category_name}
            </h4>
            <div className="flex items-center space-x-2">
              {category.attempts_count > 0 ? (
                <>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {category.models_attempted}/{category.models_count} models
                  </span>
                  {hasIncompleteModels && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      {totalRemainingAttempts} attempt{totalRemainingAttempts !== 1 ? 's' : ''} left
                    </span>
                  )}
                </>
              ) : (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  Not started
                </span>
              )}
            </div>
          </div>

          {category.attempts_count > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
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
                <div>
                  <p className="text-gray-600">Lowest</p>
                  <p className="font-semibold text-gray-900">
                    {category.lowest_score}%
                  </p>
                </div>
              </div>
              
              {/* Progress Section for Incomplete Models */}
              {hasIncompleteModels && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-yellow-800">
                      Incomplete Models
                    </p>
                  </div>
                  <div className="space-y-2">
                    {incompleteModels.slice(0, 2).map((model) => {
                      const remainingAttempts = Math.max(0, model.min_attempts_required - model.attempts_count);
                      return (
                        <div key={model.model_id} className="flex justify-between items-center text-xs">
                          <span className="text-yellow-700 truncate flex-1 mr-2">
                            {model.model_name}
                          </span>
                          <span className="text-yellow-600 font-medium whitespace-nowrap">
                            {remainingAttempts} more
                          </span>
                        </div>
                      );
                    })}
                    {incompleteModels.length > 2 && (
                      <p className="text-xs text-yellow-600 text-center">
                        +{incompleteModels.length - 2} more model{incompleteModels.length - 2 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Last: {new Date(category.last_attempt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {category.models_count} model{category.models_count !== 1 ? 's' : ''} available
            </p>
          )}

          <div className="mt-4 pt-3 border-t border-gray-200">
            <button className="w-full text-[#6EBE3A] hover:text-[#4C9441] font-medium text-sm flex items-center justify-center">
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      );
    })}
  </div>
</div>

      {/* Recent Activity */}
      {recent_roleplay && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-[#6EBE3A]" />
            Most Recent Activity
          </h3>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{recent_roleplay.model_name}</p>
                <p className="text-sm text-gray-600">{recent_roleplay.category_name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(recent_roleplay.timestamp).toLocaleDateString()} at{' '}
                  {new Date(recent_roleplay.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{recent_roleplay.score}%</p>
              {recent_roleplay.raw_score && recent_roleplay.raw_score !== `${recent_roleplay.score}%` && (
                <p className="text-sm text-gray-500">({recent_roleplay.raw_score})</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Model Detail View
  const ModelDetailView = () => {
    if (!selectedModel || !selectedCategory) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedModel(null)}
                className="text-[#6EBE3A] hover:text-[#4C9441] font-medium flex items-center space-x-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back to {selectedCategory.category_name}</span>
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedModel.model_name}</h2>
                <p className="text-gray-600">
                  {selectedCategory.category_name} • {selectedModel.attempts_count} attempt{selectedModel.attempts_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {selectedModel.latest_score}%
              </p>
              <p className="text-sm text-gray-600">Latest Score</p>
            </div>
          </div>
        </div>
        {/* Attempt Requirements */}
        {selectedModel.attempts_count < selectedCategory.models.find(m => m.model_id === selectedModel.model_id)?.min_attempts_required && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <h4 className="font-medium text-yellow-800">Minimum Attempts Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  You need {selectedCategory.models.find(m => m.model_id === selectedModel.model_id)?.min_attempts_required - selectedModel.attempts_count} more attempt{selectedCategory.models.find(m => m.model_id === selectedModel.model_id)?.min_attempts_required - selectedModel.attempts_count !== 1 ? 's' : ''} to complete the minimum requirement of {selectedCategory.models.find(m => m.model_id === selectedModel.model_id)?.min_attempts_required} attempts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Model Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-2xl font-bold text-gray-900">{selectedModel.attempts_count}</p>
            <p className="text-sm text-gray-600">Total Attempts</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-2xl font-bold text-gray-900">{selectedModel.highest_score}%</p>
            <p className="text-sm text-gray-600">Highest Score</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {selectedCategory.lowest_score}%
            </p>
            <p className="text-sm text-gray-600">Lowest Score</p>
          </div>
        </div>

        {/* Attempt History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-[#6EBE3A]" />
            Attempt History
          </h3>
          <div className="space-y-6">
            {selectedModel.models_attempt_history && selectedModel.models_attempt_history.length > 0 ? (
              selectedModel.models_attempt_history.map((attempt, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          attempt.score >= 80 ? 'bg-green-100 text-green-800' :
                          attempt.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Score: {attempt.score}%
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(attempt.submitted_at).toLocaleDateString()} at{' '}
                          {new Date(attempt.submitted_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Attempt #{selectedModel.models_attempt_history.length - index}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Star className="w-4 h-4 mr-2 text-green-600" />
                        Strengths
                      </h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{attempt.strengths}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Target className="w-4 h-4 mr-2 text-blue-600" />
                        Areas for Improvement
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{attempt.improvements}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No attempt history available</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={() => handleModelClick(selectedCategory.category_id, selectedModel.model_id)}
            className="bg-[#6EBE3A] hover:bg-[#4C9441] text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
          >
            <Clapperboard className="w-5 h-5 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  };

  // Single Category Detail View
  const CategoryDetailView = () => {
    if (!selectedCategory) return null;

    if (selectedModel) {
      return <ModelDetailView />;
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode('overview')}
                className="text-[#6EBE3A] hover:text-[#4C9441] font-medium flex items-center space-x-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back to Overview</span>
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCategory.category_name}</h2>
                <p className="text-gray-600">
                  {selectedCategory.models_attempted} of {selectedCategory.models_count} models attempted
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {selectedCategory.attempts_count > 0 ? Math.round(selectedCategory.average_score) : 0}%
              </p>
              <p className="text-sm text-gray-600">Average Score</p>
            </div>
          </div>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-2xl font-bold text-gray-900">{selectedCategory.attempts_count}</p>
            <p className="text-sm text-gray-600">Total Attempts</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-2xl font-bold text-gray-900">{selectedCategory.highest_score}%</p>
            <p className="text-sm text-gray-600">Highest Score</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-2xl font-bold text-gray-900">{selectedCategory.lowest_score}%</p>
            <p className="text-sm text-gray-600">Lowest Score</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {selectedCategory.models_attempted}/{selectedCategory.models_count}
            </p>
            <p className="text-sm text-gray-600">Models Completed</p>
          </div>
        </div>

        {/* Model Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Performance</h3>
          <div className="space-y-4">
            {selectedCategory.models.map((model) => {
              // Calculate remaining attempts needed
              const remainingAttempts = Math.max(0, model.min_attempts_required - model.attempts_count);
              const hasMinimumAttempts = model.attempts_count >= model.min_attempts_required;
              
              return (
                <div
                  key={model.model_id}
                  className={`flex items-center justify-between p-6 rounded-xl border transition-all ${
                    model.attempts_count > 0
                      ? 'bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => model.attempts_count > 0 && setSelectedModel(model)}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-900 text-lg">{model.model_name}</p>
                      <div className="flex items-center space-x-2">
                        {/* Minimum Attempts Notification */}
                        {!hasMinimumAttempts && model.attempts_count > 0 && (
                          <div className="relative group">
                            <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {remainingAttempts} more attempt{remainingAttempts !== 1 ? 's' : ''}
                            </span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              Minimum {model.min_attempts_required} attempts required
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                        {model.attempts_count > 0 && (
                          <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                            {model.attempts_count} attempt{model.attempts_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {model.attempts_count > 0 ? (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Latest Score</p>
                          <p className="font-semibold text-gray-900 text-lg">{model.latest_score}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Highest</p>
                          <p className="font-semibold text-gray-900">{model.highest_score}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Last Attempt</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(model.last_attempt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Not attempted yet</p>
                    )}
                    
                    {model.attempts_count > 0 && (
                      <p className="text-xs text-[#6EBE3A] font-medium mt-3 flex items-center">
                        Click to view detailed feedback history
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModelClick(selectedCategory.category_id, model.model_id);
                    }}
                    className="bg-[#6EBE3A] hover:bg-[#4C9441] text-white px-6 py-3 rounded-lg font-medium transition-colors ml-4"
                  >
                    {model.attempts_count > 0 ? 'Retry' : 'Start'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {viewMode === 'overview' ? <CategoryOverview /> : <CategoryDetailView />}
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
                {selectedCategory.models.map((model) => {
  const modelPerformance = userPerformance?.category_stats
    ?.find(cat => cat.category_id === selectedCategory.id)
    ?.models?.find(m => m.model_id === model.id);
  
  const attemptsCount = modelPerformance?.attempts_count || 0;
  const minAttemptsRequired = model.min_attempts_required;
  const remainingAttempts = Math.max(0, minAttemptsRequired - attemptsCount);
  const hasMinimumAttempts = attemptsCount >= minAttemptsRequired;

  return (
    <button
      key={model.id}
      onClick={() => handleModelClick(selectedCategory.id, model.id)}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-[#6EBE3A] transition-all text-left group relative"
    >
      {/* Attempt Notification Badge */}
      {attemptsCount > 0 && !hasMinimumAttempts && (
        <div className="absolute -top-2 -right-2">
          <div className="relative group">
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {remainingAttempts}
            </span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              {remainingAttempts} more attempt{remainingAttempts !== 1 ? 's' : ''} needed
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-[#333333] group-hover:text-[#6EBE3A] transition-colors flex-1">
          {model.name}
        </h3>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#6EBE3A] transition-colors flex-shrink-0 mt-1" />
      </div>
      
      {/* Show attempt progress */}
      <div className="mt-2">
        {attemptsCount > 0 ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {attemptsCount} attempt{attemptsCount !== 1 ? 's' : ''}
            </span>
            {!hasMinimumAttempts && (
              <span className="text-yellow-600 text-xs">
                {remainingAttempts} more needed
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Click to start roleplay</p>
        )}
      </div>
      
      {/* Minimum requirements info */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Min score: {model.min_score_to_pass}%</span>
          <span>Min attempts: {model.min_attempts_required}</span>
        </div>
      </div>
    </button>
  );
})}

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