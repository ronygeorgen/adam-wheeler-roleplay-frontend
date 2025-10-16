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

  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchModels());
    }
  }, [dispatch, models.length]);

  // Function to handle the score submission
  const handleScoreSubmission = async (score) => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    console.log('Final score detected:', score);
    setScoreDetected(true);
    setIsSubmitting(true);
    setDebugInfo('Submitting score to backend...');
    
    try {
      // Remove percentage sign and convert to number
      const numericScore = parseInt(score.replace('%', ''));
      console.log('Numeric score:', numericScore);

      // Prepare the data
      const submissionData = {
        email: userEmail,
        model_id: parseInt(modelId),
        score: numericScore,
        raw_score: score,
        first_name: 'Auto', // You can get this from user data if available
        last_name: 'Detected' // You can get this from user data if available
      };

      // Option 1: Submit to scores endpoint (recommended)
      const response = await axiosInstance.post('/roleplay/scores/submit_score/', submissionData);
      
      console.log('Score saved to backend:', response.data);
      setDebugInfo('✓ Score successfully recorded!');
      
    } catch (error) {
      console.error('Error saving score:', error);
      
      // Fallback: Try the feedback endpoint if scores endpoint fails
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

  // Function to check for score using try-catch approach
  const checkForScore = () => {
    if (!iframeRef.current) {
      setDebugInfo('Iframe not loaded yet...');
      return null;
    }
    
    try {
      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDocument) {
        setDebugInfo('Cannot access iframe document');
        return null;
      }

      // Try multiple selectors since we don't know the exact structure
      const possibleSelectors = [
        '.score-section',
        '.speech-summary-banner',
        '[class*="score"]',
        '[class*="result"]',
        '[class*="summary"]',
        'strong', // Direct strong tag that might contain score
        '.summary-header + div', // Element after summary header
        'p:contains("score")', // Paragraph containing "score"
        'div:contains("score")' // Div containing "score"
      ];
      
      for (const selector of possibleSelectors) {
        try {
          const element = iframeDocument.querySelector(selector);
          if (element) {
            const text = element.textContent || element.innerText || '';
            console.log(`Checking selector "${selector}":`, text);
            
            // Look for score patterns
            const scorePatterns = [
              /Your score was\s*<strong>([^<]+)<\/strong>/,
              /Your score was\s*([0-9]+%)/,
              /score.*?([0-9]+%)/i,
              /([0-9]+%)/, // Just look for percentage pattern
              /Score:\s*([0-9]+%)/i,
              /Result:\s*([0-9]+%)/i,
              /([0-9]{1,3})%/ // Match any percentage
            ];
            
            for (const pattern of scorePatterns) {
              const match = text.match(pattern);
              if (match && match[1]) {
                const foundScore = match[1].trim();
                setDebugInfo(`Score detected: ${foundScore}`);
                return foundScore;
              }
            }
            
            // Also check if the element itself contains a percentage
            const directMatch = text.match(/([0-9]{1,3})%/);
            if (directMatch && directMatch[1]) {
              const foundScore = `${directMatch[1]}%`;
              setDebugInfo(`Score detected (direct): ${foundScore}`);
              return foundScore;
            }
          }
        } catch (e) {
          // Continue to next selector
          console.log(`Selector ${selector} failed:`, e.message);
          continue;
        }
      }
      
      setDebugInfo('No score found in current check');
      return null;
    } catch (error) {
      // CORS error - we can't access the iframe content
      console.log('Cannot access iframe content due to CORS:', error.message);
      setDebugInfo('CORS restriction - using alternative detection');
      return null;
    }
  };

  // Set up interval to check for score
  useEffect(() => {
    if (!model || scoreDetected) return;
    
    let checkCount = 0;
    const maxChecks = 100; // 5 minutes at 3-second intervals
    
    const scoreCheckInterval = setInterval(() => {
      checkCount++;
      setDebugInfo(`Checking for score... (Attempt ${checkCount})`);
      
      const score = checkForScore();
      if (score && !scoreDetected) {
        handleScoreSubmission(score);
        clearInterval(scoreCheckInterval);
      }
      
      // Stop after max checks
      if (checkCount >= maxChecks) {
        clearInterval(scoreCheckInterval);
        setDebugInfo('Score detection ended after maximum attempts');
        console.log('Score detection ended after maximum attempts');
      }
    }, 3000); // Check every 3 seconds

    return () => {
      clearInterval(scoreCheckInterval);
    };
  }, [model, scoreDetected]);

  // Alternative: Listen for iframe URL changes (if the score appears in URL)
  useEffect(() => {
    if (!iframeRef.current || scoreDetected) return;

    const iframe = iframeRef.current;
    
    const checkUrlForScore = () => {
      try {
        const iframeUrl = iframe.contentWindow?.location?.href;
        if (iframeUrl && iframeUrl.includes('score=')) {
          const scoreMatch = iframeUrl.match(/score=([0-9]+)/);
          if (scoreMatch && scoreMatch[1]) {
            const score = `${scoreMatch[1]}%`;
            setDebugInfo(`Score detected from URL: ${score}`);
            handleScoreSubmission(score);
          }
        }
      } catch (error) {
        // CORS error when accessing iframe URL
      }
    };

    const urlCheckInterval = setInterval(checkUrlForScore, 5000);
    
    return () => {
      clearInterval(urlCheckInterval);
    };
  }, [scoreDetected]);

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
                Monitoring for score...
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
              setDebugInfo('Iframe loaded - starting score detection');
              console.log('Iframe loaded successfully');
            }}
          />
        </div>
        
        {/* Debug info */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <div className="text-sm">
            <strong className="text-gray-700">Status: </strong>
            <span className={`font-medium ${
              debugInfo.includes('✓') ? 'text-green-600' : 
              debugInfo.includes('✗') ? 'text-red-600' : 
              'text-gray-600'
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
        </div>

        {/* Manual score submission fallback */}
        {!scoreDetected && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> If the score doesn't auto-detect, you can manually submit it through the feedback form.
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigateWithEmail('/feedback')}
            >
              Go to Feedback Form
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleplayViewerPage;