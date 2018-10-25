import Form from '../components/Form/Form';

export default function installFormModal(Vue) {

  Vue.mixin({
    computed: {
      $formModal() {
        let id;

        const open = (doc, options = {}) => {
          const { defaultValues = null, onClose = () => {} } = options;
          id = this.$modal.show({
            component: Form,
            props: {
              doctype: doc.doctype,
              name: doc.name,
              defaultValues,
            },
            events: {
              onClose
            },
            modalProps: {
              noHeader: true
            }
          });
        }

        const close = () => this.$modal.hide(id);

        return {
          open,
          close
        }
      }
    }
  })
}
