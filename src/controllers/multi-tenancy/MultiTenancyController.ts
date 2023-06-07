import { Agent, DefaultAgentModules, ModulesMap, RecordNotFoundError, inject, injectable } from '@aries-framework/core'
import { CreateTenantOptions, GetTenantAgentOptions, WithTenantAgentCallback } from '../types';
import { TenantRecord, TenantsApi } from '@aries-framework/tenants';
import { Body, Controller, Delete, Get, Post, Query, Res, Route, Tags, TsoaResponse } from 'tsoa'
import { JsonTransformer } from '@aries-framework/core';

@Tags("Multi-Tenancy")
@Route("/multi-tenancy")
@injectable()
export class MultiTenancyController extends Controller {
    private readonly agent: Agent;
    private multiTenancy: TenantsApi;

    /**
     * Initializes a new instance of the MultiTenancyController class.
     *
     * @param agent - The agent instance.
     */
    public constructor(agent: Agent, multiTenancy: TenantsApi) {
        super();
        this.agent = agent;
        this.multiTenancy = multiTenancy;
    }
    /**
     * Retrieve tenant by ID.
     *
     * @param tenantId - The ID of the tenant.
     * @param notFoundError - The response for a not found error.
     * @param internalServerError - The response for an internal server error.
     * @returns The tenant agent.
     */
    @Get("/:id")
    public async getTenantById(
        @Query("tenantId") tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ): Promise<any> {
        try {
            const tenantAgent: TenantRecord = await this.multiTenancy.getTenantById(tenantId);
            return tenantAgent;
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `tenant with tenantId "${tenantId}" not found.`,
                })
            }
            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    /**
     * Delete tenant by ID.
     *
     * @param tenantId - The ID of the tenant.
     * @param notFoundError - The response for a not found error.
     * @param internalServerError - The response for an internal server error.
     * @returns The delete result.
     */
    @Delete("/delete/tenantId")
    public async deleteTenantById(
        @Query("tenantId") tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            this.setStatus(204);
            const tenantAgent = await this.multiTenancy.deleteTenantById(tenantId);
            return tenantAgent;
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `tenant with tenantId "${tenantId}" not found.`,
                })
            }
            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    /**
     * Create a new tenant.
     *
     * @param createTenantOptions - The options for creating the tenant.
     * @param notFoundError - The response for a not found error.
     * @param internalServerError - The response for an internal server error.
     * @returns The created tenant.
     */
    @Post("/")
    public async createTenant(
        @Body() createTenantOptions: CreateTenantOptions,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const createTenantAgent: TenantRecord = await this.multiTenancy.createTenant(createTenantOptions);
            return createTenantAgent;
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant not created`,
                })
            }
            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    /**
     * Retrieve tenant agent by options.
     *
     * @param getTenantAgentOptions - The options for retrieving the tenant agent.
     * @param notFoundError - The response for a not found error.
     * @param internalServerError - The response for an internal server error.
     * @returns The tenant agent.
     */
    @Get("/")
    public async getTenantAgent(
        @Body() getTenantAgentOptions: GetTenantAgentOptions,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.multiTenancy.getTenantAgent(getTenantAgentOptions);
            return tenantAgent;
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `tenant with tenantId "${getTenantAgentOptions.tenantId}" not found.`,
                })
            }
            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    /**
     * Execute actions within the context of a tenant agent.
     *
     * @param options - The options for retrieving the tenant agent.
     * @param withTenantAgentCallback - The callback function to be executed with the retrieved tenant agent.
     * @param notFoundError - The response for a not found error.
     * @param internalServerError - The response for an internal server error.
     * @returns The result of the callback function.
     */
    @Post("/with-tenant-agent")
    async withTenantAgent(
        @Body() options: GetTenantAgentOptions,
        withTenantAgentCallback: WithTenantAgentCallback<DefaultAgentModules>,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const response = await this.multiTenancy.withTenantAgent(options, withTenantAgentCallback);
            return JsonTransformer.toJSON(response);
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `tenant with tenantId "${options.tenantId}" not found.`,
                })
            }
            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

}