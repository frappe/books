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
      },

      observable() {
        return Bus;
      }
    }

    Vue.mixin({
      data() {
        return {
          registered: false,
          modalVisible: false,
          modalOptions: {},
          modalListeners: {}
        }
      },

      watch: {
        modalVisible(value) {
          if (value === true) {
            Bus.trigger('modal.show');
          } else {
            Bus.trigger('modal.hide');
          }
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
          this.modalOptions = {};
        });

        this.registered = true;
      }
    });
  }
}