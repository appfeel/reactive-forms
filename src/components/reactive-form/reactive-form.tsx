import { Component, Host, h, Element, EventEmitter, Event, Prop } from '@stencil/core';

import { FormGroup, ISetFormControlValueOptions } from '../../utils/model';

interface IStyleOptions {
    valid?: string;
    invalid?: string;
}

@Component({
    tag: 'reactive-form',
    styleUrl: 'reactive-form.css',
    shadow: true,
})
export class ReactiveForm {
    @Prop() formGroup!: FormGroup;
    @Prop() styleOptions: IStyleOptions = { invalid: 'invalid', valid: 'valid' };

    @Element() reactiveEl: HTMLElement;

    @Event({ eventName: 'valueChanges' }) valueChanges: EventEmitter;
    @Event({ eventName: 'statusChanges' }) statusChanges: EventEmitter;
    @Event({ eventName: 'formStatus' }) form: EventEmitter;

    async componentDidRender() {
        const dataElements = this.reactiveEl.querySelectorAll('[data-form-control]');
        /** Searched 'input' elements to control. Keep in mind to add new exceptions as we did with 'textarea'. */
        let elmts: NodeListOf<HTMLInputElement | HTMLTextAreaElement>;

        dataElements.forEach((htmlElmnt) => {
            const controlName = htmlElmnt.getAttribute('data-form-control');
            htmlElmnt.addEventListener('ionChange', ev => this.onionchange(controlName, ev));

            elmts = htmlElmnt.querySelectorAll('input');

            if (elmts.length === 0) {
                elmts = htmlElmnt.querySelectorAll('textarea');
            }

            if (elmts.length === 1) {
                const el: any = elmts.item(0);
                el.setAttribute('name', controlName);
                el.onchange = ev => this.onchange(controlName, ev);
                el.oninput = ev => this.oninput(controlName, ev);
                el.onfocus = () => this.onfocus(controlName);
                el.onreset = () => this.onreset(controlName);
            } else if (elmts.length === 0) {
                throw new Error('Error: Debe contener un input o textarea');
            } else {
                throw new Error('Error: No puede contener mas de 1 input o textarea');
            }
        });

        this.formGroup.valueChanges.subscribe(value => this.valueChanges.emit(value));
        this.formGroup.statusChanges.subscribe(value => this.statusChanges.emit(value));
    }

    oninput(name: string, ev: any) {
        const { value } = ev.target;
        this.updateInputValue(name, value, {
            onlySelf: true,
            emitEvent: false,
            emitModelToViewChange: false,
            emitViewToModelChange: false,
        });
    }

    onionchange(name: string, ev: any) {
        const { value } = ev.target;
        this.updateInputValue(name, value, {
            onlySelf: true,
            emitEvent: true,
            emitModelToViewChange: true,
            emitViewToModelChange: true,
        });
    }

    onchange(name: string, ev: any) {
        const { value } = ev.target;
        this.updateInputValue(name, value, {
            onlySelf: true,
            emitEvent: true,
            emitModelToViewChange: true,
            emitViewToModelChange: true,
        });
    }

    onfocus(name: string) {
        if (!this.formGroup.controls[name].touched) {
            this.formGroup.controls[name].markAllAsTouched();
        }
    }

    onreset(name: string) {
        this.formGroup.controls[name].reset('', {
            onlySelf: true,
            // TODO: view options
        });
        if (!this.formGroup.controls[name].touched) {
            this.formGroup.controls[name].markAllAsTouched();
        }
    }

    updateInputValue(name: string, value: any, options: ISetFormControlValueOptions) {
        if (!this.formGroup.controls[name].dirty) {
            this.formGroup.controls[name].markAsDirty();
        }
        this.formGroup.controls[name].setValue(value, options);
        this.formGroup.updateValueAndValidity();

        this.updateInputEl(name);

        this.form.emit(this.formGroup);
    }

    updateInputEl(name: string) {
        const query = `[data-form-control=${name}]`;
        const el = this.reactiveEl.querySelector(query);

        if (this.formGroup.controls[name].status === 'VALID') {
            el.classList.remove(this.styleOptions.invalid);
            el.classList.add(this.styleOptions.valid);
        } else {
            el.classList.remove(this.styleOptions.valid);
            el.classList.add(this.styleOptions.invalid);
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
