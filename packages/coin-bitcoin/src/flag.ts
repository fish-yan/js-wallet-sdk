export enum Flag {
    Etching = 0,
    Terms = 1,
    // [allow(unused)]
    Cenotaph = 127,
  }
  
  export const FlagUtils = {
    mask: (self: Flag): bigint => BigInt(1) << BigInt(self),
  
    take: (self: Flag, flags: bigint): boolean => {
      const mask = FlagUtils.mask(self);
      const set = Boolean(flags & mask);
      flags ^= mask;
      return set;
    },
  
    set: (self: Flag, flags: bigint): bigint => {
      flags |= FlagUtils.mask(self);
      return flags
    },
  };
  
  export const FlagFromBigInt: { [key: number]: bigint } = {
    0: BigInt(1) << BigInt(0),
    1: BigInt(1) << BigInt(1),
    127: BigInt(1) << BigInt(127),
  };
  
  export const FlagFromBigIntValues: { [key: number]: bigint } = {
    0: BigInt(1) << BigInt(0),
    1: BigInt(1) << BigInt(1),
    127: BigInt(1) << BigInt(127),
  };
  
  export function fromFlag(flag: Flag): bigint {
    return FlagUtils.mask(flag);
  }