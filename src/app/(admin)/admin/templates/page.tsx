"use client";

export default function AdminTemplatesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
        <p className="text-gray-600 mt-2">Manage email templates and content</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Template Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            Email template editor and content management system coming soon.
          </p>
          <div className="mt-6">
            <div className="text-left space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Verification Email Template</h4>
                <p className="text-sm text-gray-600 mt-1">Customize the email verification message</p>
                <button
                  onClick={() => alert('Template editor coming soon')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit Template
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Password Reset Template</h4>
                <p className="text-sm text-gray-600 mt-1">Customize the password reset email</p>
                <button
                  onClick={() => alert('Template editor coming soon')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit Template
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Welcome Email Templates</h4>
                <p className="text-sm text-gray-600 mt-1">Starter and Pro plan welcome messages</p>
                <button
                  onClick={() => alert('Template editor coming soon')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit Templates
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
