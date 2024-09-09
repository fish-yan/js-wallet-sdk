/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider, Dictionary, external,
    internal,
    MessageRelaxed,
    OutActionSendMsg,
    Sender,
    SendMode, storeMessage,
    storeMessageRelaxed
} from "../../../ton-core";
import { Maybe } from "../../utils/maybe";
import { sign } from "../../../ton-crypto";
import { storeWalletIdV5R1, WalletIdV5R1 } from "./WalletV5R1WalletId";
import { SendArgsSignable, SendArgsSigned } from "../signing/signer";
import { createWalletTransferV5R1 } from "../signing/createWalletTransfer";
import { OutActionWalletV5 } from "./WalletV5OutActions";



export type WalletV5R1BasicSendArgs = {
    seqno: number;
    timeout?: Maybe<number>;
}

export type WalletV5R1SendArgsSinged = WalletV5R1BasicSendArgs
    & SendArgsSigned
    & { authType?: 'external' | 'internal';};

export type WalletV5R1SendArgsSignable = WalletV5R1BasicSendArgs
    & SendArgsSignable
    & {  authType?: 'external' | 'internal'; };

export type Wallet5VR1SendArgsExtensionAuth = WalletV5R1BasicSendArgs & {
    authType: 'extension';
    queryId?: bigint;
}

export type WalletV5R1SendArgs =
    | WalletV5R1SendArgsSinged
    | WalletV5R1SendArgsSignable
    | Wallet5VR1SendArgsExtensionAuth;

export type WalletV5R1PackedCell<T> =  T extends WalletV5R1SendArgsSignable ? Promise<Cell> : Cell;

export const TestWalletId: WalletIdV5R1 = {
    networkGlobalId: -3,
    context: {
        walletVersion: 'v5r1',
        workchain: 0,
        subwalletNumber: 0
    }
}

export const MainnetWalletId: WalletIdV5R1 = {
    networkGlobalId: -239,
    context: {
        walletVersion: 'v5r1',
        workchain: 0,
        subwalletNumber: 0
    }
}

class WalletContractV5 implements Contract {

    static OpCodes = {
        auth_extension: 0x6578746e,
        auth_signed_external: 0x7369676e,
        auth_signed_internal: 0x73696e74
    }

    readonly workchain: number;
    readonly publicKey: Buffer;
    readonly address: Address;
    readonly walletId: WalletIdV5R1;
    readonly init: { data: Cell, code: Cell };
    

    constructor(codeString: string, workchain: number, publicKey: Buffer, walletId?: WalletIdV5R1) {

        // Resolve parameters
        this.workchain = workchain;
        this.publicKey = publicKey;
        if (walletId !== null && walletId !== undefined) {
            this.walletId = walletId;
        } else {
            this.walletId = MainnetWalletId
        }

        // Build initial code and data
        let code = Cell.fromBoc(Buffer.from(codeString, 'base64'))[0];
        let data = beginCell()
            .storeUint(1, 1)
            .storeUint(0, 32) // Seqno
            .store(storeWalletIdV5R1(this.walletId))
            .storeBuffer(this.publicKey, 32)
            .storeBit(0) // Empty plugins dict
            .endCell();
        this.init = { code, data };
        this.address = contractAddress(workchain, { code, data });
    }

    /**
     * Get Wallet Balance
     */
    async getBalance(provider: ContractProvider) {
        let state = await provider.getState();
        return state.balance;
    }

    /**
     * Get Wallet Seqno
     */
    async getSeqno(provider: ContractProvider) {
        let state = await provider.getState();
        if (state.state.type === 'active') {
            let res = await provider.get('seqno', []);
            return res.stack.readNumber();
        } else {
            return 0;
        }
    }

    /**
     * Get Wallet Extensions
     */
    async getExtensions(provider: ContractProvider) {
        let state = await provider.getState();
        if (state.state.type === 'active') {
            const result = await provider.get('get_extensions', []);
            return result.stack.readCellOpt();
        } else {
            return null;
        }
    }

    /**
     * Get Wallet Extensions
     */
    async getExtensionsArray(provider: ContractProvider) {
        const extensions = await this.getExtensions(provider);
        if (!extensions) {
            return [];
        }

        const dict:  Dictionary<bigint, bigint> = Dictionary.loadDirect(
            Dictionary.Keys.BigUint(256),
            Dictionary.Values.BigInt(1),
            extensions
        );

        return dict.keys().map(addressHex => {
            const wc = this.address.workChain;
            return Address.parseRaw(`${wc}:${addressHex.toString(16).padStart(64, '0')}`);
        })
    }

    /**
     * Get is secret-key authentication enabled
     */
    async getIsSecretKeyAuthEnabled(provider: ContractProvider) {
        let res = await provider.get('is_signature_allowed', []);
        return res.stack.readBoolean();
    }


    /**
     * Send signed transfer
     */
    async send(provider: ContractProvider, message: Cell) {
        await provider.external(message);
    }

    /**
     * Sign and send transfer
     */
    async sendTransfer(provider: ContractProvider, args: WalletV5R1SendArgs & { secretKey: Buffer, messages: MessageRelaxed[];  sendMode: SendMode }) {
        const transfer = await this.createTransfer(args);
        await this.send(provider, transfer);
    }

    /**
     * Sign and send add extension request
     */
    async sendAddExtension(provider: ContractProvider, args: WalletV5R1SendArgs & { extensionAddress: Address }) {
        const request = await this.createAddExtension(args);
        await this.send(provider, request);
    }

    /**
     * Sign and send remove extension request
     */
    async sendRemoveExtension(provider: ContractProvider, args: WalletV5R1SendArgs & { extensionAddress: Address, }) {
        const request = await this.createRemoveExtension(args);
        await this.send(provider, request);
    }

    private createActions( args: {  messages: MessageRelaxed[], sendMode: SendMode }) {
        const actions: OutActionSendMsg[] = args.messages.map(message => ({ type: 'sendMsg', mode: args.sendMode, outMsg: message}));
        return actions;
    }


    /**
     * Create signed transfer
     */
    createTransfer<T extends WalletV5R1SendArgs>(args: T & { secretKey: Buffer, messages: MessageRelaxed[]; sendMode?: Maybe<SendMode> }) {
        // let sendMode = SendMode.PAY_GAS_SEPARATELY;
        let sendMode = SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS;
        if (args.sendMode !== null && args.sendMode !== undefined) {
            sendMode = args.sendMode;
        }
        let isForSimulate: boolean = false;
        if (!args.secretKey || args.secretKey.length == 0) {
            args.secretKey = Buffer.alloc(64); // fake seed for simulate
            isForSimulate = true;
        }
        let body = this.createRequest({
            actions: this.createActions({ messages: args.messages, sendMode: sendMode }),
            ...args
        })

        // external message for send
        const externalMessage = external({
            to: this.address,
            init: args.seqno === 0 ? {code: this.init.code, data: this.init.data} : undefined,
            body: body as Cell
        });
        return beginCell()
            .store(storeMessage(externalMessage))
            .endCell();
    }

    /**
     * Create signed add extension request
     */
    createAddExtension<T extends WalletV5R1SendArgs>(args: T & { extensionAddress: Address }): WalletV5R1PackedCell<T> {
        return this.createRequest({
            actions: [{
                type: 'addExtension',
                address: args.extensionAddress
            }],
            ...args
        })
    }

    /**
     * Create signed remove extension request
     */
    createRemoveExtension<T extends WalletV5R1SendArgs>(args: T & { extensionAddress: Address }): WalletV5R1PackedCell<T> {
        return this.createRequest({
            actions: [{
                type: 'removeExtension',
                address: args.extensionAddress
            }],
            ...args
        })
    }

    /**
     * Create signed request or extension auth request
     */
    createRequest<T extends WalletV5R1SendArgs>(args: T & { actions: OutActionWalletV5[] }): WalletV5R1PackedCell<T> {
        if (args.authType === 'extension') {
            return createWalletTransferV5R1(args as Wallet5VR1SendArgsExtensionAuth & { actions: OutActionWalletV5[] }) as WalletV5R1PackedCell<T>;
        }

        return createWalletTransferV5R1({
            ...(args as (WalletV5R1SendArgsSinged | WalletV5R1SendArgsSignable) & { actions: OutActionWalletV5[] }),
            walletId: storeWalletIdV5R1(this.walletId)
        }) as WalletV5R1PackedCell<T>;
    }
    /**
     * Create sender
     */
    sender(provider: ContractProvider, secretKey: Buffer): Sender {
        return {
            send: async (args) => {
                let seqno = await this.getSeqno(provider);
                let transfer = this.createTransfer({
                    seqno,
                    secretKey,
                    sendMode: args.sendMode ?? SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                    messages: [internal({
                        to: args.to,
                        value: args.value,
                        init: args.init,
                        body: args.body,
                        bounce: args.bounce
                    })]
                });
                await this.send(provider, transfer);
            }
        };
    }
}

export class WalletContractV5R1 extends WalletContractV5 {
    static create(args: { workchain: number, publicKey: Buffer, walletId?: WalletIdV5R1 }) {
        return new WalletContractV5R1(args.workchain, args.publicKey, args.walletId);
    }

    private constructor(workchain: number, publicKey: Buffer, walletId?: WalletIdV5R1) {
        let code = "te6cckECFAEAAoEAART/APSkE/S88sgLAQIBIAINAgFIAwQC3NAg10nBIJFbj2Mg1wsfIIIQZXh0br0hghBzaW50vbCSXwPgghBleHRuuo60gCDXIQHQdNch+kAw+kT4KPpEMFi9kVvg7UTQgQFB1yH0BYMH9A5voTGRMOGAQNchcH/bPOAxINdJgQKAuZEw4HDiEA8CASAFDAIBIAYJAgFuBwgAGa3OdqJoQCDrkOuF/8AAGa8d9qJoQBDrkOuFj8ACAUgKCwAXsyX7UTQcdch1wsfgABGyYvtRNDXCgCAAGb5fD2omhAgKDrkPoCwBAvIOAR4g1wsfghBzaWduuvLgin8PAeaO8O2i7fshgwjXIgKDCNcjIIAg1yHTH9Mf0x/tRNDSANMfINMf0//XCgAK+QFAzPkQmiiUXwrbMeHywIffArNQB7Dy0IRRJbry4IVQNrry4Ib4I7vy0IgikvgA3gGkf8jKAMsfAc8Wye1UIJL4D95w2zzYEAP27aLt+wL0BCFukmwhjkwCIdc5MHCUIccAs44tAdcoIHYeQ2wg10nACPLgkyDXSsAC8uCTINcdBscSwgBSMLDy0InXTNc5MAGk6GwShAe78uCT10rAAPLgk+1V4tIAAcAAkVvg69csCBQgkXCWAdcsCBwS4lIQseMPINdKERITAJYB+kAB+kT4KPpEMFi68uCR7UTQgQFB1xj0BQSdf8jKAEAEgwf0U/Lgi44UA4MH9Fvy4Iwi1woAIW4Bs7Dy0JDiyFADzxYS9ADJ7VQAcjDXLAgkji0h8uCS0gDtRNDSAFETuvLQj1RQMJExnAGBAUDXIdcKAPLgjuLIygBYzxbJ7VST8sCN4gAQk1vbMeHXTNC01sNe"
        super(code, workchain, publicKey, walletId)
    }
}