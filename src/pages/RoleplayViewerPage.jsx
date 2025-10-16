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
  const [debugInfo, setDebugInfo] = useState('Monitoring for score...');
  const [checkCount, setCheckCount] = useState(0);

  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchModels());
    }
  }, [dispatch, models.length]);

  // Function to handle the score submission
  const handleScoreSubmission = async (score) => {
    if (isSubmitting) return;
    
    console.log('Final score detected:', score);
    setScoreDetected(true);
    setIsSubmitting(true);
    setDebugInfo('Submitting score to backend...');
    
    try {
      const numericScore = parseInt(score.replace('%', ''));
      console.log('Numeric score:', numericScore);

      const submissionData = {
        email: userEmail,
        model_id: parseInt(modelId),
        score: numericScore,
        raw_score: score,
        first_name: 'Auto',
        last_name: 'Detected'
      };

      const response = await axiosInstance.post('/roleplay/scores/submit_score/', submissionData);
      
      console.log('Score saved to backend:', response.data);
      setDebugInfo('✓ Score successfully recorded!');
      
    } catch (error) {
      console.error('Error saving score:', error);
      
      // Fallback to feedback endpoint
      try {
        const fallbackData = {
          first_name: 'Auto',
          last_name: 'Detected',
          email: userEmail,
          score: parseInt(score.replace('%', '')),
          strengths: "Auto-detected from roleplay completion",
          improvements: "Auto-detected from roleplay completion"
        };
        
        const fallbackResponse = await axiosInstance.post('/roleplay/feedback/', fallbackData);
        console.log('Score saved via feedback endpoint:', fallbackResponse.data);
        setDebugInfo('✓ Score recorded via feedback endpoint');
      } catch (fallbackError) {
        console.error('Fallback submission also failed:', fallbackError);
        setDebugInfo('✗ Failed to save score. Please try again.');
      }
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

  // NEW APPROACH: Use MutationObserver on iframe load to detect when it's ready
  const setupIframeObserver = () => {
    if (!iframeRef.current) return;

    try {
      const iframe = iframeRef.current;
      
      // Wait for iframe to load completely
      const checkIframeReady = setInterval(() => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc && iframeDoc.readyState === 'complete') {
            clearInterval(checkIframeReady);
            setDebugInfo('Iframe loaded - attempting score detection');
            
            // Start the main detection loop
            startScoreDetection();
          }
        } catch (error) {
          // CORS error - use alternative approach
          clearInterval(checkIframeReady);
          setDebugInfo('CORS restricted - using URL monitoring');
          startURLCheck();
        }
      }, 1000);

      // Timeout if iframe never loads properly
      setTimeout(() => {
        clearInterval(checkIframeReady);
        setDebugInfo('Iframe load timeout - using alternative methods');
        startURLCheck();
      }, 10000);

    } catch (error) {
      console.error('Iframe setup error:', error);
      setDebugInfo('Iframe setup failed - using URL monitoring');
      startURLCheck();
    }
  };

  // Alternative: Monitor URL changes for score parameters
  const startURLCheck = () => {
    if (!iframeRef.current || scoreDetected) return;

    const urlCheckInterval = setInterval(() => {
      try {
        const iframe = iframeRef.current;
        const iframeUrl = iframe.contentWindow?.location?.href;
        
        if (iframeUrl) {
          // Check for common score parameters in URL
          const scorePatterns = [
            /score=([0-9]+)/,
            /result=([0-9]+)/,
            /percentage=([0-9]+)/,
            /[?&]([0-9]+)%/,
            /score%3D([0-9]+)/ // URL encoded
          ];
          
          for (const pattern of scorePatterns) {
            const match = iframeUrl.match(pattern);
            if (match && match[1]) {
              const score = `${match[1]}%`;
              setDebugInfo(`Score detected from URL: ${score}`);
              handleScoreSubmission(score);
              clearInterval(urlCheckInterval);
              return;
            }
          }
        }
      } catch (error) {
        // CORS error when accessing iframe URL
      }
    }, 2000);

    // Stop after 5 minutes
    setTimeout(() => {
      clearInterval(urlCheckInterval);
      setDebugInfo('URL monitoring ended');
    }, 300000);

    return () => clearInterval(urlCheckInterval);
  };

  // Main score detection function (only works if same-origin)
  const startScoreDetection = () => {
    if (!iframeRef.current || scoreDetected) return;

    let detectionCount = 0;
    const maxDetections = 60; // 3 minutes at 3-second intervals

    const detectionInterval = setInterval(() => {
      detectionCount++;
      setCheckCount(detectionCount);
      setDebugInfo(`Checking for score... (Attempt ${detectionCount})`);

      try {
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (!iframeDoc) {
          setDebugInfo('Iframe document not accessible');
          return;
        }

        // FIXED: Use only valid CSS selectors
        const validSelectors = [
          '.score-section',
          '.speech-summary-banner',
          '[class*="score"]',
          '[class*="result"]',
          '[class*="summary"]',
          'strong',
          '.summary-header + div',
          'p',
          'div',
          'span'
        ];

        // Search through all elements with valid selectors
        for (const selector of validSelectors) {
          try {
            const elements = iframeDoc.querySelectorAll(selector);
            
            for (const element of elements) {
              const text = element.textContent || element.innerText || '';
              
              // Check if this element contains score-related text
              if (text.includes('score') || text.includes('Score') || text.includes('result') || /[0-9]+%/.test(text)) {
                console.log(`Found potential score element (${selector}):`, text);
                
                // Look for percentage patterns in the text
                const scorePatterns = [
                  /Your score was\s*<strong>([^<]+)<\/strong>/,
                  /Your score was\s*([0-9]+%)/,
                  /score.*?([0-9]+%)/i,
                  /([0-9]+%)/,
                  /Score:\s*([0-9]+%)/i,
                  /Result:\s*([0-9]+%)/i,
                  /([0-9]{1,3})%/
                ];
                
                for (const pattern of scorePatterns) {
                  const match = text.match(pattern);
                  if (match && match[1]) {
                    const foundScore = match[1].trim();
                    setDebugInfo(`Score detected: ${foundScore}`);
                    handleScoreSubmission(foundScore);
                    clearInterval(detectionInterval);
                    return;
                  }
                }
                
                // Also check for any percentage in the text
                const directMatch = text.match(/([0-9]{1,3})%/);
                if (directMatch && directMatch[1]) {
                  const foundScore = `${directMatch[1]}%`;
                  setDebugInfo(`Score detected (percentage only): ${foundScore}`);
                  handleScoreSubmission(foundScore);
                  clearInterval(detectionInterval);
                  return;
                }
              }
            }
          } catch (e) {
            // Continue to next selector
            continue;
          }
        }
        
        setDebugInfo(`No score found (Attempt ${detectionCount})`);
        
        // Stop after max attempts
        if (detectionCount >= maxDetections) {
          clearInterval(detectionInterval);
          setDebugInfo('Score detection ended - no score found');
          // Fall back to URL monitoring
          startURLCheck();
        }
        
      } catch (error) {
        // CORS error - switch to URL monitoring
        console.log('CORS error in detection:', error);
        clearInterval(detectionInterval);
        setDebugInfo('CORS restriction - switching to URL monitoring');
        startURLCheck();
      }
    }, 3000);

    return () => clearInterval(detectionInterval);
  };

  // Set up iframe observer when model is available
  useEffect(() => {
    if (!model || scoreDetected) return;

    setupIframeObserver();
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
                Detection active ({checkCount} checks)
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
            onLoad={setupIframeObserver}
          />
        </div>
        
        {/* Debug info */}
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
          {modelId && (
            <div className="text-sm text-gray-600 mt-1">
              <strong>Model ID:</strong> {modelId}
            </div>
          )}
          <div className="text-sm text-gray-600 mt-1">
            <strong>Detection Method:</strong> {debugInfo.includes('URL') ? 'URL Monitoring' : 'DOM Analysis'}
          </div>
        </div>

        {/* Manual fallback */}
        {!scoreDetected && checkCount > 10 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> If auto-detection fails, please submit your score manually.
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigateWithEmail('/feedback')}
            >
              Submit Score Manually
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleplayViewerPage;