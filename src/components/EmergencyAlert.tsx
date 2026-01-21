import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Mail, X, Send, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "@/hooks/use-toast";
import emailjs from "@emailjs/browser";

interface EmergencyAlertProps {
  isActive: boolean;
  onDismiss: () => void;
  userEmail?: string | null;
  className?: string;
}

const COUNTDOWN_SECONDS = 10;

const EmergencyAlert = ({ isActive, onDismiss, userEmail, className }: EmergencyAlertProps) => {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  
  // EmailJS settings (free tier - 200 emails/month)
  const [serviceId, setServiceId] = useState(() => localStorage.getItem("emailjs_service_id") || "");
  const [templateId, setTemplateId] = useState(() => localStorage.getItem("emailjs_template_id") || "");
  const [publicKey, setPublicKey] = useState(() => localStorage.getItem("emailjs_public_key") || "");

  // Auto-fill with user's email when logged in
  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  // Track if we should auto-send (when countdown reaches 0)
  const [shouldAutoSend, setShouldAutoSend] = useState(false);

  // Ref to hold the latest handleSendEmail function
  const handleSendEmailRef = useRef<() => void>(() => {});

  // Countdown timer logic
  useEffect(() => {
    if (!isActive || showSettings || isPaused || isSending) {
      return;
    }

    if (countdown <= 0) {
      setShouldAutoSend(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isActive, countdown, showSettings, isPaused, isSending]);

  // Handle auto-send when countdown completes
  useEffect(() => {
    if (shouldAutoSend && !isSending) {
      setShouldAutoSend(false);
      handleSendEmailRef.current();
    }
  }, [shouldAutoSend, isSending]);

  // Reset countdown when modal opens
  useEffect(() => {
    if (isActive) {
      setCountdown(COUNTDOWN_SECONDS);
      setIsPaused(false);
      setShouldAutoSend(false);
    }
  }, [isActive]);

  const pauseCountdown = () => {
    setIsPaused(true);
  };

  const resumeCountdown = () => {
    setIsPaused(false);
  };

  const saveSettings = () => {
    localStorage.setItem("emailjs_service_id", serviceId);
    localStorage.setItem("emailjs_template_id", templateId);
    localStorage.setItem("emailjs_public_key", publicKey);
    toast({
      title: "Settings Saved",
      description: "EmailJS settings have been saved locally",
    });
    setShowSettings(false);
  };

  const handleSendEmail = useCallback(async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Check if EmailJS is configured
    if (!serviceId || !templateId || !publicKey) {
      // Fallback to mailto
      const subject = encodeURIComponent("EMERGENCY ALERT - Eye Blink Control System");
      const body = encodeURIComponent(
        `EMERGENCY ALERT!\n\nAn emergency alert has been triggered from the Eye Blink-Based Appliance Control System.\n\nTime: ${new Date().toLocaleString()}\n\nPlease respond immediately.`
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      toast({
        title: "Email Client Opened",
        description: "Configure EmailJS in settings for automatic sending",
      });
      return;
    }

    setIsSending(true);

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: email,
          subject: "EMERGENCY ALERT - Eye Blink Control System",
          message: `EMERGENCY ALERT!\n\nAn emergency alert has been triggered from the Eye Blink-Based Appliance Control System.\n\nTime: ${new Date().toLocaleString()}\n\nPlease respond immediately.`,
          time: new Date().toLocaleString(),
        },
        publicKey
      );

      toast({
        title: "Emergency Email Sent!",
        description: `Alert sent to ${email}`,
      });
      onDismiss();
    } catch (error) {
      console.error("EmailJS error:", error);
      toast({
        title: "Failed to Send",
        description: "Check your EmailJS settings or try mailto fallback",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [email, serviceId, templateId, publicKey, onDismiss]);

  // Keep the ref updated with latest handleSendEmail
  useEffect(() => {
    handleSendEmailRef.current = handleSendEmail;
  }, [handleSendEmail]);

  if (!isActive) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      <div className="relative w-full max-w-md mx-4 p-8 rounded-2xl border-2 border-destructive bg-card animate-emergency-pulse">
        {/* Settings & Close buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-destructive/20 transition-colors"
            title="EmailJS Settings"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={onDismiss}
            className="p-2 rounded-full hover:bg-destructive/20 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {showSettings ? (
          /* Settings Panel */
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold text-foreground mb-4">
              EmailJS Settings (Free)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get free keys at{" "}
              <a
                href="https://www.emailjs.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                emailjs.com
              </a>{" "}
              (200 emails/month free)
            </p>
            <Input
              placeholder="Service ID (e.g., service_xxx)"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="bg-secondary"
            />
            <Input
              placeholder="Template ID (e.g., template_xxx)"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="bg-secondary"
            />
            <Input
              placeholder="Public Key (e.g., xxx)"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              className="bg-secondary"
            />
            <Button onClick={saveSettings} className="w-full">
              Save Settings
            </Button>
            <Button
              onClick={() => setShowSettings(false)}
              variant="outline"
              className="w-full"
            >
              Back
            </Button>
          </div>
        ) : (
          <>
            {/* Alert icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
            </div>

            {/* Title */}
            <h2 className="font-display text-2xl font-bold text-center text-destructive mb-2">
              EMERGENCY ALERT
            </h2>
            <p className="text-center text-muted-foreground mb-4">
              5 blinks detected. Sending alert in:
            </p>

            {/* Countdown Timer */}
            <div className="flex justify-center mb-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="4"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="hsl(var(--destructive))"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 36}
                    strokeDashoffset={2 * Math.PI * 36 * (1 - countdown / COUNTDOWN_SECONDS)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="text-2xl font-bold text-destructive">
                  {isPaused ? "⏸" : countdown}
                </span>
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter emergency contact email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={pauseCountdown}
                  className="pl-10 bg-secondary border-destructive/30 focus:border-destructive"
                />
              </div>

              {userEmail && (
                <p className="text-xs text-center text-success">
                  Auto-filled with your account email
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={isPaused ? resumeCountdown : pauseCountdown}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  variant="danger"
                  className="flex-1"
                  size="lg"
                >
                  {isSending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Now
                    </>
                  )}
                </Button>
              </div>

              {!serviceId && (
                <p className="text-xs text-center text-muted-foreground">
                  Click ⚙️ to configure EmailJS for auto-sending
                </p>
              )}

              <Button
                onClick={onDismiss}
                variant="outline"
                className="w-full border-destructive/50 hover:bg-destructive/10"
              >
                Cancel Alert
              </Button>
            </div>
          </>
        )}

        {/* Pulsing background effect */}
        <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-destructive/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlert;
