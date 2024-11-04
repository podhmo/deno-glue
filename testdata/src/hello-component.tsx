/** @jsx h */

import { h } from 'npm:preact';

export function hello(name: string) {
    return (
        <p>`Hello ${name}`</p>
    )
}