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
  const [debugInfo, setDebugInfo] = useState('Starting roleplay session...');
  const [timeElapsed, setTimeElapsed] = useState(0);

  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchModels());
    }
  }, [dispatch, models.length]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('Message received from iframe:', event.data);
      
      // Check if this message contains score information
      if (event.data && event.data.type === 'ROLEPLAY_SCORE') {
        const score = event.data.score;
        setDebugInfo(`🎯 Score received: ${score}`);
        handleScoreSubmission(score, 'auto');
      }
      
      // Also check for any message that might contain score data
      if (event.data && typeof event.data === 'object') {
        const scoreData = extractScoreFromObject(event.data);
        if (scoreData) {
          setDebugInfo(`🎯 Score detected in data: ${scoreData}`);
          handleScoreSubmission(scoreData, 'auto');
        }
      }
      
      // Check for plain text that might contain score
      if (typeof event.data === 'string') {
        const scoreMatch = event.data.match(/([0-9]{1,3})%/);
        if (scoreMatch) {
          setDebugInfo(`🎯 Score found in message: ${scoreMatch[0]}`);
          handleScoreSubmission(scoreMatch[0], 'auto');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Function to extract score from various data structures
  const extractScoreFromObject = (data) => {
    // Check common score property names
    const scoreProperties = ['score', 'result', 'percentage', 'finalScore', 'userScore'];
    
    for (const prop of scoreProperties) {
      if (data[prop] !== undefined) {
        let score = data[prop];
        if (typeof score === 'number') {
          return `${score}%`;
        }
        if (typeof score === 'string' && score.match(/([0-9]{1,3})%/)) {
          return score;
        }
      }
    }
    
    // Check nested objects
    if (data.data && typeof data.data === 'object') {
      return extractScoreFromObject(data.data);
    }
    
    return null;
  };

  // Function to handle the score submission
  const handleScoreSubmission = async (score, source = 'manual') => {
    if (isSubmitting || scoreDetected) return;
    
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
          <strong>Manual Score Entry:</strong> If auto-detection doesn't work, enter your score here:
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
      </div>
    );
  };

  // Try to inject a script into the iframe that can detect the score
  const injectScoreDetector = () => {
    if (!iframeRef.current) return;
    
    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        const script = iframeDoc.createElement('script');
        script.textContent = `
          // Score detection script
          (function() {
            console.log('Score detector injected into iframe');
            
            // Method 1: Monitor for score elements
            function checkForScore() {
              const scoreElements = [
                '.score-section',
                '.speech-summary-banner',
                '[class*="score"]',
                '[class*="result"]'
              ];
              
              for (const selector of scoreElements) {
                const element = document.querySelector(selector);
                if (element) {
                  const text = element.textContent || element.innerText;
                  const scoreMatch = text.match(/([0-9]{1,3})%/);
                  if (scoreMatch) {
                    console.log('Score found via element:', scoreMatch[0]);
                    window.parent.postMessage({
                      type: 'ROLEPLAY_SCORE',
                      score: scoreMatch[0],
                      source: 'element-detection'
                    }, '*');
                    return true;
                  }
                }
              }
              return false;
            }
            
            // Method 2: MutationObserver to watch for DOM changes
            const observer = new MutationObserver(function(mutations) {
              for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                  if (checkForScore()) {
                    observer.disconnect();
                    break;
                  }
                }
              }
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
            
            // Method 3: Periodic checking as fallback
            const interval = setInterval(() => {
              if (checkForScore()) {
                clearInterval(interval);
              }
            }, 2000);
            
            // Stop after 5 minutes
            setTimeout(() => {
              clearInterval(interval);
              observer.disconnect();
            }, 300000);
            
          })();
        `;
        
        iframeDoc.head.appendChild(script);
        setDebugInfo('Score detector injected into iframe');
      }
    } catch (error) {
      console.log('Cannot inject script due to CORS:', error);
      setDebugInfo('CORS restriction - using message listening only');
    }
  };

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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={model.iframe_code}
            style={{ width: '100%', minHeight: '600px', border: 'none' }}
            title="Roleplay Simulation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => {
              setDebugInfo('Roleplay loaded - listening for score...');
              setTimeout(injectScoreDetector, 2000); // Try injection after load
            }}
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
            <div><strong>Session Time:</strong> {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s</div>
            <div><strong>Detection:</strong> Message Listening</div>
          </div>
        </div>

        {/* Manual Score Input */}
        <ManualScoreInput />

        {/* Instructions */}
        {!scoreDetected && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-800">
              <strong>How it works:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Complete the roleplay exercise above</li>
                <li>When finished, your score will appear as "Your score was X%"</li>
                <li>We'll automatically detect and record your score</li>
                <li>If auto-detection fails, use the manual input above</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleplayViewerPage;