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

    componentDidRender() {
        const ionInputs = this.reactiveEl.querySelectorAll('[data-form-control]');
        /** Searched 'input' elements to control. Keep in mind to add new exceptions as we did with 'textarea'. */
        let elmts: NodeListOf<HTMLInputElement | HTMLTextAreaElement>;

        ionInputs.forEach((ionInput) => {
            elmts = ionInput.querySelectorAll('input');

            if (elmts.length === 0) {
                elmts = ionInput.querySelectorAll('textarea');
                console.log(elmts);
            }

            if (elmts.length === 1) {
                const data = ionInput.getAttribute('data-form-control');
                const input = elmts.item(0);

                input.setAttribute('name', data);

                input.onchange = this.onchange.bind(this);
                input.oninput = this.oninput.bind(this);
                input.onfocus = this.onfocus.bind(this);
                input.onreset = this.onreset.bind(this);

            } else if (elmts.length === 0) {
                throw new Error('Error: Debe contener un input o textarea');
            } else {
                throw new Error('Error: No puede contener mas de 1 input o textarea');
            }
        });

        this.formGroup.valueChanges.subscribe(value => this.valueChanges.emit(value));
        this.formGroup.statusChanges.subscribe(value => this.statusChanges.emit(value));
    }

    oninput(ev: any) {
        const { value, name } = ev.target;
        this.updateInputValue(name, value, {
            onlySelf: true,
            emitEvent: false,
            emitModelToViewChange: false,
            emitViewToModelChange: false,
        });
    }

    onchange(ev: any) {
        const { value, name } = ev.target;
        this.updateInputValue(name, value, {
            onlySelf: true,
            emitEvent: true,
            emitModelToViewChange: true,
            emitViewToModelChange: true,
        });
    }

    onfocus(ev: any) {
        const { name } = ev.target;
        if (!this.formGroup.controls[name].touched) {
            this.formGroup.controls[name].markAllAsTouched();
        }
    }

    onreset(ev: any) {
        const { name } = ev.target;
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
                <slot></slot>
            </Host>
        );
    }
}
