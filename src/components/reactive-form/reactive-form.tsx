import { Component, Host, h, Element, EventEmitter, Event, Prop, Watch } from '@stencil/core';
import { Subscription } from 'rxjs';

import { FormControl, FormGroup, ISetFormControlValueOptions, VALID } from '../../utils/model';

@Component({
    tag: 'reactive-form',
    styleUrl: 'reactive-form.css',
    shadow: true,
})
export class ReactiveForm {
    @Prop() formGroup!: FormGroup;
    @Prop() attributeName = 'data-form-control';
    @Prop() additionalSelfHosted = [];

    @Element() reactiveEl: HTMLElement;

    @Event({ eventName: 'valueChanges' }) valueChanges: EventEmitter;
    @Event({ eventName: 'statusChanges' }) statusChanges: EventEmitter;

    defaultSelfHosted = ['ion-select', 'ion-checkbox', 'ion-radio-group', 'ion-range', 'ion-toggle'];
    subscriptions: Function[] = [];

    async componentDidRender() {
        this.defaultSelfHosted = [...this.defaultSelfHosted, ...this.additionalSelfHosted];
        if (this.formGroup) {
            this.load();
        }
    }

    @Watch('formGroup')
    onFormGroupChange() {
        // Remove previous listeners
        while (this.subscriptions.length) {
            const unsubscriber = this.subscriptions.pop();
            unsubscriber();
        }
        if (this.formGroup) {
            this.load();
        }
    }

    load() {
        this.bindInputsTextareas(this.attributeName);
    }

    bindInputsTextareas(bindingAttr: string) {
        /** Searched 'input' elements to control. Keep in mind to add new exceptions as we did with 'textarea'. */
        const dataElements = this.reactiveEl.querySelectorAll(`[${bindingAttr}]`);
        const allControlNames = this.formGroup ? Object.keys(this.formGroup.controls) : [];
        const processed = [];
        dataElements.forEach((htmlElmnt) => {
            // TODO: custom handlers
            const controlName = htmlElmnt.getAttribute(bindingAttr);
            const tagName = htmlElmnt.tagName.toLowerCase();
            if (!controlName) {
                console.error(`Control name for element '<${tagName} ${bindingAttr}="">' cannot be empty:`, htmlElmnt);
                return;
            }

            if (processed.indexOf(controlName) >= 0) {
                console.error(`Duplicate control name '<${tagName} ${bindingAttr}="${controlName}">'`, htmlElmnt);
                return;
            }

            processed.push(controlName);

            // Select elements
            const elmts: NodeListOf<HTMLInputElement | HTMLTextAreaElement> = this.getElements(bindingAttr, controlName);

            if (this.formGroup && allControlNames.indexOf(controlName) < 0) {
                console.warn(`Missing form control for element '[${bindingAttr}="${controlName}"]'`);
                this.formGroup.registerControl(controlName, new FormControl());
                this.formGroup.updateValueAndValidity({ onlySelf: true, emitEvent: true });
                this.valueChanges.emit(this.formGroup.value);
            }

            // Bind events
            const onIonChangeEventListener: EventListenerOrEventListenerObject = ev => this.onionchange(controlName, ev);
            // Bind ionChange event anyway, so we can handle ion-radio and ion-select properly
            htmlElmnt.addEventListener('ionChange', onIonChangeEventListener);
            this.subscriptions.push(() => htmlElmnt.removeEventListener('ionChange', onIonChangeEventListener));

            // Radio buttons can have multiple inputs
            for (let i = 0; i < elmts.length; i += 1) {
                const e = elmts.item(i);
                e.setAttribute('name', controlName);
                e.onchange = ev => this.onchange(controlName, ev);
                e.oninput = ev => this.oninput(controlName, ev);
                e.onfocus = () => this.onfocus(controlName);
                e.onreset = () => this.onreset(controlName);

                // Assign values
                let valueChangesSubscr: Subscription;
                if (this.formGroup?.controls && this.formGroup.controls[controlName]) {
                    valueChangesSubscr = this.formGroup.controls[controlName].valueChanges.subscribe(() => {
                        setTimeout(() => {
                            this.updateHTMLElementValue(controlName, tagName, e);
                            // Leave time to update formGroup value and status
                            this.valueChanges.emit(this.formGroup.value);
                            this.statusChanges.emit(this.formGroup.status);
                        });
                    });
                    this.updateHTMLElementValue(controlName, tagName, e);
                }

                this.subscriptions.push(() => {
                    e.onchange = null;
                    e.oninput = null;
                    e.onfocus = null;
                    e.onreset = null;
                    valueChangesSubscr.unsubscribe();
                });
            }
        });
    }

    getElements(bindingAttr: string, controlName: string, htmlElement?: Element) {
        const htmlElmnt: Element = htmlElement || this.reactiveEl.querySelector(`[${bindingAttr}="${controlName}"]`);
        const tagName = htmlElmnt.tagName.toLowerCase();
        const isSelfHosted = htmlElmnt.hasAttribute('rf-self-hosted');
        let elmts: NodeListOf<HTMLInputElement | HTMLTextAreaElement>;

        if (htmlElmnt.tagName.toLowerCase() === 'input' || tagName === 'textarea') {
            elmts = htmlElmnt.parentElement.querySelectorAll(`[${bindingAttr}="${controlName}"]`);
        } else {
            elmts = htmlElmnt.querySelectorAll('input');
        }

        if (elmts.length === 0) {
            elmts = htmlElmnt.querySelectorAll('textarea');
        }

        if (elmts.length === 0 || isSelfHosted || this.defaultSelfHosted.indexOf(tagName) >= 0) {
            if (elmts.length === 0 && !(isSelfHosted || this.defaultSelfHosted.indexOf(tagName) >= 0)) {
                console.warn(`Can't find any input or textarea in element '[${bindingAttr}="${controlName}"]'. Taking ${tagName} as the input element.`);
            }
            elmts = htmlElmnt.parentElement.querySelectorAll(`[${bindingAttr}="${controlName}"]`);
        }
        return elmts;
    }

    oninput(name: string, ev: any) {
        let { value } = ev.target;
        if (ev.target.type === 'number') {
            value = parseFloat(value);
        }
        this.updateInputValue(name, value, {
            onlySelf: true,
            emitEvent: false,
            emitModelToViewChange: false,
            emitViewToModelChange: false,
        });
    }

    onionchange(name: string, ev: any) {
        let { value } = ev.target;
        if (ev.target.type === 'number') {
            value = parseFloat(value);
        }
        console.log(value);
        // Checkboxes have checked
        this.handleOnchange(name, value, ev.target.checked);
    }

    onchange(name: string, ev: any) {
        let { value } = ev.target;
        if (ev.target.type === 'number') {
            value = parseFloat(value);
        }
        // ev.target on inputs and other controls has also checked
        this.handleOnchange(name, value);
    }

    handleOnchange(name: string, value: any, checked?: any) {
        this.updateInputValue(name, checked !== undefined ? checked : value, {
            onlySelf: true,
            emitEvent: true,
            emitModelToViewChange: true,
            emitViewToModelChange: true,
        });
    }

    onfocus(name: string) {
        this.formGroup.markAsTouched({ emitEvent: true });
        if (!this.formGroup.controls[name].touched) {
            this.formGroup.controls[name].markAllAsTouched();
        }
        this.statusChanges.emit(this.formGroup.status);
    }

    onreset(name: string) {
        this.formGroup.controls[name].reset('', {
            onlySelf: true,
            // TODO: view options
        });
        if (!this.formGroup.controls[name].touched) {
            this.formGroup.controls[name].markAsUntouched();
        }
        this.statusChanges.emit(this.formGroup.status);
    }

    updateInputValue(name: string, value: any, options: ISetFormControlValueOptions) {
        if (!this.formGroup.controls[name].dirty) {
            this.formGroup.controls[name].markAsDirty();
        }
        this.formGroup.controls[name].setValue(value, options);
        this.formGroup.updateValueAndValidity();

        this.updateInputEl(name);

        this.valueChanges.emit(this.formGroup.value);
        this.statusChanges.emit(this.formGroup.status);
    }

    updateInputEl(name: string) {
        const query = `[${this.attributeName}="${name}"]`;
        const el = this.reactiveEl.querySelector(query);

        if (this.formGroup.controls[name].status === VALID) {
            el.classList.remove('invalid');
            el.classList.add('valid');
        } else {
            el.classList.remove('valid');
            el.classList.add('invalid');
        }
    }

    updateHTMLElementValue(controlName: string, tagName: string, e: HTMLInputElement | HTMLTextAreaElement) {
        if (this.formGroup.controls[controlName]?.value) {
            // ion inputs will raise onioninput event so it will raise
            // valueChanges and statusChanges twice instead of once:
            // once in this.formGroup.controls[controlName].valueChanges.subscribe()
            // other one in updateInputValue()
            if (e.type === 'checkbox' || tagName === 'ion-checkbox' || e.type === 'toggle' || tagName === 'ion-toggle') {
                e['checked'] = this.formGroup.controls[controlName].value;
            } else {
                e.value = this.formGroup.controls[controlName].value;
            }
        }
    }

    render() {
        return (
            <Host>
                <slot />
            </Host>
        );
    }
}
