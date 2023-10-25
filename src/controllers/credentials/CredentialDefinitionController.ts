import type { SchemaId } from '../examples'
import { AnonCredsApi, AnonCredsError, getUnqualifiedCredentialDefinitionId, parseIndyCredentialDefinitionId } from '@aries-framework/anoncreds'
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
      endorse?: boolean
      endorserDid?: string
    },
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {

      const { issuerId, schemaId, tag, endorse, endorserDid } = credentialDefinitionRequest
      const credentialDefinitionPyload = {
        issuerId,
        schemaId,
        tag,
        type: 'CL'
      }
      if (!endorse) {
        const { credentialDefinitionState } = await this.agent.modules.anoncreds.registerCredentialDefinition({
          credentialDefinition: credentialDefinitionPyload,
          options: {}
        })

        const indyCredDefId = parseIndyCredentialDefinitionId(credentialDefinitionState.credentialDefinitionId)
        const getCredentialDefinitionId = await getUnqualifiedCredentialDefinitionId(
          indyCredDefId.namespaceIdentifier,
          indyCredDefId.schemaSeqNo,
          indyCredDefId.tag
        );

        if (credentialDefinitionState.state === CredentialEnum.Finished) {
          credentialDefinitionState.credentialDefinitionId = getCredentialDefinitionId;
        }
        return credentialDefinitionState;
      } else {

        if (!endorserDid) {
          throw new Error('Please provide the endorser DID')
        }

        const createCredDefTxResult = await this.agent.modules.anoncreds.registerCredentialDefinition({
          credentialDefinition: credentialDefinitionPyload,
          options: {
            endorserMode: 'external',
            endorserDid: endorserDid ? endorserDid : '',
          },
        })

        return createCredDefTxResult
      }
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
