import { Fyo } from "fyo";
import { DocValueMap } from "fyo/core/types";
import { Doc } from "fyo/model/doc";
import { Money } from "pesa";
import { Invoice } from "../Invoice/Invoice";

export class AdditionalCost extends Doc {
	account?: string;
	rate?: number;
	amount?: Money;
	parentdoc?: Invoice;
}
