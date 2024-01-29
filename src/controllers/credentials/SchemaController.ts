import type { Version } from '../examples'

import { AnonCredsError, getUnqualifiedSchemaId, parseIndySchemaId } from '@aries-framework/anoncreds'
import { Agent, AriesFrameworkError } from '@aries-framework/core'
import { injectable } from 'tsyringe'

import { CredentialEnum } from '../../enums/enum'
import { SchemaId, SchemaExample } from '../examples'

import { Body, Example, Get, Path, Post, Res, Route, Tags, TsoaResponse, Security } from 'tsoa'

@Tags('Schemas')
@Route('/schemas')
@Security('apiKey')
@injectable()
export class SchemaController {
  private agent: Agent
  // private anonCredsSchema: AnonCredsApi

  public constructor(agent: Agent) {
    this.agent = agent
    // this.anonCredsSchema = anonCredsSchema
  }

  /**
   * Retrieve schema by schema id
   *
   * @param schemaId
   * @returns Schema
   */
  @Example(SchemaExample)
  @Get('/:schemaId')
  public async getSchemaById(
    @Path('schemaId') schemaId: SchemaId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() forbiddenError: TsoaResponse<403, { reason: string }>,
    @Res() badRequestError: TsoaResponse<400, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      return await this.agent.modules.anoncreds.getSchema(schemaId)
    } catch (errorMessage) {
      if (
        errorMessage instanceof AnonCredsError &&
        errorMessage.message === 'IndyError(LedgerNotFound): LedgerNotFound'
      ) {
        return notFoundError(404, {
          reason: `schema definition with schemaId "${schemaId}" not found.`,
        })
      } else if (errorMessage instanceof AnonCredsError && errorMessage.cause instanceof AnonCredsError) {
        if ((errorMessage.cause.cause, 'LedgerInvalidTransaction')) {
          return forbiddenError(403, {
            reason: `schema definition with schemaId "${schemaId}" can not be returned.`,
          })
        }
        if ((errorMessage.cause.cause, 'CommonInvalidStructure')) {
          return badRequestError(400, {
            reason: `schemaId "${schemaId}" has invalid structure.`,
          })
        }
      }

      return internalServerError(500, { message: `something went wrong: ${errorMessage}` })
    }
  }

  /**
   * Creates a new schema and registers schema on ledger
   *
   * @param schema
   * @returns schema
   */
  @Example(SchemaExample)
  @Post('/')
  public async createSchema(
    @Body()
    schema: {
      issuerId: string
      name: string
      version: Version
      attributes: string[]
      endorse?: boolean
      endorserDid?: string
    },
    @Res() forbiddenError: TsoaResponse<400, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const { issuerId, name, version, attributes } = schema

      const schemaPayload = {
        issuerId: issuerId,
        name: name,
        version: version,
        attrNames: attributes,
      }

      if (!schema.endorse) {
        const { schemaState } = await this.agent.modules.anoncreds.registerSchema({
          schema: schemaPayload,
          options: {
            endorserMode: 'internal',
            endorserDid: issuerId,
          },
        })

        const indySchemaId = parseIndySchemaId(schemaState.schemaId)
        const getSchemaUnqualifiedId = await getUnqualifiedSchemaId(
          indySchemaId.namespaceIdentifier,
          indySchemaId.schemaName,
          indySchemaId.schemaVersion
        )
        if (schemaState.state === CredentialEnum.Finished) {
          schemaState.schemaId = getSchemaUnqualifiedId
        }
        return schemaState
      } else {
        if (!schema.endorserDid) {
          throw new Error('Please provide the endorser DID')
        }

        const createSchemaTxResult = await this.agent.modules.anoncreds.registerSchema({
          options: {
            endorserMode: 'external',
            endorserDid: schema.endorserDid ? schema.endorserDid : '',
          },
          schema: schemaPayload,
        })

        return createSchemaTxResult
      }
    } catch (error) {
      if (error instanceof AriesFrameworkError) {
        if (error.message.includes('UnauthorizedClientRequest')) {
          return forbiddenError(400, {
            reason: 'this action is not allowed.',
          })
        }
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }
}
