import React from 'react'
import toast from 'react-hot-toast'

export const closeAction = (t) => (
  <button
    onClick={() => toast.dismiss(t.id)}
    style={{
      background: 'transparent',
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      padding: 0,
      marginLeft: '12px'
    }}
    aria-label="close"
  >
    ✕
  </button>
)
