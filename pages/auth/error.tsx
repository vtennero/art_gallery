import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'AccessDenied':
        return 'Access denied. You are not authorized to access the admin panel.';
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <>
      <Head>
        <title>Authentication Error - Art Gallery Admin</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Authentication Error
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {getErrorMessage(error as string)}
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <a
                href="/auth/signin"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </a>
            </div>
            
            <div className="text-center">
              <a href="/" className="text-sm text-gray-600 hover:text-gray-500">
                ← Back to Gallery
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
