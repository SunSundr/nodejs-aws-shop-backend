export enum Effect {
  Allow = 'Allow',
  Deny = 'Deny',
}

export enum AccessMessage {
  Deny = 'Access denied: invalid credentials',
  Allow = 'Successfully authorized',
  Error = 'Internal server error',
}
