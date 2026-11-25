import { AnimatePresence } from 'framer-motion'
import ParticipantCard from './ParticipantCard.jsx'
import { Users } from 'lucide-react'

const ParticipantList = ({ participants = [], currentUserId, currentUserRole, onAssignRole, onRemove, onTransferHost }) => {
  const sorted = [...participants].sort((a, b) => {
    const order = { host: 0, moderator: 1, participant: 2 }
    return (order[a.role] ?? 3) - (order[b.role] ?? 3)
  })

  return (
    <div className="flex flex-col h-full bg-[#111111] text-[#FFFFFF] select-none">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#242424] bg-[#181818]">
        <Users size={15} className="text-[#32C443]" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">People</span>
        <span className="ml-auto text-[11px] bg-[#202020] text-[#999999] border border-[#242424] px-2 py-0.5 rounded-full font-medium">
          {participants.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
        {sorted.length === 0 ? (
          <p className="text-[#999999] text-xs text-center py-8">No participants yet</p>
        ) : (
          <AnimatePresence>
            {sorted.map((p) => (
              <ParticipantCard
                key={p.userId}
                participant={p}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onAssignRole={onAssignRole}
                onRemove={onRemove}
                onTransferHost={onTransferHost}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default ParticipantList
