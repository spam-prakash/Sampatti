import React, { useState } from 'react'
import {
  FaBrain,
  FaChartLine,
  FaComments,
  FaBullseye,
  FaShieldAlt,
  FaLightbulb,
  FaRocket,
  FaGem,
  FaLayerGroup,
  FaChevronRight,
  FaFingerprint,
  FaDatabase,
  FaCodeBranch
} from 'react-icons/fa'
import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'

const AboutProjectPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  const features = [
    {
      icon: <FaBrain />,
      title: 'AI Intelligence',
      description: 'Advanced Gemini AI analyzes patterns to provide personalized financial wisdom and predictive spending alerts.',
      accent: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      icon: <FaChartLine />,
      title: 'Health Scoring',
      description: 'A proprietary algorithm that rates your financial habits from 0-100, providing actionable growth steps.',
      accent: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      icon: <FaComments />,
      title: 'Smart Concierge',
      description: 'An interactive advisor that understands natural language queries regarding your budget and goals.',
      accent: 'text-violet-600',
      bg: 'bg-violet-50'
    }
  ]

  const ecosystem = [
    { title: 'Personalized Budgeting', desc: 'Auto-categorization of expenses with smart limit alerts.' },
    { title: 'Goal Management', desc: 'Visual progress tracking for short and long-term financial targets.' },
    { title: 'Debt Visualization', desc: 'Strategic insights on interest rates and repayment optimization.' }
  ]

  return (
    <div className='flex h-screen bg-[#F8FAFC] overflow-hidden'>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className='flex-1 flex flex-col min-w-0 relative'>
        <Header onMenuClick={toggleSidebar} />

        <main className='flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar'>
          <div className='max-w-6xl mx-auto space-y-10 pb-12'>

            {/* 1. High-Impact Hero Section */}
            <section className='bg-white rounded-[2.5rem] p-8 md:p-14 border border-gray-100 shadow-sm relative overflow-hidden'>
              <div className='relative z-10 max-w-2xl space-y-6'>
                <div className='inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em]'>
                  <FaBrain className='animate-pulse' /> The Architecture of Wealth
                </div>
                <h1 className='text-4xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight'>
                  Your Financial <br />Data, <span className='text-blue-600'>Demystified.</span>
                </h1>
                <p className='text-gray-500 text-sm md:text-lg leading-relaxed'>
                  Sampatti is a <strong>Centralized Financial Intelligence Hub</strong>. It aggregates fragmented data—income streams, recurring expenses, and savings targets—into a unified MERN-based ecosystem. By leveraging the <strong>Gemini Pro API</strong>, it transforms static ledger entries into conversational insights.
                </p>
                <div className='flex flex-wrap gap-4 pt-4'>
                  <div className='flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-2xl font-bold text-xs'>
                    <FaDatabase className='text-blue-400' /> MongoDB Structured
                  </div>
                  <div className='flex items-center gap-3 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold text-xs shadow-xl shadow-blue-100'>
                    <FaRocket /> AI Logic Integrated
                  </div>
                </div>
              </div>
              <div className='hidden lg:block absolute right-[-100px] top-1/2 -translate-y-1/2 opacity-5'>
                <FaGem size={500} />
              </div>
            </section>

            {/* 2. Core Pillars - Clean Feature Grid */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {features.map((f, i) => (
                <div key={i} className='bg-white p-8 rounded-[2.5rem] border border-gray-100 transition-all hover:translate-y-[-5px] hover:shadow-xl group'>
                  <div className={`w-14 h-14 ${f.bg} ${f.accent} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner`}>
                    {f.icon}
                  </div>
                  <h3 className='text-xl font-bold text-gray-900 mb-3'>{f.title}</h3>
                  <p className='text-gray-500 text-xs leading-relaxed'>{f.description}</p>
                </div>
              ))}
            </div>

            {/* 3. Product Ecosystem Section */}
            <section className='grid md:grid-cols-2 gap-8 items-center'>
              <div className='space-y-6'>
                <h2 className='text-3xl font-black text-gray-900 tracking-tight'>The Ecosystem</h2>
                <p className='text-gray-500 text-sm'>We focus on three critical domains of wealth management to ensure a holistic user experience.</p>
                <div className='space-y-3'>
                  {ecosystem.map((item, i) => (
                    <div key={i} className='flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl group hover:border-blue-200 transition-colors'>
                      <div className='w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs group-hover:bg-blue-600 group-hover:text-white transition-all'>
                        <FaChevronRight />
                      </div>
                      <div>
                        <h4 className='text-sm font-bold text-gray-800'>{item.title}</h4>
                        <p className='text-[11px] text-gray-500'>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className='bg-blue-600 rounded-[2.5rem] p-10 text-white flex flex-col justify-center relative overflow-hidden shadow-2xl shadow-blue-200'>
                <FaLightbulb className='text-5xl mb-6 opacity-80' />
                <h3 className='text-2xl font-black mb-4'>Why Sampatti?</h3>
                <p className='text-blue-100 text-sm leading-relaxed mb-6'>
                  Standard apps show you "where" your money went. Sampatti shows you "how" to make it stay.
                  Our goal is to reduce financial anxiety through clarity and automated intelligence.
                </p>
                <div className='p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20'>
                  <p className='text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1'>Core Value</p>
                  <p className='text-xs font-medium italic'>"Transparency leads to prosperity."</p>
                </div>
              </div>
            </section>

            {/* 4. Future Roadmap - Technical Evolution */}
            <section className='bg-gray-950 rounded-[3rem] p-8 md:p-12 text-white'>
              <div className='flex flex-col md:flex-row justify-between items-end gap-6 mb-12'>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest'>
                    <FaCodeBranch /> Engineering Milestones
                  </div>
                  <h2 className='text-3xl font-black tracking-tight'>Technical Evolution</h2>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                {/* Milestone 01 */}
                <div className='space-y-4 group'>
                  <div className='text-3xl font-black text-blue-500 group-hover:scale-110 transition-transform inline-block'>01</div>
                  <h4 className='font-bold text-lg border-b border-white/10 pb-2'>Data Aggregation Layer</h4>
                  <p className='text-gray-400 text-xs leading-relaxed'>
                    The current build focuses on **CRUD optimization** for financial records. We implemented custom middleware to sanitize transaction data before it reaches the MongoDB atlas cluster, ensuring high data integrity.
                  </p>
                </div>

                {/* Milestone 02 */}
                <div className='space-y-4 group'>
                  <div className='text-3xl font-black text-indigo-500 group-hover:scale-110 transition-transform inline-block'>02</div>
                  <h4 className='font-bold text-lg border-b border-white/10 pb-2'>Contextual AI Prompting</h4>
                  <p className='text-gray-400 text-xs leading-relaxed'>
                    Instead of generic AI, we engineered <strong>System Instruction Sets</strong> for Gemini. This allows the AI to "read" your specific database state and offer advice based on your actual debt-to-income ratio.
                  </p>
                </div>

                {/* Milestone 03 */}
                <div className='space-y-4 group'>
                  <div className='text-3xl font-black text-violet-500 group-hover:scale-110 transition-transform inline-block'>03</div>
                  <h4 className='font-bold text-lg border-b border-white/10 pb-2'>Predictive Forecasting</h4>
                  <p className='text-gray-400 text-xs leading-relaxed'>
                    The next release focuses on <strong>Recursive Analysis</strong>—using past 6-month trends to predict future wallet balance, helping users identify potential cash-flow shortages before they happen.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  )
}

export default AboutProjectPage
