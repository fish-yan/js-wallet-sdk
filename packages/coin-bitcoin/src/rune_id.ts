import { bigintToHex, hexToBigint } from "@okxweb3/crypto-lib";
import { number2Hex } from "./wallet";

export class RuneId {
    public block: number;
    public tx: number;

    constructor(block: number, tx: number) {
        this.block = block;
        this.tx = tx;
    }

    public delta(next: RuneId): RuneId {
        const block = next.block - this.block;
        const tx = block === 0 ? next.tx - this.tx : next.tx;
        return new RuneId(block, tx)
    }

    public next(block: number, tx: number): RuneId {
        return new RuneId(this.block + block,
            block === 0 ? this.tx + tx : tx,
        );
    }

    public toString(): string {
        return `${this.block}:${this.tx}`;
    }

    public static fromString(s: string): RuneId | undefined {
        const [block, tx] = s.split(":");

        if (!block || !tx) {
            return undefined;
        }        
        return new RuneId(
            Number(block),
            Number(tx),
        );
    }
}