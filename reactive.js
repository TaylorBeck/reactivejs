class ReactiveJS {
  constructor() {
    this.state = {};
    this.elements = new Map();
    this.listeners = new Map();
    this.computedProperties = new Map();
  }

  createState(initialState) {
    this.state = new Proxy(initialState, {
      set: (target, key, value) => {
        target[key] = value;
        this.updateDOM(key);
        this.updateComputedProperties();
        return true;
      }
    });
  }

  bind(selector, key, formatter = null) {
    const element = document.querySelector(selector);
    if (element) {
      this.elements.set(key, { element, formatter });
      this.updateDOM(key);
    }
  }

  updateDOM(key) {
    if (this.elements.has(key)) {
      const { element, formatter } = this.elements.get(key);
      let value = this.state[key];
      if (formatter) {
        value = formatter(value);
      }
      element.innerHTML = value;
    }
  }

  on(eventType, selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener(eventType, callback);
    }
  }

  computed(key, computeFunc) {
    Object.defineProperty(this.state, key, {
      get: () => computeFunc(this.state),
      enumerable: true,
      configurable: true
    });
    this.computedProperties.set(key, computeFunc);
  }

  updateComputedProperties() {
    for (let [key, computeFunc] of this.computedProperties) {
      const value = computeFunc(this.state);
      if (this.elements.has(key)) {
        const { element, formatter } = this.elements.get(key);
        element.innerHTML = formatter ? formatter(value) : value;
      }
    }
  }

  component(selector, template, data = {}) {
    const element = document.querySelector(selector);
    if (element) {
      const renderFunction = this.compile(template);
      const render = () => {
        element.innerHTML = renderFunction(this.state);
      };
      render();
      for (let key in data) {
        if (this.computedProperties.has(key)) {
          this.bind(`${selector} [data-bind="${key}"]`, key);
        } else {
          this.bind(`${selector} [data-bind="${key}"]`, key);
        }
      }
      return render;
    }
  }

  compile(template) {
    return (state) => template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      return key.split('.').reduce((obj, key) => obj[key], state);
    });
  }
}

// Create a global instance
window.app = new ReactiveJS();
