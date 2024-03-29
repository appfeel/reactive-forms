import '@ionic/core'; // Do not remove me! needed to render ion-elements
import { Component, h, State } from '@stencil/core';
import { Subscription } from 'rxjs';

import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '../../utils/forms';

@Component({
    tag: 'test-component',
    styleUrl: 'test-component.css',
})
export class TestComponent {
    @State() printedForm = {};
    @State() isValidating = false;
    @State() forceUpdate = 0;
    @State() isLoading = false;
    @State() debounceTime = 100;
    formGroup: FormGroup;
    options: string[] = [];
    subscriptions: Subscription[] = [];

    componentWillLoad() {
        this.options = ['Option 1', 'Option 2', 'Option 3'];
        this.formGroup = new FormBuilder().group({
            textInputEmpty: ['', [Validators.required, Validators.email]],
            textInput: ['default text at initializer', [Validators.required, Validators.minLength(30)]],
            textInputPatched: ['', [Validators.required, Validators.maxLength(5)]],
            numericInputEmpty: [null, [Validators.required, Validators.email]],
            numericInput: [10, [Validators.required, Validators.minLength(30)]],
            numericInputPatched: [null, [Validators.required, Validators.maxLength(5)]],
            selectPickerInputEmpty: ['', null, this.asyncValidator('Option 3')],
            selectPickerInput: ['Option 2', Validators.required],
            selectPickerInputPatched: ['', Validators.required],
            checkboxEmpty: ['', Validators.required],
            checkboxFalse: [false, Validators.requiredTrue],
            checkbox: [true],
            checkboxPatched: [''],
            toggleEmpty: [null, Validators.required],
            toggleFalse: [false, Validators.requiredTrue],
            toggle: [true],
            togglePatched: [null],
            radioEmpty: [''],
            radio: ['tesla'],
            radioPatched: [''],
            rangeEmpty: [],
            range: [10, Validators.min(20)],
            rangePatched: [{}, Validators.max(10)],
            rangeDualEmpty: ['', this.rangeMinDistance(10)],
            rangeDual: [{ lower: 3, upper: 9 }],
            rangeDualPatched: [],
        });

        this.isLoading = true;
        setTimeout(() => {
            this.formGroup.patchValue({
                textInputPatched: 'patched value',
                numericInputPatched: 20,
                selectPickerInputPatched: 'Option 3',
                checkboxPatched: true,
                togglePatched: true,
                radioPatched: 'tesla',
                rangePatched: 30,
                rangeDualPatched: { lower: 6, upper: 12 },
            });
            this.isLoading = false;
        }, 1000);
        this.printedForm = { ...this.formGroup.value };

        // We can subscribe or we can use reactive-form events. They are not affected by debounceTime
        // this.subscriptions.push(this.formGroup.valueChanges.subscribe(value => this.handleValueChanges(value)));
        // this.subscriptions.push(this.formGroup.statusChanges.subscribe(state => this.handleStatusChanges(state)));
    }

    disconnectedCallback() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    rangeMinDistance(distance: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const { lower, upper } = (control.value || { lower: 0, upper: 0 });
            const actual = upper - lower;
            return actual < distance ? { 'min distance': { distance, actual } } : null;
        };
    }

    asyncValidator(option: string): AsyncValidatorFn {
        return (control: AbstractControl): Promise<ValidationErrors | null> => new Promise((resolve) => {
            this.isValidating = true;
            setTimeout(() => {
                resolve(control.value !== option ? { 'wrong option': { option, actual: control.value } } : null);
                this.isValidating = false;
            }, 2000);
        });
    }

    handleValueChanges(ev: CustomEvent) {
        this.printedForm = { ...ev.detail };
    }

    handleStatusChanges(_state) {
        // Async validators and touch events require to update the ui after validation occurs
        // otherwise the component won't be able to render f`ormGroup.controls['controlName'].errors`:
        // They are updated asyncronously but they only change `formGroup`, which is not a `@State()`
        // So it's needed to change a `@State()` variable to force ui to re-render
        this.forceUpdate += 1;
    }

    handlePatchRandom() {
        this.formGroup.patchValue({
            textInput: Math.random().toString(36).replace(/[^a-z]+/g, ''),
            rangeEmpty: Math.floor(Math.random() * 101),
        }, { emitEvent: true });
    }

    renderChips(control: string | AbstractControl) {
        const el = typeof control === 'string' ? this.formGroup?.controls[control] : control;
        return (
            <ion-item lines="none">
                <ion-chip color={el?.valid ? 'success' : 'danger'} mode="ios" outline={el?.valid}>
                    <ion-label>valid: {el?.valid ? 'true' : 'false'}</ion-label>
                </ion-chip>
                <ion-chip color={el?.invalid ? 'danger' : 'success'} mode="ios" outline={el?.invalid}>
                    <ion-label>invalid: {el?.invalid ? 'true' : 'false'}</ion-label>
                </ion-chip>
                <ion-chip color={el?.pristine ? 'primary' : 'secondary'} mode="ios" outline={el?.pristine}>
                    <ion-label>pristine: {el?.pristine ? 'true' : 'false'}</ion-label>
                </ion-chip>
                <ion-chip color={el?.touched ? 'primary' : 'secondary'} mode="ios" outline={el?.touched}>
                    <ion-label>touched: {el?.touched ? 'true' : 'false'}</ion-label>
                </ion-chip>
                <ion-chip color={el?.dirty ? 'primary' : 'secondary'} mode="ios" outline={el?.dirty}>
                    <ion-label>dirty: {el?.dirty ? 'true' : 'false'}</ion-label>
                </ion-chip>
            </ion-item>
        );
    }

    renderErrors(control: string | AbstractControl, isAsyncValidation = false) {
        const el = typeof control === 'string' ? this.formGroup?.controls[control] : control;
        const isWithErrors = Object.keys(el?.errors || {}).length > 0;
        return (
            <ion-item lines="none">
                <ion-label color={isWithErrors ? 'danger' : 'success'}>
                    {isWithErrors ? 'Errors: ' : 'No errors'}{Object.keys(el?.errors || {}).map(k => `${k}: ${JSON.stringify(el?.getError(k))}`)}
                </ion-label>
                {isAsyncValidation && this.isValidating ? <ion-spinner name="dots" /> : null}
            </ion-item>
        );
    }

    renderTextInput() {
        return (
            <span>
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Email empty value</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-input type="text" rf-ctrl="textInputEmpty" />
                    </ion-item>
                    {this.renderChips('textInputEmpty')}
                    {this.renderErrors('textInputEmpty')}
                </ion-card>
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Text input default value</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-input type="text" rf-ctrl="textInput" />
                    </ion-item>
                    {this.renderChips('textInput')}
                    {this.renderErrors('textInput')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Text input patched value</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-input type="text" rf-ctrl="textInputPatched" />
                    </ion-item>
                    {this.renderChips('textInputPatched')}
                    {this.renderErrors('textInputPatched')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Text input missing control in form group</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-input type="text" rf-ctrl="textInputMissingControl" />
                    </ion-item>
                    {this.renderChips('textInputMissingControl')}
                    {this.renderErrors('textInputMissingControl')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Text input error: empty html attribute</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-input type="text" rf-ctrl="" />
                    </ion-item>
                </ion-card>
            </span>
        );
    }

    renderNumericInput() {
        return (
            <span>
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Numeric input default value</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-input type="number" rf-ctrl="numericInput" />
                    </ion-item>
                    {this.renderChips('numericInput')}
                    {this.renderErrors('numericInput')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Numeric input patched value</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-input type="number" rf-ctrl="numericInputPatched" />
                    </ion-item>
                    {this.renderChips('numericInputPatched')}
                    {this.renderErrors('numericInputPatched')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Numeric input missing control in form group</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-input type="number" rf-ctrl="numericInputMissingControl" />
                    </ion-item>
                    {this.renderChips('numericInputMissingControl')}
                    {this.renderErrors('numericInputMissingControl')}
                </ion-card>
            </span>
        );
    }

    renderSelect() {
        return (
            <span>
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Select empty value, async validators</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-label>Select:</ion-label>
                        <ion-select rf-ctrl="selectPickerInputEmpty" rf-self-hosted interface="popover">
                            {this.options.map(opt => <ion-select-option value={opt}>{opt}</ion-select-option>)}
                        </ion-select>
                    </ion-item>
                    {this.renderChips('selectPickerInputEmpty')}
                    {this.renderErrors('selectPickerInputEmpty', true)}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Select default value</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-label>Select:</ion-label>
                        <ion-select rf-ctrl="selectPickerInput" interface="popover">
                            {this.options.map(opt => <ion-select-option value={opt}>{opt}</ion-select-option>)}
                        </ion-select>
                    </ion-item>
                    {this.renderChips('selectPickerInput')}
                    {this.renderErrors('selectPickerInput')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Select patched value</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-label>Select:</ion-label>
                        <ion-select rf-ctrl="selectPickerInputPatched" rf-self-hosted interface="popover">
                            {this.options.map(opt => <ion-select-option value={opt}>{opt}</ion-select-option>)}
                        </ion-select>
                    </ion-item>
                    {this.renderChips('selectPickerInputPatched')}
                    {this.renderErrors('selectPickerInputPatched')}
                </ion-card>
            </span>
        );
    }

    renderCheckbox() {
        return (
            <span>
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Checkbox empty value, required to be changed</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-label>Checkbox</ion-label>
                        <ion-checkbox rf-ctrl="checkboxEmpty" slot="start" />
                    </ion-item>
                    {this.renderChips('checkboxEmpty')}
                    {this.renderErrors('checkboxEmpty')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Checkbox default value (False), required True</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-label>Checkbox</ion-label>
                        <ion-checkbox rf-ctrl="checkboxFalse" slot="start" />
                    </ion-item>
                    {this.renderChips('checkboxFalse')}
                    {this.renderErrors('checkboxFalse')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Checkbox default value (True)</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-label>Checkbox</ion-label>
                        <ion-checkbox rf-ctrl="checkbox" slot="start" />
                    </ion-item>
                    {this.renderChips('checkbox')}
                    {this.renderErrors('checkbox')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Checkbox patched value</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-label>Checkbox</ion-label>
                        <ion-checkbox rf-ctrl="checkboxPatched" slot="start" />
                    </ion-item>
                    {this.renderChips('checkboxPatched')}
                    {this.renderErrors('checkboxPatched')}
                </ion-card>
            </span>
        );
    }

    renderToggle() {
        return (
            <span>
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Toggle empty value, required to be changed</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-label>Toggle</ion-label>
                        <ion-toggle rf-ctrl="toggleEmpty" slot="start" />
                    </ion-item>
                    {this.renderChips('toggleEmpty')}
                    {this.renderErrors('toggleEmpty')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Toggle default value (False), required True</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-label>Toggle</ion-label>
                        <ion-toggle rf-ctrl="toggleFalse" slot="start" />
                    </ion-item>
                    {this.renderChips('toggleFalse')}
                    {this.renderErrors('toggleFalse')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Toggle default value (True)</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-label>Toggle</ion-label>
                        <ion-toggle rf-ctrl="toggle" slot="start" />
                    </ion-item>
                    {this.renderChips('toggle')}
                    {this.renderErrors('toggle')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Toggle patched value</ion-card-title>
                    </ion-card-header>
                    <ion-item lines="full">
                        <ion-label>Toggle</ion-label>
                        <ion-toggle rf-ctrl="togglePatched" slot="start" />
                    </ion-item>
                    {this.renderChips('togglePatched')}
                    {this.renderErrors('togglePatched')}
                </ion-card>
            </span>
        );
    }

    renderRadio() {
        return (
            <span>
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Radio empty value</ion-card-title>
                    </ion-card-header>
                    <ion-list lines="none">
                        <ion-radio-group rf-ctrl="radioEmpty">
                            <ion-item>
                                <ion-label>Tesla</ion-label>
                                <ion-radio value="tesla" />
                            </ion-item>
                            <ion-item lines="full">
                                <ion-label>Ford</ion-label>
                                <ion-radio value="ford" />
                            </ion-item>
                        </ion-radio-group>
                        {this.renderChips('radioEmpty')}
                        {this.renderErrors('radioEmpty')}
                    </ion-list>
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Radio default value</ion-card-title>
                    </ion-card-header>
                    <ion-list lines="none">
                        <ion-radio-group rf-ctrl="radio">
                            <ion-item>
                                <ion-label>Tesla</ion-label>
                                <ion-radio value="tesla" />
                            </ion-item>
                            <ion-item lines="full">
                                <ion-label>Ford</ion-label>
                                <ion-radio value="ford" />
                            </ion-item>
                        </ion-radio-group>
                        {this.renderChips('radio')}
                        {this.renderErrors('radio')}
                    </ion-list>
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Radio patched value</ion-card-title>
                    </ion-card-header>
                    <ion-list lines="none">
                        <ion-radio-group rf-ctrl="radioPatched">
                            <ion-item>
                                <ion-label>Tesla</ion-label>
                                <ion-radio value="tesla" />
                            </ion-item>
                            <ion-item lines="full">
                                <ion-label>Ford</ion-label>
                                <ion-radio value="ford" />
                            </ion-item>
                        </ion-radio-group>
                        {this.renderChips('radioPatched')}
                        {this.renderErrors('radioPatched')}
                    </ion-list>
                </ion-card>
            </span>
        );
    }

    renderRange() {
        return (
            <span>
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Range empty value</ion-card-title>
                    </ion-card-header>
                    <ion-item><ion-range rf-ctrl="rangeEmpty" pin /></ion-item>
                    {this.renderChips('rangeEmpty')}
                    {this.renderErrors('rangeEmpty')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Range default value</ion-card-title>
                    </ion-card-header>
                    <ion-item><ion-range rf-ctrl="range" pin /></ion-item>
                    {this.renderChips('range')}
                    {this.renderErrors('range')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Range patched value</ion-card-title>
                    </ion-card-header>
                    <ion-item><ion-range rf-ctrl="rangePatched" pin /></ion-item>
                    {this.renderChips('rangePatched')}
                    {this.renderErrors('rangePatched')}
                </ion-card>
            </span>
        );
    }

    renderRangeDual() {
        return (
            <span>
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Range Dual empty value</ion-card-title>
                    </ion-card-header>
                    <ion-item><ion-range rf-ctrl="rangeDualEmpty" dualKnobs min={0} max={20} step={3} snaps /></ion-item>
                    {this.renderChips('rangeDualEmpty')}
                    {this.renderErrors('rangeDualEmpty')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Range Dual default value</ion-card-title>
                    </ion-card-header>
                    <ion-item><ion-range rf-ctrl="rangeDual" dualKnobs min={0} max={20} step={3} snaps /></ion-item>
                    {this.renderChips('rangeDual')}
                    {this.renderErrors('rangeDual')}
                </ion-card>

                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Range Dual patched value</ion-card-title>
                    </ion-card-header>
                    <ion-item><ion-range rf-ctrl="rangeDualPatched" dualKnobs min={0} max={20} step={3} snaps /></ion-item>
                    {this.renderChips('rangeDualPatched')}
                    {this.renderErrors('rangeDualPatched')}
                </ion-card>
            </span>
        );
    }

    renderForm() {
        return (
            <reactive-form
                dataFormGroup={this.formGroup}
                dataAttributeName="rf-ctrl"
                onValueChanges={value => this.handleValueChanges(value)}
                onStatusChanges={state => this.handleStatusChanges(state)}
                dataDebounceTime={this.debounceTime}
            >

                <ion-card>
                    <ion-card-content>
                        <ion-item lines="none">
                            <ion-label class="ion-text-wrap">
                            Reactive form allows to bind a json to a collection of controls.
                            In this example we simulate a timeout of 2 seconds to patch values on the form.
                            </ion-label>
                            {this.isLoading ? <ion-spinner name="circular" slot="end" /> : <ion-icon name="checkmark-outline" slot="end" />}
                        </ion-item>
                    </ion-card-content>
                </ion-card>

                <ion-card>
                    <ion-card-content>
                        <ion-item>
                            <ion-label position="floating">Debounce time (milliseconds)</ion-label>
                            <ion-input type="number" value={this.debounceTime} onIonChange={ev => this.debounceTime = parseInt(ev.detail.value)} />
                        </ion-item>
                    </ion-card-content>
                </ion-card>

                {this.renderTextInput()}
                {this.renderNumericInput()}
                {this.renderSelect()}
                {this.renderCheckbox()}
                {this.renderToggle()}
                {this.renderRadio()}
                {this.renderRange()}
                {this.renderRangeDual()}

            </reactive-form>
        );
    }

    renderFormStatus() {
        return (
            <ion-card class="form-values">
                <ion-card-header>
                    <ion-card-title>Form</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                    <p>This is the value of the form updated via <code class="code">&nbsp;onValueChanges&nbsp;</code> event.</p>
                    <p>Dirty is triggered by patched values.</p>
                    <p>{this.renderChips(this.formGroup)}</p>
                    {this.isValidating ? <ion-item lines="none">Running async validators &nbsp;<ion-spinner name="dots" /></ion-item> : null}
                    <div class="scrollable">
                        <pre>{JSON.stringify(this.printedForm, undefined, 4)}</pre>
                    </div>
                </ion-card-content>
                <ion-footer>
                    <ion-toolbar>
                        <ion-buttons slot="end">
                            <ion-button onClick={() => this.handlePatchRandom()}>
                                <ion-icon slot="start" name="refresh-outline" />
                            Click to patch random value on text input and range
                            </ion-button>
                        </ion-buttons>
                    </ion-toolbar>
                </ion-footer>
            </ion-card>
        );
    }

    render() {
        return [
            <ion-header>
                <ion-toolbar>
                    <ion-title>
                        Reactive forms Web Component
                        <br />
                        <ion-note>Developed by AppFeel, a brand of <a href="https://bitgenoma.com" target="_blank" rel="noreferrer">https://bitgenoma.com</a></ion-note>
                    </ion-title>
                </ion-toolbar>
            </ion-header>,
            <ion-content>
                <ion-grid>
                    <ion-row>
                        <ion-col size="6">
                            {this.renderForm()}
                        </ion-col>
                        <ion-col size="6">
                            {this.renderFormStatus()}
                        </ion-col>
                    </ion-row>
                </ion-grid>
            </ion-content>,
        ];
    }
}
