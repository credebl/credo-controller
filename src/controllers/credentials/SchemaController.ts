import type { Version } from '../examples'
import { AnonCredsError, AnonCredsApi, getUnqualifiedSchemaId } from '@aries-framework/anoncreds'
import { Agent, AriesFrameworkError, BaseAgent } from '@aries-framework/core'
// import { LedgerError } from '@aries-framework/core/build/modules/ledger/error/LedgerError'
// import { isIndyError } from '@aries-framework/core/build/utils/indyError'
import { Body, Example, Get, Path, Post, Res, Route, Tags, TsoaResponse } from 'tsoa'
import { injectable } from 'tsyringe'
import { SchemaId, SchemaExample } from '../examples'


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
    } catch (error) {
      if (error instanceof AnonCredsError && error.message === 'IndyError(LedgerNotFound): LedgerNotFound') {
        return notFoundError(404, {
          reason: `schema definition with schemaId "${schemaId}" not found.`,
        })
      } else if (error instanceof AnonCredsError && error.cause instanceof AnonCredsError) {
        if (error.cause.cause, 'LedgerInvalidTransaction') {
          return forbiddenError(403, {
            reason: `schema definition with schemaId "${schemaId}" can not be returned.`,
          })
        }
        if (error.cause.cause, 'CommonInvalidStructure') {
          return badRequestError(400, {
            reason: `schemaId "${schemaId}" has invalid structure.`,
          })
        }
      }

      return internalServerError(500, { message: `something went wrong: ${error}` })
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
    },
    @Res() forbiddenError: TsoaResponse<400, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const { schemaState } = await this.agent.modules.anoncreds.registerSchema({
        schema: {
          issuerId: schema.issuerId,
          name: schema.name,
          version: schema.version,
          attrNames: schema.attributes
        },
        options: {
          endorserMode: 'internal',
          endorserDid: schema.issuerId,
        },
      })
      const getSchemaId = await getUnqualifiedSchemaId(schemaState.schema.issuerId, schema.name, schema.version);
      if (schemaState.state === 'finished') {
        const indyNamespace = /did:indy:([^:]+:?(mainnet|testnet)?:?)/.exec(schema.issuerId);
        let schemaId;
        if (indyNamespace) {
          schemaId = getSchemaId.substring(`did:indy:${indyNamespace[1]}`.length);
        } else {
          throw new Error('No indyNameSpace found')
        }
        schemaState.schemaId = schemaId
      }
      return schemaState;
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
