import React, { useState } from 'react'
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaInstagram,
  FaCode,
  FaCrown,
  FaRocket,
  FaStar,
  FaMedal,
  FaTerminal,
  FaExternalLinkAlt,
  FaBook
} from 'react-icons/fa'
import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'

const AboutDevelopersPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  const teamMembers = [
    {
      name: 'Prakash Kumar',
      imgLink: 'https://iili.io/fEKMCQ4.md.jpg',
      role: 'Team Lead & Full Stack',
      description: 'Architected the core system of Sampatti. Guided the team through end-to-end integration and technical strategy.',
      social: {
        github: 'https://github.com/spam-prakash/',
        linkedin: 'https://www.linkedin.com/in/spam-prakash/',
        twitter: 'https://x.com/spam_prakash',
        instagram: 'http://instagram.com/spam_prakash'
      },
      color: 'blue',
      icon: <FaCrown />,
      rank: 'Team Leader',
      initials: 'PK'
    },
    {
      name: 'Smile',
      imgLink: 'https://iili.io/fEKh8WG.jpg',
      role: 'AI & Resarch',
      description: 'The brain behind the Gemini AI integration. Developed the logic for intelligent financial forecasting.',
      social: {
        github: 'https://github.com/smile259/',
        linkedin: 'https://www.linkedin.com/in/smile-engg/',
        twitter: 'https://x.com/Smilee_24',
        instagram: 'http://instagram.com/smilx.30'
      },
      color: 'purple',
      icon: <FaBook />,
      initials: 'S'
    },
    {
      name: 'Md Ayan',
      imgLink: 'https://iili.io/fEKNtXn.md.jpg',
      role: 'UI/UX & Presentation',
      description: 'Crafted the visual soul of Sampatti. Transformed raw financial data into a beautiful, intuitive user journey.',
      social: {
        github: 'https://github.com/MdAyan-dot/',
        linkedin: 'https://www.linkedin.com/in/mdayan-dot/',
        twitter: 'https://x.com/MdAyan_dot',
        instagram: 'https://www.instagram.com/md.ayanu786/'
      },
      color: 'emerald',
      icon: <FaStar />,
      initials: 'MA'
    },
    {
      name: 'Prashant Kumar',
      imgLink: 'https://iili.io/fEKUYBt.md.jpg',
      role: 'UI/UX & Frontend',
      description: 'The master of responsiveness and performance. Ensured every pixel is perfect across all device screens.',
      social: {
        github: 'https://github.com/prashant10479/',
        linkedin: 'https://www.linkedin.com/in/prashant914/',
        twitter: 'https://x.com/aqueous_NaOH',
        instagram: 'https://www.instagram.com/____star.boyy____'
      },
      color: 'orange',
      icon: <FaMedal />,
      initials: 'PK'
    }
  ]

  return (
    <div className='flex h-screen bg-[#F8FAFC] overflow-hidden'>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className='flex-1 flex flex-col min-w-0 relative'>
        <Header onMenuClick={toggleSidebar} />

        <main className='flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar'>
          <div className='max-w-6xl mx-auto space-y-6'>

            {/* Minimalist Hero Section */}
            <div className='text-center space-y-2'>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest'>
                <FaTerminal /> The Innovators
              </div>
              <h1 className='text-3xl md:text-5xl font-black text-gray-900 tracking-tight'>
                Meet the <span className='text-blue-600'>Developers</span>
              </h1>
              <p className='text-gray-500 text-sm md:text-base max-w-2xl mx-auto'>
                A multidisciplinary team from the <strong>TechSprint Hackathon</strong> (GDG on Campus: IGC & Hack2Skill)
                dedicated to building the future of personal finance.
              </p>
            </div>

            {/* Premium Developer Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className='group bg-white rounded-[2.5rem] border border-gray-100 p-2 hover:border-blue-200 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/5'
                >
                  <div className='flex flex-col sm:flex-row items-center gap-6 p-6'>

                    {/* Visual Profile Block */}
                    <div className='relative shrink-0'>
                      <div className={`w-32 h-32 rounded-[2rem] overflow-hidden bg-gradient-to-br flex items-center justify-center shadow-inner
                        ${member.color === 'blue'
? 'from-blue-500 to-blue-700'
                          : member.color === 'purple'
? 'from-purple-500 to-purple-700'
                          : member.color === 'emerald'
? 'from-emerald-500 to-emerald-700'
                          : 'from-orange-500 to-orange-700'}`}
                      >
                        {member.imgLink
                          ? (
                            <img
                              src={member.imgLink}
                              alt={member.name}
                              className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                            />
                            )
                          : (
                            <span className='text-white text-3xl font-black'>{member.initials}</span>
                            )}
                      </div>
                      <div className='absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-50 flex items-center justify-center text-gray-900 group-hover:text-blue-600 transition-colors'>
                        {member.icon}
                      </div>
                    </div>

                    {/* Content Block */}
                    <div className='flex-1 text-center sm:text-left space-y-2'>
                      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
                        <h3 className='text-xl font-bold text-gray-900'>{member.name}</h3>
                        {member.rank &&
                          <span className='px-3 py-1 bg-gray-50 text-gray-400 text-[11px] font-bold uppercase rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors'>
                            {member.rank}
                          </span>}
                      </div>
                      <p className='text-blue-600 text-xs font-bold uppercase tracking-tighter'>{member.role}</p>
                      <p className='text-gray-500 text-xs leading-relaxed'>{member.description}</p>

                      {/* Social Links - Integrated into card */}
                      <div className='flex items-center justify-center sm:justify-start gap-4 pt-4 border-t border-gray-50 mt-4'>
                        <a href={member.social.github} target='_blank' className='text-gray-400 hover:text-gray-900 transition-colors' rel='noreferrer'><FaGithub size={16} /></a>
                        <a href={member.social.linkedin} target='_blank' className='text-gray-400 hover:text-blue-600 transition-colors' rel='noreferrer'><FaLinkedin size={16} /></a>
                        <a href={member.social.twitter} target='_blank' className='text-gray-400 hover:text-sky-500 transition-colors' rel='noreferrer'><FaTwitter size={16} /></a>
                        <a href={member.social.instagram} target='_blank' className='text-gray-400 hover:text-pink-600 transition-colors' rel='noreferrer'><FaInstagram size={16} /></a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AboutDevelopersPage
