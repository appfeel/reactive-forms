# Reactive Forms Web Component

This is a reactive form component, [Angular Reactive Forms](https://angular.io/guide/reactive-forms) style.
It can be used with any framework of none at all: [Integration](https://stenciljs.com/docs/overview)

# Install

## Pure Javascript

Add the script in html file:
```html
<script type="module" src="https://unpkg.com/forms-reactive/dist/forms-reactive/forms-reactive.esm.js"></script>
<script nomodule src="https://unpkg.com/forms-reactive/dist/forms-reactive/forms-reactive.js"></script>
```

## NPM package

```
npm i forms-reactive -S
```

# Usage

## Pure Javascript

Wrap the form controls in a `<reactive-form>` tag. Every control must have the `data-form-control` attribute set to the control name on the input itself or in a parent element:

```html
<reactive-form id="reactiveForm">
    <div data-form-control="colorInput">
        <label>Color</label>
        <input type="color" />
    </div>

    <div>
        <label>Text</label>
        <input type="text" data-form-control="textInput" />
    </div>
</reactive-form>
```

It is also possible to change the attribute name:

```html
<reactive-form id="reactiveForm" attribute-name="rf-ctrl">
    <label>Text</label>
    <input type="text" rf-ctrl="textInput" />
</reactive-form>
```

Wait for the library to be available and then bind the form group object to the form:

```js

function bindForm() {
    const fg = new FormBuilder().group({
        // controlName: [Default value, [Sync validators], [Async validators]]
        textInput: ['default text at initializer', Validators.required],
    });
    fg.valueChanges.subscribe(v => console.log(v));
    reactiveForm.formGroup = fg;
}

// As the script is being load asyncronous, wait for FormGroup to be available
const itrvl = setInterval(() => {
    if (window['FormGroup']) {
        clearInterval(itrvl);
        bindForm();
    }
}, 100);
```

## Events

- `valueChanges`:

Each time the value changes, the `valueChanges` event is fired. It is possible to subscribe to the event to observe the value:

```js
fg.valueChanges.subscribe(v => console.log(v));
```

- `statusChanges`:

In the same way, each time the form is validated or it's status has changed, the `statusChanges` event is fired:

```js
fg.statusChanges.subscribe(status => console.log(status === 'VALID' ? 'Form is valid' : 'Form is not valid'));
```

When used with ionic, two events will be rised every time the value or status changes, one per ionic `ionChange` events and another per javascript `change` events. To avoid this duplicate bouncing, there is an optional parameter which can be configured. The usual value to avoid bouncing in the majority of brosers will be about 100ms, but it depends on many factors like browser, user computer speed, etc.

```html
<reactive-form debounce-time=100>
```

## Status

Each control maintains different status flags:

- `valid`: `true` when control value is `valid`, `false` otherwise. It's not computed until all validators (sync and async) are computed. Changes to `false` immediately when the value is changed.
- `invalid`: `true` when the control value is `invalid`, `false` otherwise. Changes to `false` when the value changes and is computed after all validators (sync and async) are computed.
- `pristine`: `true` when the control value has not been modified by the user. `false` when the value has been changed, even when it is the same as the original.
- `touched`: `true` when the control value has got the focus at least once. `false` otherwise.
- `dirty`: `true` when the control value has been modified by the user. `false` otherwise.

The form itself has the same flags, but they correspond to all the controls in the form. I.e. `valid` is `true` when all the controls have `valid` status, `false` when some of the components has `valid` status to `false`.

## Validators

There are some predefined validators:
- `Validators.min`: Validator that requires the control's value to be greater than or equal to the provided number.
- `Validators.max`: Validator that requires the control's value to be less than or equal to the provided number.
- `Validators.required`: Validator that requires the control have a non-empty value.
- `Validators.requiredTrue`: Validator that requires the control's value be true. This validator is commonly used for required checkboxes.
- `Validators.email`: Validator that requires the control's value pass an email validation test.
- `Validators.minLength`: Validator that requires the length of the control's value to be greater than or equal to the provided minimum length. This validator is also provided by default if you use the the HTML5 `minlength` attribute. Note that the `minLength` validator is intended to be used only for types that have a numeric `length` property, such as strings or arrays. The `minLength` validator logic is also not invoked for values when their `length` property is 0 (for example in case of an empty string or an empty array), to support optional controls. You can use the standard `required` validator if empty values should not be considered valid.
- `Validators.maxLength`: Validator that requires the length of the control's value to be less than or equal to the provided maximum length. This validator is also provided by default if you use the the HTML5 `maxlength` attribute. Note that the `maxLength` validator is intended to be used only for types that have a numeric `length` property, such as strings or arrays.
- `Validators.pattern`: Validator that requires the control's value to match a regex pattern. This validator is also provided by default if you use the HTML5 `pattern` attribute.
- `Validators.nullValidator`: Validator that performs no operation.
- `Validators.compose`: Compose multiple validators into a single function that returns the union of the individual error maps for the provided control.
- `Validators.composeAsync`: Compose multiple async validators into a single function that returns the union of the individual error objects for the provided control.

It is possible to create custom validators. Errors should be reported in the form `{ 'error description': { additionalInfo: '' } }:

```js
function linealRegression(a, b) {
    return control => {
        const value = parseInt(control.value || 0, 10);
        const actual = value * a + b;
        return actual > max ? { 'max square': { max, actual } } : null;
    };
}

const fg = new FormBuilder().group({
    // controlName: [Default value, [Sync validators], [Async validators]]
    numberInput: [0, squareMax(144)],
});
```

## AsyncValidators

Async validators allows to perform an async operation and wait for the result to validate the input:

```js
function asyncUrlExits(control) {
    return new Promise((resolve) => {
        const url = control.value;
        if (url) {
            fetch(url)
                .then(() => resolve(null))
                .catch(error => resolve({ 'url error': { url, error } }));
        } else {
            resolve({ 'empty url': { url }});
        }
    });
}

const fg = new FormBuilder().group({
    // controlName: [Default value, [Sync validators], [Async validators]]
    numberInput: ['https://bitgenoma.com', [], asyncUrlExits],
});
```

# Quick Examples

## Javascript

See javascript example at [examples folder](examples/javascript.html)

```html
<html>
<head>
    <script type="module" src="https://unpkg.com/forms-reactive/dist/forms-reactive/forms-reactive.esm.js"></script>
    <script nomodule src="https://unpkg.com/forms-reactive/dist/forms-reactive/forms-reactive.js"></script>
</head>

<body>
    <reactive-form id="reactiveForm">
        <div data-form-control="textInput">
            <label for="textInput">Text input</label>
            <input type="text" name="textInput" />
        </div>
    </reactive-form>

    <pre id="liveFormValue"></pre>

    <script>
        const reactiveForm = document.getElementById('reactiveForm');
        const liveFormValue = document.getElementById('liveFormValue');

        function updateLive(value) {
            liveFormValue.innerHTML = JSON.stringify(value, undefined, 4);
        }

        /**
         * Helper function that will wait until class is available
         */
        function whenAvailable(cls, cb) {
            if (typeof cls === 'string') {
                cls = [cls];
            }
            window.setTimeout(() => cls.every(c => window[c]) ? cb(window[cls]) : whenAvailable(cls, cb), 10);
        }

        // Need to wait to all components are loaded
        whenAvailable('FormBuilder', () => {
            const fg = new FormBuilder().group({
                textInput: ['default text at initializer', Validators.required],
            });
            fg.valueChanges.subscribe(v => updateLive(v));
            reactiveForm.formGroup = fg;
            updateLive(fg.value);
        });
    </script>
</body>

</html>
```
## Stencil.js

See complete stencil example at [src folder](src/components/test-component.tsx)

```tsx
import { Component, h, State } from '@stencil/core';
import { FormBuilder, FormGroup, Validators } from 'forms-reactive';

@Component({
    tag: 'test-component',
    styleUrl: 'test-component.css',
})
export class TestComponent {
    formGroup: FormGroup;
    subscription;

    componentWillLoad() {
        this.formGroup = new FormBuilder().group({
            textInputEmpty: ['', Validators.required],
            textInput: ['default text at initializer', Validators.required],
            textInputPatched: ['', Validators.required],
        });
        this.formGroup.patchValue({ textInputPatched: 'patched value', selectPickerInputPatched: 'Option 3' });
        this.subscription = this.formGroup.valueChanges.subscribe(value => console.log(value));
    }

    disconnectedCallback() {
        this.subscription.unsubscribe();
    }

    renderChips(el: any) {
        return [
            <ion-chip color={el?.valid ? "success" : "danger"} mode="ios" outline={el?.valid}>
                <ion-label>valid: {el?.valid ? "true" : "false"}</ion-label>
            </ion-chip>,
            <ion-chip color={el?.invalid ? "danger" : "success"} mode="ios" outline={el?.invalid}>
                <ion-label>invalid: {el?.invalid ? "true" : "false"}</ion-label>
            </ion-chip>,
            <ion-chip color={el?.pristine ? "primary" : "secondary"} mode="ios" outline={el?.pristine}>
                <ion-label>pristine: {el?.pristine ? "true" : "false"}</ion-label>
            </ion-chip>,
            <ion-chip color={el?.touched ? "primary" : "secondary"} mode="ios" outline={el?.touched}>
                <ion-label>touched: {el?.touched ? "true" : "false"}</ion-label>
            </ion-chip>,
            <ion-chip color={el?.dirty ? "primary" : "secondary"} mode="ios" outline={el?.dirty}>
                <ion-label>dirty: {el?.dirty ? "true" : "false"}</ion-label>
            </ion-chip>,
        ];
    }

    render() {
        return <reactive-form formGroup={this.formGroup}>
            <ion-item lines="none">
                <ion-label position="stacked">Empty Text input</ion-label>
                <ion-input type="text" data-form-control="textInputEmpty"></ion-input>
                <ion-note>
                    Errors: {Object.keys(this.formGroup?.controls['textInputEmpty'].errors || { none: true }).map(k => `${k}: ${this.formGroup?.controls['textInputEmpty'].getError(k)}`)}
                </ion-note>
            </ion-item>
            <ion-item lines="full">{this.renderChips(this.formGroup?.controls['textInputEmpty'])}</ion-item>

            <ion-item lines="none">
                <ion-label position="stacked">Text input with value on constructor</ion-label>
                <ion-input type="text" data-form-control="textInput"></ion-input>
                <ion-note>
                    Errors: {Object.keys(this.formGroup?.controls['textInput'].errors || { none: true }).map(k => `${k}: ${this.formGroup?.controls['textInput'].getError(k)}`)}
                </ion-note>
            </ion-item>
            <ion-item lines="full">{this.renderChips(this.formGroup?.controls['textInput'])}</ion-item>

            <ion-item lines="none">
                <ion-label position="stacked">Text input patched value</ion-label>
                <ion-input type="text" data-form-control="textInputPatched"></ion-input>
                <ion-note>
                    Errors: {Object.keys(this.formGroup?.controls['textInputPatched'].errors || { none: true }).map(k => `${k}: ${this.formGroup?.controls['textInputPatched'].getError(k)}`)}
                </ion-note>
            </ion-item>
            <ion-item lines="full">{this.renderChips(this.formGroup?.controls['textInputPatched'])}</ion-item>
        </reactive-form>;
    }
}
```

# RoadMap

[ ] remove test-component compilation at build time

# License

```LICENSE
MIT License

Copyright AppFeel (Bit Genoma Digital Solutions SL) All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
