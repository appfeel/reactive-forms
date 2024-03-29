/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * @license
 * Copyright AppFeel (Bit Genoma Digital Solutions SL) All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/appfeel/reactive-forms/LICENSE
 */

import { forkJoin, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AsyncValidator, AsyncValidatorFn, ValidationErrors, Validator, ValidatorFn } from './directives/validators';
import { AbstractControl } from './model';

export function isEmptyInputValue(value: any): boolean {
    // we don't check for string here so it also works with arrays
    return value == null || value.length === 0;
}

export function hasValidLength(value: any): boolean {
    // non-strict comparison is intentional, to check for both `null` and `undefined` values
    return value != null && typeof value.length === 'number';
}

// eslint-disable-next-line max-len
const EMAIL_REGEXP = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isPresent(o: any): boolean {
    return o != null;
}

function mergeErrors(arrayOfErrors: (ValidationErrors | null)[]): ValidationErrors | null {
    let res: { [key: string]: any } = {};

    // Not using Array.reduce here due to a Chrome 80 bug
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1049982
    arrayOfErrors.forEach((errors: ValidationErrors | null) => {
        res = errors != null ? { ...res!, ...errors } : res!;
    });

    return Object.keys(res).length === 0 ? null : res;
}

type GenericValidatorFn = (control: AbstractControl) => any;

function executeValidators<V extends GenericValidatorFn>(control: AbstractControl, validators: V[]): ReturnType<V>[] {
    return validators.map(validator => validator(control));
}

function isValidatorFn<V>(validator: V | Validator | AsyncValidator): validator is V {
    return !(validator as Validator) || !(validator as Validator).validate;
}

export function toObservable(r: any): Observable<any> {
    const obs = r instanceof Promise ? from(r) : r;

    if (!(obs instanceof Observable)) {
        throw new Error('Expected validator to return Promise or Observable.');
    }
    return obs;
}

/**
 * @description
 * Provides a set of built-in validators that can be used by form controls.
 *
 * A validator is a function that processes a `FormControl` or collection of
 * controls and returns an error map or null. A null map means that validation has passed.
 *
 * @see [Form Validation](/guide/form-validation)
 *
 * @publicApi
 */
export class Validators {
    /**
     * @description
     * Validator that requires the control's value to be greater than or equal to the provided number.
     * The validator exists only as a function and not as a directive.
     *
     * @usageNotes
     *
     * ### Validate against a minimum of 3
     *
     * ```typescript
     * const control = new FormControl(2, Validators.min(3));
     *
     * console.log(control.errors); // {min: {min: 3, actual: 2}}
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `min` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static min(min: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (isEmptyInputValue(control.value) || isEmptyInputValue(min)) {
                return null; // don't validate empty values to allow optional controls
            }
            const value = parseFloat(control.value);
            // Controls with NaN values after parsing should be treated as not having a
            // minimum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-min
            // tslint:disable-next-line: object-literal-key-quotes
            return !Number.isNaN(value) && value < min ? { min: { min, actual: control.value } } : null;
        };
    }

    /**
     * @description
     * Validator that requires the control's value to be less than or equal to the provided number.
     * The validator exists only as a function and not as a directive.
     *
     * @usageNotes
     *
     * ### Validate against a maximum of 15
     *
     * ```typescript
     * const control = new FormControl(16, Validators.max(15));
     *
     * console.log(control.errors); // {max: {max: 15, actual: 16}}
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `max` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static max(max: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (isEmptyInputValue(control.value) || isEmptyInputValue(max)) {
                return null; // don't validate empty values to allow optional controls
            }
            const value = parseFloat(control.value);
            // Controls with NaN values after parsing should be treated as not having a
            // maximum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-max
            // tslint:disable-next-line: object-literal-key-quotes
            return !Number.isNaN(value) && value > max ? { max: { max, actual: control.value } } : null;
        };
    }

    /**
     * @description
     * Validator that requires the control have a non-empty value.
     *
     * @usageNotes
     *
     * ### Validate that the field is non-empty
     *
     * ```typescript
     * const control = new FormControl('', Validators.required);
     *
     * console.log(control.errors); // {required: true}
     * ```
     *
     * @returns An error map with the `required` property
     * if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static required(control: AbstractControl): ValidationErrors | null {
        // tslint:disable-next-line: object-literal-key-quotes
        return isEmptyInputValue(control.value) ? { required: true } : null;
    }

    /**
     * @description
     * Validator that requires the control's value be true. This validator is commonly
     * used for required checkboxes.
     *F
     * @usageNotes
     *
     * ### Validate that the field value is true
     *
     * ```typescript
     * const control = new FormControl('', Validators.requiredTrue);
     *
     * console.log(control.errors); // {required: true}
     * ```
     *
     * @returns An error map that contains the `required` property
     * set to `true` if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static requiredTrue(control: AbstractControl): ValidationErrors | null {
        // tslint:disable-next-line: object-literal-key-quotes
        return control.value === true ? null : { required: true };
    }

    /**
     * @description
     * Validator that requires the control's value pass an email validation test.
     *
     * Tests the value using a [regular
     * expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
     * pattern suitable for common usecases. The pattern is based on the definition of a valid email
     * address in the [WHATWG HTML
     * specification](https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address) with
     * some enhancements to incorporate more RFC rules (such as rules related to domain names and the
     * lengths of different parts of the address).
     *
     * The differences from the WHATWG version include:
     * - Disallow `local-part` (the part before the `@` symbol) to begin or end with a period (`.`).
     * - Disallow `local-part` to be longer than 64 characters.
     * - Disallow the whole address to be longer than 254 characters.
     *
     * If this pattern does not satisfy your business needs, you can use `Validators.pattern()` to
     * validate the value against a different pattern.
     *
     * @usageNotes
     *
     * ### Validate that the field matches a valid email pattern
     *
     * ```typescript
     * const control = new FormControl('bad@', Validators.email);
     *
     * console.log(control.errors); // {email: true}
     * ```
     *
     * @returns An error map with the `email` property
     * if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static email(control: AbstractControl): ValidationErrors | null {
        if (isEmptyInputValue(control.value)) {
            return null; // don't validate empty values to allow optional controls
        }
        // tslint:disable-next-line: object-literal-key-quotes
        EMAIL_REGEXP.lastIndex = 0;
        return EMAIL_REGEXP.test(control.value) ? null : { email: true };
    }

    /**
     * @description
     * Validator that requires the length of the control's value to be greater than or equal
     * to the provided minimum length. This validator is also provided by default if you use the
     * the HTML5 `minlength` attribute. Note that the `minLength` validator is intended to be used
     * only for types that have a numeric `length` property, such as strings or arrays. The
     * `minLength` validator logic is also not invoked for values when their `length` property is 0
     * (for example in case of an empty string or an empty array), to support optional controls. You
     * can use the standard `required` validator if empty values should not be considered valid.
     *
     * @usageNotes
     *
     * ### Validate that the field has a minimum of 3 characters
     *
     * ```typescript
     * const control = new FormControl('ng', Validators.minLength(3));
     *
     * console.log(control.errors); // {minlength: {requiredLength: 3, actualLength: 2}}
     * ```
     *
     * ```html
     * <input minlength="5">
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `minlength` if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static minLength(minLength: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (isEmptyInputValue(control.value) || !hasValidLength(control.value)) {
                // don't validate empty values to allow optional controls
                // don't validate values without `length` property
                return null;
            }

            return control.value.length < minLength
                // tslint:disable-next-line: object-literal-key-quotes
                ? { minlength: { requiredLength: minLength, actualLength: control.value.length } }
                : null;
        };
    }

    /**
     * @description
     * Validator that requires the length of the control's value to be less than or equal
     * to the provided maximum length. This validator is also provided by default if you use the
     * the HTML5 `maxlength` attribute. Note that the `maxLength` validator is intended to be used
     * only for types that have a numeric `length` property, such as strings or arrays.
     *
     * @usageNotes
     *
     * ### Validate that the field has maximum of 5 characters
     *
     * ```typescript
     * const control = new FormControl('Angular', Validators.maxLength(5));
     *
     * console.log(control.errors); // {maxlength: {requiredLength: 5, actualLength: 7}}
     * ```
     *
     * ```html
     * <input maxlength="5">
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `maxlength` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static maxLength(maxLength: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => (hasValidLength(control.value) && control.value.length > maxLength
        // tslint:disable-next-line: object-literal-key-quotes
            ? { maxlength: { requiredLength: maxLength, actualLength: control.value.length } }
            : null);
    }

    /**
     * @description
     * Validator that requires the control's value to match a regex pattern. This validator is also
     * provided by default if you use the HTML5 `pattern` attribute.
     *
     * @usageNotes
     *
     * ### Validate that the field only contains letters or spaces
     *
     * ```typescript
     * const control = new FormControl('1', Validators.pattern('[a-zA-Z ]*'));
     *
     * console.log(control.errors); // {pattern: {requiredPattern: '^[a-zA-Z ]*$', actualValue: '1'}}
     * ```
     *
     * ```html
     * <input pattern="[a-zA-Z ]*">
     * ```
     *
     * @param pattern A regular expression to be used as is to test the values, or a string.
     * If a string is passed, the `^` character is prepended and the `$` character is
     * appended to the provided string (if not already present), and the resulting regular
     * expression is used to test the values.
     *
     * @returns A validator function that returns an error map with the
     * `pattern` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static pattern(pattern: string | RegExp): ValidatorFn {
        if (!pattern) {
            return Validators.nullValidator;
        }
        let regex: RegExp;
        let regexStr: string;
        if (typeof pattern === 'string') {
            regexStr = '';

            if (pattern.charAt(0) !== '^') regexStr += '^';

            regexStr += pattern;

            if (pattern.charAt(pattern.length - 1) !== '$') regexStr += '$';

            regex = new RegExp(regexStr);
        } else {
            regexStr = pattern.toString();
            regex = pattern;
        }
        return (control: AbstractControl): ValidationErrors | null => {
            if (isEmptyInputValue(control.value)) {
                return null; // don't validate empty values to allow optional controls
            }
            const { value } = control;
            regex.lastIndex = 0; // Reset regex!!
            return regex.test(value) ? null
                : { pattern: { requiredPattern: regexStr, actualValue: value } };
        };
    }

    /**
     * @description
     * Validator that performs no operation.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static nullValidator(_control: AbstractControl): ValidationErrors | null {
        return null;
    }

    /**
     * @description
     * Compose multiple validators into a single function that returns the union
     * of the individual error maps for the provided control.
     *
     * @returns A validator function that returns an error map with the
     * merged error maps of the validators if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static compose(validators: null): null;
    static compose(validators: (ValidatorFn | null | undefined)[]): ValidatorFn | null;
    static compose(validators: (ValidatorFn | null | undefined)[] | null): ValidatorFn | null {
        if (!validators) return null;
        const presentValidators: ValidatorFn[] = validators.filter(isPresent) as any;
        if (presentValidators.length === 0) return null;

        return function (control: AbstractControl) {
            return mergeErrors(executeValidators<ValidatorFn>(control, presentValidators));
        };
    }

    /**
     * @description
     * Compose multiple async validators into a single function that returns the union
     * of the individual error objects for the provided control.
     *
     * @returns A validator function that returns an error map with the
     * merged error objects of the async validators if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static composeAsync(validators: (AsyncValidatorFn | null)[]): AsyncValidatorFn | null {
        if (!validators) return null;
        const presentValidators: AsyncValidatorFn[] = validators.filter(isPresent) as any;
        if (presentValidators.length === 0) return null;

        return (control: AbstractControl) => {
            const observables = executeValidators<AsyncValidatorFn>(control, presentValidators).map(toObservable);
            return forkJoin(observables).pipe(map(mergeErrors));
        };
    }
}

/**
 * Given a validator that may be a function or a class, return the
 * validator function (convert validator classes into validator functions).
 *
 * @param validators The validator that may be a plain function
 *     as well as represented as a validator class.
 */
export function normalizeValidator<V>(validator: V | Validator | AsyncValidator): V {
    return isValidatorFn<V>(validator)
        ? validator
        : ((c: AbstractControl) => validator.validate(c)) as unknown as V;
}

/**
 * Given the list of validators that may contain both functions as well as classes, return the list
 * of validator functions (convert validator classes into validator functions). This is needed to
 * have consistent structure in validators list before composing them.
 *
 * @param validators The set of validators that may contain validators both in plain function form
 *     as well as represented as a validator class.
 */
export function normalizeValidators<V>(validators: (V | Validator | AsyncValidator)[]): V[] {
    return validators.map(validator => normalizeValidator(validator));
}
