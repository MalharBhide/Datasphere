import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'

export function OverviewPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
          <svg
            className="w-9 h-9 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to Datasphere
        </h1>

        {/* Description */}
        <p className="text-base text-gray-500 leading-relaxed mb-8">
          Datasphere is a browser-based data workspace for inspecting and
          cleaning datasets. Upload a CSV or Excel file, detect quality issues
          such as missing values, duplicates, and inconsistent formatting, then
          apply targeted cleaning operations and download the corrected file —
          all without leaving your browser.
        </p>

        {/* CTA */}
        <Button
          size="lg"
          onClick={() => navigate('/clean')}
          className="mx-auto"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Start Cleaning Data
        </Button>

        {/* Quick feature list */}
        <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {[
            'Upload CSV or XLSX files',
            'Detect 6 types of data quality issues',
            'Apply targeted cleaning operations',
            'Preview before-and-after changes',
            'Download cleaned files',
            'No data leaves your browser',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
              <svg
                className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
