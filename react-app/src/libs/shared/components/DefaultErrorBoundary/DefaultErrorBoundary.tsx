import type { FallbackProps } from "react-error-boundary";
import { Button } from "../Button/Button";
import "./DefaultErrorBoundary.css";

export const DefaultErrorBoundary = ({ error, resetErrorBoundary }: FallbackProps) => {
    return (
        <div className="error-boundary">
            <div className="error-boundary__card">
                <h2 className="error-boundary__title">Er is iets misgegaan</h2>
                <p className="error-boundary__description">
                    Er is een onverwachte fout opgetreden. Probeer het opnieuw of neem contact op
                    met de beheerder als het probleem aanhoudt.
                </p>
                {error instanceof Error && error.message && (
                    <pre className="error-boundary__details">{error.message}</pre>
                )}
                <Button
                    type="button"
                    buttonStyle="filled"
                    onClick={resetErrorBoundary}
                >
                    Probeer opnieuw
                </Button>
            </div>
        </div>
    );
};
