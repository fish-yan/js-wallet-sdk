import {base, signUtil} from "@okxweb3/crypto-lib";
import {VenomWalletV3} from "../ton";
import {Address} from "../ton-core";
import {WalletContractV4} from "../ton/wallets/WalletContractV4";
import { WalletContractV5R1 } from "../ton/wallets/v5r1/WalletContractV5";

export type ApiNetwork = 'mainnet' | 'testnet';

export function getPubKeyBySeed(seed: string) {
    checkSeed(seed);
    const {publicKey} = signUtil.ed25519.fromSeed(base.fromHex(seed));
    return base.toHex(publicKey);
}

export function checkSeed(seed: string) {
    if (!base.validateHexString(seed)) {
        throw new Error("invalid key");
    }
    const buf = base.fromHex(seed.toLowerCase());
    if (!buf || (buf.length != 32)) {
        throw new Error("invalid key");
    }
}

export function getAddressBySeed(seed: string, testOnly: boolean = false): string {
    checkSeed(seed);
    const {publicKey} = signUtil.ed25519.fromSeed(base.fromHex(seed));
    const wallet = WalletContractV4.create({workchain: 0, publicKey: Buffer.from(publicKey)});    
    return wallet.address.toString({bounceable: false, testOnly});
}

export function getV5R1AddressBySeed(seed: string, testOnly: boolean = false): string {
    checkSeed(seed);
    const {publicKey} = signUtil.ed25519.fromSeed(base.fromHex(seed));
    const wallet = WalletContractV5R1.create({workchain: 0, publicKey: Buffer.from(publicKey)});
    console.log("wallet address", wallet.address.toRawString());

    return wallet.address.toString({bounceable: false, testOnly});
}

export function parseAddress(address: string): {
    isValid: boolean;
    isRaw?: boolean;
    isUserFriendly?: boolean;
    isBounceable?: boolean;
    isTestOnly?: boolean;
    address?: Address;
    isUrlSafe?: boolean;
} {
    try {
        if (Address.isRaw(address)) {
            return {
                address: Address.parseRaw(address),
                isRaw: true,
                isValid: true,
            };
        } else if (Address.isFriendly(address)) {
            return {
                ...Address.parseFriendly(address),
                isUserFriendly: true,
                isValid: true,
            };
        }
    } catch (err) {

    }

    return {isValid: false};
}

export function getVenomAddressBySeed(seed: string): string {
    const {publicKey} = signUtil.ed25519.fromSeed(base.fromHex(seed));
    const wallet = VenomWalletV3.create({workchain: 0, publicKey: Buffer.from(publicKey)});

    return wallet.address.toRawString();
}

export function validateAddress(address: string) {
    try {
        return Address.parse(address);
    } catch (e) {
        return false;
    }
}

export function convertAddress(address: string): any {
    const a = parseAddress(address);
    if (!a.isValid) {
        return a;
    } else {
        const rawString = a.address?.toRawString();
        const userFriendlyBounceable = a.address?.toString({bounceable: true, urlSafe: true});
        const userFriendlyUnbounceable = a.address?.toString({bounceable: false, urlSafe: true});
        const addrBounceable = {bounceable: true, urlSafe: true, userFriendlyBounceable: userFriendlyBounceable};
        const addrUnounceable = {bounceable: false, urlSafe: true, userFriendlyUnbounceable: userFriendlyUnbounceable};
        return {
            raw: rawString,
            addrBounceable,
            addrUnounceable,
        }
    }
}

export function toBase64Address(address: Address | string, isBounceable = true, network?: ApiNetwork) {
    if (typeof address === 'string') {
        address = Address.parse(address);
    }
    return address.toString({
        urlSafe: true,
        bounceable: isBounceable,
        testOnly: network === 'testnet',
    });
}