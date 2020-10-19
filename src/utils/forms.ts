/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * @module
 * @description
 * This module is used for handling user input, by defining and building a `FormGroup` that
 * consists of `FormControl` objects, and mapping them onto the DOM. `FormControl`
 * objects can then be used to read information from the form DOM elements.
 *
 * Forms providers are not included in default providers; you must import these providers
 * explicitly.
 */
// tslint:disable-next-line: max-line-length
export { AsyncValidator, AsyncValidatorFn, ValidationErrors, Validator, ValidatorFn } from './directives/validators';
export { FormBuilder } from './form_builder';
export { AbstractControl, AbstractControlOptions, FormArray, FormControl, FormGroup } from './model';
export { Validators } from './validators';
// export {VERSION} from './version';

// export * from './form_providers';
