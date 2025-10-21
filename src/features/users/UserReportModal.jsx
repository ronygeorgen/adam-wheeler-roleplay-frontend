// src/features/users/UserReportModal.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  X, User, Target, BarChart3, Clock, Award, TrendingUp, 
  Calendar, Star, Activity, Zap, ChevronDown, ChevronUp,
  MessageSquare
} from 'lucide-react';
import { fetchUserPerformance, clearPerformanceData } from '../roleplay/roleplaySlice';
const UserReportModal = ({ isOpen, onClose, user }) => {
  const dispatch = useDispatch();
  const { userPerformance, performanceLoading, performanceError } = useSelector((state) => state.roleplay);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedModels, setExpandedModels] = useState({});

  useEffect(() => {
    if (isOpen && user?.email) {
      dispatch(fetchUserPerformance(user.email));
    }
  }, [isOpen, user?.email, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearPerformanceData());
    };
  }, [dispatch]);

  const handleClose = () => {
    onClose();
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleModel = (modelId) => {
    setExpandedModels(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }));
  };

  if (!isOpen) return null;

  const overallStats = userPerformance?.overall_stats || {};
  const categoryStats = userPerformance?.category_stats || [];
  const recentRoleplay = userPerformance?.recent_roleplay;

  // Calculate active categories (with attempts)
  const activeCategories = categoryStats.filter(cat => cat.attempts_count > 0);
  const totalAttempts = overallStats.total_scores || 0;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never attempted';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get score badge color
  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">User Performance Report</h2>
                <p className="text-green-100">
                  {user?.name} • {user?.email}
                </p>
                {userPerformance?.user?.location_id && (
                  <p className="text-green-100 text-sm mt-1">
                    Location: {userPerformance.user.location_id}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-green-600 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {performanceLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : performanceError ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-800 font-medium">Error loading report</p>
                <p className="text-red-600 text-sm mt-1">
                  {typeof performanceError === 'string' 
                    ? performanceError 
                    : 'Failed to fetch performance data'
                  }
                </p>
              </div>
            </div>
          ) : userPerformance ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Attempts</p>
                      <p className="text-2xl font-bold text-blue-900">{totalAttempts}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Average Score</p>
                      <p className="text-2xl font-bold text-green-900">
                        {overallStats.average_score?.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Active Categories</p>
                      <p className="text-2xl font-bold text-purple-900">{activeCategories.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Award className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Highest Score</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {overallStats.highest_score || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {recentRoleplay && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span>Most Recent Attempt</span>
                  </h3>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{recentRoleplay.model_name}</h4>
                        <p className="text-sm text-gray-600">{recentRoleplay.category_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(recentRoleplay.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBadgeColor(recentRoleplay.score)}`}>
                          <Star className="w-3 h-3 mr-1" />
                          Score: {recentRoleplay.score}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Performance */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span>Category Performance Breakdown</span>
                  <span className="text-sm text-gray-500 font-normal">
                    ({activeCategories.length} of {categoryStats.length} categories attempted)
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {categoryStats.map((category) => (
                    <div key={category.category_id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <div 
                        className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleCategory(category.category_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {expandedCategories[category.category_id] ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                              <h4 className="font-semibold text-gray-900">{category.category_name}</h4>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {category.attempts_count} attempts
                              </span>
                              <span>Models: {category.models_attempted}/{category.models_count}</span>
                              <span>Last: {formatDate(category.last_attempt)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-bold ${getScoreColor(category.average_score)}`}>
                              {category.average_score?.toFixed(1) || 0}%
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Best: {category.highest_score}% • Low: {category.lowest_score}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category Details */}
                      {expandedCategories[category.category_id] && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <div className="space-y-4">
                            {category.models.map((model) => (
                              <div key={model.model_id} className="border border-gray-100 rounded-lg">
                                {/* Model Header */}
                                <div 
                                  className="bg-gray-25 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => toggleModel(model.model_id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex items-center space-x-2">
                                        {expandedModels[model.model_id] ? (
                                          <ChevronUp className="w-3 h-3 text-gray-500" />
                                        ) : (
                                          <ChevronDown className="w-3 h-3 text-gray-500" />
                                        )}
                                        <h5 className="font-medium text-gray-900">{model.model_name}</h5>
                                      </div>
                                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                                        <span>{model.attempts_count} attempts</span>
                                        <span>Latest: {model.latest_score || 0}%</span>
                                        <span>Best: {model.highest_score || 0}%</span>
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Last: {formatDate(model.last_attempt)}
                                    </div>
                                  </div>
                                </div>

                                {/* Model Attempt History */}
                                {expandedModels[model.model_id] && model.models_attempt_history.length > 0 && (
                                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                                    <h6 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                                      <MessageSquare className="w-4 h-4 text-gray-500" />
                                      <span>Attempt History</span>
                                    </h6>
                                    <div className="space-y-3">
                                      {model.models_attempt_history.map((attempt, index) => (
                                        <div key={index} className="bg-white p-3 rounded border border-gray-200">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                              <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreBadgeColor(attempt.score)}`}>
                                                Score: {attempt.score}%
                                              </span>
                                              <span className="text-sm text-gray-500">
                                                {formatDate(attempt.submitted_at)}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <p className="font-medium text-green-700 mb-1">Strengths:</p>
                                              <p className="text-gray-700 bg-green-50 p-2 rounded">
                                                {attempt.strengths || 'No strengths noted'}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="font-medium text-orange-700 mb-1">Areas for Improvement:</p>
                                              <p className="text-gray-700 bg-orange-50 p-2 rounded">
                                                {attempt.improvements || 'No improvements noted'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Empty State for Model */}
                                {expandedModels[model.model_id] && model.models_attempt_history.length === 0 && (
                                  <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-gray-500">
                                    No attempts recorded for this model
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Empty State for Categories */}
                {categoryStats.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No categories available for this user</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-yellow-800 font-medium">No performance data available</p>
                <p className="text-yellow-600 text-sm mt-1">
                  This user hasn't completed any roleplay sessions yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Report generated on {new Date().toLocaleDateString()}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserReportModal;