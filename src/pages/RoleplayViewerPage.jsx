import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Camera, Scan } from 'lucide-react';
import { fetchModels } from '../features/roleplay/roleplaySlice';
import Button from '../components/Button';
import axiosInstance from '../api/axiosInstance';

// Dynamic imports to reduce bundle size
const loadOCR = async () => {
  const { createWorker } = await import('tesseract.js');
  return createWorker('eng');
};

const loadHtml2Canvas = async () => {
  return (await import('html2canvas')).default;
};

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
  const [debugInfo, setDebugInfo] = useState('Starting roleplay session...');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [screenshotData, setScreenshotData] = useState(null);
  const [ocrWorker, setOcrWorker] = useState(null);

  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchModels());
    }
  }, [dispatch, models.length]);

  // Initialize OCR worker
  useEffect(() => {
    const initializeOCR = async () => {
      try {
        setDebugInfo('Initializing OCR engine...');
        const worker = await loadOCR();
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        setOcrWorker(worker);
        setDebugInfo('OCR engine ready');
      } catch (error) {
        console.error('OCR initialization failed:', error);
        setDebugInfo('OCR unavailable - manual input only');
      }
    };

    initializeOCR();

    return () => {
      if (ocrWorker) {
        ocrWorker.terminate();
      }
    };
  }, []);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Function to capture iframe screenshot
  const captureScreenshot = async () => {
    if (!iframeRef.current || !ocrWorker) {
      setDebugInfo('OCR not ready or iframe not loaded');
      return null;
    }

    setIsScanning(true);
    setDebugInfo('Capturing screenshot...');

    try {
      const html2canvas = await loadHtml2Canvas();
      const iframe = iframeRef.current;

      // Wait for iframe to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(iframe, {
        scale: 2, // Higher resolution for better OCR
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: iframe.offsetWidth,
        height: iframe.offsetHeight,
      });

      setScreenshotData(canvas.toDataURL());
      setDebugInfo('Screenshot captured - analyzing text...');
      
      return canvas;
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      setDebugInfo('Screenshot failed - ' + error.message);
      setIsScanning(false);
      return null;
    }
  };

  // Function to perform OCR on screenshot
  const performOCR = async (canvas) => {
    if (!ocrWorker) {
      setDebugInfo('OCR engine not available');
      return null;
    }

    try {
      setDebugInfo('Running OCR analysis...');
      
      const { data } = await ocrWorker.recognize(canvas);
      const extractedText = data.text;
      
      console.log('OCR Extracted Text:', extractedText);
      setDebugInfo(`OCR found: ${extractedText.substring(0, 100)}...`);

      // Look for score patterns in OCR text
      const scorePatterns = [
        /Your score was\s*([0-9]{1,3})%/i,
        /score was\s*([0-9]{1,3})%/i,
        /Score:\s*([0-9]{1,3})%/i,
        /Result:\s*([0-9]{1,3})%/i,
        /([0-9]{1,3})%/
      ];

      for (const pattern of scorePatterns) {
        const match = extractedText.match(pattern);
        if (match) {
          let score = match[1] ? match[1] : match[0].replace('%', '');
          score = `${score}%`;
          setDebugInfo(`🎯 OCR detected score: ${score}`);
          return score;
        }
      }

      setDebugInfo('No score pattern found in OCR text');
      return null;
    } catch (error) {
      console.error('OCR analysis failed:', error);
      setDebugInfo('OCR analysis failed - ' + error.message);
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  // Automated scanning process
  const startAutoScan = async () => {
    if (isScanning || scoreDetected) return;

    setIsScanning(true);
    setDebugInfo('Starting automated score detection...');

    const canvas = await captureScreenshot();
    if (!canvas) {
      setIsScanning(false);
      return;
    }

    const detectedScore = await performOCR(canvas);
    if (detectedScore) {
      handleScoreSubmission(detectedScore, 'ocr-auto');
    } else {
      setDebugInfo('No score detected in this scan');
      setIsScanning(false);
    }
  };

  // Manual scan trigger
  const handleManualScan = async () => {
    await startAutoScan();
  };

  // Automated periodic scanning
  useEffect(() => {
    if (!ocrWorker || scoreDetected || isScanning) return;

    let scanCount = 0;
    const maxScans = 40; // Scan for ~10 minutes (40 * 15 seconds)

    const scanInterval = setInterval(async () => {
      if (scoreDetected || scanCount >= maxScans) {
        clearInterval(scanInterval);
        return;
      }

      scanCount++;
      setDebugInfo(`Auto-scan ${scanCount}/${maxScans}...`);
      
      await startAutoScan();
      
      // Wait a bit before next scan
      await new Promise(resolve => setTimeout(resolve, 5000));
    }, 15000); // Scan every 15 seconds

    return () => clearInterval(scanInterval);
  }, [ocrWorker, scoreDetected, isScanning]);

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
      setDebugInfo(`✓ ${score} successfully recorded via ${source}!`);
      
    } catch (error) {
      console.error('Error saving score:', error);
      setDebugInfo(`✗ Failed to save ${score}. ${error.response?.data?.error || error.message}`);
      setScoreDetected(false); // Allow retry
    } finally {
      setIsSubmitting(false);
      setIsScanning(false);
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
          <strong>Manual Score Entry:</strong> If OCR detection doesn't work:
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
            ) : isScanning ? (
              <div className="text-orange-600 text-sm font-medium">
                <Scan className="w-4 h-4 inline mr-1 animate-pulse" />
                Scanning...
              </div>
            ) : (
              <div className="text-blue-600 text-sm font-medium">
                Session: {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s
              </div>
            )}
          </div>
        </div>

        {/* OCR Controls */}
        <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-800">OCR Score Detection</h3>
              <p className="text-sm text-purple-600">
                Automatically scans for scores using optical character recognition
              </p>
            </div>
            <Button
              onClick={handleManualScan}
              disabled={isScanning || !ocrWorker}
              icon={Camera}
            >
              {isScanning ? 'Scanning...' : 'Scan for Score'}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={model.iframe_code}
            style={{ width: '100%', minHeight: '600px', border: 'none' }}
            title="Roleplay Simulation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setDebugInfo('Roleplay loaded - OCR detection active')}
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
              debugInfo.includes('OCR') ? 'text-purple-600' :
              'text-blue-600'
            }`}>
              {debugInfo}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
            <div><strong>User:</strong> {userEmail}</div>
            <div><strong>Model:</strong> {model.name}</div>
            <div><strong>Session Time:</strong> {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s</div>
            <div><strong>OCR:</strong> {ocrWorker ? 'Ready' : 'Loading...'}</div>
          </div>
        </div>

        {/* Screenshot Preview */}
        {screenshotData && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">Last Screenshot Capture</h4>
            <img 
              src={screenshotData} 
              alt="OCR screenshot" 
              className="max-w-full h-auto border rounded"
            />
          </div>
        )}

        {/* Manual Score Input */}
        <ManualScoreInput />

        {/* Instructions */}
        {!scoreDetected && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-green-800">
              <strong>How OCR Detection Works:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Complete the roleplay exercise above</li>
                <li>OCR automatically scans every 15 seconds for "Your score was X%"</li>
                <li>You can also manually trigger a scan with the button above</li>
                <li>If OCR fails, use the manual input below</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleplayViewerPage;