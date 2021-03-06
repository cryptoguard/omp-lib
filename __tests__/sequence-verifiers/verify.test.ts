import { hash } from "../../src/hasher/hash";
import { Sequence } from "../../src/sequence-verifiers/verify";

const validate = Sequence.validate;
const listing_ok = JSON.parse(
    `{
        "version": "0.1.0.0",
        "action": {
            "type": "MPA_LISTING_ADD",
            "item": {
              "information": {
                "title": "a 6 month old dog",
                "shortDescription": "very cute",
                "longDescription": "not for eating",
                "category": [
                    "Animals"
                ]
              },
              "payment": {
                "type": "SALE",
                "escrow": {
                  "type": "MULTISIG",
                  "ratio": {
                    "buyer": 100,
                    "seller": 100
                  }
                },
                "cryptocurrency": [
                  {
                    "currency": "PART",
                    "basePrice": 10
                  }
                ]
              },
              "messaging": [
                {
                  "protocol": "TODO",
                  "publicKey": "TODO"
                }
              ]
            }
        }
    }`);

const bid_ok = JSON.parse(
    `{
            "version": "0.1.0.0",
            "action": {
                "type": "MPA_BID",
                "created": ${+ new Date()},
                "item": "${hash(listing_ok)}",
                "buyer": { 
                  "payment": {
                    "cryptocurrency": "PART",
                    "escrow": "MULTISIG",
                    "pubKey": "somepublickey",
                    "changeAddress": {
                        "type": "NORMAL",
                        "address": "someaddress"
                    },
                    "outputs": [
                        {
                            "txid": "${hash('txid')}",
                            "vout": 0
                        }
                    ]
                  },
                  "shippingAddress": {
                    "firstName": "string",
                    "lastName": "string",
                    "addressLine1": "string",
                    "addressLine2": "string",
                    "city": "string",
                    "state": "string",
                    "zipCode": "zipCodeString",
                    "country": "string"
                  }
                }
            }
        }`);

const accept_ok = JSON.parse(
    `{
        "version": "0.1.0.0",
        "action": {
            "type": "MPA_ACCEPT",
                "bid": "${hash(bid_ok)}",
                "seller": { 
                    "payment": {
                    "escrow": "MULTISIG",
                    "pubKey": "somepublickey",
                    "changeAddress": {
                        "type": "NORMAL",
                        "address": "someaddress"
                    },
                    "outputs": [
                        {
                            "txid": "${hash('txid')}",
                            "vout": 0
                        }
                    ],
                    "signatures": [
                        "signature1"
                    ]
                }
            }
        }
    }`);

const lock_ok = JSON.parse(
    `{
            "version": "0.1.0.0",
            "action": {
                "type": "MPA_LOCK",
                "bid": "${hash(bid_ok)}",
                "buyer": { 
                  "payment": {
                    "escrow": "MULTISIG",
                    "signatures": [
                        "signature1"
                    ]
                  }
                }
            }
        }`);


test('seqver complete good cycle', () => {
    let fail: boolean = false;
    try {

        fail = !validate([listing_ok, bid_ok, accept_ok, lock_ok])
    } catch (e) {
        console.log(e)
        fail = true;
    }
    expect(fail).toBe(false);
});

test('seqver listing, bid & bid (fail)', () => {
    let error: string = "";
    try {
        validate([listing_ok, bid_ok, bid_ok])
    } catch (e) {
        error = e.toString();
    }
    expect(error).toEqual(expect.stringContaining("third action in the sequence must be a MPA_ACCEPT, MPA_REJECT, MPA_CANCEL."));
});

const accept_fail = JSON.parse(JSON.stringify(accept_ok));
accept_fail.action.bid = hash("UNKWONSDFS")

test('seqver listing, bid & accept_fail', () => {
    let error: string = "";
    try {
        validate([listing_ok, bid_ok, accept_fail])
    } catch (e) {
        error = e.toString();
    }
    expect(error).toEqual(expect.stringContaining("did not match the hash of the bid."));
});

const wrong_escrow_bid = JSON.parse(JSON.stringify(bid_ok));
wrong_escrow_bid.action.buyer.payment.escrow = "MAD"

test('seqver listing, bid with wrong escrow type & accept', () => {
    let error: string = "";
    try {
        validate([listing_ok, wrong_escrow_bid, accept_ok])
    } catch (e) {
        error = e.toString();
    }
    // TODO: should fail once MAD validation format is added. Fix it
    expect(error).toEqual(expect.stringContaining("unknown validation format, unknown value, got MAD"));
});

const wrong_escrow_accept = JSON.parse(JSON.stringify(accept_ok));
wrong_escrow_accept.action.seller.payment.escrow = "MAD"

test('seqver listing, bid & accept with wrong escrow type', () => {
    let error: string = "";
    try {
        validate([listing_ok, bid_ok, wrong_escrow_accept])
    } catch (e) {
        error = e.toString();
    }
    // TODO: should fail once MAD validation format is added. Fix it
    expect(error).toEqual(expect.stringContaining("unknown validation format, unknown value, got MAD"));
});

const wrong_escrow_lock = JSON.parse(JSON.stringify(bid_ok));
wrong_escrow_lock.action.buyer.payment.escrow = "MAD"

test('seqver listing, bid & accept with wrong escrow type', () => {
    let error: string = "";
    try {
        validate([listing_ok, bid_ok, wrong_escrow_lock])
    } catch (e) {
        error = e.toString();
    }
    // TODO: should fail once MAD validation format is added. Fix it
    expect(error).toEqual(expect.stringContaining("unknown validation format, unknown value, got MAD"));
});

const wrong_currency_bid = JSON.parse(JSON.stringify(bid_ok));
wrong_currency_bid.action.buyer.payment.cryptocurrency = "BTC"

test('seqver listing, bid with wrong currency type', () => {
    let error: string = "";
    try {
        validate([listing_ok, wrong_currency_bid])
    } catch (e) {
        error = e.toString();
    }
    expect(error).toEqual(expect.stringContaining("currency provided by MPA_BID not accepted by the listing"));
});