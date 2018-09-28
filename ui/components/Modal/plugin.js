import ModalContainer from './ModalContainer';

const Plugin = {
  install (Vue) {

    this.event = new Vue();

    Vue.prototype.$modal = {
      show(...args) {
        return Plugin.modalContainer.add(...args);
      },

      hide(id) {
        Plugin.event.$emit('hide', id);
      }
    }

    // create modal container
    const div = document.createElement('div');
    document.body.appendChild(div);
    new Vue({ render: h => h(ModalContainer) }).$mount(div);
  }
}

export default Plugin;