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

import { AsyncValidator, AsyncValidatorFn, Validator, ValidatorFn } from './forms';
import { AbstractControl, AbstractControlOptions, FormArray, FormControl, FormGroup, FormHooks } from './model';

export type TControlsConfig =
    | FormControl | FormGroup | FormArray
    | [string]
    | [string, Validator | ValidatorFn | (Validator | ValidatorFn)[]]
    | [string, Validator | ValidatorFn | (Validator | ValidatorFn)[], AsyncValidator | AsyncValidatorFn | (AsyncValidator | AsyncValidatorFn)[]];

function isAbstractControlOptions(options: AbstractControlOptions |
{ [key: string]: any }): options is AbstractControlOptions {
    return (<AbstractControlOptions>options).asyncValidators !== undefined
        || (<AbstractControlOptions>options).validators !== undefined
        || (<AbstractControlOptions>options).updateOn !== undefined;
}

export interface FormComponent {
    getForm(): Promise<FormGroup>;
}

/**
 * @description
 * Creates an `AbstractControl` from a user-specified configuration.
 *
 * The `FormBuilder` provides syntactic sugar that shortens creating instances of a `FormControl`,
 * `FormGroup`, or `FormArray`. It reduces the amount of boilerplate needed to build complex
 * forms.
 *
 * @see [Reactive Forms Guide](/guide/reactive-forms)
 *
 * @publicApi
 */
export class FormBuilder {
    /**
     * @description
     * Construct a new `FormGroup` instance.
     *
     * @param controlsConfig A collection of child controls. The key for each child is the name
     * under which it is registered.
     *
     * @param options Configuration options object for the `FormGroup`. The object can
     * have two shapes:
     *
     * 1) `AbstractControlOptions` object (preferred), which consists of:
     * * `validators`: A synchronous validator function, or an array of validator functions
     * * `asyncValidators`: A single async validator or array of async validator functions
     * * `updateOn`: The event upon which the control should be updated (options: 'change' | 'blur' |
     * submit')
     *
     * 2) Legacy configuration object, which consists of:
     * * `validator`: A synchronous validator function, or an array of validator functions
     * * `asyncValidator`: A single async validator or array of async validator functions
     *
     */
    group(
        controlsConfig: { [key: string]: TControlsConfig | any },
        options: AbstractControlOptions | { [key: string]: any } | null = null,
    ): FormGroup {
        const controls = this._reduceControls(controlsConfig);

        let validators: Validator | ValidatorFn | (Validator | ValidatorFn)[] | null = null;
        let asyncValidators: AsyncValidator | AsyncValidatorFn | (AsyncValidator | AsyncValidatorFn)[] | null = null;
        let updateOn: FormHooks | undefined;

        if (options != null) {
            if (isAbstractControlOptions(options)) {
                // `options` are `AbstractControlOptions`
                validators = options.validators != null ? options.validators : null;
                asyncValidators = options.asyncValidators != null ? options.asyncValidators : null;
                updateOn = options.updateOn != null ? options.updateOn : undefined;
            } else {
                // `options` are legacy form group options
                validators = options.validator != null ? options.validator : null;
                asyncValidators = options.asyncValidator != null ? options.asyncValidator : null;
            }
        }

        return new FormGroup(controls, { asyncValidators, updateOn, validators });
    }

    /**
     * @description
     * Construct a new `FormControl` with the given state, validators and options.
     *
     * @param formState Initializes the control with an initial state value, or
     * with an object that contains both a value and a disabled status.
     *
     * @param validatorOrOpts A synchronous validator function, or an array of
     * such functions, or an `AbstractControlOptions` object that contains
     * validation functions and a validation trigger.
     *
     * @param asyncValidator A single async validator or array of async validator
     * functions.
     *
     * @usageNotes
     *
     * ### Initialize a control as disabled
     *
     * The following example returns a control with an initial value in a disabled state.
     *
     * <code-example path="forms/ts/formBuilder/form_builder_example.ts" region="disabled-control">
     * </code-example>
     */
    control(
        formState: any,
        validatorOrOpts?: Validator | ValidatorFn | (Validator | ValidatorFn)[] | AbstractControlOptions | null,
        asyncValidator?: AsyncValidator | AsyncValidatorFn | (AsyncValidator | AsyncValidatorFn)[] | null,
    ): FormControl {
        return new FormControl(formState, validatorOrOpts, asyncValidator);
    }

    /**
     * Constructs a new `FormArray` from the given array of configurations,
     * validators and options.
     *
     * @param controlsConfig An array of child controls or control configs. Each
     * child control is given an index when it is registered.
     *
     * @param validatorOrOpts A synchronous validator function, or an array of
     * such functions, or an `AbstractControlOptions` object that contains
     * validation functions and a validation trigger.
     *
     * @param asyncValidator A single async validator or array of async validator
     * functions.
     */
    array(
        controlsConfig: (TControlsConfig | any)[],
        validatorOrOpts?: Validator | ValidatorFn | (Validator | ValidatorFn)[] | AbstractControlOptions | null,
        asyncValidator?: AsyncValidator | AsyncValidatorFn | (AsyncValidator | AsyncValidatorFn)[] | null,
    ): FormArray {
        const controls = controlsConfig.map(c => this._createControl(c));
        return new FormArray(controls, validatorOrOpts, asyncValidator);
    }

    /** @internal */
    // tslint:disable-next-line: function-name
    _reduceControls(controlsConfig: { [k: string]: TControlsConfig | any }): { [key: string]: AbstractControl } {
        const controls: { [key: string]: AbstractControl } = {};
        Object.keys(controlsConfig).forEach((controlName) => {
            controls[controlName] = this._createControl(controlsConfig[controlName]);
        });
        return controls;
    }

    /** @internal */
    // tslint:disable-next-line: function-name
    _createControl(controlConfig: TControlsConfig | any): AbstractControl {
        if (controlConfig instanceof FormControl || controlConfig instanceof FormGroup
            || controlConfig instanceof FormArray) {
            return controlConfig;
        } if (Array.isArray(controlConfig)) {
            const value = controlConfig[0];
            const validator: Validator | ValidatorFn | (Validator | ValidatorFn)[] | null = controlConfig.length > 1 ? controlConfig[1] : null;
            const asyncValidator: AsyncValidator | AsyncValidatorFn | (AsyncValidator | AsyncValidatorFn)[] | null = controlConfig.length > 2 ? controlConfig[2] : null;
            return this.control(value, validator, asyncValidator);
        }
        return this.control(controlConfig);
    }
}
