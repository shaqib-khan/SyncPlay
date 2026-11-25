import { useState } from 'react'
import { Copy, Check, Share2, ExternalLink } from 'lucide-react'
import { copyToClipboard } from '../utils/helpers.js'

const RoomInvite = ({ roomId }) => {
  const [copied, setCopied] = useState(false)

  const inviteUrl = `${window.location.origin}/join/${roomId}`

  const handleCopy = async () => {
    const ok = await copyToClipboard(inviteUrl)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex items-center gap-2 bg-bg-secondary border border-border-color rounded-xl p-2 pl-3">
      <span className="text-xs text-text-secondary font-mono truncate max-w-[180px] select-all">{inviteUrl}</span>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-accent-blue/20 text-accent-cyan hover:bg-accent-blue/30 transition text-xs font-medium"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

export default RoomInvite

