# WebComp

Functions for creating [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components).

Creates framework-agnostic components that work across different projects and teams. Complex UI components with complex logic can be used through simple HTML attributes, hiding implementation details behind a standard interface.

Components built with WebComp work in any environment that supports Web Components, regardless of framework or technological stack. Usage requires only basic HTML:

```html
<my-data-table data-source="/api/users" sortable="true"></my-data-table>
```

All complexity is handled internally by the component.

## Usage

Only attributes described in the `attrs` object can be used and will be listened to in the component. Attributes not defined in `attrs` are ignored.

### Basic Example

```javascript
import { WebComponent } from 'webdetta/webcomp';
import { r } from 'webdetta/reactivity';

const MyComponent = WebComponent('my-component', {
  attrs: {
    name: (value) => value || 'default',
    count: (value) => parseInt(value) || 0
  },
  shadow: { mode: 'open' }
}, (instance) => {
  // Component logic
  instance.onConnect(() => {
    console.log('Component connected');
  });
  
  // Listen to attribute changes using r.effect
  r.effect(() => {
    const name = instance.attrs.name();
    console.log('Name changed:', name);
  });
  
  // Return DOM content (required for component to render)
  const div = document.createElement('div');
  div.textContent = 'Hello World';
  return div;
});

// Use in HTML
// <my-component name="John" count="5"></my-component>
```

## Listening to Attributes

Attributes are reactive signals. Listen to changes using `r.effect()` from the reactivity module:

```javascript
import { WebComponent } from 'webdetta/webcomp';
import { r } from 'webdetta/reactivity';

const MyComponent = WebComponent('my-component', {
  attrs: {
    count: (value) => parseInt(value) || 0
  }
}, function() {
  const { attrs } = this;
  
  // Listen to attribute changes
  r.effect(() => {
    const count = attrs.count();
    console.log('Count changed to:', count);
    // Update UI based on new count value
  });
  
  // Return component content
  return document.createElement('div');
});
```

## Setting Attributes

Set attributes programmatically by calling the attribute signal with a new value:

```javascript
import { WebComponent } from 'webdetta/webcomp';

const MyComponent = WebComponent('my-component', {
  attrs: {
    count: (value) => parseInt(value) || 0
  }
}, function() {
  const { attrs } = this;
  
  // Set attribute programmatically
  const button = document.createElement('button');
  button.textContent = 'Increment';
  button.addEventListener('click', () => {
    const currentCount = attrs.count();
    attrs.count(currentCount + 1); // Updates the attribute
  });
  
  return button;
});
```

## Real-Time Integration Example

Complete example using RealDOM with full reactivity integration:

```javascript
import { WebComponent } from 'webdetta/webcomp/realdom-adapter';
import { el } from 'webdetta/realdom';
import { r } from 'webdetta/reactivity';

const CounterComponent = WebComponent('counter-component', {
  attrs: {
    count: (value) => parseInt(value) || 0,
    step: (value) => parseInt(value) || 1
  },
  shadow: { mode: 'open' }
}, function() {
  const { attrs, onConnect, onDisconnect } = this;
  
  // Derived reactive values
  const isEven = () => attrs.count() % 2 === 0;
  const isPositive = () => attrs.count() > 0;
  
  // Create reactive scope for effects
  const abortable = r.abortable(() => {
    // Listen to attribute changes
    r.effect(() => {
      const count = attrs.count();
      console.log('Count changed to:', count);
    });
  });
  
  // Clean up on disconnect
  onDisconnect(() => {
    abortable.abort();
  });
  
  // Build reactive UI with RealDOM
  return el.Div(
    el.style.padding`20px`,
    el.style.border`1px solid #ccc`,
    el.style.borderRadius`8px`,
    el.style.backgroundColor(() => isEven() ? '#f0f8ff' : '#fff8f0'),
    
    // Count display with reactive styling
    el.Span(
      el.style.display`block`,
      el.style.fontSize`24px`,
      el.style.color(() => isPositive() ? '#007bff' : '#dc3545'),
      el.style.marginBottom`10px`,
      () => `Count: ${attrs.count()}`
    ),
    
    // Button container
    el.Div(
      el.style.display`flex`,
      el.style.gap`10px`,
      
      // Decrement button
      el.Button(
        () => `-${attrs.step()}`,
        el.style.padding`8px 16px`,
        el.style.cursor`pointer`,
        el.prop.disabled(() => attrs.count() <= 0),
        el.on.click(() => {
          const currentCount = attrs.count();
          const step = attrs.step();
          attrs.count(currentCount - step);
        })
      ),
      
      // Increment button
      el.Button(
        () => `+${attrs.step()}`,
        el.style.padding`8px 16px`,
        el.style.cursor`pointer`,
        el.on.click(() => {
          const currentCount = attrs.count();
          const step = attrs.step();
          attrs.count(currentCount + step);
        })
      )
    )
  );
});

// Use in HTML
// <counter-component count="5" step="2"></counter-component>
```

## API

- `WebComponent(name, options, func)` - Creates a Web Component
  - `name` - Custom element name (must contain a hyphen)
  - `options.attrs` - Attribute definitions with parsers
  - `options.shadow` - Shadow DOM configuration
  - `func` - Component initialization function that receives `instance` with:
    - `instance.dom` - The DOM element
    - `instance.attrs` - Object of reactive attribute signals
    - `instance.onConnect(callback)` - Register callback when component connects to DOM
    - `instance.onDisconnect(callback)` - Register callback when component disconnects from DOM
  - **Must return** a DOM element or null (returned element will be appended to component)

