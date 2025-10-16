import { useEffect, useRef, useState } from 'react';
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
  const iframeRef = useRef(null);
  const [scoreDetected, setScoreDetected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Roleplay session started');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showManualInput, setShowManualInput] = useState(false);

  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchModels());
    }
  }, [dispatch, models.length]);

  // Timer to track session duration
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Function to handle the score submission
  const handleScoreSubmission = async (score, source = 'manual') => {
    if (isSubmitting) return;
    
    console.log(`Score submitted (${source}):`, score);
    setScoreDetected(true);
    setIsSubmitting(true);
    setDebugInfo(`Submitting ${score} to backend...`);
    
    try {
      const numericScore = parseInt(score.replace('%', ''));
      
      const submissionData = {
        email: userEmail,
        model_id: parseInt(modelId),
        score: numericScore,
        raw_score: score,
        first_name: 'User',
        last_name: 'Roleplay'
      };

      const response = await axiosInstance.post('/roleplay/scores/submit_score/', submissionData);
      
      console.log('Score saved to backend:', response.data);
      setDebugInfo(`✓ ${score} successfully recorded!`);
      
    } catch (error) {
      console.error('Error saving score:', error);
      setDebugInfo(`✗ Failed to save ${score}. ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to navigate with email parameter
  const navigateWithEmail = (path) => {
    const url = userEmail ? `${path}?email=${encodeURIComponent(userEmail)}` : path;
    navigate(url);
  };

  const model = models.find((m) => m.id === parseInt(modelId));

  // Manual score input component
  const ManualScoreInput = () => {
    const [manualScore, setManualScore] = useState('');
    
    const submitManualScore = () => {
      if (!manualScore) return;
      
      let scoreValue = manualScore;
      if (!scoreValue.includes('%')) {
        scoreValue = scoreValue + '%';
      }
      
      handleScoreSubmission(scoreValue, 'manual');
    };

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800 mb-2">
          <strong>Enter Your Score:</strong> Please enter the score you received:
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="e.g., 85 or 85%"
            value={manualScore}
            onChange={(e) => setManualScore(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                submitManualScore();
              }
            }}
          />
          <Button
            size="sm"
            onClick={submitManualScore}
            disabled={!manualScore || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </Button>
        </div>
        <div className="text-xs text-blue-600 mt-1">
          This will save your score to your training record.
        </div>
      </div>
    );
  };

  // Show manual input after 30 seconds automatically
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowManualInput(true);
    }, 30000); // Show after 30 seconds

    return () => clearTimeout(timer);
  }, []);

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
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigateWithEmail('/user')}
          >
            Back to Library
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{model.name}</h1>
          <div className="w-48 text-right">
            {scoreDetected ? (
              <div className="text-green-600 text-sm font-medium">
                {isSubmitting ? 'Submitting...' : '✓ Score Recorded'}
              </div>
            ) : (
              <div className="text-blue-600 text-sm font-medium">
                Session: {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-800">
            <strong>Instructions:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Complete the roleplay exercise below</li>
              <li>Note your final score percentage when finished</li>
              <li>Enter your score in the form that appears below</li>
              <li>Click "Submit Score" to save it to your record</li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={model.iframe_code}
            style={{ width: '100%', minHeight: '600px', border: 'none' }}
            title="Roleplay Simulation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setDebugInfo('Roleplay loaded - begin your exercise')}
          />
        </div>
        
        {/* Status Panel */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <div className="text-sm">
            <strong className="text-gray-700">Status: </strong>
            <span className={`font-medium ${
              debugInfo.includes('✓') ? 'text-green-600' : 
              debugInfo.includes('✗') ? 'text-red-600' : 
              'text-blue-600'
            }`}>
              {debugInfo}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
            <div><strong>User:</strong> {userEmail}</div>
            <div><strong>Model:</strong> {model.name}</div>
            <div><strong>Session Time:</strong> {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s</div>
            <div><strong>Status:</strong> {scoreDetected ? 'Completed' : 'In Progress'}</div>
          </div>
        </div>

        {/* Manual Score Input - Show after delay or when user clicks */}
        {showManualInput && <ManualScoreInput />}

        {/* Show manual input trigger if not shown yet */}
        {!showManualInput && !scoreDetected && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setShowManualInput(true)}
            >
              I've Finished - Enter My Score
            </Button>
          </div>
        )}

        {/* Completion Message */}
        {scoreDetected && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-green-800 text-center">
              <strong>🎉 Exercise Completed!</strong>
              <div className="mt-1">Your score has been recorded. You can now return to the library or continue with other exercises.</div>
              <div className="mt-2 flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWithEmail('/user')}
                >
                  Back to Library
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigateWithEmail('/feedback')}
                >
                  Provide Detailed Feedback
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleplayViewerPage;