import { createApp, defineComponent } from 'vue';

export default function mount(component, { props, children, element } = {}) {
  const el = element ?? document.createElement('div');

  const vueComponent = defineComponent(component);
  const app = createApp(vueComponent);
  const componentInstance = app.mount(el);

  return {
    componentInstance,
    destroy: () => app.unmount(),
    el
  };
}
