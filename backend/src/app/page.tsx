'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Camera, 
  Scan, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Download,
  RefreshCw,
  Image as ImageIcon,
  Video,
  Zap,
  Shield,
  Clock
} from 'lucide-react';

interface DetectionResult {
  faces: number;
  confidence: number[];
  boundingBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  processedImage?: string;
  error?: string;
}

export default function FaceDetectionApp() {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Backend URL - Change this to your Python backend URL
  const BACKEND_URL = 'http://localhost:5000';

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setProcessedImage(null);
        setDetectionResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setProcessedImage(null);
        setDetectionResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please drop a valid image file');
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // Detect faces using Python backend
  const detectFaces = async () => {
    if (!selectedImage) return;
    
    setIsDetecting(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selectedImage })
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect to face detection service. Make sure your Python backend is running.');
      }
      
      const result: DetectionResult = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setDetectionResult(result);
      setProcessedImage(result.processedImage || selectedImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect faces. Please try again.');
    } finally {
      setIsDetecting(false);
    }
  };

  // Start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
      setError(null);
    } catch {
      setError('Unable to access webcam. Please check permissions.');
    }
  };

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Capture frame from webcam
  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setSelectedImage(imageData);
        stopWebcam();
        setActiveTab('upload');
      }
    }
  }, [stopWebcam]);

  // Download processed image
  const downloadImage = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.download = 'face-detection-result.jpg';
      link.href = processedImage;
      link.click();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  // Reset all
  const resetDetection = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setDetectionResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Scan className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">FaceDetect AI</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">OpenCV-Powered Detection</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex gap-1 px-3 py-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs">Ready</span>
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            AI-Powered Face Detection
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            Detect Faces with Precision
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Upload an image or use your webcam to detect faces using OpenCV and Deep Learning algorithms.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Fast Detection</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Process images in milliseconds</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">High Accuracy</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Deep learning powered models</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Real-time</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Live webcam detection</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detection Interface */}
        <Card className="bg-white dark:bg-slate-900 shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-emerald-600" />
              Detection Interface
            </CardTitle>
            <CardDescription>
              Choose an input method to start detecting faces
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Upload Image
                </TabsTrigger>
                <TabsTrigger value="webcam" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Use Webcam
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload" className="space-y-6">
                {!selectedImage ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-slate-50 dark:bg-slate-800/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Drop your image here
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      or click to browse from your device
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Supports: JPG, PNG, WEBP (Max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Image Preview */}
                    <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={processedImage || selectedImage}
                        alt="Selected"
                        className="w-full max-h-[500px] object-contain mx-auto"
                      />
                      {isDetecting && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center">
                            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mx-auto mb-3" />
                            <p className="font-medium text-slate-700 dark:text-slate-300">Detecting faces...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detection Results */}
                    {detectionResult && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                            Detection Complete
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-white dark:bg-slate-800">
                            <CardContent className="p-4 text-center">
                              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                {detectionResult.faces}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Faces Detected</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-white dark:bg-slate-800">
                            <CardContent className="p-4 text-center">
                              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {detectionResult.confidence.length > 0 
                                  ? (detectionResult.confidence.reduce((a, b) => a + b, 0) / detectionResult.confidence.length * 100).toFixed(1)
                                  : 0}%
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Avg Confidence</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-white dark:bg-slate-800">
                            <CardContent className="p-4 text-center">
                              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                {detectionResult.boundingBoxes.length}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Bounding Boxes</p>
                            </CardContent>
                          </Card>
                        </div>
                        
                        {/* Confidence Breakdown */}
                        {detectionResult.confidence.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Confidence per Face
                            </Label>
                            {detectionResult.confidence.map((conf, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <span className="text-sm text-slate-500 dark:text-slate-400 w-16">Face {idx + 1}</span>
                                <Progress value={conf * 100} className="flex-1 h-2" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-12">
                                  {(conf * 100).toFixed(0)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 justify-center">
                      {!detectionResult ? (
                        <Button
                          onClick={detectFaces}
                          disabled={isDetecting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                        >
                          {isDetecting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Detecting...
                            </>
                          ) : (
                            <>
                              <Scan className="h-4 w-4 mr-2" />
                              Detect Faces
                            </>
                          )}
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={downloadImage}
                            variant="outline"
                            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Result
                          </Button>
                          <Button
                            onClick={resetDetection}
                            variant="outline"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            New Image
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Webcam Tab */}
              <TabsContent value="webcam" className="space-y-6">
                <div className="relative rounded-xl overflow-hidden bg-slate-900">
                  {!isStreaming ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Camera className="h-16 w-16 text-slate-500 mb-4" />
                      <p className="text-slate-400 mb-4">Webcam is not active</p>
                      <Button
                        onClick={startWebcam}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Webcam
                      </Button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-h-[500px] object-contain"
                      />
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                        <Button
                          onClick={captureFrame}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capture
                        </Button>
                        <Button
                          onClick={stopWebcam}
                          variant="destructive"
                        >
                          Stop
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  Position your face in the frame and click capture to detect faces
                </p>
              </TabsContent>
            </Tabs>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="mt-10 bg-white dark:bg-slate-900 shadow-xl border-0">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
            <CardTitle>🔧 Backend Setup Required</CardTitle>
            <CardDescription>
              Follow the steps below to set up your Python backend with OpenCV
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Before You Start</AlertTitle>
              <AlertDescription>
                This frontend requires a Python backend to detect faces. Follow the setup guide in the 
                <code className="mx-1 px-1 bg-slate-100 dark:bg-slate-800 rounded">BACKEND_SETUP.md</code> 
                file to get your backend running.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 dark:text-white">Quick Start:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>Install Python 3.8+ on your laptop</li>
                <li>Create a project folder and virtual environment</li>
                <li>Install required packages: <code className="px-1 bg-slate-100 dark:bg-slate-800 rounded">pip install opencv-python flask flask-cors numpy</code></li>
                <li>Create the backend script (see BACKEND_SETUP.md)</li>
                <li>Run: <code className="px-1 bg-slate-100 dark:bg-slate-800 rounded">python app.py</code></li>
                <li>Backend will run on <code className="px-1 bg-slate-100 dark:bg-slate-800 rounded">http://localhost:5000</code></li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Face Detection using OpenCV in Python - Internship Project
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                OpenCV
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Python
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Next.js
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
