import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Award, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  Info,
  Star,
  TargetIcon,
  TrendingDown,
  MessageSquare
} from 'lucide-react';
import { fetchAllUsersPerformance } from './adminSlice';
import Button from '../../components/Button';

const AdminDashboard = ({ locationId, selectedLocationName }) => {
  const dispatch = useDispatch();
  const { 
    allUsersPerformance, 
    loading, 
    error
  } = useSelector((state) => state.admin);
  
  const [expandedUsers, setExpandedUsers] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedModels, setExpandedModels] = useState({});
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

  // Fetch data when locationId changes
  useEffect(() => {
    if (locationId) {
      dispatch(fetchAllUsersPerformance(locationId));
    }
  }, [locationId, dispatch]);

  const handleRefresh = () => {
    if (locationId) {
      dispatch(fetchAllUsersPerformance(locationId));
    }
  };

  const toggleUserExpanded = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleCategoryExpanded = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleModelExpanded = (modelId) => {
    setExpandedModels(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }));
  };

  const formatScore = (score) => {
    return typeof score === 'number' ? score.toFixed(1) : '0.0';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionColor = (rate) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Function to get category names for highest and lowest scores
  const getScoreCategories = (userData, scoreType) => {
    if (!userData.category_stats || userData.category_stats.length === 0) {
      return 'No category data';
    }

    const targetScore = scoreType === 'highest' 
      ? userData.overall_stats.highest_score 
      : userData.overall_stats.lowest_score;

    // Find categories that have this score
    const matchingCategories = userData.category_stats.filter(
      category => category[`${scoreType}_score`] === targetScore
    );

    if (matchingCategories.length === 0) {
      return 'No matching category';
    }

    return matchingCategories.map(cat => cat.category_name).join(', ');
  };

  const showTooltip = (event, content) => {
    if (!content || content === 'No category data' || content === 'No matching category') {
      return;
    }
    
    setTooltip({
      visible: true,
      content,
      x: event.clientX,
      y: event.clientY
    });
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg mb-4">Error loading dashboard</div>
        <Button onClick={handleRefresh}>Try Again</Button>
      </div>
    );
  }

  // Show loading state when no location is selected
  if (!locationId) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Location</h3>
        <p className="text-gray-500">
          Choose a location from the dropdown above to view the performance dashboard.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className="fixed z-50 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
          }}
        >
          {tooltip.content}
          <div className="absolute -top-1 left-0 w-3 h-3 bg-gray-900 transform rotate-45 -translate-x-1/2"></div>
        </div>
      )}

      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedLocationName} - Performance Overview
          </h2>
          <p className="text-gray-600 mt-1">
            Detailed performance metrics for all users in this location
          </p>
        </div>
        <Button
          icon={RefreshCw}
          onClick={handleRefresh}
          disabled={loading}
          size="sm"
          className={loading ? 'animate-spin' : ''}
        >
          Refresh
        </Button>
      </div>

      {/* Location Stats */}
      {allUsersPerformance?.location_stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {allUsersPerformance.location_stats.total_users}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatScore(allUsersPerformance.location_stats.average_score_all_users)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Feedbacks</p>
                <p className="text-3xl font-bold text-gray-900">
                  {allUsersPerformance.location_stats.total_feedbacks}
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Completion</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatScore(allUsersPerformance.location_stats.average_completion_rate)}%
                </p>
              </div>
              <Award className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Users Performance
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading performance data...</p>
            </div>
          ) : allUsersPerformance?.users?.length > 0 ? (
            allUsersPerformance.users.map((userData) => (
              <div key={userData.user.user_id} className="p-6">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleUserExpanded(userData.user.user_id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-green-800">
                        {userData.user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {userData.user.name}
                      </h3>
                      <p className="text-sm text-gray-500">{userData.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Avg Score</p>
                      <p className={`font-semibold ${getScoreColor(userData.overall_stats.average_score)}`}>
                        {formatScore(userData.overall_stats.average_score)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Completion</p>
                      <p className={`font-semibold ${getCompletionColor(userData.completion_status.completion_rate)}`}>
                        {userData.completion_status.completion_rate}%
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Feedbacks</p>
                      <p className="font-semibold text-gray-900">
                        {userData.overall_stats.total_feedbacks}
                      </p>
                    </div>

                    {expandedUsers[userData.user.user_id] ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedUsers[userData.user.user_id] && (
                  <div className="mt-6 pl-14 space-y-4">
                    {/* Overall Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Highest Score</p>
                        <div 
                          className="flex items-center gap-1 cursor-help group"
                          onMouseEnter={(e) => showTooltip(e, getScoreCategories(userData, 'highest'))}
                          onMouseLeave={hideTooltip}
                        >
                          <p className="font-semibold text-green-600">
                            {userData.overall_stats.highest_score}
                          </p>
                          <Info className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Lowest Score</p>
                        <div 
                          className="flex items-center gap-1 cursor-help group"
                          onMouseEnter={(e) => showTooltip(e, getScoreCategories(userData, 'lowest'))}
                          onMouseLeave={hideTooltip}
                        >
                          <p className="font-semibold text-red-600">
                            {userData.overall_stats.lowest_score}
                          </p>
                          <Info className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Categories Completed</p>
                        <p className="font-semibold text-gray-900">
                          {userData.completion_status.completed_categories}/
                          {userData.completion_status.assigned_categories}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Activity</p>
                        <p className="font-semibold text-gray-900">
                          {userData.recent_roleplay 
                            ? new Date(userData.recent_roleplay.timestamp).toLocaleDateString()
                            : 'No activity'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Category Stats with Models */}
                    {userData.category_stats.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Category Performance</h4>
                        <div className="space-y-3">
                          {userData.category_stats.map((category) => (
                            <div key={category.category_id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                              {/* Category Header */}
                              <div 
                                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleCategoryExpanded(category.category_id)}
                              >
                                <div>
                                  <p className="font-medium text-gray-900">{category.category_name}</p>
                                  <p className="text-sm text-gray-500">
                                    {category.attempts_count} attempts • 
                                    {category.models_attempted} models attempted
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="flex items-center gap-4">
                                      <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Average</p>
                                        <p className={`text-sm font-semibold ${getScoreColor(category.average_score)}`}>
                                          {formatScore(category.average_score)}
                                        </p>
                                      </div>
                                      <div className="w-px h-8 bg-gray-300"></div>
                                      <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Best</p>
                                        <p className="text-sm font-semibold text-green-600">
                                          {category.highest_score}
                                        </p>
                                      </div>
                                      <div className="w-px h-8 bg-gray-300"></div>
                                      <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Lowest</p>
                                        <p className="text-sm font-semibold text-red-600">
                                          {category.lowest_score}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {expandedCategories[category.category_id] ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                              </div>

                              {/* Models Section */}
                              {expandedCategories[category.category_id] && category.models && category.models.length > 0 && (
                                <div className="border-t border-gray-200 bg-gray-50">
                                  <div className="p-4">
                                    <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                      <TargetIcon className="w-4 h-4 text-blue-600" />
                                      Models Performance
                                    </h5>
                                    <div className="space-y-3">
                                      {category.models.map((model) => (
                                        <div key={model.model_id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                          {/* Model Header */}
                                          <div 
                                            className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => toggleModelExpanded(model.model_id)}
                                          >
                                            <div>
                                              <p className="font-medium text-gray-900">{model.model_name}</p>
                                              <p className="text-sm text-gray-500">
                                                {model.attempts_count} attempts • 
                                                Latest: {model.latest_score} • Best: {model.highest_score}
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <div className="text-right">
                                                <p className={`text-sm font-semibold ${getScoreColor(model.latest_score)}`}>
                                                  Current: {model.latest_score}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  Min to pass: {model.min_score_to_pass}
                                                </p>
                                              </div>
                                              {expandedModels[model.model_id] ? (
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                              ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                              )}
                                            </div>
                                          </div>

                                          {/* Feedbacks Section */}
                                          {expandedModels[model.model_id] && model.models_attempt_history && model.models_attempt_history.length > 0 && (
                                            <div className="border-t border-gray-200 bg-white">
                                              <div className="p-3">
                                                <h6 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                  <MessageSquare className="w-4 h-4 text-purple-600" />
                                                  Attempt History
                                                </h6>
                                                <div className="space-y-3">
                                                  {model.models_attempt_history.map((feedback, index) => (
                                                    <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                                      <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                          <p className="font-medium text-gray-900">
                                                            Attempt {model.models_attempt_history.length - index}
                                                          </p>
                                                          <p className="text-sm text-gray-500">
                                                            {new Date(feedback.submitted_at).toLocaleDateString()} at{' '}
                                                            {new Date(feedback.submitted_at).toLocaleTimeString()}
                                                          </p>
                                                        </div>
                                                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                          feedback.score >= 80 ? 'bg-green-100 text-green-800' :
                                                          feedback.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                          'bg-red-100 text-red-800'
                                                        }`}>
                                                          Score: {feedback.score}
                                                        </div>
                                                      </div>
                                                      
                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                          <p className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                            <Star className="w-3 h-3 text-green-600" />
                                                            Strengths:
                                                          </p>
                                                          <p className="text-gray-600 bg-green-50 p-2 rounded border border-green-200">
                                                            {feedback.strengths || 'No strengths noted'}
                                                          </p>
                                                        </div>
                                                        <div>
                                                          <p className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                            <TrendingDown className="w-3 h-3 text-blue-600" />
                                                            Improvements:
                                                          </p>
                                                          <p className="text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                                                            {feedback.improvements || 'No improvements noted'}
                                                          </p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Roleplay */}
                    {userData.recent_roleplay && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Most Recent Roleplay</h4>
                        <div className="p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">
                                {userData.recent_roleplay.model_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {userData.recent_roleplay.category_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold text-lg ${getScoreColor(userData.recent_roleplay.score)}`}>
                                Score: {userData.recent_roleplay.score}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(userData.recent_roleplay.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {locationId 
                  ? `No active users found in ${selectedLocationName}`
                  : 'Please select a location to view users'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;