import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Mail, X, Send } from "lucide-react";
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

const EmergencyAlert = ({ isActive, onDismiss, userEmail, className }: EmergencyAlertProps) => {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Ref to hold the latest handleSendEmail function
  const handleSendEmailRef = useRef<() => void>(() => {});

  // Auto-fill with user's email when logged in
  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  // Send email immediately when alert becomes active
  useEffect(() => {
    if (isActive && !emailSent && !isSending && email) {
      handleSendEmailRef.current();
    }
  }, [isActive, emailSent, isSending, email]);

  // Reset state when modal opens
  useEffect(() => {
    if (isActive) {
      setEmailSent(false);
    }
  }, [isActive]);

  const handleSendEmail = useCallback(async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const templateParams = {
        to_email: email,
        time: new Date().toLocaleString(),
        alert_type: "Emergency Blink Signal (5 consecutive blinks)",
        system_name: "BlinkControl - Eye Blink-Based Appliance Control",
        message: `EMERGENCY ALERT triggered at ${new Date().toLocaleString()}. The user has blinked 5 times in rapid succession, indicating they may need immediate assistance. Please contact them immediately to check on their wellbeing.`,
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      toast({
        title: "Emergency Email Sent!",
        description: `Alert sent to ${email}`,
      });
      setEmailSent(true);
    } catch (error: any) {
      console.error("Email error:", error);
      toast({
        title: "Failed to Send",
        description: error.text || error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [email]);

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
        {/* Close button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onDismiss}
            className="p-2 rounded-full hover:bg-destructive/20 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

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
          {isSending ? "Sending emergency email..." : emailSent ? "Email sent!" : "5 blinks detected - Sending alert..."}
        </p>

        {/* Email input */}
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter emergency contact email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-secondary border-destructive/30 focus:border-destructive"
              disabled={isSending}
            />
          </div>

          {userEmail && (
            <p className="text-xs text-center text-success">
              Auto-filled with your account email
            </p>
          )}

          <Button
            onClick={handleSendEmail}
            disabled={isSending}
            variant="danger"
            className="w-full"
            size="lg"
          >
            {isSending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4" />
                {emailSent ? "Resend Email" : "Send Now"}
              </>
            )}
          </Button>

          <Button
            onClick={onDismiss}
            variant="outline"
            className="w-full border-destructive/50 hover:bg-destructive/10"
          >
            {emailSent ? "Close" : "Cancel Alert"}
          </Button>
        </div>

        {/* Pulsing background effect */}
        <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-destructive/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlert;
