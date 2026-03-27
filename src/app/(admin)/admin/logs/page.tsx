"use client";

export default function AdminLogsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Activity Logs</h1>
        <p className="text-on-surface-variant mt-2">View system logs and audit trail for admin actions</p>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-outline-variant/30 p-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-on-surface-variant/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-on-surface">Activity Logging System</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Activity logging and audit trail system coming soon.
          </p>
          <div className="mt-6">
            <div className="text-left space-y-4">
              <div className="border border-outline-variant/30 rounded-lg p-4">
                <h4 className="font-medium text-on-surface">Admin Actions</h4>
                <p className="text-sm text-on-surface-variant mt-1">Track admin actions like plan changes, user modifications</p>
                <button
                  onClick={() => alert('Admin logs coming soon')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Admin Logs
                </button>
              </div>
              <div className="border border-outline-variant/30 rounded-lg p-4">
                <h4 className="font-medium text-on-surface">User Activity</h4>
                <p className="text-sm text-on-surface-variant mt-1">Monitor user signups, logins, and key actions</p>
                <button
                  onClick={() => alert('User logs coming soon')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  View User Logs
                </button>
              </div>
              <div className="border border-outline-variant/30 rounded-lg p-4">
                <h4 className="font-medium text-on-surface">System Events</h4>
                <p className="text-sm text-on-surface-variant mt-1">System-level events and error tracking</p>
                <button
                  onClick={() => alert('System logs coming soon')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  View System Logs
                </button>
              </div>
              <div className="border border-outline-variant/30 rounded-lg p-4">
                <h4 className="font-medium text-on-surface">Email Logs</h4>
                <p className="text-sm text-on-surface-variant mt-1">Track email sending, delivery status, and failures</p>
                <button
                  onClick={() => alert('Email logs coming soon')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Email Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
