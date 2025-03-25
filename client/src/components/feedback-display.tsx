import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FeedbackDisplayProps {
  audioAnalysis?: string;
  screenAnalysis?: string;
}

export function FeedbackDisplay({
  audioAnalysis,
  screenAnalysis
}: FeedbackDisplayProps) {
  return (
    <div className="w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>AI Assistant Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              {audioAnalysis ? (
                <div className="whitespace-pre-wrap">{audioAnalysis}</div>
              ) : (
                "No audio analysis available yet"
              )}
            </ScrollArea>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              {screenAnalysis ? (
                <div className="whitespace-pre-wrap">{screenAnalysis}</div>
              ) : (
                "No screen share analysis available yet"
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}