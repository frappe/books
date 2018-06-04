<script>
import Text from './Text';
export default {
    extends: Text,
    computed: {
        inputClass() {
            return ['text-monospace'];
        }
    }
}
</script>
