import * as varint from './varint';

export enum Tag {
  Body = 0,
  Flags = 2,
  Rune = 4,
  Premine = 6,
  Cap = 8,
  Amount = 10,
  HeightStart = 12,
  HeightEnd = 14,
  OffsetStart = 16,
  OffsetEnd = 18,
  Mint = 20,
  Pointer = 22,
  Cenotaph = 126,
  Divisibility = 1,
  Spacers = 3,
  Symbol = 5,
  Nop = 127,
}

export const TagUtils = {
    encode: (payload: number[], tag: Tag, values: bigint[]): void => {
      for (const value of values) {
        varint.encodeToVec(BigInt(tag), payload);
        varint.encodeToVec(value, payload);
      }
    },
  
    encode_option: (payload: number[], tag: Tag, value?: bigint | number): void => {
      if (value != undefined) {
        TagUtils.encode(payload, tag, [BigInt(value)]);
      }
    },
  };
