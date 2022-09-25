import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import * as pkg from './package.json';
import dts from 'rollup-plugin-dts';

export default [
    {
        input: 'src/index.js',
        output: {
            dir: 'dist',
            format: 'cjs',
            sourcemap: true
        },
        external: Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies)),
        plugins: [
            commonjs(),
            babel({ babelHelpers: 'bundled' })
        ]
    },
    {
        input: 'src/index.js',
        output: {
            file: 'dist/index.esm.js',
            format: 'esm',
            sourcemap: true
        },
        external: Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies)),
        plugins: [babel({ babelHelpers: 'bundled' })]
    },
    {
        input: 'src/index.d.ts',
        output: [
            {
                file: 'dist/index.d.ts'
            }
        ],
        external: Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies)),
        plugins: [dts()],
    },
    {
        input: 'platform-server/src/index.js',
        output: {
            dir: 'platform-server/dist',
            format: 'cjs',
            sourcemap: true
        },
        external: Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies)).concat(
            [ '@themost/cache' ]
        ),
        plugins: [
            commonjs(),
            babel({ babelHelpers: 'bundled' })
        ]
    },
    {
        input: 'platform-server/src/index.js',
        output: {
            file: 'platform-server/dist/index.esm.js',
            format: 'esm',
            sourcemap: true
        },
        external: Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies)).concat(
            [ '@themost/cache' ]
        ),
        plugins: [babel({ babelHelpers: 'bundled' })]
    },
    {
        input: 'platform-server/src/index.d.ts',
        output: [
            {
                file: 'platform-server/dist/index.d.ts'
            }
        ],
        external: Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies)).concat(
            [ '@themost/cache' ]
        ),
        plugins: [dts()],
    }
];
