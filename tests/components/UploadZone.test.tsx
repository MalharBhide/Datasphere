import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UploadZone } from '../../src/features/cleaning/components/UploadZone'

describe('UploadZone', () => {
  it('renders the upload area', () => {
    render(
      <UploadZone
        onFileSelected={vi.fn()}
        onSampleRequested={vi.fn()}
        isLoading={false}
        error={null}
      />,
    )
    expect(screen.getByText(/Drag & drop a file here/i)).toBeInTheDocument()
    expect(screen.getByText(/Try Sample Dataset/i)).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    render(
      <UploadZone
        onFileSelected={vi.fn()}
        onSampleRequested={vi.fn()}
        isLoading={true}
        error={null}
      />,
    )
    expect(screen.getByText(/Parsing file/i)).toBeInTheDocument()
  })

  it('displays an error message when provided', () => {
    render(
      <UploadZone
        onFileSelected={vi.fn()}
        onSampleRequested={vi.fn()}
        isLoading={false}
        error="Unsupported file type. Please upload a CSV or XLSX file."
      />,
    )
    expect(
      screen.getByText(/Unsupported file type/i),
    ).toBeInTheDocument()
  })

  it('calls onSampleRequested when the sample button is clicked', () => {
    const onSample = vi.fn()
    render(
      <UploadZone
        onFileSelected={vi.fn()}
        onSampleRequested={onSample}
        isLoading={false}
        error={null}
      />,
    )
    fireEvent.click(screen.getByText(/Try Sample Dataset/i))
    expect(onSample).toHaveBeenCalledOnce()
  })

  it('disables the sample button when loading', () => {
    render(
      <UploadZone
        onFileSelected={vi.fn()}
        onSampleRequested={vi.fn()}
        isLoading={true}
        error={null}
      />,
    )
    const btn = screen.getByRole('button', { name: /Try Sample Dataset/i })
    expect(btn).toBeDisabled()
  })
})
