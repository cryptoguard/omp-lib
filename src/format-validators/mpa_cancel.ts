import { FV_MPA } from "./mpa";
import { MPA_CANCEL } from "../interfaces/omp"
import { MPAction } from "../interfaces/omp-enums";
import { isString, isSHA256Hash } from "../util";

export class FV_MPA_CANCEL {

    constructor() {
    }

    static validate(msg: MPA_CANCEL): boolean {
        // validate base class
        FV_MPA.validate(msg);

        const action = msg.action;

        if (!isString(action.type)) {
            throw new Error('action.type: missing');
        }

        if (action.type !== MPAction.MPA_CANCEL) {
            throw new Error('action.type: expecting MPA_CANCEL got ' + action.type);
        }

        if (!isSHA256Hash(action.bid)) {
            throw new Error('action.bid: missing or not a valid hash');
        }

        return true;
    }

}
