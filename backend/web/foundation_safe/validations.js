import { Validator } from "./validator.js";

export const ALL_FIELDS_PRESENT = new Validator()
.whereAllFields(v => v.notNull());