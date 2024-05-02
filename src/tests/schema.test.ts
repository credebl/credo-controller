import type { Express } from 'express'
import { Agent } from '@credo-ts/core'
import { SchemaController } from '../controllers/credentials/SchemaController'
import { getTestAgent } from '../utils/helpers'
import { setupServer } from '../server'
import { handleAnonCredsError } from '../controllers/credentials/CredentialCommonError'

describe('SchemaController', () => {
  let app: Express
  let agent: Agent

  beforeAll(async () => {
    agent = await getTestAgent('Rest Schema Test', 3000)
    app = await setupServer(agent, { port: 3000 })
  })

  describe('get schema by id', () => {
    test('getSchemaById retrieves schema successfully', async () => {
      const mockSchemaId = 'EqUdzqDLy4eP4KtzEYZcVr:2:test:1.6.4'
      const mockSchema = {
        schema: {
          attrNames: ['name'],
          name: 'test',
          version: '1.6.4',
          issuerId: 'EqUdzqDLy4eP4KtzEYZcVr',
        },
        schemaId: 'EqUdzqDLy4eP4KtzEYZcVr:2:test:1.6.4',
        resolutionMetadata: {},
        schemaMetadata: {
          didIndyNamespace: 'bcovrin:testnet',
          indyLedgerSeqNo: 639621,
        },
      }

      const notFoundError = jest.fn()
      const forbiddenError = jest.fn()
      const badRequestError = jest.fn()
      const internalServerError = jest.fn()

      const controller = new SchemaController(agent)

      const result = await controller.getSchemaById(
        mockSchemaId,
        notFoundError,
        forbiddenError,
        badRequestError,
        internalServerError
      )

      expect(result).toBe(mockSchema)
      expect(agent.modules.anoncreds.getSchema).toHaveBeenCalledWith(mockSchemaId)
    })

    test('getSchemaById returns not found error for unsupported method', async () => {
        const mockSchemaId = '12345'
  
        const notFoundError = jest.fn()
        const forbiddenError = jest.fn()
        const badRequestError = jest.fn()
        const internalServerError = jest.fn()
  
        const controller = new SchemaController(agent)
  
        const result = await controller.getSchemaById(
          mockSchemaId,
          notFoundError,
          forbiddenError,
          badRequestError,
          internalServerError
        )
  
        expect(result).toEqual(
          expect.objectContaining({
            statusCode: 404,
            reason: 'Unsupported AnonCreds method',
          })
        )
        expect(agent.modules.anoncreds.getSchema).toHaveBeenCalledWith(mockSchemaId)
      })

      test('getSchemaById returns internal server error for unexpected error', async () => {
        const mockSchemaId = '12345'
        const mockError = new Error('Unexpected error')
  
        const notFoundError = jest.fn()
        const forbiddenError = jest.fn()
        const badRequestError = jest.fn()
        const internalServerError = jest.fn()
  
        const controller = new SchemaController(agent)
  
        const result = await controller.getSchemaById(
          mockSchemaId,
          notFoundError,
          forbiddenError,
          badRequestError,
          internalServerError
        )
  
        expect(result).toEqual(
          expect.objectContaining({
            statusCode: 500,
            reason: 'Internal server error',
          })
        )
        expect(agent.modules.anoncreds.getSchema).toHaveBeenCalledWith(mockSchemaId)
        expect(handleAnonCredsError).toHaveBeenCalledWith(mockError)
      })
  })

  afterAll(async () => {
    await agent.shutdown()
  })
})
