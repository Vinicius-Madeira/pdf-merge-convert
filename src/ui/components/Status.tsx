import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface StatusProps {
  status: string;
  mergeStatus: string;
}

export function Status({ status, mergeStatus }: StatusProps) {
  if (!status && !mergeStatus) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          {mergeStatus && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Merge</Badge>
              <span className="text-sm text-muted-foreground">
                {mergeStatus}
              </span>
            </div>
          )}
          {status && (
            <div className="flex items-center space-x-2">
              <Badge variant="default">Status</Badge>
              <span className="text-sm text-muted-foreground">{status}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
