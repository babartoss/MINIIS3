import { type ReactElement } from "react";
import { BaseError, UserRejectedRequestError } from "viem";

// Render error UI (dùng cho transaction fail)
export function renderError(error: unknown): ReactElement | null {
  if (!error) return null;
  
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError
    );

    if (isUserRejection) {
      return (
        <div className="mt-2 p-2 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="font-semibold text-red-500 mb-1">User Rejection</div>
          <div>Transaction was rejected by user.</div>
        </div>
      );
    }
  }
  
  let errorMessage: string;
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null && 'error' in error) {
    errorMessage = String(error.error);
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'Unknown error occurred';
  }

  return (
    <div className="mt-2 p-2 text-xs overflow-x-scroll bg-gray-100 dark:bg-gray-800 rounded-lg font-mono">
      <div className="font-semibold text-red-500 mb-1">Error</div>
      <div className="whitespace-pre-wrap break-words">{errorMessage}</div>
    </div>
  );
}