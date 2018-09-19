import { MOUNT, UNMOUNT, RECEIVE_PROPS, UPDATE, ELEMENT } from "./constants";

import { diff } from "./diff";
import { concat } from "./vdom";
import { camelCase, root, append, defer } from "./utils";

export default class extends HTMLElement {
    constructor() {
        super();
        this[ELEMENT] = true;
        this.state = {};
        this.slots = {};
        this.props = {};
        this.fragment = document.createDocumentFragment();
        this._props = this.constructor.props || [];
        this._render = [];
        this._listener = [];
        this._mount;
        this._prevent;
        this.livecycle();
    }
    static get observedAttributes() {
        return ["children"].concat(this.props || []);
    }
    livecycle() {
        this.addEventListener(
            MOUNT,
            event => this[MOUNT] && this[MOUNT](event)
        );
        this.addEventListener(
            UNMOUNT,
            event => this[UNMOUNT] && this[UNMOUNT](event)
        );
        this.addEventListener(
            UPDATE,
            event => this[UPDATE] && this[UPDATE](event)
        );
        this.addEventListener(RECEIVE_PROPS, event => {
            this[RECEIVE_PROPS] && this[RECEIVE_PROPS](event);
            if (event.defaultPrevented) return;
            this.setState({});
        });
    }
    setAttribute(prop, value) {
        if (this._props.indexOf(prop) > -1) {
            this.setProps({ ...this.props, [prop]: value });
        } else {
            super.setAttribute(prop, value);
        }
    }
    /**
     * By default the children and properties are extracted
     * only when the component exists in the document
     * This is required for the component to be read regardless
     * of the load instance, in the same way it is applied asynchronously,
     * so as to be able to read the arguments generated by synchronous invocation,
     * be it the use of document.createElement
     */
    connectedCallback() {
        this.props.children = [];
        defer(() => {
            while (this.firstChild) {
                let child = this.firstChild,
                    slot = child.getAttribute && child.getAttribute("slot");
                if (slot) {
                    this.slots[slot] = child;
                }
                append(this.fragment, child);
                this.props.children.push(child);
            }
            this.setState({}, (this._mount = true));
            this.dispatch(MOUNT);
        });
    }
    disconnectedCallback() {
        this.dispatch(UNMOUNT);
        this._listener.forEach(handler => handler());
    }
    setProps(props) {
        let nextProps = {};
        for (let prop in props) {
            if (this._props.indexOf(prop) === -1) continue;
            nextProps[camelCase(prop)] = props[prop];
        }
        if (this._mount) this.dispatch(RECEIVE_PROPS, nextProps);
        this.props = nextProps;
    }
    attributeChangedCallback(index, prev, next) {
        this.setProps({ ...this.props, [index]: next });
    }
    addEventListener(type, handler, useCapture) {
        super.addEventListener(type, handler, useCapture);
        this._listener.push(() => this.removeEventListener(type, handler));
    }
    dispatch(type, detail) {
        this.dispatchEvent(
            new CustomEvent(type, {
                cancelable: true,
                detail
            })
        );
    }
    setState(next, ignoreUpdate) {
        if (!next) return;
        this.state = { ...this.state, ...next };
        if (this._prevent) return;
        this._prevent = true;
        defer(() => {
            let render = concat([this.render()]);
            diff(root(this), this._render, render);
            this._render = render;
            this._prevent = false;
            if (!ignoreUpdate) this.dispatch(UPDATE);
        });
    }
    render() {}
}
