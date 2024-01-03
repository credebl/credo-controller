import {
  AcceptCredentialOfferOptions,
  AcceptProofRequestOptions,
  Agent,
  AriesFrameworkError,
  Buffer,
  CacheModule,
  ConnectionRecordProps,
  ConnectionRepository,
  ConnectionsModule,
  CreateOutOfBandInvitationConfig,
  CredentialProtocolVersionType,
  CredentialRepository,
  CredentialState,
  CredentialsModule,
  DidDocumentBuilder,
  DidExchangeState,
  DidsModule,
  HandshakeProtocol,
  JsonLdCredentialFormatService,
  JsonTransformer,
  KeyDidCreateOptions,
  KeyType,
  OutOfBandInvitation,
  ProofExchangeRecordProps,
  ProofsModule,
  ProofsProtocolVersionType,
  RecordNotFoundError,
  TypedArrayEncoder,
  V2CredentialProtocol,
  V2ProofProtocol,
  W3cCredentialsModule,
  getEd25519VerificationKey2018,
  injectable,
} from "@aries-framework/core";
import {
  CreateOfferOobOptions,
  CreateOfferOptions,
  CreateProofRequestOobOptions,
  CreateTenantOptions,
  DidCreate,
  DidNymTransaction,
  EndorserTransaction,
  GetTenantAgentOptions,
  ReceiveInvitationByUrlProps,
  ReceiveInvitationProps,
  WithTenantAgentOptions,
  WriteTransaction,
} from "../types";
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Res,
  Route,
  Tags,
  TsoaResponse,
  Path,
  Example,
} from "tsoa";
import axios from "axios";
import { TenantRecord } from "@aries-framework/tenants";
import {
  getUnqualifiedSchemaId,
  getUnqualifiedCredentialDefinitionId,
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  AnonCredsProofFormatService,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  V1CredentialProtocol,
  V1ProofProtocol,
  parseIndyCredentialDefinitionId,
  parseIndySchemaId,
} from "@aries-framework/anoncreds";
import {
  Version,
  SchemaId,
  CredentialDefinitionId,
  RecordId,
  ProofRecordExample,
  ConnectionRecordExample,
} from "../examples";
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrDidCreateOptions,
  IndyVdrDidCreateResult,
  IndyVdrModule,
} from "@aries-framework/indy-vdr";
import { AnonCredsError } from "@aries-framework/anoncreds";
import { RequestProofOptions } from "../types";
import { BCOVRIN_REGISTER_URL, INDICIO_NYM_URL } from "../../utils/util";
import { RestMultiTenantAgentModules } from "../../cliAgent";
import { AnonCredsRsModule } from "@aries-framework/anoncreds-rs";
import { AskarModule } from "@aries-framework/askar";
import { TenantAgent } from "@aries-framework/tenants/build/TenantAgent";
import { CredentialEnum } from "../../enums/enum";

@Tags("MultiTenancy")
@Route("/multi-tenancy")
@injectable()
export class MultiTenancyController extends Controller {
  private readonly agent: Agent<RestMultiTenantAgentModules>;

  public constructor(agent: Agent<RestMultiTenantAgentModules>) {
    super();
    this.agent = agent;
  }

  @Post("/create-tenant")
  public async createTenant(
    @Body() createTenantOptions: CreateTenantOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const { config } = createTenantOptions;
      const tenantRecord: TenantRecord =
        await this.agent.modules.tenants.createTenant({ config });
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId: tenantRecord.id,
      });

      createTenantOptions.role = createTenantOptions.role || "endorser";
      createTenantOptions.method =
        createTenantOptions.method ?? "bcovrin:testnet";
      const didMethod = `did:indy:${createTenantOptions.method}`;

      let result;

      if (createTenantOptions.method.includes("bcovrin")) {
        result = await this.handleBcovrin(
          createTenantOptions,
          tenantAgent,
          didMethod
        );
      } else if (createTenantOptions.method.includes("indicio")) {
        result = await this.handleIndicio(
          createTenantOptions,
          tenantAgent,
          didMethod
        );
      } else if (createTenantOptions.method === "key") {
        result = await this.handleKey(createTenantOptions, tenantAgent);
      } else if (createTenantOptions.method === "web") {
        result = await this.handleWeb(createTenantOptions, tenantAgent);
      } else {
        return internalServerError(500, {
          message: `Invalid method: ${createTenantOptions.method}`,
        });
      }

      return { tenantRecord, ...result };
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `Tenant not created`,
        });
      }
      return internalServerError(500, {
        message: `Something went wrong: ${error}`,
      });
    }
  }

  private async handleBcovrin(
    createTenantOptions: CreateTenantOptions,
    tenantAgent: TenantAgent<{
      askar: AskarModule;
      indyVdr: IndyVdrModule;
      dids: DidsModule;
      anoncreds: AnonCredsModule;
      _anoncreds: AnonCredsRsModule;
      connections: ConnectionsModule;
      proofs: ProofsModule<
        (
          | V1ProofProtocol
          | V2ProofProtocol<
              (LegacyIndyProofFormatService | AnonCredsProofFormatService)[]
            >
        )[]
      >;
      credentials: CredentialsModule<
        (
          | V1CredentialProtocol
          | V2CredentialProtocol<
              (
                | LegacyIndyCredentialFormatService
                | JsonLdCredentialFormatService
                | AnonCredsCredentialFormatService
              )[]
            >
        )[]
      >;
      w3cCredentials: W3cCredentialsModule;
      cache: CacheModule;
    }>,
    didMethod: string
  ) {
    if (createTenantOptions.did) {
      await this.importDid(
        didMethod,
        createTenantOptions.did,
        createTenantOptions.seed,
        tenantAgent
      );
      const resolveResult = await this.agent.dids.resolve(
        `${didMethod}:${createTenantOptions.did}`
      );
      let verkey;
      if (resolveResult.didDocument?.verificationMethod) {
        verkey =
          resolveResult.didDocument.verificationMethod[0].publicKeyBase58;
      }
      return { did: `${didMethod}:${createTenantOptions.did}`, verkey };
    } else {
      if (createTenantOptions?.role?.toLowerCase() === "endorser") {
        const body = {
          role: "ENDORSER",
          alias: "Alias",
          seed: createTenantOptions.seed,
        };
        const res = await axios.post(BCOVRIN_REGISTER_URL, body);

        if (res) {
          const { did } = res?.data || {};
          await this.importDid(
            didMethod,
            did,
            createTenantOptions.seed,
            tenantAgent
          );
          const resolveResult = await this.agent.dids.resolve(
            `${didMethod}:${res.data.did}`
          );
          let verkey;
          if (resolveResult.didDocument?.verificationMethod) {
            verkey =
              resolveResult.didDocument.verificationMethod[0].publicKeyBase58;
          }
          return { did: `${didMethod}:${res.data.did}`, verkey };
        }
      } else {
        const didCreateTxResult =
          (await this.agent.dids.create<IndyVdrDidCreateOptions>({
            method: "indy",
            options: {
              endorserMode: "external",
              endorserDid: createTenantOptions.endorserDid
                ? createTenantOptions.endorserDid
                : "",
            },
          })) as IndyVdrDidCreateResult;
        return { did: didCreateTxResult.didState.did };
      }
    }
  }

  private async handleIndicio(
    createTenantOptions: CreateTenantOptions,
    tenantAgent: TenantAgent<{
      askar: AskarModule;
      indyVdr: IndyVdrModule;
      dids: DidsModule;
      anoncreds: AnonCredsModule;
      _anoncreds: AnonCredsRsModule;
      connections: ConnectionsModule;
      proofs: ProofsModule<
        (
          | V1ProofProtocol
          | V2ProofProtocol<
              (LegacyIndyProofFormatService | AnonCredsProofFormatService)[]
            >
        )[]
      >;
      credentials: CredentialsModule<
        (
          | V1CredentialProtocol
          | V2CredentialProtocol<
              (
                | LegacyIndyCredentialFormatService
                | JsonLdCredentialFormatService
                | AnonCredsCredentialFormatService
              )[]
            >
        )[]
      >;
      w3cCredentials: W3cCredentialsModule;
      cache: CacheModule;
    }>,
    didMethod: string
  ) {
    if (createTenantOptions.did) {
      return await this.handleDidCreation(
        createTenantOptions,
        tenantAgent,
        didMethod
      );
    } else {
      if (createTenantOptions?.role?.toLowerCase() === "endorser") {
        return await this.handleEndorserCreation(
          createTenantOptions,
          tenantAgent,
          didMethod
        );
      } else {
        return await this.handleIndyDidCreation(
          createTenantOptions,
          tenantAgent
        );
      }
    }
  }

  private async handleDidCreation(
    createTenantOptions: CreateTenantOptions,
    tenantAgent: TenantAgent<{
      askar: AskarModule;
      indyVdr: IndyVdrModule;
      dids: DidsModule;
      anoncreds: AnonCredsModule;
      _anoncreds: AnonCredsRsModule;
      connections: ConnectionsModule;
      proofs: ProofsModule<
        (
          | V1ProofProtocol
          | V2ProofProtocol<
              (LegacyIndyProofFormatService | AnonCredsProofFormatService)[]
            >
        )[]
      >;
      credentials: CredentialsModule<
        (
          | V1CredentialProtocol
          | V2CredentialProtocol<
              (
                | LegacyIndyCredentialFormatService
                | JsonLdCredentialFormatService
                | AnonCredsCredentialFormatService
              )[]
            >
        )[]
      >;
      w3cCredentials: W3cCredentialsModule;
      cache: CacheModule;
    }>,
    didMethod: string
  ) {
    await this.importDid(
      didMethod,
      createTenantOptions?.did as string,
      createTenantOptions.seed,
      tenantAgent
    );
    const resolveResult = await this.agent.dids.resolve(
      `${didMethod}:${createTenantOptions.did}`
    );
    let verkey;
    if (resolveResult.didDocument?.verificationMethod) {
      verkey = resolveResult.didDocument.verificationMethod[0].publicKeyBase58;
    }
    return { did: `${didMethod}:${createTenantOptions.did}`, verkey };
  }

  private async handleEndorserCreation(
    createTenantOptions: CreateTenantOptions,
    tenantAgent: TenantAgent<{
      askar: AskarModule;
      indyVdr: IndyVdrModule;
      dids: DidsModule;
      anoncreds: AnonCredsModule;
      _anoncreds: AnonCredsRsModule;
      connections: ConnectionsModule;
      proofs: ProofsModule<
        (
          | V1ProofProtocol
          | V2ProofProtocol<
              (LegacyIndyProofFormatService | AnonCredsProofFormatService)[]
            >
        )[]
      >;
      credentials: CredentialsModule<
        (
          | V1CredentialProtocol
          | V2CredentialProtocol<
              (
                | LegacyIndyCredentialFormatService
                | JsonLdCredentialFormatService
                | AnonCredsCredentialFormatService
              )[]
            >
        )[]
      >;
      w3cCredentials: W3cCredentialsModule;
      cache: CacheModule;
    }>,
    didMethod: string
  ) {
    const key = await this.agent.wallet.createKey({
      privateKey: TypedArrayEncoder.fromString(createTenantOptions.seed),
      keyType: KeyType.Ed25519,
    });
    const buffer = TypedArrayEncoder.fromBase58(key.publicKeyBase58);
    const did = TypedArrayEncoder.toBase58(buffer.slice(0, 16));
    let body;
    if (createTenantOptions.method === "indicio:testnet") {
      body = {
        network: "testnet",
        did,
        verkey: TypedArrayEncoder.toBase58(buffer),
      };
    } else if (createTenantOptions.method === "indicio:demonet") {
      body = {
        network: "demonet",
        did,
        verkey: TypedArrayEncoder.toBase58(buffer),
      };
    }
    const res = await axios.post(INDICIO_NYM_URL, body);

    if (res.data.statusCode === 200) {
      await this.importDid(
        didMethod,
        did,
        createTenantOptions.seed,
        tenantAgent
      );
      const resolveResult = await this.agent.dids.resolve(
        `${didMethod}:${did}`
      );
      let verkey;
      if (resolveResult.didDocument?.verificationMethod) {
        verkey =
          resolveResult.didDocument.verificationMethod[0].publicKeyBase58;
      }
      return { did: `${didMethod}:${body?.did}`, verkey };
    }
  }

  private async handleIndyDidCreation(
    createTenantOptions: CreateTenantOptions,
    tenantAgent: TenantAgent<{
      askar: AskarModule;
      indyVdr: IndyVdrModule;
      dids: DidsModule;
      anoncreds: AnonCredsModule;
      _anoncreds: AnonCredsRsModule;
      connections: ConnectionsModule;
      proofs: ProofsModule<
        (
          | V1ProofProtocol
          | V2ProofProtocol<
              (LegacyIndyProofFormatService | AnonCredsProofFormatService)[]
            >
        )[]
      >;
      credentials: CredentialsModule<
        (
          | V1CredentialProtocol
          | V2CredentialProtocol<
              (
                | LegacyIndyCredentialFormatService
                | JsonLdCredentialFormatService
                | AnonCredsCredentialFormatService
              )[]
            >
        )[]
      >;
      w3cCredentials: W3cCredentialsModule;
      cache: CacheModule;
    }>
  ) {
    const didCreateTxResult = await tenantAgent.dids.create({
      method: "indy",
      options: {
        endorserMode: "external",
        endorserDid: createTenantOptions.endorserDid
          ? createTenantOptions.endorserDid
          : "",
      },
    });
    return { didTx: didCreateTxResult };
  }

  private async handleKey(
    createTenantOptions: CreateTenantOptions,
    tenantAgent: TenantAgent<{
      askar: AskarModule;
      indyVdr: IndyVdrModule;
      dids: DidsModule;
      anoncreds: AnonCredsModule;
      _anoncreds: AnonCredsRsModule;
      connections: ConnectionsModule;
      proofs: ProofsModule<
        (
          | V1ProofProtocol
          | V2ProofProtocol<
              (LegacyIndyProofFormatService | AnonCredsProofFormatService)[]
            >
        )[]
      >;
      credentials: CredentialsModule<
        (
          | V1CredentialProtocol
          | V2CredentialProtocol<
              (
                | LegacyIndyCredentialFormatService
                | JsonLdCredentialFormatService
                | AnonCredsCredentialFormatService
              )[]
            >
        )[]
      >;
      w3cCredentials: W3cCredentialsModule;
      cache: CacheModule;
    }>
  ) {
    const did = await this.agent.dids.create<KeyDidCreateOptions>({
      method: "key",
      options: {
        keyType: KeyType.Ed25519,
      },
      secret: {
        privateKey: TypedArrayEncoder.fromString(createTenantOptions.seed),
      },
    });
    await this.agent.dids.import({
      did: `${did.didState.did}`,
      overwrite: true,
      privateKeys: [
        {
          keyType: KeyType.Ed25519,
          privateKey: TypedArrayEncoder.fromString(createTenantOptions.seed),
        },
      ],
    });
    const resolveResult = await this.agent.dids.resolve(`did:key:${did}`);
    let verkey;
    if (resolveResult.didDocument?.verificationMethod) {
      verkey = resolveResult.didDocument.verificationMethod[0].publicKeyBase58;
    }
    return { did, verkey };
  }

  private async handleWeb(
    createTenantOptions: CreateTenantOptions,
    tenantAgent: TenantAgent<{
      askar: AskarModule;
      indyVdr: IndyVdrModule;
      dids: DidsModule;
      anoncreds: AnonCredsModule;
      _anoncreds: AnonCredsRsModule;
      connections: ConnectionsModule;
      proofs: ProofsModule<
        (
          | V1ProofProtocol
          | V2ProofProtocol<
              (LegacyIndyProofFormatService | AnonCredsProofFormatService)[]
            >
        )[]
      >;
      credentials: CredentialsModule<
        (
          | V1CredentialProtocol
          | V2CredentialProtocol<
              (
                | LegacyIndyCredentialFormatService
                | JsonLdCredentialFormatService
                | AnonCredsCredentialFormatService
              )[]
            >
        )[]
      >;
      w3cCredentials: W3cCredentialsModule;
      cache: CacheModule;
    }>
  ) {
    const domain = "credebl.github.io";
    const did = `did:web:${domain}`;
    const keyId = `${did}#key-1`;
    const key = await this.agent.wallet.createKey({
      keyType: KeyType.Ed25519,
      privateKey: TypedArrayEncoder.fromString(createTenantOptions.seed),
    });
    const didDocument = new DidDocumentBuilder(did)
      .addContext("https://w3id.org/security/suites/ed25519-2018/v1")
      .addVerificationMethod(
        getEd25519VerificationKey2018({ key, id: keyId, controller: did })
      )
      .addAuthentication(keyId)
      .build();
    await this.agent.dids.import({
      did,
      overwrite: true,
      didDocument,
    });
    const resolveResult = await this.agent.dids.resolve(did);
    let verkey;
    if (resolveResult.didDocument?.verificationMethod) {
      verkey = resolveResult.didDocument.verificationMethod[0].publicKeyBase58;
    }
    return { did, verkey };
  }

  private async importDid(
    didMethod: string,
    did: string,
    seed: string,
    tenantAgent: {
      dids: {
        import: (arg0: {
          did: string;
          overwrite: boolean;
          privateKeys: { keyType: KeyType; privateKey: Buffer }[];
        }) => any;
      };
    }
  ) {
    await tenantAgent.dids.import({
      did: `${didMethod}:${did}`,
      overwrite: true,
      privateKeys: [
        {
          keyType: KeyType.Ed25519,
          privateKey: TypedArrayEncoder.fromString(seed),
        },
      ],
    });
  }

  @Post("/transactions/set-endorser-role/:tenantId")
  public async didNymTransaction(
    @Path("tenantId") tenantId: string,
    @Body() didNymTransaction: DidNymTransaction,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId: tenantId,
      });
      const didCreateSubmitResult = await tenantAgent.dids.create({
        did: didNymTransaction.did,
        options: {
          endorserMode: "external",
          endorsedTransaction: {
            nymRequest: didNymTransaction.nymRequest,
          },
        },
      });
      await tenantAgent.dids.import({
        did: didNymTransaction.did,
        overwrite: true,
      });

      return didCreateSubmitResult;
    } catch (error) {
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/transactions/endorse/:tenantId")
  public async endorserTransaction(
    @Path("tenantId") tenantId: string,
    @Body() endorserTransaction: EndorserTransaction,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Res() forbiddenError: TsoaResponse<400, { reason: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const signedTransaction =
        await tenantAgent.modules.indyVdr.endorseTransaction(
          endorserTransaction.transaction,
          endorserTransaction.endorserDid
        );

      return { signedTransaction };
    } catch (error) {
      if (error instanceof AriesFrameworkError) {
        if (error.message.includes("UnauthorizedClientRequest")) {
          return forbiddenError(400, {
            reason: "this action is not allowed.",
          });
        }
      }
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Example<ConnectionRecordProps>(ConnectionRecordExample)
  @Get("/connections/:connectionId/:tenantId")
  public async getConnectionById(
    @Path("tenantId") tenantId: string,
    @Path("connectionId") connectionId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>
  ) {
    const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
      tenantId,
    });
    const connection = await tenantAgent.connections.findById(connectionId);

    if (!connection)
      return notFoundError(404, {
        reason: `connection with connection id "${connectionId}" not found.`,
      });

    return connection.toJSON();
  }

  @Post("/create-invitation/:tenantId")
  public async createInvitation(
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Path("tenantId") tenantId: string,
    @Body()
    config?: Omit<
      CreateOutOfBandInvitationConfig,
      "routing" | "appendedAttachments" | "messages"
    > // props removed because of issues with serialization
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const outOfBandRecord = await tenantAgent.oob.createInvitation(config);

      return {
        invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
          domain: this.agent.config.endpoints[0],
        }),
        invitation: outOfBandRecord.outOfBandInvitation.toJSON({
          useDidSovPrefixWhereAllowed:
            this.agent.config.useDidSovPrefixWhereAllowed,
        }),
        outOfBandRecord: outOfBandRecord.toJSON(),
      };
    } catch (error) {
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/create-legacy-invitation/:tenantId")
  public async createLegacyInvitation(
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Path("tenantId") tenantId: string,
    @Body()
    config?: Omit<
      CreateOutOfBandInvitationConfig,
      "routing" | "appendedAttachments" | "messages"
    > // props removed because of issues with serialization
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const { outOfBandRecord, invitation } =
        await tenantAgent.oob.createLegacyInvitation(config);

      return {
        invitationUrl: invitation.toUrl({
          domain: this.agent.config.endpoints[0],
          useDidSovPrefixWhereAllowed:
            this.agent.config.useDidSovPrefixWhereAllowed,
        }),
        invitation: invitation.toJSON({
          useDidSovPrefixWhereAllowed:
            this.agent.config.useDidSovPrefixWhereAllowed,
        }),
        outOfBandRecord: outOfBandRecord.toJSON(),
      };
    } catch (error) {
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/receive-invitation/:tenantId")
  public async receiveInvitation(
    @Body() invitationRequest: ReceiveInvitationProps,
    @Path("tenantId") tenantId: string,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const { invitation, ...config } = invitationRequest;
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const invite = new OutOfBandInvitation({
        ...invitation,
        handshakeProtocols: invitation.handshake_protocols,
      });
      const { outOfBandRecord, connectionRecord } =
        await tenantAgent.oob.receiveInvitation(invite, config);

      return {
        outOfBandRecord: outOfBandRecord.toJSON(),
        connectionRecord: connectionRecord?.toJSON(),
      };
    } catch (error) {
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/receive-invitation-url/:tenantId")
  public async receiveInvitationFromUrl(
    @Body() invitationRequest: ReceiveInvitationByUrlProps,
    @Path("tenantId") tenantId: string,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const { invitationUrl, ...config } = invitationRequest;
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const { outOfBandRecord, connectionRecord } =
        await tenantAgent.oob.receiveInvitationFromUrl(invitationUrl, config);

      return {
        outOfBandRecord: outOfBandRecord.toJSON(),
        connectionRecord: connectionRecord?.toJSON(),
      };
    } catch (error) {
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Get("/oob/:invitationId/:tenantId")
  public async getAllOutOfBandRecords(
    @Path("tenantId") tenantId: string,
    @Path("invitationId") invitationId?: string
  ) {
    const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
      tenantId,
    });

    let outOfBandRecords = await tenantAgent.oob.getAll();

    if (invitationId)
      outOfBandRecords = outOfBandRecords.filter(
        (o: any) => o.outOfBandInvitation.id === invitationId
      );

    return outOfBandRecords.map((c: any) => c.toJSON());
  }

  @Get("/connections/:tenantId")
  public async getAllConnections(
    @Path("tenantId") tenantId: string,
    @Query("outOfBandId") outOfBandId?: string,
    @Query("alias") alias?: string,
    @Query("state") state?: DidExchangeState,
    @Query("myDid") myDid?: string,
    @Query("theirDid") theirDid?: string,
    @Query("theirLabel") theirLabel?: string
  ) {
    let connections;
    const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
      tenantId,
    });
    if (outOfBandId) {
      connections = await tenantAgent.connections.findAllByOutOfBandId(
        outOfBandId
      );
    } else {
      const connectionRepository =
        tenantAgent.dependencyManager.resolve(ConnectionRepository);

      const connections = await connectionRepository.findByQuery(
        tenantAgent.context,
        {
          alias,
          myDid,
          theirDid,
          theirLabel,
          state,
        }
      );

      return connections.map((c: any) => c.toJSON());
    }
  }

  @Get("/url/:tenantId/:invitationId")
  public async getInvitation(
    @Path("invitationId") invitationId: string,
    @Path("tenantId") tenantId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>
  ) {
    const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
      tenantId,
    });
    const outOfBandRecord = await tenantAgent.oob.findByCreatedInvitationId(
      invitationId
    );

    if (!outOfBandRecord || outOfBandRecord.state !== "await-response")
      return notFoundError(404, {
        reason: `connection with invitationId "${invitationId}" not found.`,
      });

    const invitationJson = outOfBandRecord.outOfBandInvitation.toJSON({
      useDidSovPrefixWhereAllowed: true,
    });

    return invitationJson;
  }

  @Post("/schema/:tenantId")
  public async createSchema(
    @Body()
    schema: {
      issuerId: string;
      name: string;
      version: Version;
      attributes: string[];
      endorse?: boolean;
      endorserDid?: string;
    },
    @Path("tenantId") tenantId: string,
    @Res() forbiddenError: TsoaResponse<400, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      if (!schema.endorse) {
        const { schemaState } =
          await tenantAgent.modules.anoncreds.registerSchema({
            schema: {
              issuerId: schema.issuerId,
              name: schema.name,
              version: schema.version,
              attrNames: schema.attributes,
            },
            options: {
              endorserMode: "internal",
              endorserDid: schema.issuerId,
            },
          });

        if (!schemaState.schemaId) {
          throw Error("SchemaId not found");
        }

        const indySchemaId = parseIndySchemaId(schemaState.schemaId);
        const getSchemaId = await getUnqualifiedSchemaId(
          indySchemaId.namespaceIdentifier,
          indySchemaId.schemaName,
          indySchemaId.schemaVersion
        );
        if (schemaState.state === CredentialEnum.Finished) {
          schemaState.schemaId = getSchemaId;
        }

        return schemaState;
      } else {
        if (!schema.endorserDid) {
          throw new Error("Please provide the endorser DID");
        }

        const createSchemaTxResult =
          await tenantAgent.modules.anoncreds.registerSchema({
            options: {
              endorserMode: "external",
              endorserDid: schema.endorserDid ? schema.endorserDid : "",
            },
            schema: {
              attrNames: schema.attributes,
              issuerId: schema.issuerId,
              name: schema.name,
              version: schema.version,
            },
          });

        return createSchemaTxResult;
      }
    } catch (error) {
      if (error instanceof AriesFrameworkError) {
        if (error.message.includes("UnauthorizedClientRequest")) {
          return forbiddenError(400, {
            reason: "this action is not allowed.",
          });
        }
      }
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/transactions/write/:tenantId")
  public async writeSchemaAndCredDefOnLedger(
    @Path("tenantId") tenantId: string,
    @Res() forbiddenError: TsoaResponse<400, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body()
    writeTransaction: WriteTransaction
  ) {
    try {
      if (writeTransaction.schema) {
        const writeSchema = await this.submitSchemaOnLedger(
          writeTransaction.schema,
          writeTransaction.endorsedTransaction,
          tenantId
        );
        return writeSchema;
      } else if (writeTransaction.credentialDefinition) {
        const writeCredDef = await this.submitCredDefOnLedger(
          writeTransaction.credentialDefinition,
          writeTransaction.endorsedTransaction,
          tenantId
        );
        return writeCredDef;
      } else {
        throw new Error("Please provide valid schema or credential-def!");
      }
    } catch (error) {
      if (error instanceof AriesFrameworkError) {
        if (error.message.includes("UnauthorizedClientRequest")) {
          return forbiddenError(400, {
            reason: "this action is not allowed.",
          });
        }
      }
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  public async submitSchemaOnLedger(
    schema: {
      issuerId: string;
      name: string;
      version: Version;
      attributes: string[];
    },
    endorsedTransaction: string,
    tenantId: string
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const { issuerId, name, version, attributes } = schema;
      const { schemaState } =
        await tenantAgent.modules.anoncreds.registerSchema({
          options: {
            endorserMode: "external",
            endorsedTransaction,
          },
          schema: {
            attrNames: attributes,
            issuerId: issuerId,
            name: name,
            version: version,
          },
        });

      if (!schemaState.schemaId) {
        throw Error("SchemaId not found");
      }

      const indySchemaId = parseIndySchemaId(schemaState.schemaId);
      const getSchemaUnqualifiedId = await getUnqualifiedSchemaId(
        indySchemaId.namespaceIdentifier,
        indySchemaId.schemaName,
        indySchemaId.schemaVersion
      );
      if (
        schemaState.state === CredentialEnum.Finished ||
        schemaState.state === CredentialEnum.Action
      ) {
        schemaState.schemaId = getSchemaUnqualifiedId;
      }

      return schemaState;
    } catch (error) {
      return error;
    }
  }

  public async submitCredDefOnLedger(
    credentialDefinition: {
      schemaId: string;
      issuerId: string;
      tag: string;
      value: unknown;
      type: string;
    },
    endorsedTransaction: string,
    tenantId: string
  ) {
    try {
      const { issuerId, schemaId, tag } = credentialDefinition;
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const { credentialDefinitionState } =
        await tenantAgent.modules.anoncreds.registerCredentialDefinition({
          credentialDefinition,
          options: {
            endorserMode: "external",
            endorsedTransaction: endorsedTransaction,
          },
        });

      if (!credentialDefinitionState.credentialDefinitionId) {
        throw Error("Credential Definition Id not found");
      }

      const indyCredDefId = parseIndyCredentialDefinitionId(
        credentialDefinitionState.credentialDefinitionId
      );
      const getCredentialDefinitionId =
        await getUnqualifiedCredentialDefinitionId(
          indyCredDefId.namespaceIdentifier,
          indyCredDefId.schemaSeqNo,
          indyCredDefId.tag
        );
      if (
        credentialDefinitionState.state === CredentialEnum.Finished ||
        credentialDefinitionState.state === CredentialEnum.Action
      ) {
        credentialDefinitionState.credentialDefinitionId =
          getCredentialDefinitionId;
      }

      return credentialDefinitionState;
    } catch (error) {
      return error;
    }
  }

  @Get("/schema/:schemaId/:tenantId")
  public async getSchemaById(
    @Path("schemaId") schemaId: SchemaId,
    @Path("tenantId") tenantId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() forbiddenError: TsoaResponse<403, { reason: string }>,
    @Res() badRequestError: TsoaResponse<400, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const getSchema = await tenantAgent.modules.anoncreds.getSchema(schemaId);

      return getSchema;
    } catch (error) {
      if (
        error instanceof AnonCredsError &&
        error.message === "IndyError(LedgerNotFound): LedgerNotFound"
      ) {
        return notFoundError(404, {
          reason: `schema definition with schemaId "${schemaId}" not found.`,
        });
      } else if (
        error instanceof AnonCredsError &&
        error.cause instanceof AnonCredsError
      ) {
        if ((error.cause.cause, "LedgerInvalidTransaction")) {
          return forbiddenError(403, {
            reason: `schema definition with schemaId "${schemaId}" can not be returned.`,
          });
        }
        if ((error.cause.cause, "CommonInvalidStructure")) {
          return badRequestError(400, {
            reason: `schemaId "${schemaId}" has invalid structure.`,
          });
        }
      }

      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/credential-definition/:tenantId")
  public async createCredentialDefinition(
    @Body()
    credentialDefinitionRequest: {
      issuerId: string;
      schemaId: string;
      tag: string;
      endorse?: boolean;
      endorserDid?: string;
    },
    @Path("tenantId") tenantId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      credentialDefinitionRequest.endorse = credentialDefinitionRequest.endorse
        ? credentialDefinitionRequest.endorse
        : false;
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });

      if (!credentialDefinitionRequest.endorse) {
        const { credentialDefinitionState } =
          await tenantAgent.modules.anoncreds.registerCredentialDefinition({
            credentialDefinition: {
              issuerId: credentialDefinitionRequest.issuerId,
              schemaId: credentialDefinitionRequest.schemaId,
              tag: credentialDefinitionRequest.tag,
            },
            options: {},
          });
        if (!credentialDefinitionState?.credentialDefinitionId) {
          throw new Error("Credential Definition Id not found");
        }
        const indyCredDefId = parseIndyCredentialDefinitionId(
          credentialDefinitionState.credentialDefinitionId
        );
        const getCredentialDefinitionId =
          await getUnqualifiedCredentialDefinitionId(
            indyCredDefId.namespaceIdentifier,
            indyCredDefId.schemaSeqNo,
            indyCredDefId.tag
          );
        if (credentialDefinitionState.state === CredentialEnum.Finished) {
          credentialDefinitionState.credentialDefinitionId =
            getCredentialDefinitionId;
        }

        return credentialDefinitionState;
      } else {
        const createCredDefTxResult =
          await tenantAgent.modules.anoncreds.registerCredentialDefinition({
            credentialDefinition: {
              issuerId: credentialDefinitionRequest.issuerId,
              tag: credentialDefinitionRequest.tag,
              schemaId: credentialDefinitionRequest.schemaId,
              type: "CL",
            },
            options: {
              endorserMode: "external",
              endorserDid: credentialDefinitionRequest.endorserDid
                ? credentialDefinitionRequest.endorserDid
                : "",
            },
          });

        return createCredDefTxResult;
      }
    } catch (error) {
      if (error instanceof notFoundError) {
        return notFoundError(404, {
          reason: `schema with schemaId "${credentialDefinitionRequest.schemaId}" not found.`,
        });
      }

      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Get("/credential-definition/:credentialDefinitionId/:tenantId")
  public async getCredentialDefinitionById(
    @Path("credentialDefinitionId")
    credentialDefinitionId: CredentialDefinitionId,
    @Path("tenantId") tenantId: string,
    @Res() badRequestError: TsoaResponse<400, { reason: string }>,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const getCredDef =
        await tenantAgent.modules.anoncreds.getCredentialDefinition(
          credentialDefinitionId
        );

      return getCredDef;
    } catch (error) {
      if (
        error instanceof AriesFrameworkError &&
        error.message === "IndyError(LedgerNotFound): LedgerNotFound"
      ) {
        return notFoundError(404, {
          reason: `credential definition with credentialDefinitionId "${credentialDefinitionId}" not found.`,
        });
      } else if (
        error instanceof AnonCredsError &&
        error.cause instanceof AriesFrameworkError
      ) {
        if ((error.cause.cause, "CommonInvalidStructure")) {
          return badRequestError(400, {
            reason: `credentialDefinitionId "${credentialDefinitionId}" has invalid structure.`,
          });
        }
      }
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/credentials/create-offer/:tenantId")
  public async createOffer(
    @Body() createOfferOptions: CreateOfferOptions,
    @Path("tenantId") tenantId: string,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const offer = await tenantAgent.credentials.offerCredential({
        connectionId: createOfferOptions.connectionId,
        protocolVersion:
          createOfferOptions.protocolVersion as CredentialProtocolVersionType<
            []
          >,
        credentialFormats: createOfferOptions.credentialFormats,
        autoAcceptCredential: createOfferOptions.autoAcceptCredential,
      });

      return offer;
    } catch (error) {
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/credentials/create-offer-oob/:tenantId")
  public async createOfferOob(
    @Path("tenantId") tenantId: string,
    @Body() createOfferOptions: CreateOfferOobOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const linkSecretIds =
        await tenantAgent.modules.anoncreds.getLinkSecretIds();
      if (linkSecretIds.length === 0) {
        await tenantAgent.modules.anoncreds.createLinkSecret();
      }

      const offerOob = await tenantAgent.credentials.createOffer({
        protocolVersion:
          createOfferOptions.protocolVersion as CredentialProtocolVersionType<
            []
          >,
        credentialFormats: createOfferOptions.credentialFormats,
        autoAcceptCredential: createOfferOptions.autoAcceptCredential,
        comment: createOfferOptions.comment,
      });

      const credentialMessage = offerOob.message;
      const outOfBandRecord = await tenantAgent.oob.createInvitation({
        label: createOfferOptions.label,
        handshakeProtocols: [HandshakeProtocol.Connections],
        messages: [credentialMessage],
        autoAcceptConnection: true,
      });

      return {
        invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
          domain: this.agent.config.endpoints[0],
        }),
        invitation: outOfBandRecord.outOfBandInvitation.toJSON({
          useDidSovPrefixWhereAllowed:
            this.agent.config.useDidSovPrefixWhereAllowed,
        }),
        outOfBandRecord: outOfBandRecord.toJSON(),
      };
    } catch (error) {
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/credentials/accept-offer/:tenantId")
  public async acceptOffer(
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Path("tenantId") tenantId: string,
    @Body() acceptCredentialOfferOptions: AcceptCredentialOfferOptions
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const linkSecretIds =
        await tenantAgent.modules.anoncreds.getLinkSecretIds();
      if (linkSecretIds.length === 0) {
        await tenantAgent.modules.anoncreds.createLinkSecret();
      }
      const acceptOffer = await tenantAgent.credentials.acceptOffer({
        credentialRecordId: acceptCredentialOfferOptions.credentialRecordId,
        credentialFormats: acceptCredentialOfferOptions.credentialFormats,
        autoAcceptCredential: acceptCredentialOfferOptions.autoAcceptCredential,
        comment: acceptCredentialOfferOptions.comment,
      });

      return acceptOffer;
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record id "${acceptCredentialOfferOptions.credentialRecordId}" not found.`,
        });
      }
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Get("/credentials/:credentialRecordId/:tenantId")
  public async getCredentialById(
    @Path("credentialRecordId") credentialRecordId: RecordId,
    @Path("tenantId") tenantId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const credential = await tenantAgent.credentials.getById(
        credentialRecordId
      );

      return credential.toJSON();
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record id "${credentialRecordId}" not found.`,
        });
      }
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Get("/credentials/:tenantId")
  public async getAllCredentials(
    @Path("tenantId") tenantId: string,
    @Query("threadId") threadId?: string,
    @Query("connectionId") connectionId?: string,
    @Query("state") state?: CredentialState
  ) {
    const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
      tenantId,
    });
    const credentialRepository =
      tenantAgent.dependencyManager.resolve(CredentialRepository);

    const credentials = await credentialRepository.findByQuery(
      tenantAgent.context,
      {
        connectionId,
        threadId,
        state,
      }
    );

    return credentials.map((c: any) => c.toJSON());
  }

  @Get("/proofs/:tenantId")
  public async getAllProofs(
    @Path("tenantId") tenantId: string,
    @Query("threadId") threadId?: string
  ) {
    const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
      tenantId,
    });

    let proofs = await tenantAgent.proofs.getAll();

    if (threadId) proofs = proofs.filter((p: any) => p.threadId === threadId);

    return proofs.map((proof: any) => proof.toJSON());
  }

  @Get("/form-data/:tenantId/:proofRecordId")
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async proofFormData(
    @Path("proofRecordId") proofRecordId: string,
    @Path("tenantId") tenantId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const proof = await tenantAgent.proofs.getFormatData(proofRecordId);

      return proof;
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proofRecordId "${proofRecordId}" not found.`,
        });
      }
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/proofs/request-proof/:tenantId")
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async requestProof(
    @Body() requestProofOptions: RequestProofOptions,
    @Path("tenantId") tenantId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });



      const requestProofPayload = {
        connectionId: requestProofOptions.connectionId,
        protocolVersion:
          requestProofOptions.protocolVersion as ProofsProtocolVersionType<[]>,
        comment: requestProofOptions.comment,
        proofFormats: requestProofOptions.proofFormats,
        autoAcceptProof: requestProofOptions.autoAcceptProof,
        goalCode: requestProofOptions.goalCode,
        parentThreadId: requestProofOptions.parentThreadId,
        willConfirm: requestProofOptions.willConfirm,
      };
  
      const proof = await tenantAgent.proofs.requestProof(requestProofPayload);

      return proof;
    } catch (error) {
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/proofs/create-request-oob/:tenantId")
  public async createRequest(
    @Path("tenantId") tenantId: string,
    @Body() createRequestOptions: CreateProofRequestOobOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const proof = await tenantAgent.proofs.createRequest({
        protocolVersion:











        
          createRequestOptions.protocolVersion as ProofsProtocolVersionType<[]>,
        proofFormats: createRequestOptions.proofFormats,
        goalCode: createRequestOptions.goalCode,
        willConfirm: createRequestOptions.willConfirm,
        parentThreadId: createRequestOptions.parentThreadId,
        autoAcceptProof: createRequestOptions.autoAcceptProof,
        comment: createRequestOptions.comment,
      });

      const proofMessage = proof.message;
      const outOfBandRecord = await tenantAgent.oob.createInvitation({
        label: createRequestOptions.label,
        handshakeProtocols: [HandshakeProtocol.Connections],
        messages: [proofMessage],
        autoAcceptConnection: true,
      });

      return {
        invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
          domain: this.agent.config.endpoints[0],
        }),
        invitation: outOfBandRecord.outOfBandInvitation.toJSON({
          useDidSovPrefixWhereAllowed:
            this.agent.config.useDidSovPrefixWhereAllowed,
        }),
        outOfBandRecord: outOfBandRecord.toJSON(),
      };
    } catch (error) {
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/proofs/:proofRecordId/accept-request/:tenantId")
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async acceptRequest(
    @Path("tenantId") tenantId: string,
    @Path("proofRecordId") proofRecordId: string,
    @Body()
    request: {
      filterByPresentationPreview?: boolean;
      filterByNonRevocationRequirements?: boolean;
      comment?: string;
    },
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const requestedCredentials =
        await tenantAgent.proofs.selectCredentialsForRequest({
          proofRecordId,
        });

      const acceptProofRequest: AcceptProofRequestOptions = {
        proofRecordId,
        comment: request.comment,
        proofFormats: requestedCredentials.proofFormats,
      };

      const proof = await tenantAgent.proofs.acceptRequest(acceptProofRequest);

      return proof.toJSON();
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proofRecordId "${proofRecordId}" not found.`,
        });
      }
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Post("/proofs/:proofRecordId/accept-presentation/:tenantId")
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async acceptPresentation(
    @Path("tenantId") tenantId: string,
    @Path("proofRecordId") proofRecordId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const proof = await tenantAgent.proofs.acceptPresentation({
        proofRecordId,
      });

      return proof;
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proofRecordId "${proofRecordId}" not found.`,
        });
      }
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Get("/proofs/:proofRecordId/:tenantId")
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async getProofById(
    @Path("tenantId") tenantId: string,
    @Path("proofRecordId") proofRecordId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
      const proof = await tenantAgent.proofs.getById(proofRecordId);

      return proof.toJSON();
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proofRecordId "${proofRecordId}" not found.`,
        });
      }
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }

  @Get(":tenantId")
  public async getTenantById(
    @Path("tenantId") tenantId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantById(
        tenantId
      );
      return tenantAgent;
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `Tenant with id: ${tenantId} not found.`,
        });
      }
      return internalServerError(500, {
        message: `Something went wrong: ${error}`,
      });
    }
  }

  @Post("tenant")
  public async getTenantAgent(
    @Body() tenantAgentOptions: GetTenantAgentOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId: tenantAgentOptions.tenantId,
      });

      return tenantAgent;
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `Tenant with id: ${tenantAgentOptions.tenantId} not found.`,
        });
      }
      return internalServerError(500, {
        message: `Something went wrong: ${error}`,
      });
    }
  }

  @Delete(":tenantId")
  public async deleteTenantById(
    @Path("tenantId") tenantId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const deleteTenant = await this.agent.modules.tenants.deleteTenantById(
        tenantId
      );
      return JsonTransformer.toJSON(deleteTenant);
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `Tenant with id: ${tenantId} not found.`,
        });
      }
      return internalServerError(500, {
        message: `Something went wrong: ${error}`,
      });
    }
  }

  async registerSchemaWithTenant(tenantAgent: any, payload: any) {
    const { issuerId, name, version, attributes } = payload;
    const { schemaState } = await tenantAgent.modules.anoncreds.registerSchema({
      schema: {
        issuerId: issuerId,
        name: name,
        version: version,
        attrNames: attributes,
      },
      options: {
        endorserMode: "internal",
        endorserDid: issuerId,
      },
    });

    if (!schemaState.schemaId) {
      throw Error("SchemaId not found");
    }

    const indySchemaId = parseIndySchemaId(schemaState.schemaId);
    const getSchemaId = await getUnqualifiedSchemaId(
      indySchemaId.namespaceIdentifier,
      indySchemaId.schemaName,
      indySchemaId.schemaVersion
    );
    if (schemaState.state === CredentialEnum.Finished) {
      schemaState.schemaId = getSchemaId;
    }

    return schemaState;
  }

  async getSchemaWithTenant(tenantAgent: any, schemaId: any) {
    const schema = await tenantAgent.modules.anoncreds.getSchema(schemaId);

    return schema;
  }

  async getCredentialDefinition(tenantAgent: any, credentialDefinitionId: any) {
    const credDef = await tenantAgent.modules.anoncreds.getCredentialDefinition(
      credentialDefinitionId
    );

    return credDef;
  }

  async createCredentialDefinitionWithTenant(tenantAgent: any, payload: any) {
    const { issuerId, schemaId, tag } = payload;
    const { credentialDefinitionState } =
      await tenantAgent.modules.anoncreds.registerCredentialDefinition({
        credentialDefinition: {
          issuerId,
          schemaId,
          tag,
        },
        options: {},
      });

    if (!credentialDefinitionState.credentialDefinitionId) {
      throw Error("Credential Definition Id not found");
    }

    const indyCredDefId = parseIndyCredentialDefinitionId(
      credentialDefinitionState.credentialDefinitionId
    );
    const getCredentialDefinitionId =
      await getUnqualifiedCredentialDefinitionId(
        indyCredDefId.namespaceIdentifier,
        indyCredDefId.schemaSeqNo,
        indyCredDefId.tag
      );
    if (credentialDefinitionState.state === CredentialEnum.Finished) {
      credentialDefinitionState.credentialDefinitionId =
        getCredentialDefinitionId;
    }

    return credentialDefinitionState;
  }

  async createInvitationWithTenant(tenantAgent: any) {
    const config = {
      autoAcceptConnection: true,
    };
    const createInvitation = await tenantAgent.oob.createInvitation(config);

    return {
      invitationUrl: createInvitation.outOfBandInvitation.toUrl({
        domain: this.agent.config.endpoints[0],
      }),
      invitation: createInvitation.outOfBandInvitation.toJSON({
        useDidSovPrefixWhereAllowed:
          this.agent.config.useDidSovPrefixWhereAllowed,
      }),
      outOfBandRecord: createInvitation.toJSON(),
    };
  }

  async receiveInvitationWithTenant(tenantAgent: any, payload: any) {
    const { invitationUrl, remaining } = payload;
    const { outOfBandRecord, connectionRecord } =
      await tenantAgent.oob.receiveInvitationFromUrl(invitationUrl, remaining);

    return {
      outOfBandRecord: outOfBandRecord.toJSON(),
      connectionRecord: connectionRecord?.toJSON(),
    };
  }

  async acceptOfferWithTenant(tenantAgent: any, payload: any) {
    const { credentialRecordId, autoAcceptCredential, comment } = payload;
    const linkSecretIds =
      await tenantAgent.modules.anoncreds.getLinkSecretIds();
    if (linkSecretIds.length === 0) {
      await tenantAgent.modules.anoncreds.createLinkSecret();
    }
    const acceptOffer = await tenantAgent.credentials.acceptOffer({
      credentialRecordId,
      autoAcceptCredential,
      comment,
    });

    return { CredentialExchangeRecord: acceptOffer };
  }

  @Post("/did/key:tenantId")
  public async createDidKey(
    @Path("tenantId") tenantId: string,
    @Body() didOptions: DidCreate,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const tenantAgent = await this.agent.modules.tenants.getTenantAgent({
        tenantId,
      });
    
      const did = await tenantAgent.dids.create<KeyDidCreateOptions>({
        method: "key",
        options: {
          // keyType: KeyType.Bls12381g2,
          keyType: KeyType.Ed25519,
        },
        secret: {
          privateKey: TypedArrayEncoder.fromString(didOptions.seed),
        },
      });
      return { did: `${did.didState.did}` };
    } catch (error) {
      return internalServerError(500, {
        message: `something went wrong: ${error}`,
      });
    }
  }
}
