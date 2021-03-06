//@ts-ignore
import { expect } from "@bundled-es-modules/chai";
import { useHook, createHooks, useRender, useHost } from "../create-hooks.js";

describe("src/hooks/create-hooks", () => {
    it("hooks.load", () => {
        function render() {}
        let host = {};
        let hooks = createHooks(render, host);
        let param = {};
        hooks.load((param) => expect(param).to.equal(param), param);
    });

    it("hooks > useRender", () => {
        function render() {}
        let host = {};
        let hooks = createHooks(render, host);
        hooks.load(() => {
            expect(useRender()).to.equal(render);
        }, null);
    });

    it("hooks > useHost", () => {
        function render() {}
        let host = {};
        let hooks = createHooks(render, host);
        hooks.load(() => {
            expect(useHost().current).to.equal(host);
        }, null);
    });

    it("hooks > useHook", () => {
        function render() {}
        let host = {};
        let hooks = createHooks(render, host);
        let param = {};
        hooks.load(() => {
            useHook((param) => {
                expect(param).to.equal(param);
            }, param);
        }, null);
    });

    it("hooks.(updated|unmount) > useHook", () => {
        function render() {}
        let host = {};
        let hooks = createHooks(render, host);

        let cycle = 0;
        let steps = {};

        let hooksScope = (cycle) => {
            useHook((state, type) => {
                (steps[cycle] = steps[cycle] || []).push(type);
            });
        };

        let runCycle = (unmount) => {
            hooks.load(hooksScope, cycle++);
            unmount ? hooks.unmount() : hooks.updated();
        };

        runCycle();
        runCycle();
        runCycle(true);

        expect(steps[0]).to.deep.equal([1, 2]); // mount - mounted
        expect(steps[1]).to.deep.equal([3, 4]); // update - updated
        expect(steps[2]).to.deep.equal([3, 5]); // update - unmount

        expect(cycle).to.equal(3); // if it were older, additional cycles would be generated
    });
});
