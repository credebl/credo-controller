import type { Version } from '../examples'
import { AnonCredsError, AnonCredsApi, getUnqualifiedSchemaId } from '@aries-framework/anoncreds'
import { Agent, AriesFrameworkError, BaseAgent } from '@aries-framework/core'
// import { LedgerError } from '@aries-framework/core/build/modules/ledger/error/LedgerError'
// import { isIndyError } from '@aries-framework/core/build/utils/indyError'
import { Body, Example, Get, Path, Post, Res, Route, Tags, TsoaResponse } from 'tsoa'
import { injectable } from 'tsyringe'
import { SchemaId, SchemaExample } from '../examples'
import { IndyVdrDidCreateOptions, IndyVdrDidCreateResult } from '@aries-framework/indy-vdr'


@Tags('Schemas')
@Route('/schemas')
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
      if (errorMessage instanceof AnonCredsError && errorMessage.message === 'IndyError(LedgerNotFound): LedgerNotFound') {
        return notFoundError(404, {
          reason: `schema definition with schemaId "${schemaId}" not found.`,
        })
      } else if (errorMessage instanceof AnonCredsError && errorMessage.cause instanceof AnonCredsError) {
        if (errorMessage.cause.cause, 'LedgerInvalidTransaction') {
          return forbiddenError(403, {
            reason: `schema definition with schemaId "${schemaId}" can not be returned.`,
          })
        }
        if (errorMessage.cause.cause, 'CommonInvalidStructure') {
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

      const { issuerId, name, version, attributes } = schema;

      const schemaPayload = {
        issuerId: issuerId,
        name: name,
        version: version,
        attrNames: attributes
      }

      if (!schema.endorse) {
        const { schemaState } = await this.agent.modules.anoncreds.registerSchema({
          schema: schemaPayload,
          options: {
            endorserMode: 'internal',
            endorserDid: issuerId,
          },
        })
        const getSchemaUnqualifiedId = await getUnqualifiedSchemaId(schemaState.schema.issuerId, name, version);
        if (schemaState.state === 'finished') {
          const indyNamespace = /did:indy:([^:]+:?(mainnet|testnet)?:?)/.exec(issuerId);
          let schemaId;
          if (indyNamespace) {
            schemaId = getSchemaUnqualifiedId.substring(`did:indy:${indyNamespace[1]}`.length);
          } else {
            throw new Error('No indyNameSpace found')
          }
          schemaState.schemaId = schemaId
        }
        return schemaState;

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
