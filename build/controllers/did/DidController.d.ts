import type { DidCreate } from '../types';
import { Agent } from '@aries-framework/core';
import { Controller, TsoaResponse } from 'tsoa';
import { Did } from '../examples';
export declare class DidController extends Controller {
    private agent;
    constructor(agent: Agent);
    /**
     * Resolves did and returns did resolution result
     * @param did Decentralized Identifier
     * @returns DidResolutionResult
     */
    getDidRecordByDid(did: Did): Promise<{
        importDid: void;
    } | {
        didDocument: Record<string, any>;
        didResolutionMetadata: import("@aries-framework/core").DidResolutionMetadata;
        didDocumentMetadata: import("did-resolver").DIDDocumentMetadata;
        importDid?: undefined;
    }>;
    /**
     * Did nym registration
     * @body DidCreateOptions
     * @returns DidResolutionResult
     */
    writeDid(data: DidCreate, internalServerError: TsoaResponse<500, {
        message: string;
    }>): Promise<any>;
    private handleBcovrin;
    private handleIndicio;
    private createEndorserDid;
    private createIndicioKey;
    private importDid;
    createDidKey(didOptions: DidCreate, internalServerError: TsoaResponse<500, {
        message: string;
    }>): Promise<any>;
    createDidWeb(didOptions: DidCreate, internalServerError: TsoaResponse<500, {
        message: string;
    }>): Promise<any>;
    getDids(internalServerError: TsoaResponse<500, {
        message: string;
    }>): Promise<any>;
}
