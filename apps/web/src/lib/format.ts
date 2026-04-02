export function metricValue(value: number | null, prefix = ''): string {
  if (value === null) {
    return 'Awaiting calls'
  }

  return `${prefix}${value.toLocaleString()}`
}

export function timeLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function getCallStatusLabel(status: string): string {
  switch (status) {
    case 'requesting_token':
      return 'Requesting scoped voice token'
    case 'connecting':
      return 'Connecting to HappyRobot room'
    case 'live':
      return 'Call live'
    case 'ended':
      return 'Call ended'
    case 'error':
      return 'Call error'
    default:
      return 'Ready'
  }
}

export function titleLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
