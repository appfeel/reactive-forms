import { EventEmitter, HTMLStencilElement } from '@stencil/core/internal';

import { Components, ReactiveFormStatus } from './components';

export { Components, JSX } from './components';
export * from './utils/forms';

export interface ReactiveFormCustomEvents<T> {
    statusChanges: CustomEvent<ReactiveFormStatus>;
    valueChanges: CustomEvent<T>;
}

declare global {
    interface HTMLReactiveFormElement<T = any> extends Components.ReactiveForm, HTMLStencilElement {
        addEventListener<K extends keyof ReactiveFormCustomEvents<T>>(
            type: K,
            listener: (this: HTMLReactiveFormElement<T>, ev: ReactiveFormCustomEvents<T>[K]) => any,
            options?: boolean | AddEventListenerOptions
        ): void;
        /**
        * Should return the rawValue of the form.
        * @note In stencil it should be decorated with \@Method()
        * ```ts
        *  class YourComponent implements FormComponent<any> {
        *      \@Method()
        *      async getFormValue(): Promise<any> {
        *          return this.formGroup.getRawValue();
        *      }
        *  }
        * ```
        */
        getValue(): Promise<T>;
        /**
         * The validation status of the control. There are four possible
         * validation status values:
         *
         * * **VALID**: This control has passed all validation checks.
         * * **INVALID**: This control has failed at least one validation check.
         * * **PENDING**: This control is in the midst of conducting a validation check.
         * * **DISABLED**: This control is exempt from validation checks.
         *
         * These status values are mutually exclusive, so a control cannot be
         * both valid AND invalid or invalid AND disabled.
         *
         * @note In stencil it should be decorated with @Method():
         * ```ts
         *  class YourComponent implements FormComponent<any> {
         *      \@Method()
         *      async isValid(): Promise<boolean> {
         *          return this.formGroup.status;
         *      }
         *  }
         * ```
         */
        getStatus(): Promise<ReactiveFormStatus>;
    }
    interface FormComponent<T = any> {
        /**
         * This event is raised when the value of the form has been changed.
         * @note In stencil it should be decorated with \@Event():
         * ```ts
         *  class YourComponent implements FormComponent<any> {
         *      \@Event() valueChanges: EventEmitter<any>;
         *  }
         * ```
         */
        valueChanges: EventEmitter<T>;
        /**
         * This event is raised when the status of the form has been changed.
         *
         * There are four possible validation status values:
         *
         * * **VALID**: This control has passed all validation checks.
         * * **INVALID**: This control has failed at least one validation check.
         * * **PENDING**: This control is in the midst of conducting a validation check.
         * * **DISABLED**: This control is exempt from validation checks.
         *
         * These status values are mutually exclusive, so a control cannot be
         * both valid AND invalid or invalid AND disabled.
         *
         * @note In stencil it should be decorated with \@Event():
         * ```ts
         *  class YourComponent implements FormComponent<any> {
         *      \@Event() statusChanges: EventEmitter<string>;
         *  }
         * ```
         */
        statusChanges: EventEmitter<ReactiveFormStatus>;
        /**
         * Should return the rawValue of the form.
         * @note In stencil it should be decorated with \@Method()
         * ```ts
         *  class YourComponent implements FormComponent<any> {
         *      \@Method()
         *      async getFormValue(): Promise<any> {
         *          return this.formGroup.getRawValue();
         *      }
         *  }
         * ```
         */
        getValue(): Promise<T>;
        /**
         * The validation status of the control. There are four possible
         * validation status values:
         *
         * * **VALID**: This control has passed all validation checks.
         * * **INVALID**: This control has failed at least one validation check.
         * * **PENDING**: This control is in the midst of conducting a validation check.
         * * **DISABLED**: This control is exempt from validation checks.
         *
         * These status values are mutually exclusive, so a control cannot be
         * both valid AND invalid or invalid AND disabled.
         *
         * @note In stencil it should be decorated with @Method():
         * ```ts
         *  class YourComponent implements FormComponent<any> {
         *      \@Method()
         *      async isValid(): Promise<boolean> {
         *          return this.formGroup.status;
         *      }
         *  }
         * ```
         */
        getStatus(): Promise<ReactiveFormStatus>;
    }
}
