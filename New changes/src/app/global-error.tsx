'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-destructive">
                Something Went Wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && (
                <div className="rounded-md bg-muted p-4 text-left text-xs text-muted-foreground">
                  <p className="font-semibold">Error Details:</p>
                  <pre className="mt-2 whitespace-pre-wrap font-code">
                    {error.message}
                  </pre>
                  {error.digest && (
                    <p className="mt-2">
                      <strong>Digest:</strong> {error.digest}
                    </p>
                  )}
                </div>
              )}
              <Button onClick={() => reset()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
