// The activity log's vocabulary. No server code here, so pages and client components can import it.
export const ACTIONS = {
  login: 'Logged in',
  'login.failed': 'Failed login attempt',
  logout: 'Logged out',
  register: 'Created the account',
  'profile.update': 'Updated the profile',
  'password.change': 'Changed the password',
  'sessions.revoke': 'Signed out other devices',
  'account.delete': 'Deleted the account',
  'page.create': 'Created a page',
  'page.copy': 'Duplicated a page',
  'page.rename': 'Renamed a page',
  'page.edit': 'Edited a page',
  'page.delete': 'Deleted a page',
  'user.create': 'Added a user',
  'user.role': 'Changed a role',
  'user.status': 'Changed a user’s status',
  'user.delete': 'Deleted a user',
  'component.create': 'Added a component',
  'component.update': 'Edited a component',
  'component.delete': 'Deleted a component',
  'component.reset': 'Reset a component',
} as const
export type Action = keyof typeof ACTIONS

export const KINDS = {
  account: ['login', 'login.failed', 'logout', 'register', 'profile.update', 'password.change', 'sessions.revoke', 'account.delete'],
  pages: ['page.create', 'page.copy', 'page.rename', 'page.edit', 'page.delete'],
  admin: ['user.create', 'user.role', 'user.status', 'user.delete', 'component.create', 'component.update', 'component.delete', 'component.reset'],
} as const satisfies Record<string, readonly Action[]>
export type Kind = keyof typeof KINDS
export const KIND_LABEL: Record<Kind, string> = { account: 'Account & security', pages: 'Pages', admin: 'Admin actions' }

export const WARN = new Set<string>(['login.failed', 'account.delete', 'user.delete', 'page.delete', 'component.delete', 'sessions.revoke'])
