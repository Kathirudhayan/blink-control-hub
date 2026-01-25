import { cn } from "@/lib/utils";
import { Lightbulb, Fan, AlertTriangle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface HistoryEvent {
  id: string;
  type: "light_on" | "light_off" | "fan_on" | "fan_off" | "emergency";
  timestamp: Date;
}

interface HistoryLogProps {
  events: HistoryEvent[];
  className?: string;
}

const getEventDetails = (type: HistoryEvent["type"]) => {
  switch (type) {
    case "light_on":
      return { icon: Lightbulb, label: "Light ON", color: "text-yellow-500", bg: "bg-yellow-500/10" };
    case "light_off":
      return { icon: Lightbulb, label: "Light OFF", color: "text-muted-foreground", bg: "bg-muted/50" };
    case "fan_on":
      return { icon: Fan, label: "Fan ON", color: "text-blue-500", bg: "bg-blue-500/10" };
    case "fan_off":
      return { icon: Fan, label: "Fan OFF", color: "text-muted-foreground", bg: "bg-muted/50" };
    case "emergency":
      return { icon: AlertTriangle, label: "Emergency Alert", color: "text-destructive", bg: "bg-destructive/10" };
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const HistoryLog = ({ events, className }: HistoryLogProps) => {
  return (
    <div className={cn("rounded-xl border border-border bg-card/50 p-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">Activity History</h3>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No activity yet. Start the camera to begin tracking.
        </p>
      ) : (
        <ScrollArea className="h-[200px] pr-2">
          <div className="space-y-2">
            {events.map((event) => {
              const details = getEventDetails(event.type);
              const Icon = details.icon;
              return (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg",
                    details.bg
                  )}
                >
                  <Icon className={cn("w-4 h-4", details.color)} />
                  <span className={cn("text-sm font-medium flex-1", details.color)}>
                    {details.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default HistoryLog;
