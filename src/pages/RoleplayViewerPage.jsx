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
  const [debugInfo, setDebugInfo] = useState('Starting score detection...');
  const [checkCount, setCheckCount] = useState(0);

  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchModels());
    }
  }, [dispatch, models.length]);

  // Function to handle the score submission
  const handleScoreSubmission = async (score, source = 'manual') => {
    if (isSubmitting) return;
    
    console.log(`Score detected (${source}):`, score);
    setScoreDetected(true);
    setIsSubmitting(true);
    setDebugInfo(`Submitting ${score} to backend...`);
    
    try {
      const numericScore = parseInt(score.replace('%', ''));
      
      // Try the scores endpoint first
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
      setDebugInfo(`✗ Failed to save ${score}. Please try manually.`);
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

  // SIMPLIFIED: Manual score input for user
  const ManualScoreInput = () => {
    const [manualScore, setManualScore] = useState('');
    
    const submitManualScore = () => {
      if (!manualScore) return;
      
      let scoreValue = manualScore;
      // Add percentage if not included
      if (!scoreValue.includes('%')) {
        scoreValue = scoreValue + '%';
      }
      
      handleScoreSubmission(scoreValue, 'manual');
    };

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800 mb-2">
          <strong>Auto-detection didn't work?</strong> Enter your score manually:
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="e.g., 85 or 85%"
            value={manualScore}
            onChange={(e) => setManualScore(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <Button
            size="sm"
            onClick={submitManualScore}
            disabled={!manualScore || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </Button>
        </div>
      </div>
    );
  };

  // Basic iframe monitoring (minimal approach)
  useEffect(() => {
    if (!model || scoreDetected) return;

    let attempts = 0;
    const maxAttempts = 20; // Reduced to 1 minute

    const interval = setInterval(() => {
      attempts++;
      setCheckCount(attempts);
      setDebugInfo(`Monitoring iframe... (Attempt ${attempts})`);

      // Try basic DOM access (will fail due to CORS, but we try anyway)
      try {
        const iframe = iframeRef.current;
        if (iframe) {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          
          // This will throw CORS error, but we catch it below
          if (iframeDoc) {
            const bodyText = iframeDoc.body?.textContent || '';
            
            // Simple pattern matching for scores
            const scoreMatch = bodyText.match(/([0-9]{1,3})%/);
            if (scoreMatch) {
              const score = scoreMatch[0];
              setDebugInfo(`Found potential score: ${score}`);
              // Don't auto-submit from DOM due to potential false positives
            }
          }
        }
      } catch (error) {
        // Expected CORS error - do nothing
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setDebugInfo('Auto-detection complete. Use manual input if needed.');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [model, scoreDetected]);

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
                Detection: {checkCount} checks
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={model.iframe_code}
            style={{ width: '100%', minHeight: '600px', border: 'none' }}
            title="Roleplay Simulation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setDebugInfo('Roleplay loaded - complete the exercise')}
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
          {userEmail && (
            <div className="text-sm text-gray-600 mt-1">
              <strong>User:</strong> {userEmail}
            </div>
          )}
          <div className="text-sm text-gray-600 mt-1">
            <strong>Model:</strong> {model.name}
          </div>
        </div>

        {/* Manual Score Input - Always show as fallback */}
        <ManualScoreInput />

        {/* Instructions */}
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-800">
            <strong>How to record your score:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Complete the roleplay exercise above</li>
              <li>Note your final score percentage (e.g., 85%)</li>
              <li>Enter the score in the manual input above</li>
              <li>Click "Submit Score" to save it to your record</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleplayViewerPage;