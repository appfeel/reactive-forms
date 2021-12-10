import { Config } from '@stencil/core';
import { OutputTarget } from '@stencil/core/internal';

let outputTargets: OutputTarget[] = [{
    type: 'www',
    serviceWorker: null, // disable service workers
}];

if (process.argv.indexOf('--dist') > -1) {
    outputTargets = [{
        type: 'dist',
        esmLoaderPath: '../loader',
    },
    {
        type: 'dist-custom-elements-bundle',
    }];
}

if (process.argv.indexOf('--dist') > -1) {
    outputTargets.push({
        type: 'docs-readme',
    });
}

export const config: Config = {
    outputTargets,
    namespace: 'forms-reactive',
};
