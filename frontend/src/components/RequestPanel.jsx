import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Bell, Play, Pause, FastForward, Clock, Send, Sparkles } from 'lucide-react'

const RequestPanel = ({
  requests = [],
  currentUserRole = 'participant',
  onApprove,
  onReject,
  onRequestAction,
  currentTime = 0,
}) => {
  const canManage = currentUserRole === 'host' || currentUserRole === 'moderator'
  const [seekSeconds, setSeekSeconds] = useState('')

  const actionLabels = {
    play: 'Play video',
    pause: 'Pause video',
    seek: 'Seek to position',
    changeVideo: 'Change video',
    add_to_queue: 'Add video to queue',
  }

  const handleSeekRequest = (e) => {
    e.preventDefault()
    const sec = parseFloat(seekSeconds)
    if (!isNaN(sec) && sec >= 0) {
      onRequestAction?.('seek', { currentTime: sec })
      setSeekSeconds('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#111111] text-[#FFFFFF] select-none">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#242424] bg-[#181818]">
        <Bell size={15} className="text-[#32C443]" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">Requests</span>
        {requests.length > 0 && (
          <span className="ml-auto text-[11px] bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
            {requests.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
        {/* Participant quick request actions */}
        {!canManage && (
          <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-[#32C443]" />
              <span className="text-xs font-bold text-white">Request Playback Action</span>
            </div>
            <p className="text-[11px] text-[#999999] mb-3">
              As a Participant, your playback requests will be reviewed by the Host or Moderator in real time.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => onRequestAction?.('play', { currentTime })}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-[#202020] hover:bg-[#282828] border border-[#242424] text-xs font-semibold text-white transition active:scale-95"
              >
                <Play size={12} className="text-[#32C443]" />
                Request Play
              </button>
              <button
                onClick={() => onRequestAction?.('pause', { currentTime })}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-[#202020] hover:bg-[#282828] border border-[#242424] text-xs font-semibold text-white transition active:scale-95"
              >
                <Pause size={12} className="text-[#2885DB]" />
                Request Pause
              </button>
            </div>

            {/* Seek Request Input */}
            <form onSubmit={handleSeekRequest} className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Seek timestamp (sec)"
                value={seekSeconds}
                onChange={(e) => setSeekSeconds(e.target.value)}
                className="flex-1 bg-[#111111] border border-[#242424] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#666666] focus:border-[#32C443] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!seekSeconds}
                className="px-3 py-1.5 rounded-lg bg-[#32C443] hover:bg-[#2DB33D] disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold transition flex items-center gap-1"
              >
                <FastForward size={12} />
                Seek
              </button>
            </form>
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <p className="text-[#999999] text-xs text-center py-8">
            {canManage ? 'No pending requests from participants' : 'No active requests pending approval'}
          </p>
        ) : (
          <AnimatePresence>
            {requests.map((req) => (
              <motion.div
                key={req.requestId}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 rounded-xl bg-[#181818] border border-[#242424]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-bold text-white">{req.username}</p>
                    <p className="text-xs text-[#32C443] font-medium">{actionLabels[req.action] || req.action}</p>
                    {req.payload?.currentTime !== undefined && (
                      <p className="text-[11px] text-[#999999] font-mono mt-0.5">
                        Timestamp: {Math.floor(req.payload.currentTime)}s
                      </p>
                    )}
                    {req.payload?.videoUrl && (
                      <p className="text-[11px] text-[#999999] truncate max-w-[200px] font-mono mt-0.5">
                        {req.payload.videoUrl}
                      </p>
                    )}
                    {req.payload?.video?.title && (
                      <p className="text-[11px] text-[#999999] truncate max-w-[200px] font-mono mt-0.5">
                        "{req.payload.video.title}"
                      </p>
                    )}
                  </div>
                </div>

                {canManage && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => onApprove(req.requestId)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#32C443]/15 text-[#32C443] border border-[#32C443]/30 hover:bg-[#32C443]/25 text-xs font-semibold transition"
                    >
                      <CheckCircle size={12} />
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(req.requestId)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 text-xs font-semibold transition"
                    >
                      <XCircle size={12} />
                      Reject
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default RequestPanel
