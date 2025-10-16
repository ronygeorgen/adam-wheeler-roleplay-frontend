import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { fetchModels } from '../features/roleplay/roleplaySlice';
import Button from '../components/Button';
import axiosInstance from '../utils/axiosInstance';

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
  const [timeElapsed, setTimeElapsed] = useState(0);

  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchModels());
    }
  }, [dispatch, models.length]);

  // Timer to track how long we've been monitoring
  useEffect(() => {
    if (!model || scoreDetected) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [model, scoreDetected]);

  // Function to handle the score submission
  const handleScoreSubmission = async (score, source = 'auto') => {
    if (isSubmitting) return;
    
    console.log(`Score detected (${source}):`, score);
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
          <strong>Manual Score Entry:</strong> If auto-detection doesn't work, enter your score here:
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

  // Enhanced DOM monitoring for longer duration
  useEffect(() => {
    if (!model || scoreDetected) return;

    let attempts = 0;
    const maxAttempts = 200; // ~10 minutes (200 * 3 seconds = 600 seconds)

    const interval = setInterval(() => {
      attempts++;
      setCheckCount(attempts);
      
      const minutes = Math.floor(timeElapsed / 60);
      const seconds = timeElapsed % 60;
      setDebugInfo(`Monitoring... ${minutes}m ${seconds}s (Check ${attempts})`);

      // Try to detect score in iframe
      const detectScore = () => {
        try {
          const iframe = iframeRef.current;
          if (!iframe) return null;

          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) return null;

          // Check for score elements
          const scoreSelectors = [
            '.score-section',
            '.speech-summary-banner',
            '[class*="score"]',
            '[class*="result"]',
            '[class*="summary"]'
          ];

          for (const selector of scoreSelectors) {
            try {
              const element = iframeDoc.querySelector(selector);
              if (element) {
                const text = element.textContent || element.innerText || '';
                console.log(`Checking ${selector}:`, text.substring(0, 100));
                
                // Look for percentage
                const scoreMatch = text.match(/([0-9]{1,3})%/);
                if (scoreMatch) {
                  return scoreMatch[0];
                }
              }
            } catch (e) {
              // Continue to next selector
            }
          }

          // Check body text
          const bodyText = iframeDoc.body?.textContent || '';
          const scorePatterns = [
            /Your score was\s*([0-9]+%)/i,
            /Score:\s*([0-9]+%)/i,
            /Result:\s*([0-9]+%)/i,
            /([0-9]{1,3})%/
          ];

          for (const pattern of scorePatterns) {
            const match = bodyText.match(pattern);
            if (match && match[1]) {
              return match[1].trim();
            }
          }

          return null;
        } catch (error) {
          // CORS error - expected
          return null;
        }
      };

      const detectedScore = detectScore();
      if (detectedScore) {
        setDebugInfo(`🎯 Score detected: ${detectedScore}`);
        handleScoreSubmission(detectedScore, 'auto');
        clearInterval(interval);
        return;
      }

      // Stop after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setDebugInfo('Auto-detection ended after 10 minutes. Use manual input if needed.');
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [model, scoreDetected, timeElapsed]);

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
                Monitoring: {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s
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
            onLoad={() => setDebugInfo('Roleplay loaded - complete the exercise to get your score')}
          />
        </div>
        
        {/* Status Panel */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <div className="text-sm">
            <strong className="text-gray-700">Status: </strong>
            <span className={`font-medium ${
              debugInfo.includes('🎯') ? 'text-green-600' : 
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
            <div><strong>Checks:</strong> {checkCount}</div>
            <div><strong>Time:</strong> {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s</div>
          </div>
        </div>

        {/* Manual Score Input */}
        <ManualScoreInput />

        {/* Progress and Instructions */}
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-800">
            <strong>Progress & Instructions:</strong>
            <div className="mt-2 space-y-1">
              <div>⏱️ <strong>Time Elapsed:</strong> {Math.floor(timeElapsed / 60)} minutes {timeElapsed % 60} seconds</div>
              <div>🔍 <strong>Detection Checks:</strong> {checkCount} scans performed</div>
              <div>📊 <strong>Expected Duration:</strong> ~5 minutes for the exercise</div>
              <div>✅ <strong>What happens:</strong> Complete the exercise → Score appears → Auto-detected</div>
              <div>🔄 <strong>Monitoring:</strong> Will continue for 10 minutes total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleplayViewerPage;