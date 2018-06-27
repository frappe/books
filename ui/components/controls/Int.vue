<script>
import Float from './Float';

export default {
    extends: Float,
    methods: {
        parse(value) {
            const parsedValue = parseInt(value);
            return isNaN(parsedValue) ? 0 : parsedValue;
        }
    }
}
</script>
