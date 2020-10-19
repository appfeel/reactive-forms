/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// import { isDevMode } from '@angular/core';

import { normalizeValidators, Validators } from '../validators';

import { AsyncValidator, AsyncValidatorFn, Validator, ValidatorFn } from './validators';

// tslint:disable-next-line: prefer-array-literal
export function composeValidators(validators: Array<Validator | ValidatorFn>): ValidatorFn | null {
    return validators != null ? Validators.compose(normalizeValidators<ValidatorFn>(validators)) :
        null;
}

// tslint:disable-next-line: prefer-array-literal
export function composeAsyncValidators(validators: Array<AsyncValidator | AsyncValidatorFn>):
    AsyncValidatorFn | null {
    return validators != null ?
        Validators.composeAsync(normalizeValidators<AsyncValidatorFn>(validators)) :
        null;
}
