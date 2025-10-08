"use client";

export default function AdminSupportPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600 mt-2">View and manage support requests from users</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Support Ticket System</h3>
          <p className="mt-1 text-sm text-gray-500">
            Support ticket viewer and management system coming soon.
          </p>
          <div className="mt-6">
            <div className="text-left space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Contact Form Submissions</h4>
                <p className="text-sm text-gray-600 mt-1">View messages sent through the contact form</p>
                <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">View Messages</button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">User Support Requests</h4>
                <p className="text-sm text-gray-600 mt-1">Manage user-reported issues and feature requests</p>
                <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">View Requests</button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Email Support</h4>
                <p className="text-sm text-gray-600 mt-1">Direct email support and response tracking</p>
                <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">Email Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
