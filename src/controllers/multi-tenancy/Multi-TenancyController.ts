import { AcceptProofRequestOptions, Agent, JsonTransformer, KeyType, RecordNotFoundError, TypedArrayEncoder, injectable } from '@aries-framework/core'
import { CreateTenantOptions, GetTenantAgentOptions, WithTenantAgentOptions } from '../types';
import { Body, Controller, Delete, Get, Post, Query, Res, Route, Tags, TsoaResponse, Path } from 'tsoa'
import { TenantAgent } from '@aries-framework/tenants/build/TenantAgent';
import axios from 'axios';
import { TenantRecord } from '@aries-framework/tenants';
import { AnonCredsApi, getUnqualifiedSchemaId, getUnqualifiedCredentialDefinitionId } from '@aries-framework/anoncreds'
import { IndySdkAnonCredsRegistry } from '@aries-framework/indy-sdk'

@Tags("Multi-Tenancy")
@Route("/multi-tenancy")
@injectable()
export class MultiTenancyController extends Controller {
    private readonly agent: Agent;

    public constructor(agent: Agent) {
        super()
        this.agent = agent;
    }

    @Post("/")
    public async createTenant(
        @Body() createTenantOptions: CreateTenantOptions,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const { config, seed } = createTenantOptions;
            const body = {
                role: 'ENDORSER',
                alias: 'Alias',
                seed
            };
            console.log("config", config);
            const tenantRecord: TenantRecord = await this.agent.modules.tenants.createTenant({ config });
            const tenantAgent: TenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId: tenantRecord.id });
            const didRegistration = await axios.post('http://test.bcovrin.vonx.io/register', body);

            if (didRegistration.data) {
                await tenantAgent.dids.import({
                    did: `did:indy:bcovrin:${didRegistration.data.did}`,
                    overwrite: true,
                    privateKeys: [
                        {
                            keyType: KeyType.Ed25519,
                            privateKey: TypedArrayEncoder.fromString(seed),
                        },
                    ],
                });
            }
            console.log("doneee");

            return tenantRecord;
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant not created`,
                });
            }
            return internalServerError(500, { message: `Something went wrong: ${error}` });
        }
    }


    @Get("/:tenantId")
    public async getTenantById(
        @Query("tenantId") tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent: TenantAgent = await this.agent.modules.tenants.getTenantById(tenantId);
            return tenantAgent;
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant with id: ${tenantId} not found.`,
                })
            }
            return internalServerError(500, { message: `Something went wrong: ${error}` })
        }
    }

    @Post("/tenant")
    public async getTenantAgent(
        @Body() tenantAgentOptions: GetTenantAgentOptions,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId: tenantAgentOptions.tenantId });
            return tenantAgent;
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant with id: ${tenantAgentOptions.tenantId} not found.`,
                })
            }
            return internalServerError(500, { message: `Something went wrong: ${error}` })
        }
    }

    @Delete("/:tenantId")
    public async deleteTenantById(
        @Query("tenantId") tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const deleteTenant = await this.agent.modules.tenants.deleteTenantById(tenantId);
            return JsonTransformer.toJSON(deleteTenant);
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant with id: ${tenantId} not found.`,
                })
            }
            return internalServerError(500, { message: `Something went wrong: ${error}` });
        }
    }

    @Post("/with-tenant-agent")
    async withTenantAgent(
        @Body() withTenantAgentOptions: WithTenantAgentOptions,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        const { tenantId, method, payload } = withTenantAgentOptions;
        console.log("STARTING");

        try {
            const result = await new Promise((resolve,) => {
                this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent: TenantAgent) => {
                    switch (method) {
                        case "createInvitation":
                            const config = {
                                autoAcceptConnection: true,
                            }
                            const createInvitation = await tenantAgent.oob.createInvitation(config);

                            resolve({
                                invitationUrl: createInvitation.outOfBandInvitation.toUrl({
                                    domain: this.agent.config.endpoints[0],
                                }),
                                invitation: createInvitation.outOfBandInvitation.toJSON({
                                    useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
                                }),
                                outOfBandRecord: createInvitation.toJSON(),
                            });
                            break;

                        case "receiveInvitation":
                            const { invitationUrl, ...remaining } = payload;
                            const { outOfBandRecord, connectionRecord } = await tenantAgent.oob.receiveInvitationFromUrl(
                                invitationUrl,
                                remaining
                            );
                            console.log("Executed: ", outOfBandRecord.toJSON(), connectionRecord?.toJSON());

                            resolve({
                                outOfBandRecord: outOfBandRecord.toJSON(),
                                connectionRecord: connectionRecord?.toJSON(),
                            });
                            break;

                        case "getConnection":
                            const { connectionId } = payload;
                            const connection = await tenantAgent.connections.findById(connectionId);
                            console.log("Connection: ", connection);
                            resolve({ connection: connection?.toJSON() });
                            break;

                        case "registerSchema":
                            var { issuerId, name, version, attributes } = payload;
                            const getTenantToCreateSchema = await this.agent.modules.tenants.getTenantAgent({ tenantId: tenantId });
                            const { schemaState } = await getTenantToCreateSchema.modules.anoncreds.registerSchema({
                                schema: {
                                    issuerId: issuerId,
                                    name: name,
                                    version: version,
                                    attrNames: attributes
                                },
                                options: {
                                    endorserMode: 'internal',
                                    endorserDid: issuerId,
                                },
                            })
                            console.log("schema registered", schemaState);

                            const getSchemaId = await getUnqualifiedSchemaId(schemaState.schema.issuerId, name, version);
                            if (schemaState.state === 'finished') {
                                const skippedString = getSchemaId.substring('did:indy:bcovrin:'.length);
                                schemaState.schemaId = skippedString
                            }
                            resolve({ schemaState });
                            break;

                        case "registerCredentialDefinition":
                            var { issuerId, schemaId, tag } = payload;
                            const getTenantToCreateCredentialDefinition = await this.agent.modules.tenants.getTenantAgent({ tenantId: tenantId });
                            const { credentialDefinitionState } = await getTenantToCreateCredentialDefinition.modules.anoncreds.registerCredentialDefinition({
                                credentialDefinition: {
                                    issuerId,
                                    schemaId,
                                    tag
                                },
                                options: {}
                            })
                            const indySdkAnonCredsRegistry = new IndySdkAnonCredsRegistry()
                            const schemaDetails = await indySdkAnonCredsRegistry.getSchema(getTenantToCreateCredentialDefinition.context, schemaId)
                            const getCredentialDefinitionId = await getUnqualifiedCredentialDefinitionId(credentialDefinitionState.credentialDefinition.issuerId, `${schemaDetails.schemaMetadata.indyLedgerSeqNo}`, tag);
                            if (credentialDefinitionState.state === 'finished') {
                                const skippedString = getCredentialDefinitionId.substring('did:indy:bcovrin:'.length);
                                credentialDefinitionState.credentialDefinitionId = skippedString
                            }
                            resolve({ credentialDefinitionState });
                            break;

                        case "getConnections":
                            const connections = await tenantAgent.connections.getAll();
                            console.log(`Connections associated ${tenantId} are `, connections);
                            resolve({ connectionRecord: connections });
                            break;

                        case "getCredentials":
                            const credentials = await tenantAgent.credentials.getAll();
                            console.log(`Credentials associated with ${tenantId} are ${credentials}`);
                            resolve({ CredentialExchangeRecord: credentials });
                        case "issueCredential":
                            const offerCredential = await tenantAgent.credentials.offerCredential(payload);
                            console.log("Credential offered: ", offerCredential);
                            resolve({ offerCredential });
                            break;

                        case "acceptOffer":
                            var { credentialRecordId, autoAcceptCredential, comment } = payload;
                            var getTenant = await this.agent.modules.tenants.getTenantAgent({ tenantId });
                            const linkSecretIds = await getTenant.modules.anoncreds.getLinkSecretIds();
                            if (linkSecretIds.length === 0) {
                                await getTenant.modules.anoncreds.createLinkSecret()
                            }
                            const acceptOffer = await tenantAgent.credentials.acceptOffer({
                                credentialRecordId,
                                autoAcceptCredential,
                                comment
                            });
                            console.log("Offer accepted: ", acceptOffer);
                            resolve({ CredentialExchangeRecord: acceptOffer });
                            break;

                        case "createRequestForProofPresentation":
                            const createRequest = await tenantAgent.proofs.requestProof(payload);
                            console.log("Request sent for presentation: ", createRequest);
                            resolve({ ProofExchangeRecord: createRequest.toJSON() });
                            break;

                        case "acceptRequestForProofPresentation":
                            var { proofRecordId, comment } = payload;
                            const requestedCredentials = await tenantAgent.proofs.selectCredentialsForRequest({
                                proofRecordId,
                            });
                            console.log(`Requested credentials: ${requestedCredentials}`);
                            const acceptProofRequest: AcceptProofRequestOptions = {
                                proofRecordId,
                                comment,
                                proofFormats: requestedCredentials.proofFormats,
                            }

                            const acceptRequest = await tenantAgent.proofs.acceptRequest(acceptProofRequest);
                            console.log("accept request executed");
                            console.log("Request has been accepted by sending presentation: ", acceptRequest);
                            resolve({ ProofExchangeRecord: acceptRequest.toJSON() });
                            break;

                        case "acceptPresentation":
                            const acceptPresentation = await tenantAgent.proofs.acceptPresentation(payload);
                            console.log("Presentation accepted: ", acceptPresentation);
                            resolve({ ProofExchangeRecord: acceptPresentation.toJSON() });
                            break;

                        case "getProofs":
                            const presentations = await tenantAgent.proofs.getAll();
                            resolve({ presentations });
                            break;
                    }
                });
            });
            return result;
        } catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant with id: ${tenantId} not found.`,
                });
            }
            return internalServerError(500, { message: `Something went wrong: ${error}` });
        }
    }
}


/*
{
  "_tags": {},
  "metadata": {},
  "id": "4a31567f-8aa9-410a-8324-75022fa86b12", 095012d5-901c-4672-997c-5f27bab1bb9d
  "createdAt": "2023-06-14T14:51:47.901Z",
  "config": {
    "label": "t1",
    "walletConfig": {
      "id": "tenant-4a31567f-8aa9-410a-8324-75022fa86b12",
      "key": "EYciuZyUuJe4ryH1ejgJFFc8dWbaLUQXHmj2wAKNaGuT",
      "keyDerivationMethod": "RAW"
    }
  },
  "updatedAt": "2023-06-14T14:51:47.901Z"
}

{
  "_tags": {},
  "metadata": {},
  "id": "eca61dbc-ff83-4bac-a129-02c795ac18bb", f0496df5-78a9-4e42-b834-caf7b58dbf98
  "createdAt": "2023-06-14T14:52:31.420Z",
  "config": {
    "label": "t2",
    "walletConfig": {
      "id": "tenant-eca61dbc-ff83-4bac-a129-02c795ac18bb",
      "key": "2vE3tDGNhW82JsNS1orDyV4TGraE2m9Wj4LhCzVp4JMy",
      "keyDerivationMethod": "RAW"
    }
  },
  "updatedAt": "2023-06-14T14:52:31.420Z"
}


schema: {
rest-sample_1  |     attrNames: [
rest-sample_1  |       'name'
rest-sample_1  |     ],
rest-sample_1  |     name: 'GM',
rest-sample_1  |     version: '1.1.0',
rest-sample_1  |     id: '2XKsaGBrgRoAqNcSycUvKK:2:GMM:1.1.1',
rest-sample_1  |     ver: '1.0'
rest-sample_1  |   } issuerId: 'did:indy:bcovrin:4HQoJ62U34utYg5Yr9U8bn', KcEztZvgs65UJos8YKvjvT:3:CL:850285:kb

t1: did:indy:bcovrin:KcEztZvgs65UJos8YKvjvT
t2:  did:indy:bcovrin:2TomyR1f669gWwBVqL3HqF 

{
  "schemaState": {
    "state": "finished",
    "schema": {
      "attrNames": [
        "weight"
      ],
      "issuerId": "did:indy:bcovrin:KcEztZvgs65UJos8YKvjvT",
      "name": "gym",
      "version": "1.9.9"
    },
    "schemaId": "KcEztZvgs65UJos8YKvjvT:2:gym:1.9.9"
  }
}

{
  "offerCredential": {
    "_tags": {},
    "metadata": {
      "_anoncreds/credential": {
        "schemaId": "KcEztZvgs65UJos8YKvjvT:2:gym:1.4.9",
        "credentialDefinitionId": "KcEztZvgs65UJos8YKvjvT:3:CL:849543:kb"
      }
    },
    "credentials": [],
    "id": "acb916fa-aa12-4bee-a64e-70176269cdb8",
    "createdAt": "2023-06-14T06:53:54.127Z",
    "state": "offer-sent",
    "connectionId": "6971adfe-85a2-43b5-b720-ec1f585fb88c",
    "threadId": "3fafc8a9-6d24-46c3-9107-258265ac4935",
    "protocolVersion": "v2",
    "credentialAttributes": [
      {
        "name": "weight",
        "value": "62"
      }
    ],
    "updatedAt": "2023-06-14T06:53:56.245Z"
  }
}

{
  "ProofExchangeRecord": {
    "_tags": {},
    "metadata": {},
    "id": "06588a24-2680-4c03-8341-b8c3c7d7ac84",
    "createdAt": "2023-06-14T09:42:35.068Z",
    "protocolVersion": "v1",
    "state": "request-sent",
    "connectionId": "ac410905-2374-4027-95a0-280b14fca701",
    "threadId": "0204e8cd-3e52-48df-9378-b6699e23244a",
    "autoAcceptProof": "always",
    "updatedAt": "2023-06-14T09:42:35.080Z"
  }
}

*/ 