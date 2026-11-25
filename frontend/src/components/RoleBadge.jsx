import { Crown, Shield, User } from 'lucide-react'

const badges = {
  host: {
    label: 'Host',
    icon: Crown,
    className: 'role-host',
  },
  moderator: {
    label: 'Mod',
    icon: Shield,
    className: 'role-moderator',
  },
  participant: {
    label: 'Viewer',
    icon: User,
    className: 'role-participant',
  },
}

const RoleBadge = ({ role, showIcon = true }) => {
  const badge = badges[role] || badges.participant
  const Icon = badge.icon

  return (
    <span className={`inline-flex items-center gap-1 ${badge.className}`}>
      {showIcon && <Icon size={10} />}
      {badge.label}
    </span>
  )
}

export default RoleBadge

