<script>
import Base from "./Base";

export default {
  name: "Password",
  extends: Base,
  methods: {
    getInputAttrs() {
      return {
        id: this.id,
        type: 'password',
        value: this.value,
        required: this.docfield.required,
        disabled: this.disabled
      };
    },
  }
};
</script>