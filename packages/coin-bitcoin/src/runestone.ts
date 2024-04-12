import * as bitcoin from './bitcoinjs-lib';
import { OPS } from './bitcoinjs-lib/ops';
import { Edict, RuneData, Etching } from "./type";
import { Flag, FlagUtils } from './flag';
import { Tag, TagUtils } from './tag';
import { RuneId } from './rune_id';
import { textToBigint } from '@okxweb3/crypto-lib';
import { Rune } from './rune';
import * as varint from './varint';
import bigInt from 'big-integer';

export class RuneStone {
    constructor(
        edicts: Edict[],
        etching?: Etching,
        mint?: RuneId,
        pointer?: number
    ) { }

    // public decipher(transaction: bitcoin.Transaction): RuneStone | null {
    //     const payload = this.payload(transaction);
    //     if (!payload) {
    //         return null;
    //     }

    //     let integers: bigint[] = [];
    //     let i = 0;

    //     while (i < payload.length) {
    //         const _payload = payload.subarray(i);
    //         const [integer, length] = varint.decode(_payload);
    //         integers.push(integer);
    //         i += length;
    //     }

    //     let message = Message.fromIntegers(integers)
        
    //     let fields = message.fields;

    //     let flags = BigInt(0)

    //     let etching = FlagUtils.take(Flag.Etching, flags);
        

    //     let claim = fields.has(TAG_CLAIM) ? fields.get(TAG_CLAIM) : null;
    //     fields.delete(TAG_CLAIM);
    // }

    public payload(transaction: bitcoin.Transaction): Buffer | null {
        for (const output of transaction.outs) {
            const script = bitcoin.script.decompile(output.script);

            // 检查是否以 OP_RETURN 开始
            if (script && script[0] === OPS.OP_RETURN) {
                // 检查是否包含特定标记 "RUNE_TEST"
                if (script.length > 1 && script[1] && script[1] === OPS.OP_13) {
                    // 提取随后的数据
                    let payload = Buffer.alloc(0);
                    for (let i = 2; i < script.length; i++) {
                        if (Buffer.isBuffer(script[i])) {
                            payload = Buffer.concat([payload, script[i] as Buffer]);
                        }
                    }
                    return payload;
                }
            }
        }
        return null;
    }

}

export function buildRuneData(isMainnet: boolean, runeData: RuneData): Buffer {
    let edicts = runeData.edicts
    let payload: number[] = []
    let etching = runeData.etching
    if (etching != undefined) {
        let flags = BigInt(0)
        flags = FlagUtils.set(Flag.Etching, flags)
        if (etching.terms != undefined) {
            flags = FlagUtils.set(Flag.Terms, flags)
        }

        TagUtils.encode(payload, Tag.Flags, [flags])
        if (etching.rune != undefined) {
            let rune = Rune.fromString(etching.rune)
            TagUtils.encode_option(payload, Tag.Rune, rune.value)
        }
        TagUtils.encode_option(payload, Tag.Divisibility, etching.divisibility)
        TagUtils.encode_option(payload, Tag.Spacers, etching.spacers)
        if (etching.symbol != undefined) {
            TagUtils.encode_option(payload, Tag.Symbol, textToBigint(etching.symbol))
        }
        TagUtils.encode_option(payload, Tag.Premine, etching.premine)

        if (etching.terms != undefined) {
            let terms = etching.terms
            if (typeof terms.amount === "string") {
                terms.amount = Number(terms.amount);
            }
            TagUtils.encode_option(payload, Tag.Amount, terms.amount)
            TagUtils.encode_option(payload, Tag.Cap, terms.cap)
            TagUtils.encode_option(payload, Tag.HeightStart, terms.height?.[0])
            TagUtils.encode_option(payload, Tag.HeightEnd, terms.height?.[1])
            TagUtils.encode_option(payload, Tag.OffsetStart, terms.offset?.[0])
            TagUtils.encode_option(payload, Tag.OffsetEnd, terms.offset?.[1])
        }
    }

    if (runeData.mint != undefined) {
        let mint = runeData.mint!
        TagUtils.encode(payload, Tag.Mint, [BigInt(mint.block), BigInt(mint.tx)])
    }

    TagUtils.encode_option(payload, Tag.Pointer, runeData.pointer)

    for (let edict of edicts) {
        if (typeof edict.amount === "string") {
            edict.amount = BigInt(edict.amount);
        }
    }

    if (edicts.length > 0) {
        varint.encodeToVec(BigInt(Tag.Body), payload)

        edicts.sort((a, b) => {
            if (a.id.block == b.id.block) {
                return a.id.tx - b.id.tx
            }
            return a.id.block - b.id.block
        })
        let id = 0
        let previous = new RuneId(0, 0)
        for (const edict of edicts) {
            let { block, tx } = previous.delta(edict.id)
            // nedd remove if
            varint.encodeToVec(BigInt(block), payload)
            varint.encodeToVec(BigInt(tx), payload)
            varint.encodeToVec(BigInt(edict.amount), payload)
            varint.encodeToVec(BigInt(edict.output), payload)
            previous = edict.id
        }
    }

    // return payload

    const opReturnScript = bitcoin.script.compile([OPS.OP_RETURN, OPS.OP_13, Buffer.from(payload)])

    return opReturnScript
}


export class Message {
    constructor(
        public fields: Map<bigint, bigint>,
        public edicts: Edict[],
    ) { }

    static fromIntegers(payload: bigint[]): Message {
        const edicts: Edict[] = [];
        const fields = new Map<bigint, bigint>();
        const flaws = 0;

        for (let i = 0; i < payload.length; i += 2) {
            const tag = payload[i];

            if (tag === BigInt(Tag.Body)) {
                let id = new RuneId(0, 0);
                for (let j = i + 1; j < payload.length; j += 4) {
                    const block = payload[i]
                    const tx = payload[j + 1]
                    const amount = payload[j + 2]
                    const output = payload[j + 3]
                    const runeId = id.next(Number(block), Number(tx))

                    edicts.push({
                        id: runeId,
                        amount: amount,
                        output: Number(output)
                    })
                    id = runeId;
                }
                break;
            }

            const value = payload[i + 1];
            if (!fields.get(tag)) {
                fields.set(tag, value);
            }
        }

        return new Message(fields, edicts);
    }
}