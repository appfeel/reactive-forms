import '@ionic/core';
import { Component, h, Method, State, Prop, Watch, Event, EventEmitter } from '@stencil/core';

import { FormBuilder, Validators } from '../../utils/forms';

interface IHourSlot {
    minute: number;
    hour: number;
}

@Component({
    tag: 'test-component',
    styleUrl: 'test-component.css',
})
export class TestComponent {

    formGroup = new FormBuilder().group({
        textInput: ['', Validators.required],
        selectPickerInput: [''],
    });
    timeSlotTo: HTMLIonSelectElement;
    toHourOptions: string[] = [];

    componentWillLoad() {
        this.toHourOptions = this.getHourOptions({ hour: 22, minute: 30 });
    }

    /**
     * Returns IHourSlot[] containing all slots greater than the given minimum
     * @param minimHourSlot {IHourSlot}
     */
    getHourOptions(minimHourSlot: IHourSlot = { hour: 0, minute: -1 }): string[] {
        const options = [];
        const hourAmount = 24;
        const minutes = [0, 30];
        let isPassedMinim = false;
        for (let i = minimHourSlot.hour; i < hourAmount; i += 1) {
            minutes.forEach((m) => {
                if (isPassedMinim) {
                    options.push(`${i}:${m}`);
                }
                if (i >= minimHourSlot.hour && m >= minimHourSlot.minute) {
                    isPassedMinim = true;
                }
            });
        }
        return options;
    }

    render() {
        return [
            <reactive-form formGroup={this.formGroup}>
                <ion-item>
                    <ion-label>Hora límite:</ion-label>
                    <ion-select
                        data-form-control='selectPickerInput'
                        interface='popover'
                        ref={tEl => this.timeSlotTo = tEl}
                        onIonChange={e => console.log('ion change', e.detail.value)}>
                        {this.toHourOptions.map(hs => <ion-select-option value={hs}>{hs}</ion-select-option>)}
                    </ion-select>
                </ion-item>
            </reactive-form>,
        ];
    }
}

function getAddedLeftZeroNumber(num: number): string {
    return num > 9 ? num.toString() : `0${num}`;
}

function getHourSlotString(timeSlot: IHourSlot): string {
    return `${getAddedLeftZeroNumber(timeSlot.hour)}:${getAddedLeftZeroNumber(timeSlot.minute)}`;
}
