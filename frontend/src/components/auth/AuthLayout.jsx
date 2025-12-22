import React from 'react'
import { Link } from 'react-router-dom'
import { FcMoneyTransfer } from 'react-icons/fc'

const AuthLayout = ({ children, title, subtitle, type = 'login' }) => {
  const isLogin = type === 'login'

  return (
    /* h-[100dvh] ensures it fits perfectly even with mobile browser toolbars */
    /* overflow-hidden prevents the body from scrolling */
    <div className='h-[100dvh] w-full bg-[#F3F7FF] flex items-center justify-center overflow-hidden p-4'>

      {/* Background soft blurs - Scaled down to prevent "fuzziness" */}
      <div className='absolute top-[-10%] left-[-5%] w-[300px] h-[300px] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none' />
      <div className='absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] bg-indigo-200/30 rounded-full blur-[100px] pointer-events-none' />

      <div className='relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16'>

        {/* Left Branding - Compacted for better balance */}
        <div className='hidden lg:flex flex-col space-y-3 max-w-sm'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-11 h-11 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-white/50'>
              <FcMoneyTransfer className='w-7 h-7' />
            </div>
            <span className='text-xl font-black text-gray-900 tracking-tight'>Sampatti</span>
          </div>
          <h2 className='text-4xl xl:text-5xl font-extrabold text-gray-900 leading-tight'>
            Master your money with <span className='text-blue-600'>intelligence.</span>
          </h2>
          <p className='text-gray-500 text-sm xl:text-base leading-relaxed'>
            Track, save, and grow your wealth with our all-in-one financial intelligence platform.
          </p>
        </div>

        {/* Auth Card - Height Optimized */}
        <div className='w-full max-w-[420px]'>
          <div className='bg-white rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-white p-6 sm:p-8 flex flex-col'>

            <header className='mb-5'>
              <div className='lg:hidden flex justify-center mb-4'>
                <FcMoneyTransfer className='w-10 h-10' />
              </div>
              <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight text-center lg:text-left'>{title}</h2>
              {subtitle && (
                <p className='text-gray-500 mt-1 text-xs sm:text-sm font-medium text-center lg:text-left'>
                  {subtitle}
                </p>
              )}
            </header>

            {/* Content area */}
            <div className='w-full overflow-hidden'>
              {children}
            </div>

            {/* Footer - Reduced margin to save space */}
            <footer className='mt-6 pt-5 border-t border-gray-50 text-center'>
              <p className='text-gray-500 text-xs sm:text-sm'>
                {isLogin ? 'New to Sampatti?' : 'Already have an account?'}{' '}
                <Link
                  to={isLogin ? '/signup' : '/login'}
                  className='font-bold text-blue-600 hover:text-blue-700 transition-colors inline-block ml-1'
                >
                  {isLogin ? 'Create account' : 'Sign in'}
                </Link>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
