import type { SchemaId } from '../examples'
import { AnonCredsApi, AnonCredsError, getUnqualifiedCredentialDefinitionId } from '@aries-framework/anoncreds'
// import { error}

// TODO: Chenged IndySdkError to AriesFrameworkError. If approved, the message must be changed too.
import { Agent, AriesFrameworkError } from '@aries-framework/core'
import { Body, Controller, Example, Get, Path, Post, Res, Route, Tags, TsoaResponse } from 'tsoa'
import { injectable } from 'tsyringe'
import { IndyVdrAnonCredsRegistry } from '@aries-framework/indy-vdr'
import { CredentialDefinitionExample, CredentialDefinitionId } from '../examples'

@Tags('Credential Definitions')
@Route('/credential-definitions')
@injectable()
export class CredentialDefinitionController extends Controller {
  private agent: Agent
  public constructor(agent: Agent) {
    super()
    this.agent = agent
  }

  /**
   * Retrieve credential definition by credential definition id
   *
   * @param credentialDefinitionId
   * @returns CredDef
   */
  @Example(CredentialDefinitionExample)
  @Get('/:credentialDefinitionId')
  public async getCredentialDefinitionById(
    @Path('credentialDefinitionId') credentialDefinitionId: CredentialDefinitionId,
    @Res() badRequestError: TsoaResponse<400, { reason: string }>,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      return await this.agent.modules.anoncreds.getCredentialDefinition(credentialDefinitionId)
    } catch (error) {
      if (error instanceof AriesFrameworkError && error.message === 'IndyError(LedgerNotFound): LedgerNotFound') {
        return notFoundError(404, {
          reason: `credential definition with credentialDefinitionId "${credentialDefinitionId}" not found.`,
        })
      } else if (error instanceof AnonCredsError && error.cause instanceof AriesFrameworkError) {
        if (error.cause.cause, 'CommonInvalidStructure') {
          return badRequestError(400, {
            reason: `credentialDefinitionId "${credentialDefinitionId}" has invalid structure.`,
          })
        }
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Creates a new credential definition.
   *
   * @param credentialDefinitionRequest
   * @returns CredDef
   */
  @Example(CredentialDefinitionExample)
  @Post('/')
  public async createCredentialDefinition(
    @Body()
    credentialDefinitionRequest: {
      issuerId: string
      schemaId: SchemaId
      tag: string
    },
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
  
      const { credentialDefinitionState } = await this.agent.modules.anoncreds.registerCredentialDefinition({
        credentialDefinition: {
          issuerId: credentialDefinitionRequest.issuerId,
          schemaId: credentialDefinitionRequest.schemaId,
          tag: credentialDefinitionRequest.tag
        },
        options: {}
      })
  
      const indyVdrAnonCredsRegistry = new IndyVdrAnonCredsRegistry()
      const schemaDetails = await indyVdrAnonCredsRegistry.getSchema(this.agent.context, credentialDefinitionRequest.schemaId)
      const getCredentialDefinitionId = await getUnqualifiedCredentialDefinitionId(credentialDefinitionState.credentialDefinition.issuerId, `${schemaDetails.schemaMetadata.indyLedgerSeqNo}`, credentialDefinitionRequest.tag);
      if (credentialDefinitionState.state === 'finished') {
  
        const indyNamespaceMatch = /did:indy:([^:]+:?(mainnet|testnet)?:?)/.exec(credentialDefinitionRequest.issuerId);
        let credDefId;
        if (indyNamespaceMatch) {
          credDefId = getCredentialDefinitionId.substring(`did:indy:${indyNamespaceMatch[1]}`.length);
        } else {
          throw new Error('No indyNameSpace found')
        }
  
        credentialDefinitionState.credentialDefinitionId = credDefId;
      }
      return credentialDefinitionState;
    } catch (error) {
      if (error instanceof notFoundError) {
        return notFoundError(404, {
          reason: `schema with schemaId "${credentialDefinitionRequest.schemaId}" not found.`,
        })
      }
  
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }
}
