import { useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { fetchModels } from '../features/roleplay/roleplaySlice';
import Button from '../components/Button';

const RoleplayViewerPage = () => {
  const { categoryId, modelId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { models } = useSelector((state) => state.roleplay);
  const iframeRef = useRef(null);

  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchModels());
    }
  }, [dispatch, models.length]);

  useEffect(() => {
    // Function to handle messages from iframe
    const handleMessage = (event) => {
      // For security, you might want to verify the origin
      // if (event.origin !== 'https://trusted-domain.com') return;
      
      if (event.data && event.data.type === 'ROLEPLAY_SCORE') {
        console.log('Score received from iframe:', event.data.score);
        // You can also store it in state or send to your backend
        handleScoreSubmission(event.data.score);
      }
    };

    // Listen for messages from iframe
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Function to handle the score (you can modify this to send to your backend)
  const handleScoreSubmission = (score) => {
    console.log('Final score:', score);
    
    // Example: Send to your backend API
    // fetch('/api/roleplay/save-score', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     userEmail,
    //     modelId,
    //     score: score,
    //     timestamp: new Date().toISOString()
    //   })
    // });
  };

  // Helper function to navigate with email parameter
  const navigateWithEmail = (path) => {
    const url = userEmail ? `${path}?email=${encodeURIComponent(userEmail)}` : path;
    navigate(url);
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={model.iframe_code}
            style={{ width: '100%', minHeight: '600px', border: 'none' }}
            title="Roleplay Simulation"
            onLoad={() => {
              // Inject script to monitor for score changes
              injectScoreMonitorScript();
            }}
          />
        </div>
      </div>
    </div>
  );

  // Function to inject script into iframe
  function injectScoreMonitorScript() {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    
    // Create a script element to monitor for score
    const script = iframeDocument.createElement('script');
    script.textContent = `
      (function() {
        // Function to extract score from the page
        function extractScore() {
          const scoreSection = document.querySelector('.score-section');
          if (scoreSection) {
            const text = scoreSection.textContent || scoreSection.innerText;
            const match = text.match(/Your score was\\s*<strong>([^<]+)<\\/strong>/);
            if (match && match[1]) {
              return match[1].trim();
            }
          }
          return null;
        }

        // Monitor for DOM changes (when the score appears)
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
              const score = extractScore();
              if (score) {
                // Send score to parent window
                window.parent.postMessage({
                  type: 'ROLEPLAY_SCORE',
                  score: score
                }, '*');
                
                // Stop observing once we got the score
                observer.disconnect();
              }
            }
          });
        });

        // Start observing
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        // Also check immediately in case score is already there
        setTimeout(function() {
          const score = extractScore();
          if (score) {
            window.parent.postMessage({
              type: 'ROLEPLAY_SCORE',
              score: score
            }, '*');
            observer.disconnect();
          }
        }, 1000);

        // Periodic check as backup
        const interval = setInterval(function() {
          const score = extractScore();
          if (score) {
            window.parent.postMessage({
              type: 'ROLEPLAY_SCORE',
              score: score
            }, '*');
            clearInterval(interval);
            observer.disconnect();
          }
        }, 2000);

        // Stop checking after 30 seconds
        setTimeout(function() {
          clearInterval(interval);
          observer.disconnect();
        }, 30000);
      })();
    `;

    iframeDocument.head.appendChild(script);
  }
};

export default RoleplayViewerPage;