import { Rune } from "./rune"
import { RuneId } from "./rune_id"

type utxoInput = {
    txId: string
    vOut: number
    amount: number  // min unit: satoshi
    address?: string
    reedScript?: string
    privateKey?: string
    publicKey?: string
    sequence?: number,
    nonWitnessUtxo?: string,
    bip32Derivation?: Bip32Derivation[],
    derivationPath?: string,
    sighashType?: number,
    data?: any  // xrc20 token info
}

type Bip32Derivation = {
    masterFingerprint: string,
    pubkey: string,
    path: string,
    leafHashes?: string[]
}

type utxoOutput = {
    address: string
    amount: number // min unit: satoshi
    omniScript?: string
    bip32Derivation?: Bip32Derivation[]
    derivationPath?: string
    isChange?: boolean
    data?: any // xrc20 token info
}

type omniOutput = {
    coinType?: number // usdt 31
    amount: number    // need to multiply 10^8
}

type utxoTx = {
    // inputs: []
    // outputs: []
    // address: string   // change address
    // feePerB?: number  //  Sat/b
    // decimal?: number  // precision: 8 bit
    // fee?: number      // fixed fee  eg: 0.001 AVAX
    // omni?: omniOutput
    // dustSize?: number
    // bip32Derivation?: Bip32Derivation[] // derivation info
    // derivationPath?: string
    inputs: []
    outputs: []
    address: string   // change address
    feePerB?: number  //  Sat/b
    decimal?: number  // precision: 8 bit
    fee?: number      // fixed fee  eg: 0.001 AVAX
    omni?: omniOutput
    dustSize?: number
    bip32Derivation?: Bip32Derivation[] // derivation info
    derivationPath?: string
    memo?: string
    memoPos?: number
    runeData?: RuneData
}

// rune
type RuneData = {
    edicts: Edict[]
    etching?: Etching
    mint?: RuneId
    pointer?: number
    burn?: boolean
}

type Etching = {
    divisibility?: number,
    premine?: number,
    rune?: string,
    spacers?: number,
    symbol?: string,
    terms?: Terms,
}

type Terms = {
    amount?: number; // 单次铸造量，最后一次mint如果超过总供应量，截断。
    cap?: number;  // 总供应量，
    height?: [number, number]; // 铸造生效高度区间
    offset?: [number, number]; // 铸造生效高度相对当前刻录高度的偏移量。
}

type Edict = {
    id: RuneId
    amount: bigint | string
    output: number
}

type ListingData = {
    nftAddress: string
    nftUtxo: {
        txHash: string
        vout: number
        coinAmount: number
        rawTransation: string
    }
    receiveBtcAddress: string
    price: number
};

type BuyingData = {
    dummyUtxos: {
        txHash: string
        vout: number
        coinAmount: number
        rawTransation: string
    }[]
    paymentUtxos: {
        txHash: string
        vout: number
        coinAmount: number
        rawTransation: string
    }[]
    receiveNftAddress: string
    paymentAndChangeAddress: string
    feeRate: number
    sellerPsbts: string[]
}

type toSignInputs = {
    index: number,
    address: string,
    publicKey: string,
    sighashTypes: number[],
    disableTweakSigner: boolean
}


type toSignInput = {
    index: number,
    address: string,
    publicKey?: string,
    sighashTypes?: number[],
    disableTweakSigner?: boolean
}

type signPsbtOptions = {
    autoFinalized?: boolean,
    toSignInputs?: toSignInput[]
}

export {
    utxoInput, utxoOutput, omniOutput, utxoTx, ListingData, BuyingData, RuneData, Edict, Etching, toSignInput, signPsbtOptions
};
