import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FeedbackDisplayProps {
  audioFeedback?: string;
  screenFeedback?: string;
}

export function FeedbackDisplay({ audioFeedback, screenFeedback }: FeedbackDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Audio Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            {audioFeedback || "No audio feedback available yet"}
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Screen Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            {screenFeedback || "No screen feedback available yet"}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
