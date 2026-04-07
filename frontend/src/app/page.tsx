'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  Scan, 
  AlertCircle, 
  Loader2, 
  Download,
  RefreshCw,
  Camera,
  Maximize2,
  Cpu
} from 'lucide-react';

interface DetectionResult {
  faces: number;
  confidence: number[];
  processedImage?: string;
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

  const BACKEND_URL = 'http://127.0.0.1:5000';

  const resetDetection = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setDetectionResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
      
      if (!response.ok) throw new Error(`Neural engine offline`);
      
      const result: DetectionResult = await response.json();
      setDetectionResult(result);
      setProcessedImage(result.processedImage || selectedImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsDetecting(false);
    }
  };

  const startWebcam = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      setIsStreaming(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err) {
      setError('Camera access denied.');
    }
  };

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setSelectedImage(canvas.toDataURL('image/jpeg', 0.95));
        stopWebcam();
        setActiveTab('upload');
      }
    }
  }, [stopWebcam]);

  useEffect(() => { return () => stopWebcam(); }, [stopWebcam]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-4 md:p-10 transition-colors duration-500">
      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Adaptive Multi-Scale AI</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Vision Engine v4</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="h-8 px-4 rounded-full border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 shadow-sm text-[10px] font-bold uppercase tracking-widest">
            Mode: MTCNN Neural Pyramid
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <Card className="border-none shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem]">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if(v !== 'webcam') stopWebcam(); }}>
            <div className="border-b px-8 pt-6 bg-slate-50/50 dark:bg-slate-800/10">
              <TabsList className="bg-transparent gap-8 h-12">
                <TabsTrigger value="upload" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none bg-transparent px-0 pb-4 shadow-none font-bold text-sm">
                  Image Analysis
                </TabsTrigger>
                <TabsTrigger value="webcam" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none bg-transparent px-0 pb-4 shadow-none font-bold text-sm">
                  Live Stream
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-8">
              <TabsContent value="upload" className="mt-0 outline-none">
                {!selectedImage ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-24 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-50/20 transition-all duration-300"
                  >
                    <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileUpload} />
                    <div className="bg-slate-100 dark:bg-slate-800 h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                      <Upload className="h-8 w-8 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Load Target Visuals</h3>
                    <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto text-balance font-medium">Any resolution supported. MTCNN scans multiple scales for hidden faces.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    <div className="w-full flex justify-center bg-slate-100/50 dark:bg-black/30 rounded-[2.5rem] p-6 border dark:border-slate-800 shadow-inner">
                      <div className="relative inline-block overflow-hidden rounded-2xl shadow-2xl bg-slate-950">
                        <img 
                          src={processedImage || selectedImage} 
                          className="w-auto h-auto max-w-full max-h-[65vh] block mx-auto" 
                          style={{ imageRendering: 'pixelated' }} 
                          alt="Neural Scan Result" 
                        />
                        {isDetecting && (
                          <div className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-400 mb-4" />
                            <span className="text-white text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Scanning Pyramids</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 px-4 pb-4">
                      <div className="flex gap-4">
                        {!processedImage ? (
                          <Button onClick={detectFaces} disabled={isDetecting} className="bg-blue-600 hover:bg-blue-700 text-white px-12 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20">
                            <Scan className="mr-2 h-5 w-5" /> Execute Neural Scan
                          </Button>
                        ) : (
                          <>
                            <Button onClick={() => { const a = document.createElement('a'); a.href = processedImage!; a.download = 'ai-scan.jpg'; a.click(); }} variant="outline" className="rounded-2xl h-14 px-8 border-slate-200 dark:border-slate-700 font-bold">
                              <Download className="mr-2 h-5 w-5" /> Export Data
                            </Button>
                            <Button onClick={resetDetection} variant="ghost" className="rounded-2xl h-14 px-8 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 font-bold">
                              <RefreshCw className="mr-2 h-5 w-5" /> Flush
                            </Button>
                          </>
                        )}
                      </div>

                      {detectionResult && (
                        <div className="flex items-center gap-10 bg-white dark:bg-slate-950 border dark:border-slate-800 p-5 px-10 rounded-[1.5rem] shadow-sm">
                          <div className="flex flex-col text-center">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Entities</span>
                            <span className="text-3xl font-black text-blue-600 leading-none">{detectionResult.faces}</span>
                          </div>
                          <div className="w-px h-10 bg-slate-100 dark:bg-slate-800" />
                          <div className="flex flex-col text-center">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Max Conf</span>
                            <span className="text-3xl font-black text-blue-600 leading-none">
                              {detectionResult.confidence.length > 0 ? (Math.max(...detectionResult.confidence) * 100).toFixed(0) : 0}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="webcam" className="mt-0 outline-none">
                <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-950 aspect-video shadow-2xl flex items-center justify-center border-[8px] border-slate-50 dark:border-slate-800">
                  {!isStreaming ? (
                    <div className="text-center">
                      <div className="h-20 w-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Camera className="h-8 w-8 text-slate-700" />
                      </div>
                      <Button onClick={startWebcam} className="bg-blue-600 rounded-2xl px-12 h-14 font-black text-xs uppercase tracking-widest">Enable Cam</Button>
                    </div>
                  ) : (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale brightness-75" />
                      <div className="absolute bottom-10 flex justify-center w-full">
                        <button onClick={captureFrame} className="h-24 w-24 rounded-full bg-white/10 backdrop-blur-md border-4 border-white/20 flex items-center justify-center group hover:scale-105 transition-all">
                          <div className="h-16 w-16 rounded-full bg-white group-active:scale-90 transition-transform" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {error && (
          <Alert variant="destructive" className="mt-8 border-none bg-red-50 text-red-600 p-6 rounded-3xl">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-black uppercase tracking-widest text-xs mb-1">Process Halted</AlertTitle>
            <AlertDescription className="font-bold">{error}</AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}