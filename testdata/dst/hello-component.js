import { h } from 'npm:preact';
function hello(name) {
    return h("p", null, "`Hello $", name, "`");
}
export { hello as hello };
