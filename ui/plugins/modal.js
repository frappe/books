import Observable from 'frappejs/utils/observable';

const Bus = new Observable();

export default {
  // enable use of this.$modal in every component
  // this also keeps only one modal in the DOM at any time
  // which is the recommended way by bootstrap
  install (Vue) {
    Vue.prototype.$modal = {
      show(options) {
        Bus.trigger('showModal', options);
      },

      hide() {
        Bus.trigger('hideModal');
      }
    }

    Vue.mixin({
      data() {
        return {
          registered: false,
          modalVisible: false,
          modalOptions: {}
        }
      },
      created: function () {
        if (this.registered) return;

        Bus.on('showModal', (options = {}) => {
          this.modalVisible = true;
          this.modalOptions = options;
        });

        Bus.on('hideModal', () => {
          this.modalVisible = false;
        });

        this.registered = true;
      }
    });
  }
}