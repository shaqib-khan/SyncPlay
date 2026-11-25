import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Smile, MessageSquare, ArrowDown, Sparkles } from 'lucide-react'
import RoleBadge from './RoleBadge.jsx'

const QUICK_REACTIONS = ['🔥', '😂', '❤️', '👍', '😮', '🎉']
const EMOJI_GRID = [
  '😂', '❤️', '🔥', '👍', '😮', '🎉', '👏', '😍',
  '🍿', '💯', '✨', '👋', '😭', '🤣', '🙌', '🤩',
  '😎', '🥳', '🤯', '👀', '💀', '🫶', '🎵', '🚀',
]

const AVATAR_PALETTE = [
  { bg: '#32C443', text: '#FFFFFF' },
  { bg: '#2885DB', text: '#FFFFFF' },
  { bg: '#9C27B0', text: '#FFFFFF' },
  { bg: '#FF9800', text: '#000000' },
  { bg: '#00BCD4', text: '#000000' },
  { bg: '#E91E63', text: '#FFFFFF' },
  { bg: '#4CAF50', text: '#FFFFFF' },
  { bg: '#FFC107', text: '#000000' },
]

const getAvatarStyle = (name = '') => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

const formatChatTime = (timestamp) => {
  if (!timestamp) return ''
  try {
    const d = new Date(timestamp)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

// Detect short emoji-only messages (1-3 emojis, no letters/digits)
const isEmojiOnly = (str = '') => {
  const trimmed = str.trim()
  if (!trimmed || trimmed.length > 12) return false
  return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u.test(trimmed)
}

const ChatBox = ({ messages = [], onSendMessage, currentUserId }) => {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [isScrolledUp, setIsScrolledUp] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const bottomRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const inputRef = useRef(null)
  const prevLengthRef = useRef(messages.length)

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const scrolledUp = distanceFromBottom > 80
    setIsScrolledUp(scrolledUp)
    if (!scrolledUp) {
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    const newCount = messages.length - prevLengthRef.current
    prevLengthRef.current = messages.length

    if (!isScrolledUp) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setUnreadCount(0)
    } else if (newCount > 0) {
      setUnreadCount((prev) => prev + newCount)
    }
  }, [messages, isScrolledUp])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setIsScrolledUp(false)
    setUnreadCount(0)
  }

  const handleSend = (e) => {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSendMessage(trimmed, 'chat', null)
    setText('')
    setShowEmoji(false)
    setIsScrolledUp(false)
    setUnreadCount(0)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const insertEmoji = (emoji) => {
    setText((prev) => (prev + emoji).slice(0, 500))
    inputRef.current?.focus()
  }

  const sendQuickReaction = (emoji) => {
    onSendMessage(emoji, 'chat', emoji)
    setShowEmoji(false)
    setIsScrolledUp(false)
    setUnreadCount(0)
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#111111] text-[#FFFFFF] select-none overflow-hidden relative">
      {/* ─── Fixed Chat Header ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#242424] bg-[#181818] flex-shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#202020] border border-[#242424] flex items-center justify-center text-[#2885DB]">
            <MessageSquare size={14} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-wide text-white">Party Chat</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#32C443]" title="Live" />
            </div>
            <p className="text-[10px] text-[#999999] leading-none mt-0.5">Real-time room chat</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#999999] bg-[#202020] border border-[#242424] px-2 py-0.5 rounded-full">
          {messages.length} {messages.length === 1 ? 'msg' : 'msgs'}
        </span>
      </div>

      {/* ─── Scrollable Message History ─── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3 scrollbar-hide bg-[#111111]"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-[#242424] flex items-center justify-center mb-3">
              <Sparkles size={20} className="text-[#32C443]" />
            </div>
            <p className="text-sm font-semibold text-white">Start the conversation</p>
            <p className="text-xs text-[#999999] mt-1 max-w-[220px] leading-relaxed">
              Send a message or tap a quick reaction below to chat while watching together.
            </p>
            <div className="flex items-center gap-1.5 mt-4">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => sendQuickReaction(emoji)}
                  className="w-8 h-8 rounded-full bg-[#181818] hover:bg-[#202020] border border-[#242424] flex items-center justify-center text-sm hover:scale-110 active:scale-95 transition-transform"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isSystem = msg.type === 'system'
            if (isSystem) {
              return (
                <div key={msg._id || i} className="text-center my-2.5">
                  <span className="text-[10px] text-[#999999] bg-[#181818] border border-[#242424] px-3 py-1 rounded-full inline-block font-medium">
                    {msg.message}
                  </span>
                </div>
              )
            }

            const isMe = msg.senderId === currentUserId
            const prevMsg = i > 0 ? messages[i - 1] : null
            const nextMsg = i < messages.length - 1 ? messages[i + 1] : null

            const samePrev =
              prevMsg &&
              prevMsg.type !== 'system' &&
              prevMsg.senderId === msg.senderId &&
              Math.abs(new Date(msg.timestamp || 0) - new Date(prevMsg.timestamp || 0)) < 120000

            const sameNext =
              nextMsg &&
              nextMsg.type !== 'system' &&
              nextMsg.senderId === msg.senderId &&
              Math.abs(new Date(nextMsg.timestamp || 0) - new Date(msg.timestamp || 0)) < 120000

            const isFirstInGroup = !samePrev
            const isLastInGroup = !sameNext

            const role = msg.senderRole || msg.role || 'participant'
            const senderName = msg.senderName || 'Anonymous'
            const avatarColor = getAvatarStyle(senderName)
            const initial = senderName.charAt(0).toUpperCase()
            const emojiOnly = isEmojiOnly(msg.message)

            // Corner rounding for grouped chat bubbles
            const bubbleRadius = isMe
              ? `${isFirstInGroup ? 'rounded-tl-2xl rounded-tr-2xl' : 'rounded-tl-2xl rounded-tr-md'} ${
                  isLastInGroup ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-bl-2xl rounded-br-md'
                }`
              : `${isFirstInGroup ? 'rounded-tr-2xl rounded-tl-2xl' : 'rounded-tr-2xl rounded-tl-md'} ${
                  isLastInGroup ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-br-2xl rounded-bl-md'
                }`

            return (
              <motion.div
                key={msg._id || i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.14 }}
                className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'} ${
                  isFirstInGroup ? 'mt-3 first:mt-0' : 'mt-0.5'
                }`}
              >
                {/* Left avatar slot (reserve width for grouped alignment) */}
                {!isMe && (
                  <div className="w-7 flex-shrink-0 flex justify-center">
                    {isLastInGroup ? (
                      <div
                        style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm"
                        title={senderName}
                      >
                        {initial}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Message column */}
                <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender name + role badge only on first message of a group */}
                  {!isMe && isFirstInGroup && (
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-semibold text-white truncate max-w-[120px]">
                        {senderName}
                      </span>
                      <RoleBadge role={role} showIcon={false} />
                    </div>
                  )}

                  {/* Bubble or large emoji */}
                  {emojiOnly ? (
                    <div className="px-1 py-0.5 text-2xl leading-none select-text" title={formatChatTime(msg.timestamp)}>
                      {msg.message}
                    </div>
                  ) : (
                    <div
                      className={`px-3 py-1.5 text-xs leading-relaxed break-words select-text ${bubbleRadius} ${
                        isMe
                          ? 'bg-[#2885DB] text-white'
                          : 'bg-[#181818] border border-[#242424] text-[#FFFFFF]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  )}

                  {/* Timestamp on last message in group */}
                  {isLastInGroup && (
                    <span className="text-[9px] text-[#777777] font-mono mt-0.5 px-1">
                      {formatChatTime(msg.timestamp)}
                    </span>
                  )}
                </div>

                {/* Right avatar slot for own messages */}
                {isMe && (
                  <div className="w-7 flex-shrink-0 flex justify-center">
                    {isLastInGroup ? (
                      <div
                        style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm"
                        title="You"
                      >
                        {initial}
                      </div>
                    ) : null}
                  </div>
                )}
              </motion.div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ─── Floating "New Messages / Latest" Jump Pill ─── */}
      <AnimatePresence>
        {isScrolledUp && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-16 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2885DB] hover:bg-[#2070BC] text-white text-[11px] font-semibold shadow-lg active:scale-95 transition-all"
          >
            <ArrowDown size={12} />
            <span>{unreadCount > 0 ? `${unreadCount} new` : 'Latest'}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Emoji Picker Popover ─── */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.14 }}
            className="border-t border-[#242424] bg-[#181818] px-3 py-2.5 flex-shrink-0"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#999999]">
                Quick Reactions
              </span>
              <div className="flex items-center gap-1">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => sendQuickReaction(emoji)}
                    className="w-6 h-6 rounded-md hover:bg-[#242424] flex items-center justify-center text-sm hover:scale-110 active:scale-95 transition-transform"
                    title={`Send ${emoji} immediately`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-8 gap-1 pt-1.5 border-t border-[#242424]">
              {EMOJI_GRID.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="h-7 rounded-md hover:bg-[#202020] flex items-center justify-center text-base hover:scale-110 active:scale-95 transition-transform"
                  title="Insert into message"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Fixed Message Composer at Bottom ─── */}
      <form
        onSubmit={handleSend}
        className="p-2.5 border-t border-[#242424] bg-[#181818] flex items-center gap-2 flex-shrink-0 z-10"
      >
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
            showEmoji
              ? 'text-[#2885DB] bg-[#202020]'
              : 'text-[#999999] hover:text-white hover:bg-[#202020]'
          }`}
          title="Emoji picker"
        >
          <Smile size={18} />
        </button>

        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the party..."
            maxLength={500}
            className="w-full bg-[#111111] border border-[#242424] rounded-full px-4 py-2 text-xs text-white placeholder-[#777777] focus:outline-none focus:border-[#2885DB] transition-colors"
          />
          {text.length > 400 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#999999]">
              {text.length}/500
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2 rounded-full bg-[#2885DB] hover:bg-[#2070BC] active:scale-95 text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm flex items-center justify-center flex-shrink-0"
          title="Send message (Enter)"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}

export default ChatBox
