import { motion } from 'framer-motion'
import RoleBadge from './RoleBadge.jsx'
import { Shield, ShieldAlert, UserMinus, Crown } from 'lucide-react'

const ParticipantCard = ({ participant, currentUserId, currentUserRole, onAssignRole, onRemove, onTransferHost }) => {
  const isMe = participant.userId === currentUserId
  const isHost = currentUserRole === 'host'
  const canManage = isHost && !isMe && participant.role !== 'host'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-[#181818] hover:bg-[#202020] transition-colors border border-[#242424]"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#202020] border border-[#242424] flex items-center justify-center text-white text-xs font-bold">
          {participant.username?.[0]?.toUpperCase() || '?'}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#181818] ${
            participant.isConnected ? 'bg-[#32C443]' : 'bg-[#666666]'
          }`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white truncate">
            {participant.username}
            {isMe && <span className="text-[#999999] text-[10px] ml-1">(you)</span>}
          </span>
        </div>
        <div className="mt-0.5">
          <RoleBadge role={participant.role} />
        </div>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex gap-1.5">
          {participant.role === 'participant' && (
            <button
              onClick={() => onAssignRole(participant.userId, 'moderator')}
              title="Promote to Moderator"
              className="w-7 h-7 rounded-lg bg-[#2885DB]/15 text-[#2885DB] hover:bg-[#2885DB]/25 transition flex items-center justify-center border border-[#2885DB]/30"
            >
              <Shield size={13} />
            </button>
          )}
          {participant.role === 'moderator' && (
            <button
              onClick={() => onAssignRole(participant.userId, 'participant')}
              title="Demote to Participant"
              className="w-7 h-7 rounded-lg bg-[#202020] text-[#999999] hover:text-white transition flex items-center justify-center border border-[#242424]"
            >
              <ShieldAlert size={13} />
            </button>
          )}
          {onTransferHost && (
            <button
              onClick={() => {
                if (window.confirm(`Transfer host role to ${participant.username}? You will become a participant.`)) {
                  onTransferHost(participant.userId)
                }
              }}
              title="Transfer Host Role"
              className="w-7 h-7 rounded-lg bg-[#FFD700]/15 text-[#FFD700] hover:bg-[#FFD700]/25 transition flex items-center justify-center border border-[#FFD700]/30"
            >
              <Crown size={13} />
            </button>
          )}
          <button
            onClick={() => onRemove(participant.userId)}
            title="Remove from Party"
            className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition flex items-center justify-center border border-red-500/30"
          >
            <UserMinus size={13} />
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default ParticipantCard
