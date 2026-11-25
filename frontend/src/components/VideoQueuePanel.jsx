import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  Film,
  Shuffle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import YouTubeThumbnail from './YouTubeThumbnail.jsx'

const VideoQueuePanel = ({
  queue = [],
  currentVideoId,
  isAuthorized = false,
  autoplayNext = true,
  onPlayNext,
  onPlayItemNow,
  onRemoveQueueItem,
  onReorderQueue,
  onClearQueue,
  onShuffleQueue,
  onToggleAutoplay,
  onOpenSearch,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#111111] text-[#FFFFFF] select-none">
      {/* Header with Title and Global Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#242424] bg-[#181818]">
        <div className="flex items-center gap-2">
          <Film size={15} className="text-[#32C443]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
            Queue ({queue.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Shuffle button */}
          {isAuthorized && queue.length > 1 && (
            <button
              onClick={onShuffleQueue}
              className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-[#999999] hover:text-white transition-colors border border-[#242424]"
              title="Shuffle Queue"
            >
              <Shuffle size={13} />
            </button>
          )}

          {/* Add video button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#32C443] hover:bg-[#2DB33D] text-white text-[11px] font-semibold transition-colors shadow-sm"
          >
            <Plus size={12} />
            <span>Add</span>
          </button>

          {/* Clear button */}
          {isAuthorized && queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="px-2 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 text-[11px] font-medium transition-colors"
              title="Clear all queued videos"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Autoplay Banner */}
      <div className="px-4 py-2 bg-[#181818] border-b border-[#242424] flex items-center justify-between text-xs">
        <span className="text-[11px] text-[#999999] font-medium">Autoplay Next Video</span>
        {isAuthorized ? (
          <button
            onClick={() => onToggleAutoplay?.(!autoplayNext)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#32C443] hover:text-[#2DB33D] transition-colors"
            title="Toggle autoplay when active video finishes"
          >
            {autoplayNext ? (
              <>
                <span className="text-[#32C443]">ON</span>
                <ToggleRight size={18} className="text-[#32C443]" />
              </>
            ) : (
              <>
                <span className="text-[#999999]">OFF</span>
                <ToggleLeft size={18} className="text-[#999999]" />
              </>
            )}
          </button>
        ) : (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              autoplayNext ? 'bg-[#32C443]/15 text-[#32C443] border border-[#32C443]/30' : 'bg-[#202020] text-[#999999]'
            }`}
          >
            {autoplayNext ? 'ON' : 'OFF'}
          </span>
        )}
      </div>

      {/* Queue Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
        {/* Currently Playing Card */}
        {currentVideoId && (
          <div className="p-2.5 rounded-xl bg-[#181818] border border-[#32C443]/30">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#32C443]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#32C443] animate-pulse" />
                Now Playing
              </span>
            </div>
            <div className="flex gap-2.5 items-center">
              <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                <YouTubeThumbnail videoId={currentVideoId} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">Active Stream</p>
                <p className="text-[10px] text-[#999999] mt-0.5">ID: {currentVideoId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Queue List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-wider text-[#999999] font-semibold">
              Up Next ({queue.length})
            </p>
            {isAuthorized && queue.length > 0 && (
              <button
                onClick={onPlayNext}
                className="text-[10px] font-bold text-[#32C443] hover:underline"
              >
                Play Next
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#181818] border border-[#242424] rounded-xl">
              <Film size={26} className="mx-auto text-[#999999] opacity-40 mb-2" />
              <p className="text-xs font-semibold text-white">Queue is empty</p>
              <p className="text-[11px] text-[#999999] mt-0.5 max-w-[200px] mx-auto mb-3">
                Queue up videos to stream continuously together without interruptions.
              </p>
              <button
                onClick={onOpenSearch}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                <Plus size={13} />
                <span>Add First Video</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {queue.map((item, idx) => (
                  <motion.div
                    key={item.queueId || idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group p-2 rounded-xl bg-[#181818] border border-[#242424] hover:border-[#333333] transition-colors flex items-center gap-2.5"
                  >
                    <span className="text-xs font-bold font-mono text-[#999999] w-4 text-center">
                      {idx + 1}
                    </span>

                    <div className="w-16 aspect-video rounded-md overflow-hidden bg-black flex-shrink-0">
                      <YouTubeThumbnail videoId={item.videoId} title={item.title} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white truncate group-hover:text-[#32C443] transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-[#999999] truncate">
                        {item.channel} {item.duration && `· ${item.duration}`}
                      </p>
                    </div>

                    {/* Actions for Host/Mod */}
                    {isAuthorized && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {onPlayItemNow && (
                          <button
                            onClick={() => onPlayItemNow(item)}
                            className="p-1 text-[#999999] hover:text-[#32C443] hover:bg-[#202020] rounded"
                            title="Play this item now"
                          >
                            <Play size={12} fill="currentColor" />
                          </button>
                        )}

                        {onReorderQueue && idx > 0 && (
                          <button
                            onClick={() => onReorderQueue(idx, idx - 1)}
                            className="p-1 text-[#999999] hover:text-white hover:bg-[#202020] rounded"
                            title="Move up"
                          >
                            <ArrowUp size={12} />
                          </button>
                        )}

                        {onReorderQueue && idx < queue.length - 1 && (
                          <button
                            onClick={() => onReorderQueue(idx, idx + 1)}
                            className="p-1 text-[#999999] hover:text-white hover:bg-[#202020] rounded"
                            title="Move down"
                          >
                            <ArrowDown size={12} />
                          </button>
                        )}

                        {onRemoveQueueItem && (
                          <button
                            onClick={() => onRemoveQueueItem(item.queueId)}
                            className="p-1 text-[#999999] hover:text-red-400 hover:bg-[#202020] rounded"
                            title="Remove from queue"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoQueuePanel
