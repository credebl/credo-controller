import { Agent, AriesFrameworkError } from "@aries-framework/core"
import { Body, Controller, Post, Res, Route, Tags, TsoaResponse } from "tsoa"
import { injectable } from "tsyringe"
import { DidNymTransaction, EndorserTransaction, WriteTransaction } from "../types"
import { SchemaId, Version } from "../examples"
import { AnonCredsCredentialDefinition, getUnqualifiedCredentialDefinitionId, getUnqualifiedSchemaId, parseIndyCredentialDefinitionId, parseIndySchemaId } from "@aries-framework/anoncreds"
import { IndyVdrAnonCredsRegistry, IndyVdrDidCreateOptions } from "@aries-framework/indy-vdr"
import { CredentialEnum } from '../../enums/enum';

@Tags('EndorserTransaction')
@Route('/transactions')
@injectable()
export class EndorserTransactionController extends Controller {
  private agent: Agent

  public constructor(agent: Agent) {
    super()
    this.agent = agent
  }

  @Post('/endorse')
  public async endorserTransaction(
    @Body() endorserTransaction: EndorserTransaction,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Res() forbiddenError: TsoaResponse<400, { reason: string }>
  ) {
    try {
      const signedTransaction = await this.agent.modules.indyVdr.endorseTransaction(
        endorserTransaction.transaction,
        endorserTransaction.endorserDid
      )

      return { signedTransaction };
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

  @Post('/set-endorser-role')
  public async didNymTransaction(
    @Body() didNymTransaction: DidNymTransaction,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const didCreateSubmitResult = await this.agent.dids.create<IndyVdrDidCreateOptions>({
        did: didNymTransaction.did,
        options: {
          endorserMode: 'external',
          endorsedTransaction: {
            nymRequest: didNymTransaction.nymRequest,
          },
        }
      })

      return didCreateSubmitResult
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Post('/write')
  public async writeSchemaAndCredDefOnLedger(
    @Res() forbiddenError: TsoaResponse<400, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body()
    writeTransaction: WriteTransaction
  ) {
    try {
      if (writeTransaction.schema) {

        const writeSchema = await this.submitSchemaOnLedger(writeTransaction.schema, writeTransaction.endorsedTransaction);
        return writeSchema;
      } else if (writeTransaction.credentialDefinition) {

        const writeCredDef = await this.submitCredDefOnLedger(writeTransaction.credentialDefinition, writeTransaction.endorsedTransaction);
        return writeCredDef;
      } else {

        throw new Error('Please provide valid schema or credential-def!');
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

  public async submitSchemaOnLedger(
    schema: {
      issuerId: string
      name: string
      version: Version
      attributes: string[]
    },
    endorsedTransaction?: string,
  ) {
    try {

      const { issuerId, name, version, attributes } = schema;
      const { schemaState } = await this.agent.modules.anoncreds.registerSchema({
        options: {
          endorserMode: 'external',
          endorsedTransaction
        },
        schema: {
          attrNames: attributes,
          issuerId: issuerId,
          name: name,
          version: version
        },
      })

      const indySchemaId = parseIndySchemaId(schemaState.schemaId)
      const getSchemaUnqualifiedId = await getUnqualifiedSchemaId(
        indySchemaId.namespaceIdentifier,
        indySchemaId.schemaName,
        indySchemaId.schemaVersion
      );
      if (schemaState.state === CredentialEnum.Finished || schemaState.state === CredentialEnum.Action) {
        schemaState.schemaId = getSchemaUnqualifiedId
      }
      return schemaState;

    } catch (error) {
      return error
    }
  }

  public async submitCredDefOnLedger(
    credentialDefinition: {
      schemaId: string,
      issuerId: string,
      tag: string,
      value: unknown,
      type: string
    },
    endorsedTransaction?: string
  ) {
    try {

      const { credentialDefinitionState } = await this.agent.modules.anoncreds.registerCredentialDefinition({
        credentialDefinition,
        options: {
          endorserMode: 'external',
          endorsedTransaction: endorsedTransaction,
        },
      })

      const indyCredDefId = parseIndyCredentialDefinitionId(credentialDefinitionState.credentialDefinitionId)
      const getCredentialDefinitionId = await getUnqualifiedCredentialDefinitionId(
        indyCredDefId.namespaceIdentifier,
        indyCredDefId.schemaSeqNo,
        indyCredDefId.tag
      );
      if (credentialDefinitionState.state === CredentialEnum.Finished || credentialDefinitionState.state === CredentialEnum.Action) {
        credentialDefinitionState.credentialDefinitionId = getCredentialDefinitionId;
      }
      return credentialDefinitionState;

    } catch (error) {
      return error
    }
  }
}