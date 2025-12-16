import React from 'react'
import toast from 'react-hot-toast'

const baseStyle = {
  color: '#fff',
  padding: '12px 16px',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  minWidth: 240,
  boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
  background: '#10b981'
}

export function showSuccess(message, opts = {}) {
  const toastElement = (
    <div style={{ ...baseStyle, background: '#10b981' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <span>{message}</span>
      </div>
      <button
        onClick={() => toast.dismiss(toastId)}
        style={{
          background: 'transparent',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 16,
          padding: '4px 8px',
          marginLeft: '8px',
          borderRadius: '4px'
        }}
        aria-label="close"
      >
        ✕
      </button>
    </div>
  )
  const toastId = toast.success(toastElement, { duration: opts.duration || 3000 })
  return toastId
}

export function showError(message, opts = {}) {
  const toastElement = (
    <div style={{ ...baseStyle, background: '#ef4444' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <span>{message}</span>
      </div>
      <button
        onClick={() => toast.dismiss(toastId)}
        style={{
          background: 'transparent',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 16,
          padding: '4px 8px',
          marginLeft: '8px',
          borderRadius: '4px'
        }}
        aria-label="close"
      >
        ✕
      </button>
    </div>
  )
  const toastId = toast.error(toastElement, { duration: opts.duration || 4000 })
  return toastId
}
