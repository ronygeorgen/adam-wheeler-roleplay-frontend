import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Camera, Monitor } from 'lucide-react';
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

  // Fetch model data if not loaded
  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchModels());
    }
  }, [dispatch, models.length]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ============================
  // 🖥️ SCREEN CAPTURE OCR OPTION
  // ============================
  const handleScreenCaptureOCR = async () => {
    try {
      setIsScanning(true);
      setScanCount((prev) => prev + 1);
      setDebugInfo('📸 Requesting screen capture permission...');

      // Ask permission to capture the screen / tab
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;

      // Wait for metadata to load
      await new Promise((resolve) => (video.onloadedmetadata = resolve));
      await video.play();

      // Create canvas same size as the captured window
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stop capture
      stream.getTracks().forEach((track) => track.stop());

      setDebugInfo('🔍 Running OCR on captured screen...');
      const Tesseract = await import('tesseract.js');
      const { data } = await Tesseract.recognize(canvas, 'eng');

      const extractedText = data.text;
      console.log('📝 OCR from screen capture:', extractedText);
      setDebugInfo(`📝 Text found: "${extractedText.substring(0, 60)}..."`);

      // Find score pattern
      const match = extractedText.match(/Your score was\s*(\d{1,3})%/i);
      if (match) {
        const detectedScore = `${match[1]}%`;
        setDebugInfo(`🎯 SCORE DETECTED: ${detectedScore}`);
        handleScoreSubmission(detectedScore, 'screen_capture');
      } else {
        setDebugInfo('❌ No score pattern found. Capture the result screen clearly.');
      }
    } catch (err) {
      console.error('Screen capture failed:', err);
      setDebugInfo(`❌ Screen capture failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  // ============================
  // SCORE SUBMISSION HANDLER
  // ============================
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
        detection_method: source,
      };

      const response = await axiosInstance.post('/roleplay/scores/submit_score/', submissionData);
      console.log('✅ Score saved to backend:', response.data);
      setDebugInfo(`✅ ${score} successfully recorded!`);
    } catch (error) {
      console.error('Error saving score:', error);
      setDebugInfo(`❌ Failed to save score: ${error.response?.data?.error || error.message}`);
      setScoreDetected(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateWithEmail = (path) => {
    const url = userEmail ? `${path}?email=${encodeURIComponent(userEmail)}` : path;
    navigate(url);
  };

  const model = models.find((m) => m.id === parseInt(modelId));

  // ============================
  // MANUAL SCORE ENTRY
  // ============================
  const ManualScoreInput = () => {
    const [manualScore, setManualScore] = useState('');
    const submitManualScore = () => {
      if (!manualScore) return;
      let scoreValue = manualScore.includes('%') ? manualScore : manualScore + '%';
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
            onKeyPress={(e) => e.key === 'Enter' && submitManualScore()}
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
          <Button onClick={() => navigateWithEmail('/user')}>Back to Library</Button>
        </div>
      </div>
    );
  }

  // ============================
  // PAGE RENDER
  // ============================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigateWithEmail('/user')}>
            Back to Library
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{model.name}</h1>
          <div className="w-48 text-right">
            {scoreDetected ? (
              <div className="text-green-600 text-sm font-medium">
                {isSubmitting ? 'Submitting...' : '✅ Score Recorded'}
              </div>
            ) : isScanning ? (
              <div className="text-orange-600 text-sm font-medium">🔄 Scanning...</div>
            ) : (
              <div className="text-blue-600 text-sm font-medium">
                ⏱️ {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s
              </div>
            )}
          </div>
        </div>

        {/* OCR Scanner Box */}
        <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-purple-800">OCR Score Scanner</h3>
              <p className="text-sm text-purple-600">
                Click "Capture Screen for Score" when you see "Your score was X%"
              </p>
            </div>
            <Button
              onClick={handleScreenCaptureOCR}
              disabled={isScanning || scoreDetected}
              icon={Monitor}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isScanning ? 'Capturing...' : 'Capture Screen for Score'}
            </Button>
          </div>
          {scanCount > 0 && (
            <div className="text-xs text-purple-500 mt-2">Captures performed: {scanCount}</div>
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
            onLoad={() =>
              setDebugInfo('✅ Roleplay loaded - Complete the exercise then click Capture')
            }
          />
        </div>

        {/* Status Panel */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <div className="text-sm">
            <strong className="text-gray-700">Status: </strong>
            <span
              className={`font-medium ${
                debugInfo.includes('🎯') || debugInfo.includes('✅')
                  ? 'text-green-600'
                  : debugInfo.includes('❌')
                  ? 'text-red-600'
                  : debugInfo.includes('🔄') || debugInfo.includes('📸') || debugInfo.includes('🔍')
                  ? 'text-orange-600'
                  : 'text-blue-600'
              }`}
            >
              {debugInfo}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
            <div>
              <strong>User:</strong> {userEmail}
            </div>
            <div>
              <strong>Model:</strong> {model.name}
            </div>
            <div>
              <strong>Time:</strong> {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s
            </div>
            <div>
              <strong>Captures:</strong> {scanCount}
            </div>
          </div>
        </div>

        {/* Manual Fallback */}
        <ManualScoreInput />

        {/* Instructions */}
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-800">
            <strong>📋 Instructions for OCR Scanning:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-2">
              <li>Complete the roleplay exercise in the frame above</li>
              <li>Wait for the result screen showing "Your score was X%"</li>
              <li>Click the <strong>"Capture Screen for Score"</strong> button</li>
              <li>Wait for scanning — may take 10–30 s depending on resolution</li>
              <li>Once detected, your score will auto-submit to backend</li>
            </ol>
            <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
              <strong>💡 Tip:</strong> Make sure the score is clearly visible before capturing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleplayViewerPage;
