import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

const SampattiBot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Persistence: Load from LocalStorage
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('sampatti_chat_history')
    return saved
      ? JSON.parse(saved)
      : [
          { role: 'model', text: 'Hi! I am Sampatti AI. How can I help with your finances today?' }
        ]
  })

  const [dimensions, setDimensions] = useState({ width: 384, height: 500 })
  const [isResizing, setIsResizing] = useState(false)
  const scrollRef = useRef(null)

  // FIX: Auto-scroll to bottom whenever messages or window state changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [messages, isOpen, loading])

  useEffect(() => {
    localStorage.setItem('sampatti_chat_history', JSON.stringify(messages))
  }, [messages])

  // Responsive Resizing Logic
  useEffect(() => {
    const stopResizing = () => setIsResizing(false)
    const resize = (e) => {
      if (!isResizing || window.innerWidth < 768) return
      const newWidth = Math.min(window.innerWidth - 40, window.innerWidth - e.clientX - 24)
      const newHeight = Math.min(window.innerHeight - 100, window.innerHeight - e.clientY - 80)
      setDimensions({
        width: Math.max(300, newWidth),
        height: Math.max(400, newHeight)
      })
    }

    if (isResizing) {
      window.addEventListener('mousemove', resize)
      window.addEventListener('mouseup', stopResizing)
    }
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [isResizing])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', text: input }
    const currentInput = input
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const history = messages.filter((_, index) => index !== 0).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }))

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('authToken')
        },
        body: JSON.stringify({ message: currentInput, chatHistory: history })
      })
      const data = await response.json()
      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', text: data.reply }])
      }
    } catch (error) {
      console.error('Chat Error:', error)
      setMessages(prev => [...prev, { role: 'model', text: 'Connection error.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    const defaultMsg = [{ role: 'model', text: 'Hi! I am Sampatti AI. How can I help with your finances today?' }]
    setMessages(defaultMsg)
    localStorage.removeItem('sampatti_chat_history')
  }

  return (
    <div className='fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 font-sans flex flex-col items-end'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='bg-blue-600 hover:bg-blue-700 text-white p-3 md:p-4 rounded-full shadow-lg transition-all flex items-center gap-2'
      >
        {isOpen ? '✖' : '💬 AI Assistant'}
      </button>

      {isOpen && (
        <div
          className='absolute bottom-16 right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-w-[95vw]'
          style={{
            width: window.innerWidth < 768 ? 'calc(100vw - 32px)' : `${dimensions.width}px`,
            height: window.innerWidth < 768 ? '60vh' : `${dimensions.height}px`
          }}
        >
          {/* Resize Handle (Desktop Only) */}
          <div
            onMouseDown={() => setIsResizing(true)}
            className='hidden md:flex absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-10 items-center justify-center group'
          >
            <div className='w-4 h-4 border-l-2 border-t-2 border-gray-300 group-hover:border-blue-400' />
          </div>

          <div className='bg-blue-600 p-3 md:p-4 text-white font-bold flex justify-between items-center select-none'>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
              <span className='text-sm md:text-base'>Sampatti AI</span>
            </div>
            <button onClick={clearChat} className='text-[10px] bg-blue-700 hover:bg-red-500 px-2 py-1 rounded transition-all uppercase'>Reset</button>
          </div>

          <div className='flex-1 overflow-y-auto p-3 md:p-4 space-y-4 bg-gray-50 flex flex-col'>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className='bg-white border w-fit p-2 px-3 rounded-xl flex gap-1 animate-pulse'>
                <div className='w-1.5 h-1.5 bg-gray-400 rounded-full' />
                <div className='w-1.5 h-1.5 bg-gray-400 rounded-full' />
                <div className='w-1.5 h-1.5 bg-gray-400 rounded-full' />
              </div>
            )}
            <div ref={scrollRef} className='pt-2' />
          </div>

          <div className='p-3 border-t border-gray-100 flex items-end gap-2 bg-white'>
            <textarea
              rows='1'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Type a message...'
              className='flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
              style={{ minHeight: '40px', maxHeight: '100px' }}
            />
            <button onClick={sendMessage} className='bg-blue-600 text-white p-2.5 rounded-full shadow-md transition-transform active:scale-95'>
              <svg viewBox='0 0 24 24' className='w-5 h-5 fill-current'><path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SampattiBot
