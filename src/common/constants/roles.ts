export const ROLES = ['SUPER_ADMIN', 'ADMIN', 'WAITER', 'KDS'] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ['ACTIVE', 'DISABLED'] as const;
export type AccountStatus = (typeof STATUSES)[number];
