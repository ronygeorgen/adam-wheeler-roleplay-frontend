import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Camera } from 'lucide-react';
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
  const [isScanning, setIsScanning] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Roleplay session started');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [scanCount, setScanCount] = useState(0);

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

  // SIMPLIFIED OCR Function - Manual Scan Only
  const handleScanForScore = async () => {
    if (isScanning || !iframeRef.current) {
      setDebugInfo('Already scanning or iframe not ready');
      return;
    }

    setIsScanning(true);
    setScanCount(prev => prev + 1);
    setDebugInfo('🔄 Capturing screenshot...');

    try {
      // Dynamically import libraries only when needed
      const { default: html2canvas } = await import('html2canvas');
      const { createWorker } = await import('tesseract.js');

      const iframe = iframeRef.current;
      
      // Capture screenshot of the iframe
      setDebugInfo('📸 Taking screenshot...');
      const canvas = await html2canvas(iframe, {
        scale: 1.5, // Good balance of quality vs performance
        useCORS: true,
        logging: false,
        width: iframe.offsetWidth,
        height: iframe.offsetHeight,
      });

      setDebugInfo('🔍 Analyzing text with OCR...');
      
      // Initialize OCR worker
      const worker = await createWorker('eng');
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      // Perform OCR on the screenshot
      const { data } = await worker.recognize(canvas);
      const extractedText = data.text;
      
      console.log('📝 OCR Extracted Text:', extractedText);
      
      // Terminate worker to free memory
      await worker.terminate();

      // Look for score patterns - SIMPLIFIED
      const scoreMatch = extractedText.match(/Your score was\s*(\d{1,3})%/i);
      
      if (scoreMatch && scoreMatch[1]) {
        const score = `${scoreMatch[1]}%`;
        setDebugInfo(`🎯 SCORE DETECTED: ${score}`);
        handleScoreSubmission(score, 'ocr');
      } else {
        // Fallback: Look for any percentage that might be the score
        const fallbackMatch = extractedText.match(/(\d{1,3})%/);
        if (fallbackMatch && fallbackMatch[1]) {
          const possibleScore = `${fallbackMatch[1]}%`;
          setDebugInfo(`🤔 Possible score found: ${possibleScore} - Please verify`);
          // Don't auto-submit fallback matches
        } else {
          setDebugInfo('❌ No score found in screenshot. Try again or enter manually.');
        }
      }

    } catch (error) {
      console.error('OCR Scan failed:', error);
      setDebugInfo(`❌ Scan failed: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
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
        last_name: 'Roleplay',
        detection_method: source
      };

      const response = await axiosInstance.post('/roleplay/scores/submit_score/', submissionData);
      
      console.log('Score saved to backend:', response.data);
      setDebugInfo(`✅ ${score} successfully recorded!`);
      
    } catch (error) {
      console.error('Error saving score:', error);
      setDebugInfo(`❌ Failed to save score: ${error.response?.data?.error || error.message}`);
      setScoreDetected(false);
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
          <strong>Manual Score Entry:</strong> If OCR doesn't work, enter score manually:
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
                {isSubmitting ? 'Submitting...' : '✅ Score Recorded'}
              </div>
            ) : isScanning ? (
              <div className="text-orange-600 text-sm font-medium">
                🔄 Scanning...
              </div>
            ) : (
              <div className="text-blue-600 text-sm font-medium">
                ⏱️ {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s
              </div>
            )}
          </div>
        </div>

        {/* OCR Scan Button - ALWAYS VISIBLE */}
        <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-800">OCR Score Scanner</h3>
              <p className="text-sm text-purple-600">
                Click to scan for "Your score was X%" text
              </p>
            </div>
            <Button
              onClick={handleScanForScore}
              disabled={isScanning || scoreDetected}
              icon={Camera}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isScanning ? 'Scanning...' : 'Scan for Score'}
            </Button>
          </div>
          {scanCount > 0 && (
            <div className="text-xs text-purple-500 mt-2">
              Scans performed: {scanCount}
            </div>
          )}
        </div>

        {/* Roleplay Iframe */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={model.iframe_code}
            style={{ width: '100%', minHeight: '600px', border: 'none' }}
            title="Roleplay Simulation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setDebugInfo('✅ Roleplay loaded - Click "Scan for Score" when finished')}
          />
        </div>
        
        {/* Status Panel */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <div className="text-sm">
            <strong className="text-gray-700">Status: </strong>
            <span className={`font-medium ${
              debugInfo.includes('🎯') || debugInfo.includes('✅') ? 'text-green-600' : 
              debugInfo.includes('❌') ? 'text-red-600' : 
              debugInfo.includes('🔄') || debugInfo.includes('🔍') ? 'text-orange-600' :
              'text-blue-600'
            }`}>
              {debugInfo}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
            <div><strong>User:</strong> {userEmail}</div>
            <div><strong>Model:</strong> {model.name}</div>
            <div><strong>Time:</strong> {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s</div>
            <div><strong>Scans:</strong> {scanCount}</div>
          </div>
        </div>

        {/* Manual Score Input */}
        <ManualScoreInput />

        {/* Instructions */}
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-800">
            <strong>How to use OCR Scanner:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Complete the roleplay exercise above</li>
              <li>Wait for the score to appear as "Your score was X%"</li>
              <li>Click the <strong>"Scan for Score"</strong> purple button above</li>
              <li>The system will capture a screenshot and detect your score automatically</li>
              <li>If OCR fails, use the manual input below</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleplayViewerPage;