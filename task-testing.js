import oe, { useState as x, useEffect as O } from "react";
function ae(c) {
  return c && c.__esModule && Object.prototype.hasOwnProperty.call(c, "default") ? c.default : c;
}
var N = { exports: {} }, S = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var J;
function ce() {
  if (J) return S;
  J = 1;
  var c = Symbol.for("react.transitional.element"), f = Symbol.for("react.fragment");
  function i(m, a, t) {
    var n = null;
    if (t !== void 0 && (n = "" + t), a.key !== void 0 && (n = "" + a.key), "key" in a) {
      t = {};
      for (var p in a)
        p !== "key" && (t[p] = a[p]);
    } else t = a;
    return a = t.ref, {
      $$typeof: c,
      type: m,
      key: n,
      ref: a !== void 0 ? a : null,
      props: t
    };
  }
  return S.Fragment = f, S.jsx = i, S.jsxs = i, S;
}
var k = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var z;
function ie() {
  return z || (z = 1, process.env.NODE_ENV !== "production" && function() {
    function c(e) {
      if (e == null) return null;
      if (typeof e == "function")
        return e.$$typeof === re ? null : e.displayName || e.name || null;
      if (typeof e == "string") return e;
      switch (e) {
        case u:
          return "Fragment";
        case B:
          return "Profiler";
        case h:
          return "StrictMode";
        case Q:
          return "Suspense";
        case K:
          return "SuspenseList";
        case te:
          return "Activity";
      }
      if (typeof e == "object")
        switch (typeof e.tag == "number" && console.error(
          "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
        ), e.$$typeof) {
          case w:
            return "Portal";
          case H:
            return (e.displayName || "Context") + ".Provider";
          case X:
            return (e._context.displayName || "Context") + ".Consumer";
          case Z:
            var r = e.render;
            return e = e.displayName, e || (e = r.displayName || r.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
          case ee:
            return r = e.displayName || null, r !== null ? r : c(e.type) || "Memo";
          case $:
            r = e._payload, e = e._init;
            try {
              return c(e(r));
            } catch {
            }
        }
      return null;
    }
    function f(e) {
      return "" + e;
    }
    function i(e) {
      try {
        f(e);
        var r = !1;
      } catch {
        r = !0;
      }
      if (r) {
        r = console;
        var l = r.error, v = typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return l.call(
          r,
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          v
        ), f(e);
      }
    }
    function m(e) {
      if (e === u) return "<>";
      if (typeof e == "object" && e !== null && e.$$typeof === $)
        return "<...>";
      try {
        var r = c(e);
        return r ? "<" + r + ">" : "<...>";
      } catch {
        return "<...>";
      }
    }
    function a() {
      var e = P.A;
      return e === null ? null : e.getOwner();
    }
    function t() {
      return Error("react-stack-top-frame");
    }
    function n(e) {
      if (D.call(e, "key")) {
        var r = Object.getOwnPropertyDescriptor(e, "key").get;
        if (r && r.isReactWarning) return !1;
      }
      return e.key !== void 0;
    }
    function p(e, r) {
      function l() {
        L || (L = !0, console.error(
          "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
          r
        ));
      }
      l.isReactWarning = !0, Object.defineProperty(e, "key", {
        get: l,
        configurable: !0
      });
    }
    function s() {
      var e = c(this.type);
      return M[e] || (M[e] = !0, console.error(
        "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
      )), e = this.props.ref, e !== void 0 ? e : null;
    }
    function g(e, r, l, v, R, E, I, C) {
      return l = E.ref, e = {
        $$typeof: _,
        type: e,
        key: r,
        props: E,
        _owner: R
      }, (l !== void 0 ? l : null) !== null ? Object.defineProperty(e, "ref", {
        enumerable: !1,
        get: s
      }) : Object.defineProperty(e, "ref", { enumerable: !1, value: null }), e._store = {}, Object.defineProperty(e._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: 0
      }), Object.defineProperty(e, "_debugInfo", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: null
      }), Object.defineProperty(e, "_debugStack", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: I
      }), Object.defineProperty(e, "_debugTask", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: C
      }), Object.freeze && (Object.freeze(e.props), Object.freeze(e)), e;
    }
    function T(e, r, l, v, R, E, I, C) {
      var b = r.children;
      if (b !== void 0)
        if (v)
          if (ne(b)) {
            for (v = 0; v < b.length; v++)
              y(b[v]);
            Object.freeze && Object.freeze(b);
          } else
            console.error(
              "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
            );
        else y(b);
      if (D.call(r, "key")) {
        b = c(e);
        var j = Object.keys(r).filter(function(se) {
          return se !== "key";
        });
        v = 0 < j.length ? "{key: someKey, " + j.join(": ..., ") + ": ...}" : "{key: someKey}", U[b + v] || (j = 0 < j.length ? "{" + j.join(": ..., ") + ": ...}" : "{}", console.error(
          `A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,
          v,
          b,
          j,
          b
        ), U[b + v] = !0);
      }
      if (b = null, l !== void 0 && (i(l), b = "" + l), n(r) && (i(r.key), b = "" + r.key), "key" in r) {
        l = {};
        for (var F in r)
          F !== "key" && (l[F] = r[F]);
      } else l = r;
      return b && p(
        l,
        typeof e == "function" ? e.displayName || e.name || "Unknown" : e
      ), g(
        e,
        b,
        E,
        R,
        a(),
        l,
        I,
        C
      );
    }
    function y(e) {
      typeof e == "object" && e !== null && e.$$typeof === _ && e._store && (e._store.validated = 1);
    }
    var o = oe, _ = Symbol.for("react.transitional.element"), w = Symbol.for("react.portal"), u = Symbol.for("react.fragment"), h = Symbol.for("react.strict_mode"), B = Symbol.for("react.profiler"), X = Symbol.for("react.consumer"), H = Symbol.for("react.context"), Z = Symbol.for("react.forward_ref"), Q = Symbol.for("react.suspense"), K = Symbol.for("react.suspense_list"), ee = Symbol.for("react.memo"), $ = Symbol.for("react.lazy"), te = Symbol.for("react.activity"), re = Symbol.for("react.client.reference"), P = o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, D = Object.prototype.hasOwnProperty, ne = Array.isArray, A = console.createTask ? console.createTask : function() {
      return null;
    };
    o = {
      "react-stack-bottom-frame": function(e) {
        return e();
      }
    };
    var L, M = {}, W = o["react-stack-bottom-frame"].bind(
      o,
      t
    )(), q = A(m(t)), U = {};
    k.Fragment = u, k.jsx = function(e, r, l, v, R) {
      var E = 1e4 > P.recentlyCreatedOwnerStacks++;
      return T(
        e,
        r,
        l,
        !1,
        v,
        R,
        E ? Error("react-stack-top-frame") : W,
        E ? A(m(e)) : q
      );
    }, k.jsxs = function(e, r, l, v, R) {
      var E = 1e4 > P.recentlyCreatedOwnerStacks++;
      return T(
        e,
        r,
        l,
        !0,
        v,
        R,
        E ? Error("react-stack-top-frame") : W,
        E ? A(m(e)) : q
      );
    };
  }()), k;
}
var V;
function le() {
  return V || (V = 1, process.env.NODE_ENV === "production" ? N.exports = ce() : N.exports = ie()), N.exports;
}
var d = le(), Y = { exports: {} };
/*!
	Copyright (c) 2018 Jed Watson.
	Licensed under the MIT License (MIT), see
	http://jedwatson.github.io/classnames
*/
var G;
function ue() {
  return G || (G = 1, function(c) {
    (function() {
      var f = {}.hasOwnProperty;
      function i() {
        for (var t = "", n = 0; n < arguments.length; n++) {
          var p = arguments[n];
          p && (t = a(t, m(p)));
        }
        return t;
      }
      function m(t) {
        if (typeof t == "string" || typeof t == "number")
          return t;
        if (typeof t != "object")
          return "";
        if (Array.isArray(t))
          return i.apply(null, t);
        if (t.toString !== Object.prototype.toString && !t.toString.toString().includes("[native code]"))
          return t.toString();
        var n = "";
        for (var p in t)
          f.call(t, p) && t[p] && (n = a(n, p));
        return n;
      }
      function a(t, n) {
        return n ? t ? t + " " + n : t + n : t;
      }
      c.exports ? (i.default = i, c.exports = i) : window.classNames = i;
    })();
  }(Y)), Y.exports;
}
var fe = ue();
const de = /* @__PURE__ */ ae(fe);
function pe(c, f) {
  var i = me(c);
  return i && typeof i.$instanceOf == "function" && i.$instanceOf(f);
}
function me(c) {
  return c && c.businessObject || c;
}
class ve {
  constructor(f) {
    const {
      deploymentConfig: i,
      deploy: m,
      getProcessId: a,
      startInstance: t,
      file: n
      // get rid of it
    } = f;
    this._getProcessId = a, this._deploymentConfig = i, this._deploy = m, this._startInstance = t, this._file = n;
  }
  async run(f, i, m) {
    const a = this._deploymentConfig, t = this._file, n = await this._deploy(a);
    if (!n.success)
      return console.log("Deployment error", n.response.details || n.response.message), n;
    if (n.success) {
      const p = this._getProcessId(n, t.name);
      if (!p) {
        console.log("No process id found");
        return;
      }
      const s = await this._startInstance.startInstance(p, {
        ...a,
        variables: i,
        startInstructions: [
          {
            elementId: f
          }
        ],
        withResult: !1
        // withResult does not support start instructions
      });
      if (s.success) {
        console.log("Start instance result", s.response);
        const { processInstanceKey: g } = s.response, y = setInterval(async () => {
          const o = await this._zeebeAPI.getProcessInstance(a.endpoint, g);
          o.success ? (console.log("Process instance", o), m({
            type: "instanceFound",
            response: o
          }), clearInterval(y)) : (console.error("Get process instance error", o), m({
            type: "instanceNotFound",
            response: o
          }));
        }, 1e3);
        return {
          type: "instanceStarted",
          response: s
        };
      } else
        console.log("Start instance error", s.response.details || s.response.message);
    }
  }
  async getInput() {
    const f = this._file, i = await this._startInstance.getConfigForFile(f), { variables: m } = i;
    return m;
  }
}
function he(c) {
  const {
    injector: f,
    saveFile: i,
    // onAction('save') from Desktop Modeler
    file: m
  } = c, [a, t] = x(""), [n, p] = x(!1), [s, g] = x(null), [T, y] = x(null), [o, _] = x({});
  O(() => {
    const u = new ve(f, m);
    y(u), u.getInput().then((h) => {
      t(h);
    });
  }, []), O(() => {
    f.get("eventBus").on("selection.changed", ({ newSelection: u }) => {
      u.length === 1 && pe(u[0], "bpmn:Task") ? g(u[0]) : g(null);
    });
  }, []), O(() => {
    const u = ({ element: h }) => {
      o[h.id] && _({
        ...o,
        [h.id]: null
      });
    };
    return f.get("eventBus").on("element.changed", u), () => {
      f.get("eventBus").off("element.changed", u);
    };
  }, [o]), O(() => {
    if (s) {
      const u = localStorage.getItem(`test-input-${s.id}`);
      u && t(u);
    }
  }, [s]), O(() => {
    s && a && localStorage.setItem(`test-input-${s.id}`, a);
  }, [a]);
  const w = async () => {
    if (!T)
      return;
    p(!0), i(), _({
      ...o,
      [s.id]: null
    });
    const u = await T.run(s.id, a, (h) => {
      h.success ? _({
        ...o,
        [s.id]: h
      }) : _({
        ...o,
        [s.id]: h
      });
    });
    console.log("test results", u), _({
      ...o,
      [s.id]: u
    }), p(!1);
  };
  return console.log("test results", o), s ? /* @__PURE__ */ d.jsx("div", { className: "task-testing", children: /* @__PURE__ */ d.jsxs("div", { className: "input-output", children: [
    /* @__PURE__ */ d.jsxs("div", { className: "input", children: [
      /* @__PURE__ */ d.jsxs("div", { className: "input-header", children: [
        /* @__PURE__ */ d.jsx("h5", { children: "Input" }),
        /* @__PURE__ */ d.jsx("button", { className: de("btn", {
          "btn-primary": !o[s.id],
          "btn-secondary": o[s.id]
        }), onClick: w, disabled: n, children: n ? "Running..." : (o[s.id], "Run") })
      ] }),
      /* @__PURE__ */ d.jsx("div", { className: "input-content", children: /* @__PURE__ */ d.jsx("textarea", { spellCheck: "false", rows: "10", onChange: (u) => t(u.target.value), value: a }) })
    ] }),
    /* @__PURE__ */ d.jsxs("div", { className: "output", children: [
      /* @__PURE__ */ d.jsxs("div", { className: "output-header", children: [
        /* @__PURE__ */ d.jsx("h5", { children: "Output" }),
        /* @__PURE__ */ d.jsx("button", { className: "btn btn-secondary", children: "Save as example output data" })
      ] }),
      /* @__PURE__ */ d.jsx("div", { className: "output-content", children: o[s.id] && /* @__PURE__ */ d.jsxs(d.Fragment, { children: [
        o[s.id].type === "instanceStarted" && /* @__PURE__ */ d.jsx("span", { children: "Instance started..." }),
        o[s.id].type === "instanceNotFound" && /* @__PURE__ */ d.jsx("span", { children: "Waiting for Operate 😴..." }),
        o[s.id].type === "instanceFound" && /* @__PURE__ */ d.jsx("pre", { children: JSON.stringify(o[s.id].response.response.variables, null, 2) })
      ] }) })
    ] })
  ] }) }) : /* @__PURE__ */ d.jsx("div", { className: "placeholder", children: "Select a task to test." });
}
export {
  he as default
};
//# sourceMappingURL=task-testing.js.map
