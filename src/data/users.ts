export const users = {
  standard: {
    username: 'standard_user',
    password: 'secret_sauce',
  },
  locked: {
    username: 'locked_out_user',
    password: 'secret_sauce',
  },
  problem: {
    username: 'problem_user',
    password: 'secret_sauce',
  },
  performance: {
    username: 'performance_glitch_user',
    password: 'secret_sauce',
  },
} as const;

export const checkoutData = {
  valid: {
    firstName: 'John',
    lastName: 'Doe',
    postalCode: '12345',
  },
} as const;
