import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

interface BlinkCounterProps {
  count: number;
  isDetecting: boolean;
  lastBlink: number;
  className?: string;
}

const BlinkCounter = ({ count, isDetecting, lastBlink, className }: BlinkCounterProps) => {
  const showBlinkIndicator = Date.now() - lastBlink < 300;

  return (
    <div
      className={cn(
        "relative p-6 rounded-xl border border-primary/30 bg-card/80 backdrop-blur-sm",
        isDetecting && "glow-primary",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-primary" />
        <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
          Blink Detection
        </h3>
        {isDetecting && (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success">Active</span>
          </span>
        )}
      </div>

      {/* Counter Display */}
      <div className="relative flex items-center justify-center py-4">
        <div
          className={cn(
            "text-7xl font-display font-bold text-gradient transition-all duration-200",
            showBlinkIndicator && "animate-blink-indicator"
          )}
        >
          {count}
        </div>
        
        {/* Blink indicator ring */}
        {showBlinkIndicator && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full border-2 border-primary animate-ping opacity-30" />
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-center text-sm text-muted-foreground mt-2">
        Total Blinks Detected
      </p>

      {/* Instructions */}
      <div className="mt-6 pt-4 border-t border-border/50 space-y-2">
        <p className="text-xs text-muted-foreground text-center font-medium uppercase tracking-wider mb-3">
          Blink Commands
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</span>
            <span className="text-muted-foreground">Light ON</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</span>
            <span className="text-muted-foreground">Light OFF</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</span>
            <span className="text-muted-foreground">Fan ON</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">4</span>
            <span className="text-muted-foreground">Fan OFF</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 p-2 rounded-lg bg-destructive/20">
            <span className="w-6 h-6 rounded-full bg-destructive/30 flex items-center justify-center text-destructive font-bold">5</span>
            <span className="text-destructive">Emergency Alert</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlinkCounter;