export interface ISetValueOptions {
    /** When true, each change only affects this control, and not its parent. Default is
    * false. */
    onlySelf?: boolean;
    /** `emitEvent`: When true or not supplied (the default), both the `statusChanges` and
    * `valueChanges`
    * observables emit events with the latest status and value when the control value is updated.
    * When false, no events are emitted.
    */
    emitEvent?: boolean;
}

export interface ISetFormControlValueOptions extends ISetValueOptions {
    /** `emitModelToViewChange`: When true or not supplied  (the default), each change triggers an
    * `onChange` event to
    * update the view. */
    emitModelToViewChange?: boolean;
    /** `emitViewToModelChange`: When true or not supplied (the default), each change triggers an
    * `ngModelChange`
    * event to update the model. */
    emitViewToModelChange?: boolean;
}

export enum ReactiveFormStatus {
    /**
     * Reports that a FormControl is valid, meaning that no errors exist in the input value.
     *
     * @see `status`
     */
    VALID = 'VALID',
    /**
     * Reports that a FormControl is invalid, meaning that an error exists in the input value.
     *
     * @see `status`
     */
    INVALID = 'INVALID',
    /**
     * Reports that a FormControl is pending, meaning that that async validation is occurring and
     * errors are not yet available for the input value.
     *
     * @see `markAsPending`
     * @see `status`
     */
    PENDING = 'PENDING',
    /**
    * Reports that a FormControl is disabled, meaning that the control is exempt from ancestor
    * calculations of validity or value.
    *
    * @see `markAsDisabled`
    * @see `status`
    */
    DISABLED = 'DISABLED',
}
