import { Component, Host, h, Element, EventEmitter, Event, Prop, Watch } from '@stencil/core';
import { Subscription } from 'rxjs';

import { Debouncer } from '../../utils/debouncer';
import { AbstractControl, FormControl, FormGroup } from '../../utils/model';
import { ISetFormControlValueOptions, ReactiveFormStatus } from '../../utils/types';

@Component({
    tag: 'reactive-form',
    styleUrl: 'reactive-form.css',
    shadow: true,
})
export class ReactiveForm {
    @Prop() dataFormGroup!: FormGroup;
    @Prop() dataAttributeName = 'data-form-control';
    @Prop() dataAdditionalSelfHosted = [];
    @Prop() dataDebounceTime = 0;

    @Element() reactiveEl: HTMLElement;

    @Event({ eventName: 'valueChanges' }) valueChanges: EventEmitter<any>;
    @Event({ eventName: 'statusChanges' }) statusChanges: EventEmitter<ReactiveFormStatus>;

    defaultSelfHosted = ['ion-select', 'ion-checkbox', 'ion-radio-group', 'ion-range', 'ion-toggle'];
    subscriptions: (() => void)[] = [];

    valueDebouncer = new Debouncer();
    statusDebouncer = new Debouncer();

    async componentDidRender() {
        this.defaultSelfHosted = [...this.defaultSelfHosted, ...this.dataAdditionalSelfHosted];
        if (this.dataFormGroup) {
            this.load();
        }
    }

    @Watch('dataFormGroup')
    onFormGroupChange() {
        // Remove previous listeners
        while (this.subscriptions.length) {
            const unsubscriber = this.subscriptions.pop();
            unsubscriber();
        }
    }

    load() {
        this.bindInputsTextareas(this.dataAttributeName);
    }

    bindInputsTextareas(bindingAttr: string) {
        /** Searched 'input' elements to control. Keep in mind to add new exceptions as we did with 'textarea'. */
        const dataElements = this.reactiveEl.querySelectorAll<HTMLElement>(`[${bindingAttr}]`);
        const allControlNames = this.dataFormGroup ? Object.keys(this.dataFormGroup.controls) : [];
        const processed = [];
        dataElements.forEach((htmlElmnt) => {
            // TODO: custom handlers
            let isOnIonChangeFiring = false;
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

            let control: AbstractControl;
            if (this.dataFormGroup && allControlNames.indexOf(controlName) < 0) {
                console.warn(`Missing form control for element '[${bindingAttr}="${controlName}"]'`);
                control = this.dataFormGroup.registerControl(controlName, new FormControl());
                this.dataFormGroup.updateValueAndValidity({ onlySelf: true, emitEvent: true });
                if (this.dataDebounceTime > 0) {
                    this.valueDebouncer.debounce(() => this.valueChanges.emit(this.dataFormGroup.value), this.dataDebounceTime);
                } else {
                    this.valueChanges.emit(this.dataFormGroup.value);
                }
            } else {
                control = this.dataFormGroup.get(controlName);
            }

            control.setHtmlElement(htmlElmnt);
            // Bind events
            const onIonChangeEventListener: EventListenerOrEventListenerObject = (ev) => {
                isOnIonChangeFiring = true;
                this.onionchange(controlName, ev);
            };
            // Bind ionChange event anyway, so we can handle ion-radio and ion-select properly
            htmlElmnt.addEventListener('ionChange', onIonChangeEventListener);
            this.subscriptions.push(() => htmlElmnt.removeEventListener('ionChange', onIonChangeEventListener));

            // Radio buttons can have multiple inputs
            for (let i = 0; i < elmts.length; i += 1) {
                const e = elmts.item(i);
                e.setAttribute('name', controlName);
                // eslint-disable-next-line no-loop-func, @typescript-eslint/no-loop-func
                e.onchange = (ev) => {
                    if (!isOnIonChangeFiring) {
                        this.onchange(controlName, ev);
                    }
                };
                // eslint-disable-next-line no-loop-func, @typescript-eslint/no-loop-func
                e.oninput = (ev) => {
                    if (!isOnIonChangeFiring) {
                        this.oninput(controlName, ev);
                    }
                };
                e.onfocus = () => this.onfocus(controlName);
                e.onreset = () => this.onreset(controlName);

                // Assign values
                let valueChangesSubscr: Subscription;
                if (this.dataFormGroup?.controls && this.dataFormGroup.controls[controlName]) {
                    valueChangesSubscr = this.dataFormGroup.controls[controlName].valueChanges.subscribe(() => {
                        setTimeout(() => {
                            this.updateHTMLElementValue(controlName, tagName, e);
                            // Leave time to update dataFormGroup value and status
                            if (this.dataDebounceTime > 0) {
                                this.valueDebouncer.debounce(() => this.valueChanges.emit(this.dataFormGroup.value), this.dataDebounceTime);
                                this.statusDebouncer.debounce(() => this.statusChanges.emit(this.dataFormGroup.status), this.dataDebounceTime);
                            } else {
                                this.valueChanges.emit(this.dataFormGroup.value);
                                this.statusChanges.emit(this.dataFormGroup.status);
                            }
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
        this.dataFormGroup.markAsTouched({ emitEvent: true });
        if (!this.dataFormGroup.controls[name].touched) {
            this.dataFormGroup.controls[name].markAllAsTouched();
        }
        if (this.dataDebounceTime > 0) {
            this.statusDebouncer.debounce(() => this.statusChanges.emit(this.dataFormGroup.status), this.dataDebounceTime);
        } else {
            this.statusChanges.emit(this.dataFormGroup.status);
        }
    }

    onreset(name: string) {
        this.dataFormGroup.controls[name].reset('', {
            onlySelf: true,
            // TODO: view options
        });
        if (!this.dataFormGroup.controls[name].touched) {
            this.dataFormGroup.controls[name].markAsUntouched();
        }
        if (this.dataDebounceTime > 0) {
            this.statusDebouncer.debounce(() => this.statusChanges.emit(this.dataFormGroup.status), this.dataDebounceTime);
        } else {
            this.statusChanges.emit(this.dataFormGroup.status);
        }
    }

    updateInputValue(name: string, value: any, options: ISetFormControlValueOptions) {
        if (!this.dataFormGroup.controls[name].dirty) {
            this.dataFormGroup.controls[name].markAsDirty();
        }
        this.dataFormGroup.controls[name].setValue(value, options);
        this.dataFormGroup.updateValueAndValidity();

        this.updateInputEl(name);

        if (this.dataDebounceTime > 0) {
            this.valueDebouncer.debounce(() => this.valueChanges.emit(this.dataFormGroup.value), this.dataDebounceTime);
            this.statusDebouncer.debounce(() => this.statusChanges.emit(this.dataFormGroup.status), this.dataDebounceTime);
        } else {
            this.valueChanges.emit(this.dataFormGroup.value);
            this.statusChanges.emit(this.dataFormGroup.status);
        }
    }

    updateInputEl(name: string) {
        const query = `[${this.dataAttributeName}="${name}"]`;
        const el = this.reactiveEl.querySelector(query);

        // Puede ser que el elemento ya no exista, si se actualiza el dataFormGroup
        if (el) {
            if (this.dataFormGroup.controls[name].status === ReactiveFormStatus.VALID) {
                el.classList.remove('invalid');
                el.classList.add('valid');
            } else {
                el.classList.remove('valid');
                el.classList.add('invalid');
            }
        }
    }

    updateHTMLElementValue(controlName: string, tagName: string, e: HTMLInputElement | HTMLTextAreaElement) {
        if (this.dataFormGroup.controls[controlName]?.value) {
            // ion inputs will raise onioninput event so it will raise
            // valueChanges and statusChanges twice instead of once:
            // once in this.dataFormGroup.controls[controlName].valueChanges.subscribe()
            // other one in updateInputValue()
            if (e.type === 'checkbox' || tagName === 'ion-checkbox' || e.type === 'toggle' || tagName === 'ion-toggle') {
                (e as any).checked = this.dataFormGroup.controls[controlName].value;
            } else {
                e.value = this.dataFormGroup.controls[controlName].value;
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
