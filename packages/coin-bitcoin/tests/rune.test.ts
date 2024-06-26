import { BtcWallet, BtcXrcTypes, RuneData, RuneTestWallet, TBtcWallet, networks } from "../src"
import { Message, buildRuneData } from "../src/runestone"
import { SignTxParams } from "@okxweb3/coin-base";
import { RuneId } from "../src/rune_id";
import { stringToBytes } from "@okxweb3/crypto-lib/dist/base";
import { Rune } from "../src/rune";
import * as varint from '../src/varint';
import { Buffer } from "buffer";
import { bufToHex, hexToBuf } from "@okxweb3/crypto-lib";
import { hexToBytes } from "@okxweb3/crypto-lib/dist/signutil/schnorr";
// import { encode } from "varint";

describe('rune test', () => {
/*
    test('rune transfer OP_RETURN test', () => {
        const runeData: RuneData = {
            edicts: [{
                id: RuneId.fromString("0:2aa16001b")!,
                amount: "1000",
                output: 0
            }]
        }
        const opReturnScript = buildRuneData(false, runeData)
        expect(opReturnScript.toString('hex')).toEqual('6a0952554e455f544553540a0000a9cfd6ff1b866800')
    })

    test('ord rune transfer OP_RETURN test', () => {
        const runeData: RuneData = {
            edicts: [
                {
                    id: new RuneId(2, 3),
                    amount: "1",
                    output: 0
                },
                {
                    id: new RuneId(5, 6),
                    amount: "4",
                    output: 1
                }
            ],
            etching: {
                divisibility: 7,
                premine: 8,
                rune: "J",
                spacers: 10,
                symbol: "@",
                terms: {
                    cap: 1000000000,
                    height: [12, 13],
                    amount: 14,
                    offset: [15, 16],
                }
            },
            mint: new RuneId(17, 18),
            pointer: 0
        }
        const opReturnScript = buildRuneData(true, runeData)
          
        expect(opReturnScript.toString('hex')).toEqual('6a5d2b020304090107030a054006080a0e088094ebdc030c0c0e0d100f1210141114121600000203010003060401')
    })

    test("ord rune etching", async () => {
        let wallet = new BtcWallet()
        let runeTxParams = {
            type: BtcXrcTypes.RUNE,
            inputs: [
                {
                    txId: "066742d57bda7f34736be2a72cea4c89f318a8b74cdd586d6fc2d748144ba9e6",
                    vOut: 0,
                    amount: 1000,
                    address: "bc1pne26q2qzjxpyr36ll2yfta64kgjgwctfk706a82xg96uzfcwswgqz3yv33",
                },
                {
                    txId: "d499c5e1b0d3cd7cc2d350716a4db5cc89ef376137f06be4c5dda7800826e55b",
                    vOut: 1,
                    amount: 1685,
                    address: "bc1pne26q2qzjxpyr36ll2yfta64kgjgwctfk706a82xg96uzfcwswgqz3yv33",
                },
                {
                    txId: "16c33cfa711817d54a0da8301116090338220746aa879db51526dc09626be1b8",
                    vOut: 1,
                    amount: 1359,
                    address: "bc1pne26q2qzjxpyr36ll2yfta64kgjgwctfk706a82xg96uzfcwswgqz3yv33",
                },
                {
                    txId: "57181d9aadd11a43c8d54969ea3b3dd03cd388b10f8f39015a8ebff10269f398",
                    vOut: 0,
                    amount: 1000,
                    address: "bc1pne26q2qzjxpyr36ll2yfta64kgjgwctfk706a82xg96uzfcwswgqz3yv33",
                },
                {
                    txId: "e35f9cc130558733715ee74593f57471257897dab28d6373079190bc3c62b46f",
                    vOut: 0,
                    amount: 1000,
                    address: "bc1pne26q2qzjxpyr36ll2yfta64kgjgwctfk706a82xg96uzfcwswgqz3yv33",
                },
                {
                    txId: "95f49e9196e7d1a1f243f6db7e0364badcc078cb9a9635245460fff6b3b31c48",
                    vOut: 0,
                    amount: 1000,
                    address: "bc1pne26q2qzjxpyr36ll2yfta64kgjgwctfk706a82xg96uzfcwswgqz3yv33",
                }
            ],
            outputs: [
                { // rune send output
                    address: "bc1pne26q2qzjxpyr36ll2yfta64kgjgwctfk706a82xg96uzfcwswgqz3yv33",
                    amount: 546,
                }
            ],
            address: "bc1pne26q2qzjxpyr36ll2yfta64kgjgwctfk706a82xg96uzfcwswgqz3yv33",
            feePerB: 12,
            runeData: {
                "etching": {
                    divisibility: 7,
                    premine: 1000,
                    symbol: 'Y',
                    terms: {
                        cap: 1000000000,
                        amount: 1000,
                    }
                },
                "burn": false
            }
        }
        let signParams: SignTxParams = {
            privateKey: "***",
            data: runeTxParams
        };
        let fee = await wallet.estimateFee(signParams)
        console.info(fee)
        let tx = await wallet.signTransaction(signParams);
        console.info(tx)
        const partial = /^02000000000106e6a94b1448d7c26f6d58dd4cb7a818f3894cea2ca7e26b73347fda7bd54267060000000000ffffffff5be5260880a7ddc5e46bf0376137ef89ccb54d6a7150d3c27ccdd3b0e1c599d40100000000ffffffffb8e16b6209dc2615b59d87aa460722380309161130a80d4ad5171871fa3cc3160100000000ffffffff98f36902f1bf8e5a01398f0fb188d33cd03d3bea6949d5c8431ad1ad9a1d18570000000000ffffffff6fb4623cbc90910773638db2da9778257174f59345e75e7133875530c19c5fe30000000000ffffffff481cb3b3f6ff60542435969acb78c0dcba64037edbf643f2a1d1e796919ef4950000000000ffffffff[0-9a-fA-F]*00000000$/
        expect(tx).toMatch(partial)
    })

    // https://testnet.runealpha.xyz/txs/9edf897ad90b15b681d0c466d9e4f83c32a60fae21ee1f90313280b86a10dd89
    test("segwit_taproot transfer rune", async () => {
        let wallet = new TBtcWallet()
        let runeTxParams = {
            type: BtcXrcTypes.RUNE,
            inputs: [
                // rune token info
                {
                    txId: "4f8a6cc528669278dc33e4d824bb047121505a5e2cc53d1a51e3575c60564b73",
                    vOut: 0,
                    amount: 546,
                    address: "tb1pnxu8mvv63dujgydwt0l5s0ly8lmgmef3355x4t7s2n568k5cryxqfk78kq",
                    data: [{ "id": "0:26e4140001", "amount": "500" }] // maybe many rune token
                },
                // gas fee utxo
                {
                    txId: "4f8a6cc528669278dc33e4d824bb047121505a5e2cc53d1a51e3575c60564b73",
                    vOut: 2,
                    amount: 97570,
                    address: "tb1pnxu8mvv63dujgydwt0l5s0ly8lmgmef3355x4t7s2n568k5cryxqfk78kq"
                },
            ],
            outputs: [
                { // rune send output
                    address: "tb1q05w9mglkhylwjcntp3n3x3jaf0yrx0n7463u2h",
                    amount: 546,
                    data: { "id": "0:26e4140001", "amount": "100" } // one output allow only one rune token
                }
            ],
            address: "tb1pnxu8mvv63dujgydwt0l5s0ly8lmgmef3355x4t7s2n568k5cryxqfk78kq",
            feePerB: 10,
            runeData: {
                "etching": null,
                "burn": false
            }
        };

        let signParams: SignTxParams = {
            privateKey: "cNtoPYke9Dhqoa463AujyLzeas8pa6S15BG1xDSRnVmcwbS9w7rS",
            data: runeTxParams
        };
        let fee = await wallet.estimateFee(signParams)
        expect(fee).toEqual(2730)
        let tx = await wallet.signTransaction(signParams);
        console.info(tx)
        const partial = /^02000000000102734b56605c57e3511a3dc52c5e5a50217104bb24d8e433dc78926628c56c8a4f0000000000ffffffff734b56605c57e3511a3dc52c5e5a50217104bb24d8e433dc78926628c56c8a4f0200000000ffffffff04220200000000000022512099b87db19a8b792411ae5bff483fe43ff68de5318d286aafd054e9a3da98190c22020000000000001600147d1c5da3f6b93ee9626b0c6713465d4bc8333e7e0000000000000000156a0952554e455f54455354090083ed9fceff016401567001000000000022512099b87db19a8b792411ae5bff483fe43ff68de5318d286aafd054e9a3da98190c0140[0-9a-fA-F]{260}00000000$/
        expect(tx).toMatch(partial)
    });


    test("varint full", () => {
        const testVectors: [number, Uint8Array][] = [
            [0, new Uint8Array([0x00])],
            [1, new Uint8Array([0x01])],
            [127, new Uint8Array([0x7F])],
            // [128, new Uint8Array([0x80, 0x00])],
            // [255, new Uint8Array([0x80, 0x7F])],
            // [256, new Uint8Array([0x81, 0x00])],
            [16383, new Uint8Array([0xFF, 0x7F])],
            [16384, new Uint8Array([0x80, 0x80, 0x01])],
            // [16511, new Uint8Array([0xFF, 0x7F])],
            [65535, new Uint8Array([0xff, 0xff, 0x03])],
            [4294967296, new Uint8Array([0x80, 0x80, 0x80, 0x80, 0x10])], // 1 << 32 = 1 in javascript
        ]

        for (const [n, encoding] of testVectors) {
            const actual = varint.encode(BigInt(n))
            expect(actual).toEqual(encoding)
            const [decoded, length] = varint.decode(encoding)
            expect(decoded).toEqual(BigInt(n))
            expect(length).toBe(encoding.length)
        }
    })
*/
test('rune test', async () => {
    let btcTxParams = {
        type: BtcXrcTypes.RUNE,
        inputs: [
            // rune token info
            {
                txId: "4bf1d2a2d498eaba83eb401f4a62d702cc02d98264de0656cd4bd8fc5ab4a913",
                vOut: 2,
                amount: 499766700,
                address: "2N8CVEgsh3p85we2sztndGScvjFvZNDhTQx", // 未花费地址
                privateKey: "cMmcX1FwYYGJrpifuQehXttCHcXE5egWAu8zXiyG1rJWJ1UtM4Eh", // 未花费 WIF 编码私钥
                // data: [{ "id": "540:1", "amount": "99700" }] // maybe many rune token
            },
            // {
            //     txId: "b58f91cd3ac7549cfc37a11ba9a4173c7fb89f30ef5e221c0b59b1678d24275d",
            //     vOut: 2,
            //     amount: 1497437990,
            //     address: "2N3RdWFd2ANnE55nU39MCkYYz8G8Qj5kMXi", // 未花费地址
            //     privateKey: "cT52VFq3255tyCBHjqr7cvHrkGuUHYf4TSR1r9migV1jJFNQTr8u", // 未花费 WIF 编码私钥
            //     // data: [{ "id": "26e414:0001", "amount": "500" }] // maybe many rune token
            // },
            // gas fee utxo
            // {
            //     txId: "82c51ff69fd0a55968e346f7093cb9088ce8b60b60a2493c8a5bc57b977ce348",
            //     vOut: 0,
            //     amount: 200000,
            //     address: "bc1pgvlezqu3crm44xjrrm7u3u63yqvw3rqvzu0vgcp2zsht5j9ss66q79p4zg", // 未花费地址
            //     privateKey: "KyCySnrRzHkEBnDY9RfgHT1iXEP4684sMQxzBwapWmLmaoLzFvki", // 未花费 WIF 编码私钥
            // }
        ],
        outputs: [
            // rune send output
            {
                address: "2N8CVEgsh3p85we2sztndGScvjFvZNDhTQx",
                amount: 546,
                // data: { "id": "540:1", "amount": "200" } // one output allow only one rune token
            }
        ],
        address: "2N8CVEgsh3p85we2sztndGScvjFvZNDhTQx", // 找零地址
        feePerB: 80,
        runeData: { // 必须有
            etching: {
                // divisibility: 1,
                // premine: 100000,
                rune: "ONTOONTOONTOONTO",
                // spacers: 4,
                // symbol: 'O',
                // terms: {
                //     cap: 1000000000,
                //     amount: 100000,
                    // height: [12, 13],
                    // offset: [15, 16],
                // }
            },
            // mint: "0:0",
            // pointer: 0,
            burn: false // 必须有
        }
    };
    let signParams: SignTxParams = {
        privateKey: "cMmcX1FwYYGJrpifuQehXttCHcXE5egWAu8zXiyG1rJWJ1UtM4Eh",
        data: btcTxParams
    };
    let wallet = new TBtcWallet()
    // let result = await wallet.estimateFee(signParams)
    // console.log(result);

    let tx = await wallet.signTransaction(signParams)
    console.log("tx", tx);
    
})

test("rune commitment", () => {
    let rune = Rune.fromString("ONTOONTOONTOONTO")
    console.log(rune.value);
    
    console.log(rune.commitment());
    let hex = bufToHex(rune.commitment())
    let buf = hexToBuf(hex)
    console.log(buf);
    
})

})