import { OpenAPIObject } from '@nestjs/swagger';

const GRAPHQL_REQUEST_SCHEMA = {
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'string',
      description: 'GraphQL query or mutation document.',
    },
    variables: {
      type: 'object',
      additionalProperties: true,
      description: 'Variables referenced by the GraphQL document.',
    },
    operationName: {
      type: 'string',
      nullable: true,
      description: 'Optional operation name when the document contains multiple operations.',
    },
  },
};

const GRAPHQL_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      nullable: true,
      additionalProperties: true,
    },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
};

const UNAUTHORIZED_RESPONSE = {
  description: 'Missing, invalid, or expired bearer token.',
  content: {
    'application/json': {
      example: {
        errors: [
          {
            message: 'Unauthorized',
            extensions: {
              code: 'UNAUTHENTICATED',
            },
          },
        ],
      },
    },
  },
};

export function addGraphqlOpenApiDocs(document: OpenAPIObject): OpenAPIObject {
  document.tags = [
    ...(document.tags ?? []),
    {
      name: 'GraphQL',
      description:
        'All business API operations are exposed through the GraphQL endpoint. Use the examples below as request bodies for POST /graphql.',
    },
  ];

  document.paths['/graphql'] = {
    post: {
      tags: ['GraphQL'],
      summary: 'Execute GraphQL operations',
      description:
        'Runs the Qik Accounts Ledger GraphQL API. Operations other than health and login require an Authorization header with a bearer token returned by login.',
      operationId: 'executeGraphqlOperation',
      security: [{ bearer: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: GRAPHQL_REQUEST_SCHEMA,
            examples: {
              health: {
                summary: 'Health check',
                value: {
                  query: 'query Health { health }',
                },
              },
              login: {
                summary: 'Login',
                value: {
                  query:
                    'mutation Login($input: LoginInput!) { login(input: $input) { accessToken user { id email name lastName } } }',
                  variables: {
                    input: {
                      email: 'demo@example.com',
                      password: 'password123',
                    },
                  },
                },
              },
              me: {
                summary: 'Authenticated user',
                value: {
                  query: 'query Me { me { id email name lastName createdAt updatedAt } }',
                },
              },
              createAccount: {
                summary: 'Create account',
                value: {
                  query:
                    'mutation CreateAccount($input: CreateAccountInput!) { createAccount(input: $input) { id accountNumber currency balance status createdAt updatedAt } }',
                  variables: {
                    input: {
                      currency: 'USD',
                    },
                  },
                },
              },
              accounts: {
                summary: 'List accounts',
                value: {
                  query:
                    'query Accounts { accounts { id accountNumber currency balance status createdAt updatedAt } }',
                },
              },
              account: {
                summary: 'Get account',
                value: {
                  query:
                    'query Account($id: ID!) { account(id: $id) { id accountNumber currency balance status createdAt updatedAt } }',
                  variables: {
                    id: '00000000-0000-4000-8000-000000000000',
                  },
                },
              },
              balance: {
                summary: 'Get account balance',
                value: {
                  query: 'query Balance($accountId: ID!) { balance(accountId: $accountId) }',
                  variables: {
                    accountId: '00000000-0000-4000-8000-000000000000',
                  },
                },
              },
              creditAccount: {
                summary: 'Credit account',
                value: {
                  query:
                    'mutation CreditAccount($input: TransactionInput!) { creditAccount(input: $input) { id accountId amount type description createdAt } }',
                  variables: {
                    input: {
                      accountId: '00000000-0000-4000-8000-000000000000',
                      amount: '100.00',
                      description: 'Initial deposit',
                    },
                  },
                },
              },
              debitAccount: {
                summary: 'Debit account',
                value: {
                  query:
                    'mutation DebitAccount($input: TransactionInput!) { debitAccount(input: $input) { id accountId amount type description createdAt } }',
                  variables: {
                    input: {
                      accountId: '00000000-0000-4000-8000-000000000000',
                      amount: '25.00',
                      description: 'Withdrawal',
                    },
                  },
                },
              },
              transactions: {
                summary: 'Transaction history',
                value: {
                  query:
                    'query Transactions($input: TransactionHistoryInput) { transactions(input: $input) { id accountId amount type description createdAt } }',
                  variables: {
                    input: {
                      accountId: '00000000-0000-4000-8000-000000000000',
                      limit: 25,
                      offset: 0,
                    },
                  },
                },
              },
              balanceSummary: {
                summary: 'Balance summary',
                value: {
                  query:
                    'query BalanceSummary($accountId: ID!) { balanceSummary(accountId: $accountId) { accountId currentBalance totalCredits totalDebits } }',
                  variables: {
                    accountId: '00000000-0000-4000-8000-000000000000',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'GraphQL execution result. Validation and resolver errors are returned in the errors array.',
          content: {
            'application/json': {
              schema: GRAPHQL_RESPONSE_SCHEMA,
              examples: {
                health: {
                  summary: 'Health response',
                  value: {
                    data: {
                      health: 'ok',
                    },
                  },
                },
                login: {
                  summary: 'Login response',
                  value: {
                    data: {
                      login: {
                        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        user: {
                          id: '00000000-0000-4000-8000-000000000000',
                          email: 'demo@example.com',
                          name: 'Demo',
                          lastName: 'User',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid GraphQL request, variables, or input data.',
          content: {
            'application/json': {
              schema: GRAPHQL_RESPONSE_SCHEMA,
            },
          },
        },
        401: UNAUTHORIZED_RESPONSE,
      },
    },
  };

  return document;
}
