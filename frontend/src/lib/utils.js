import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format date to readable string
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format datetime to readable string
export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Get status badge color
export function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

// Get priority badge color
export function getPriorityColor(priority) {
  const colors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }
  return colors[priority.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

// Calculate level from points
export function calculateLevel(points) {
  if (points < 100) return 1
  if (points < 250) return 2
  if (points < 500) return 3
  if (points < 1000) return 4
  return 5
}

// Get badge for level
export function getLevelBadge(level) {
  const badges = {
    1: { name: 'Eco Beginner', icon: '🌱' },
    2: { name: 'Green Guardian', icon: '🌿' },
    3: { name: 'Waste Warrior', icon: '♻️' },
    4: { name: 'Earth Champion', icon: '🌍' },
    5: { name: 'Eco Legend', icon: '🏆' },
  }
  return badges[level] || badges[1]
}

// Truncate text
export function truncate(text, length = 100) {
  if (!text) return ''
  return text.length > length ? `${text.substring(0, length)}...` : text
}
