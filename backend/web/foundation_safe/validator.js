import { RequestError } from "./requestError.js";

export class ValidationException extends Error {
    constructor(message) {
        super(message);
    }
    
    toString() {
        return `${this.message}`;
    }
}

//Framework for building validators
export class ValidationCondition {
    constructor() {}

    test(data) {} //Do nothing, exception is thrown in subclasses when test fails
}

export class LengthCondition extends ValidationCondition {
    constructor(minLength, maxLength) {
        super();
        this.minLength = minLength;
        this.maxLength = maxLength;
    }

    test(data) {
        if (data.length < this.minLength || data.length > this.maxLength) {
            throw new ValidationException(`must have a length between ${this.minLength} and ${this.maxLength} character`);
        }
    }
}

export class RegexpCondition extends ValidationCondition {
    constructor(regexp, errorMessage) {
        super();
        this.regexp = regexp;
        this.errorMessage = errorMessage;
    }

    test(data) {
        if (!this.regexp.test(data)) {
            throw new ValidationException(this.errorMessage);
        }
    }
}

export class AlphanumericCondition extends RegexpCondition {
    constructor() {
        super(/^[a-zA-Z0-9]+$/, "must be alphanumeric");
    }
}

export class NameLikeCharacterCondition extends RegexpCondition {
    constructor() {
        super(/^[a-zA-Z0-9 _\-\. ]+$/, "contains invalid characters");
    }
}

//Generic predicate condition, to handle one-liner conditions
export class PredicateCondition extends ValidationCondition {
    constructor(predicateFunction, errorMessage) {
        super();
        this.predicateFunction = predicateFunction;
        this.errorMessage = errorMessage;
    }

    test(data) {
        if (!this.predicateFunction(data)) {
            throw new ValidationException(this.errorMessage);
        }
    }
}

export class Validator {

    constructor(fieldName = null) {
        this.steps = [];
        this.fieldName = fieldName;
    }

    where(condition) {
        this.steps.push(condition);
        return this;
    }

    test(data) {
        for (const step of this.steps) {
            try {
                step.test(data);
            } catch (e) {
                if (e instanceof ValidationException) {
                    let message = `${this.fieldName ? this.fieldName + " " : ""}${e.toString()}`;
                    return {
                        isValid: false,
                        errorMessage: message,
                        error: e,
                        throwErrorIfInvalid: () => { throw new ValidationException(message); },
                        throwRequestErrorIfInvalid: () => { throw new RequestError(message); }
                    }
                } else {
                    throw e; // rethrow unexpected exceptions
                }
            }
        }
        return { isValid: true, errorMessage: null, error: null, throwErrorIfInvalid: () => {}, throwRequestErrorIfInvalid: () => {} };
    }

    //Shorthands
    notNull() {
        return this.where(new PredicateCondition((data) => data != null, "must not be null"));
    }
    
    lengthBetween(minLength, maxLength) {
        return this.where(new LengthCondition(minLength, maxLength));
    }

    isAlphanumeric() {
        return this.where(new AlphanumericCondition());
    }

    hasNameLikeCharsOnly() {
        return this.where(new NameLikeCharacterCondition());
    }

    whereField(fieldName, validatorBuilder) {
        return this.where(new FieldSubValidator(fieldName, validatorBuilder));
    }

    whereAllFields(validatorBuilder) {
        return this.where(new AllFieldsSubValidator(validatorBuilder));
    }

}

export class FieldSubValidator extends ValidationCondition {

    constructor(fieldName, validatorBuilder) {
        super();
        this.fieldName = fieldName;
        this.fieldValidator = validatorBuilder(new Validator(fieldName));
    }

    test(data) {
        const fieldValue = data[this.fieldName];
        var validatorResult = this.fieldValidator.test(fieldValue);
        if (!validatorResult.isValid) {
            throw validatorResult.error;
        }
    }

}

/**
 * camelCase to Title Case
 */
function camelToReadable(camelCaseString) {
    let result = "";
    let forceNextUpper = true;
    for (let i = 0; i < camelCaseString.length; i++) {
        const char = camelCaseString[i];
        if (i > 0 && /[A-Z]/.test(char)) {
            result += " ";
        }
        result += forceNextUpper ? char.toUpperCase() : char;
        forceNextUpper = false;
    }
    return result;
}

export class AllFieldsSubValidator extends ValidationCondition {

    constructor(validatorBuilder) {
        super();
        this.fieldValidator = validatorBuilder(new Validator());
    }

    test(data) {
        for (const key in data) {
            const fieldValue = data[key];
            var validatorResult = this.fieldValidator.test(fieldValue);
            if (!validatorResult.isValid) {
                throw new ValidationException(camelToReadable(key) + " " + validatorResult.error.message);
            }
        }
    }

}