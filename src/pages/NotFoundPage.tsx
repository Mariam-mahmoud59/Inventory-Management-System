import { Button } from '@/components/ui/button';
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';

export function NotFoundPage() {
    const navigate = useNavigate();
    const error = useRouteError();

    let title = "Page Not Found";
    let message = "The page you are looking for doesn't exist or has been moved.";
    let is404 = true;

    if (error) {
        if (isRouteErrorResponse(error)) {
            if (error.status !== 404) {
                is404 = false;
                title = `Error ${error.status}`;
                message = error.statusText;
            }
        } else if (error instanceof Error) {
            is404 = false;
            title = "Application Error";
            message = error.message;
        } else {
            is404 = false;
            title = "Unknown Error";
            message = String(error);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <h1 className="text-6xl font-bold text-muted-foreground">{is404 ? '404' : 'Oops!'}</h1>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="text-muted-foreground max-w-[600px] break-words">
                {message}
            </p>
            {!is404 && error !== undefined && error !== null ? (
                <pre className="text-left bg-muted p-4 rounded text-xs overflow-auto max-w-[80vw] whitespace-pre-wrap">
                    {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
                </pre>
            ) : null}
            <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
    );
}
