import { motion } from 'framer-motion'
import CreatePartyAnimation from './CreatePartyAnimation.jsx'
import InviteFriendsAnimation from './InviteFriendsAnimation.jsx'
import WatchTogetherAnimation from './WatchTogetherAnimation.jsx'

const steps = [
  {
    step: '01',
    title: '1. Create Group',
    description: "It's free! · No login required.",
    Animation: CreatePartyAnimation,
  },
  {
    step: '02',
    title: '2. Invite Friends',
    description: 'Copy the link and send it to friends.',
    Animation: InviteFriendsAnimation,
  },
  {
    step: '03',
    title: '3. Watch Together',
    description: 'Start a video and watch together.',
    Animation: WatchTogetherAnimation,
  },
]

const GettingStarted = () => {
  return (
    <section id="tutorial" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#111111] select-none scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
            How to get started
          </h2>
          <p className="text-sm sm:text-base text-[#999999] mt-2 max-w-lg mx-auto">
            In just 3 steps you can watch videos with your friends!
          </p>
        </div>

        {/* 3-Column Responsive Cards Grid (Row on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ step, title, description, Animation }) => (
            <div
              key={step}
              className="bg-[#181818] border border-[#242424] rounded-[16px] p-6 flex flex-col justify-between h-[320px] transition-colors duration-150 text-center"
            >
              {/* Illustration Animation Area */}
              <div className="flex-1 flex items-center justify-center">
                <Animation />
              </div>

              {/* Text Information */}
              <div className="pt-2">
                <h3 className="text-base font-bold text-[#FFFFFF] tracking-tight">
                  {title}
                </h3>
                <p className="text-xs text-[#999999] mt-1.5 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GettingStarted
