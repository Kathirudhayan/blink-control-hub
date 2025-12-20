import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import WebcamFeed, { WebcamFeedRef } from "@/components/WebcamFeed";
import BlinkCounter from "@/components/BlinkCounter";
import ApplianceDashboard from "@/components/ApplianceDashboard";
import EmergencyAlert from "@/components/EmergencyAlert";
import { useBlinkDetection } from "@/hooks/useBlinkDetection";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Camera, CameraOff, RotateCcw, Eye, Zap, Shield, LogOut, Loader2 } from "lucide-react";

const BLINK_SEQUENCE_TIMEOUT = 1500; // Time window to count consecutive blinks

const Index = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [lastBlink, setLastBlink] = useState(0);
  const [lightOn, setLightOn] = useState(false);
  const [fanOn, setFanOn] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [sequenceCount, setSequenceCount] = useState(0);

  const webcamRef = useRef<WebcamFeedRef>(null);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Process blink sequences
  const processBlinkSequence = useCallback((count: number) => {
    switch (count) {
      case 1:
        setLightOn(true);
        toast({
          title: "Light Turned ON",
          description: "1 blink detected",
        });
        break;
      case 2:
        setLightOn(false);
        toast({
          title: "Light Turned OFF",
          description: "2 blinks detected",
        });
        break;
      case 3:
        setFanOn(true);
        toast({
          title: "Fan Turned ON",
          description: "3 blinks detected",
        });
        break;
      case 4:
        setFanOn(false);
        toast({
          title: "Fan Turned OFF",
          description: "4 blinks detected",
        });
        break;
      case 5:
        setEmergencyActive(true);
        toast({
          title: "Emergency Alert!",
          description: "5 blinks detected - Emergency mode activated",
          variant: "destructive",
        });
        break;
      default:
        break;
    }
  }, []);

  // Handle individual blink
  const handleBlink = useCallback(() => {
    setBlinkCount((prev) => prev + 1);
    setLastBlink(Date.now());
    
    // Clear existing timeout
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }

    // Increment sequence count
    setSequenceCount((prev) => {
      const newCount = prev + 1;
      
      // Set timeout to process sequence
      sequenceTimeoutRef.current = setTimeout(() => {
        processBlinkSequence(newCount);
        setSequenceCount(0);
      }, BLINK_SEQUENCE_TIMEOUT);

      return newCount;
    });
  }, [processBlinkSequence]);

  const {
    initializeDetector,
    startDetection,
    stopDetection,
    isInitialized,
    isRunning,
    error,
  } = useBlinkDetection({
    onBlink: handleBlink,
    earThreshold: 0.19,
    consecutiveFrames: 2,
  });

  // Initialize detector on mount
  useEffect(() => {
    initializeDetector();
  }, [initializeDetector]);

  const handleVideoReady = useCallback(
    (video: HTMLVideoElement) => {
      const canvas = webcamRef.current?.getCanvas();
      if (canvas && isInitialized) {
        startDetection(video, canvas);
      }
    },
    [isInitialized, startDetection]
  );

  const toggleCamera = useCallback(() => {
    if (cameraActive) {
      stopDetection();
      setCameraActive(false);
    } else {
      setCameraActive(true);
    }
  }, [cameraActive, stopDetection]);

  const resetBlinkCount = useCallback(() => {
    setBlinkCount(0);
    setSequenceCount(0);
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }
    toast({
      title: "Blink Count Reset",
      description: "Counter has been reset to 0",
    });
  }, []);

  const dismissEmergency = useCallback(() => {
    setEmergencyActive(false);
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-gradient">
                  BlinkControl
                </h1>
                <p className="text-xs text-muted-foreground">
                  Eye-Based Appliance Control
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isInitialized ? (
                <span className="flex items-center gap-1.5 text-xs text-success">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  System Ready
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-warning">
                  <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                  Initializing...
                </span>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="icon"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Camera Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Live Camera Feed
              </h2>
              
              {sequenceCount > 0 && (
                <span className="text-sm text-primary animate-pulse">
                  Sequence: {sequenceCount} blink{sequenceCount > 1 ? "s" : ""}...
                </span>
              )}
            </div>

            <WebcamFeed
              ref={webcamRef}
              isActive={cameraActive}
              onVideoReady={handleVideoReady}
              className="aspect-video"
            />

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={toggleCamera}
                variant={cameraActive ? "destructive" : "glow"}
                size="lg"
                disabled={!isInitialized}
                className="flex-1 sm:flex-none"
              >
                {cameraActive ? (
                  <>
                    <CameraOff className="w-5 h-5" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Start Camera
                  </>
                )}
              </Button>

              <Button
                onClick={resetBlinkCount}
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <RotateCcw className="w-5 h-5" />
                Reset Count
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl border border-border bg-card/50">
                <Zap className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-display text-sm font-semibold mb-1">Real-time Detection</h3>
                <p className="text-xs text-muted-foreground">
                  MediaPipe AI processes your eye movements in real-time
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card/50">
                <Eye className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-display text-sm font-semibold mb-1">EAR Algorithm</h3>
                <p className="text-xs text-muted-foreground">
                  Eye Aspect Ratio calculation for precise blink detection
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card/50">
                <Shield className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-display text-sm font-semibold mb-1">Privacy First</h3>
                <p className="text-xs text-muted-foreground">
                  All processing happens locally in your browser
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard */}
          <div className="space-y-6">
            <BlinkCounter
              count={blinkCount}
              isDetecting={isRunning}
              lastBlink={lastBlink}
            />

            <ApplianceDashboard lightOn={lightOn} fanOn={fanOn} />
          </div>
        </div>
      </main>

      {/* Emergency Alert Modal - now with user email */}
      <EmergencyAlert 
        isActive={emergencyActive} 
        onDismiss={dismissEmergency}
        userEmail={user?.email}
      />
    </div>
  );
};

export default Index;
