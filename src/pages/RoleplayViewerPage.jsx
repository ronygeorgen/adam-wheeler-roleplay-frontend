import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { fetchModels } from '../features/roleplay/roleplaySlice';
import Button from '../components/Button';
import axiosInstance from '../api/axiosInstance';

const RoleplayViewerPage = () => {
  const { categoryId, modelId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { models } = useSelector((state) => state.roleplay);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    score: '',
    strengths: '',
    improvements: ''
  });

  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchModels());
    }
  }, [dispatch, models.length]);

  // Pre-fill email if available from URL
  useEffect(() => {
    if (userEmail) {
      setFormData(prev => ({
        ...prev,
        email: userEmail
      }));
    }
  }, [userEmail]);

  // Helper function to navigate with email parameter
  const navigateWithEmail = (path) => {
    const url = userEmail ? `${path}?email=${encodeURIComponent(userEmail)}` : path;
    navigate(url);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Basic validation
    if (!formData.email || !formData.score || !formData.strengths || !formData.improvements) {
      setSubmitStatus('❌ Please fill in all required fields');
      return;
    }

    // Convert score to number and validate minimum score
    const scoreValue = parseInt(formData.score);
    const currentModel = models.find((m) => m.id === parseInt(modelId));
    
    if (currentModel && scoreValue < currentModel.min_score_to_pass) {
      setSubmitStatus(`❌ You need minimum ${currentModel.min_score_to_pass}% to submit. Your score: ${scoreValue}%`);
      return;
    }

    // Validate score range
    if (scoreValue < 0 || scoreValue > 100) {
      setSubmitStatus('❌ Score must be between 0 and 100');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('Submitting feedback...');

    try {
      const submissionData = {
        email: formData.email,
        score: scoreValue,
        strengths: formData.strengths,
        improvements: formData.improvements,
        model: parseInt(modelId)
      };

      const response = await axiosInstance.post('/roleplay/feedback/', submissionData);
      
      console.log('Feedback submitted successfully:', response.data);
      setSubmitStatus('✅ Feedback submitted successfully!');
      
      // Reset form after successful submission
      setFormData({
        first_name: '',
        last_name: '',
        email: userEmail || '',
        score: '',
        strengths: '',
        improvements: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        navigateWithEmail('/user');
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error.response?.data?.email?.[0] || 
                          error.response?.data?.error || 
                          'Failed to submit feedback. Please try again.';
      setSubmitStatus(`❌ ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const model = models.find((m) => m.id === parseInt(modelId));

  if (!model) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Roleplay not found</h2>
          <Button onClick={() => navigateWithEmail('/user')}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigateWithEmail('/user')}
          >
            Back to Library
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{model.name}</h1>
          <div className="w-32"></div>
        </div>

        {/* Main Content - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Iframe */}
          <div className="space-y-4 lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="w-full"
                style={{ minHeight: '600px' }}
                dangerouslySetInnerHTML={{ __html: model.iframe_code }}
              />
            </div>
            <div className="text-sm text-gray-600 text-center">
              Complete the roleplay exercise above, then fill out the feedback form
            </div>
          </div>

          {/* Right Side - Feedback Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
              Feedback Form
            </h2>

            {/* Minimum Score Requirement */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Minimum Score Requirement
                  </h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    <p>You need to achieve at least <strong>{model.min_score_to_pass}%</strong> to submit this feedback.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Status */}
            {submitStatus && (
              <div className={`p-3 rounded-md mb-4 text-sm ${
                submitStatus.includes('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {submitStatus}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email is preserved from URL and submitted, but hidden from the user */}
              <input type="hidden" name="email" value={formData.email} />

              {/* Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What was your score? <span className="text-red-500">*</span>
                  {formData.score && (
                    <span className={`ml-2 text-xs font-medium ${
                      parseInt(formData.score) >= model.min_score_to_pass 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {parseInt(formData.score) >= model.min_score_to_pass 
                        ? '✓ Meets requirement' 
                        : `❌ Needs ${model.min_score_to_pass}%`}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  name="score"
                  placeholder="Enter your score (0-100)"
                  required
                  min="0"
                  max="100"
                  value={formData.score}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* What did you do well */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What did you do well? <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="strengths"
                  placeholder="Describe what you did well..."
                  required
                  rows="3"
                  value={formData.strengths}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400 resize-vertical"
                />
              </div>

              {/* What could you improve */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What could you have done to improve? <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="improvements"
                  placeholder="Describe what you could improve..."
                  required
                  rows="3"
                  value={formData.improvements}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400 resize-vertical"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (formData.score && parseInt(formData.score) < model.min_score_to_pass)}
                className="w-full bg-lime-500 hover:bg-lime-600 disabled:bg-lime-300 text-white font-semibold py-3 rounded-md transition-all duration-200 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </form>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                <li>Complete the roleplay exercise on the left</li>
                <li>Fill out this feedback form with your results</li>
                <li>Your score and feedback will be saved to your training record</li>
                <li>Use the same email you used during onboarding</li>
                <li>Minimum score required: <strong>{model.min_score_to_pass}%</strong></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleplayViewerPage;