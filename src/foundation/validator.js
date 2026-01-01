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
                    return {
                        isValid: false,
                        errorMessage: `${this.fieldName} ${e.toString()}`,
                        error: e
                    }
                } else {
                    throw e; // rethrow unexpected exceptions
                }
            }
        }
        return { isValid: true, errorMessage: null, error: null };
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
