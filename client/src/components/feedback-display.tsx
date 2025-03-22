import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FeedbackDisplayProps {
  combinedAnalysis?: string;
}

export function FeedbackDisplay({ combinedAnalysis }: FeedbackDisplayProps) {
  return (
    <div className="w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>AI Assistant Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            {combinedAnalysis ? (
              <div className="whitespace-pre-wrap">{combinedAnalysis}</div>
            ) : (
              "No analysis available yet"
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}